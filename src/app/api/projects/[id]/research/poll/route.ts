import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/role';
import {
  DataForSEOAuthError,
  DataForSEOError,
  getMyBusinessInfoTask,
} from '@/lib/dataforseo/client';
import { parsePostback } from '@/lib/dataforseo/research';

/**
 * POST /api/projects/[id]/research/poll
 *
 * Manual recovery path for the async research loop. When the DataForSEO
 * postback to /api/webhooks/dataforseo/[token] never arrived (token rotated,
 * deployment-protection 401, upstream network drop), the row stays pinned
 * at status='pending' forever. This endpoint reaches into DataForSEO with
 * the stored task_id and fetches the result synchronously, then writes back
 * the same fields the webhook handler would have.
 *
 * Admin-gated. The webhook receiver is the only other writer to
 * dataforseo_research (no UPDATE RLS), so we mirror it by using the
 * service-role admin client for the update.
 *
 * Response shape mirrors the GET research endpoint's key fields so the
 * client can decide whether to re-fetch or display the result inline.
 */

interface ResearchLookupRow {
  id: string;
  task_id: string;
  status: 'pending' | 'ready' | 'error';
}

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  // RLS-scoped read so we confirm the caller can see the project at all.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: existing, error: lookupErr } = await supabase
    .from('dataforseo_research')
    .select('id, task_id, status')
    .eq('project_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<ResearchLookupRow>();
  if (lookupErr) return NextResponse.json({ error: lookupErr.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: 'No research row for this project' }, { status: 404 });
  if (!existing.task_id) return NextResponse.json({ error: 'Research row has no task_id' }, { status: 409 });

  // Already settled — nothing to pull, but tell the caller so the UI can refresh.
  if (existing.status !== 'pending') {
    return NextResponse.json({ ok: true, status: existing.status, settled: true });
  }

  // Reach into DataForSEO with the stored task id.
  let envelope: unknown;
  let pending: boolean;
  let missing: boolean;
  try {
    const out = await getMyBusinessInfoTask(existing.task_id);
    envelope = out.envelope;
    pending = out.pending;
    missing = out.missing;
  } catch (err) {
    if (err instanceof DataForSEOAuthError) {
      return NextResponse.json({ error: 'DataForSEO auth failed' }, { status: 502 });
    }
    if (err instanceof DataForSEOError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 502 });
    }
    const message = err instanceof Error ? err.message : 'DataForSEO lookup failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // DataForSEO says the task is still running. Don't write anything — the
  // postback (or a future poll) will settle the row.
  if (pending) {
    return NextResponse.json({ ok: true, status: 'pending' });
  }

  // DataForSEO no longer knows this task id. Settle the row to 'error' with
  // a clear, actionable message so the UI can flip out of the pending state
  // and offer the re-queue path. raw_payload stays untouched so a future
  // forensic inspection still has the empty/404 envelope to look at.
  if (missing) {
    const admin = createAdminClient();
    const { error: updateErr } = await admin
      .from('dataforseo_research')
      .update({
        status: 'error',
        raw_payload: envelope,
        error_message:
          'DataForSEO no longer has this task (expired or never accepted). Re-queue to try again.',
      })
      .eq('id', existing.id);
    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
    return NextResponse.json({ ok: true, status: 'error', missing: true, settled: true });
  }

  // Settle the row exactly the way the webhook would: same parser, same
  // raw_payload, same status/error_message mapping. The admin client is
  // required because dataforseo_research has no UPDATE RLS policy.
  const parsed = parsePostback(envelope);
  if (!parsed) {
    return NextResponse.json({ error: 'DataForSEO returned an unparseable envelope' }, { status: 502 });
  }
  if (parsed.taskId !== existing.task_id) {
    // Defence in depth — if DataForSEO ever echoed a different task id we'd
    // refuse to overwrite the row rather than corrupt the binding.
    return NextResponse.json(
      { error: 'task_id mismatch between stored and returned envelope' },
      { status: 502 },
    );
  }

  const admin = createAdminClient();
  const { error: updateErr } = await admin
    .from('dataforseo_research')
    .update({
      status: parsed.status,
      raw_payload: envelope,
      error_message: parsed.errorMessage,
    })
    .eq('id', existing.id);
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, status: parsed.status, settled: true });
}
