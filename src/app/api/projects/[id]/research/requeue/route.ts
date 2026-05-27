import { NextResponse, type NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/role';
import {
  DataForSEOAuthError,
  DataForSEOError,
  postMyBusinessInfoTask,
  postQuestionsAndAnswersTask,
  postReviewsTask,
} from '@/lib/dataforseo/client';
import {
  buildPostbackUrl,
  getWebhookToken,
} from '@/lib/dataforseo/research';

/**
 * POST /api/projects/[id]/research/requeue
 *
 * Re-runs the DataForSEO research tasks for an existing project. Body is
 * optional; when present it accepts `keyword` and `locationName` overrides
 * so the review screen can correct a bad initial lookup (e.g. wizard ran
 * without an address) without forcing the user back through the wizard.
 * When the body is empty the existing row's stored terms are reused — the
 * common "lost postback" / "transient DataForSEO miss" case.
 *
 * The primary `my_business_info` row is updated in place. The supplemental
 * `reviews` and `questions_and_answers` rows are re-queued too: they share
 * the same keyword + location, and if those changed the old rows would
 * point at the wrong listing. Existing supplemental rows are updated in
 * place; absent ones are inserted (best-effort, mirroring the wizard's
 * queueSupplementalResearchTasks helper).
 *
 * Admin-gated. Admin client is used for the writes because
 * dataforseo_research has no UPDATE/INSERT RLS policy.
 */

interface ResearchLookupRow {
  id: string;
  task_id: string;
  status: 'pending' | 'ready' | 'error';
  keyword: string;
  location_name: string | null;
  language_code: string;
}

interface RequestBody {
  /** Override the stored keyword. Trimmed; empty/whitespace is ignored. */
  keyword?: string;
  /** Override the stored location_name. Empty string clears it. */
  locationName?: string;
}

type SupplementalKind = 'reviews' | 'questions_and_answers';
const SUPPLEMENTAL_KINDS: SupplementalKind[] = ['reviews', 'questions_and_answers'];
const SUPPLEMENTAL_POSTERS: Record<SupplementalKind, typeof postReviewsTask> = {
  reviews: postReviewsTask,
  questions_and_answers: postQuestionsAndAnswersTask,
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Body is optional. Empty/missing → reuse stored terms.
  let body: RequestBody = {};
  try {
    const parsed = (await request.json().catch(() => null)) as RequestBody | null;
    if (parsed && typeof parsed === 'object') body = parsed;
  } catch {
    // ignore — empty body is allowed
  }

  const { data: existing, error: lookupErr } = await supabase
    .from('dataforseo_research')
    .select('id, task_id, status, keyword, location_name, language_code')
    .eq('project_id', id)
    .eq('task_kind', 'my_business_info')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<ResearchLookupRow>();
  if (lookupErr) return NextResponse.json({ error: lookupErr.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: 'No research row for this project' }, { status: 404 });

  // Resolve final lookup terms. A whitespace-only override is treated as
  // "not provided" so the user can't accidentally blank the keyword by
  // submitting an empty form field.
  const keywordOverride = typeof body.keyword === 'string' ? body.keyword.trim() : '';
  const keyword = keywordOverride || existing.keyword;
  if (!keyword) {
    return NextResponse.json({ error: 'No keyword to retry — provide one in the request body' }, { status: 409 });
  }
  // locationName: explicit empty string clears, undefined keeps existing.
  const locationName = typeof body.locationName === 'string'
    ? (body.locationName.trim() || null)
    : existing.location_name;
  const languageCode = existing.language_code || 'en';

  // Resolve the webhook config first so a misconfigured env fails before we
  // spend a DataForSEO credit on the retry.
  let postbackUrl: string;
  try {
    const token = getWebhookToken();
    postbackUrl = buildPostbackUrl(request.nextUrl.origin, token);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook misconfigured';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Queue the primary my_business_info task first. If this fails we abort
  // before touching the DB so the row stays in its previous state — better
  // than nuking the payload for a network blip.
  let newTaskId: string;
  try {
    const out = await postMyBusinessInfoTask({
      keyword,
      locationName: locationName || undefined,
      languageCode,
      postbackUrl,
    });
    newTaskId = out.taskId;
  } catch (err) {
    if (err instanceof DataForSEOAuthError) {
      return NextResponse.json({ error: 'DataForSEO auth failed' }, { status: 502 });
    }
    if (err instanceof DataForSEOError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 502 });
    }
    const message = err instanceof Error ? err.message : 'Research re-queue failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // Reset the primary row in place. created_at is bumped so the elapsed-time
  // narrative restarts; raw_payload and error_message are cleared so the
  // review screen sees a fresh pending state. keyword + location_name are
  // overwritten so the pending banner reflects the corrected terms.
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { error: updateErr } = await admin
    .from('dataforseo_research')
    .update({
      task_id: newTaskId,
      status: 'pending',
      raw_payload: null,
      error_message: null,
      keyword,
      location_name: locationName,
      created_at: now,
    })
    .eq('id', existing.id);
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  // Re-queue supplementals best-effort. They share the same lookup terms;
  // if those changed, the old rows would still point at the wrong listing
  // when the user hits Regenerate. Failures here are non-fatal — the
  // primary row already advanced to pending.
  await requeueSupplementals(admin, {
    projectId: id,
    keyword,
    locationName,
    languageCode,
    postbackUrl,
    now,
  });

  return NextResponse.json({
    ok: true,
    taskId: newTaskId,
    status: 'pending',
    keyword,
    locationName,
  });
}

interface RequeueSupplementalsInput {
  projectId: string;
  keyword: string;
  locationName: string | null;
  languageCode: string;
  postbackUrl: string;
  now: string;
}

/**
 * For each supplemental kind (reviews, questions_and_answers): post a fresh
 * DataForSEO task, then either update the latest existing row in place or
 * insert a new one. Mirrors the primary-row semantics so all three rows for
 * a project move forward together when the user corrects the lookup terms.
 */
async function requeueSupplementals(
  admin: SupabaseClient,
  input: RequeueSupplementalsInput,
): Promise<void> {
  for (const kind of SUPPLEMENTAL_KINDS) {
    let taskId: string;
    try {
      const out = await SUPPLEMENTAL_POSTERS[kind]({
        keyword: input.keyword,
        locationName: input.locationName || undefined,
        languageCode: input.languageCode,
        postbackUrl: input.postbackUrl,
      });
      taskId = out.taskId;
    } catch (err) {
      console.error(`[research/requeue] post ${kind} task failed (non-fatal):`, err);
      continue;
    }

    const { data: existing } = await admin
      .from('dataforseo_research')
      .select('id')
      .eq('project_id', input.projectId)
      .eq('task_kind', kind)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle<{ id: string }>();

    if (existing) {
      const { error } = await admin
        .from('dataforseo_research')
        .update({
          task_id: taskId,
          status: 'pending',
          raw_payload: null,
          error_message: null,
          keyword: input.keyword,
          location_name: input.locationName,
          created_at: input.now,
        })
        .eq('id', existing.id);
      if (error) console.error(`[research/requeue] update ${kind} row failed (non-fatal):`, error);
    } else {
      const { error } = await admin.from('dataforseo_research').insert({
        project_id: input.projectId,
        task_id: taskId,
        task_kind: kind,
        status: 'pending',
        keyword: input.keyword,
        location_name: input.locationName,
        language_code: input.languageCode,
      });
      if (error) console.error(`[research/requeue] insert ${kind} row failed (non-fatal):`, error);
    }
  }
}
