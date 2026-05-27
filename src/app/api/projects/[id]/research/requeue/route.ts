import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/role';
import {
  DataForSEOAuthError,
  DataForSEOError,
  postMyBusinessInfoTask,
} from '@/lib/dataforseo/client';
import {
  buildPostbackUrl,
  getWebhookToken,
} from '@/lib/dataforseo/research';

/**
 * POST /api/projects/[id]/research/requeue
 *
 * Re-runs the DataForSEO research task for an existing project, using the
 * keyword/location_name already stored on the latest dataforseo_research
 * row. The companion to /poll: poll recovers a lost-postback case where
 * DataForSEO still has the result; requeue covers the case where the task
 * id is gone upstream (expired or never accepted), or where the row is in
 * the 'error' state and the user wants to retry without re-running the
 * whole wizard.
 *
 * Side effects on success:
 *   - Posts a new task to DataForSEO with a fresh postback URL.
 *   - Updates the existing row in place: new task_id, status='pending',
 *     raw_payload=null, error_message=null, created_at=now() (so the
 *     elapsed timer restarts).
 *
 * Admin-gated. Admin client is used for the update because
 * dataforseo_research has no UPDATE RLS policy.
 */

interface ResearchLookupRow {
  id: string;
  task_id: string;
  status: 'pending' | 'ready' | 'error';
  keyword: string;
  location_name: string | null;
  language_code: string;
}

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
  if (!existing.keyword) {
    return NextResponse.json({ error: 'Existing row has no keyword to retry' }, { status: 409 });
  }

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

  // Queue a fresh task. Reuses the stored keyword + location_name so the
  // research targets the same business the wizard originally pointed at.
  let newTaskId: string;
  try {
    const out = await postMyBusinessInfoTask({
      keyword: existing.keyword,
      locationName: existing.location_name || undefined,
      languageCode: existing.language_code || 'en',
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

  // Reset the row in place. created_at is bumped so the elapsed-time
  // narrative restarts; raw_payload and error_message are cleared so the
  // review screen sees a fresh pending state.
  const admin = createAdminClient();
  const { error: updateErr } = await admin
    .from('dataforseo_research')
    .update({
      task_id: newTaskId,
      status: 'pending',
      raw_payload: null,
      error_message: null,
      created_at: new Date().toISOString(),
    })
    .eq('id', existing.id);
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, taskId: newTaskId, status: 'pending' });
}
