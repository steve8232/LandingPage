import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  getWebhookToken,
  parsePostback,
  verifyWebhookToken,
} from '@/lib/dataforseo/research';

/**
 * POST /api/webhooks/dataforseo/[token]
 *
 * DataForSEO postback receiver for the research creation method (Lane B).
 * Authenticated by a single shared secret embedded in the URL path; the
 * value lives in DATAFORSEO_WEBHOOK_TOKEN and is compared with constant-time
 * equality (see verifyWebhookToken in src/lib/dataforseo/research.ts).
 *
 * Flow:
 *   1. Verify the path token against the env var. Mismatch → 401.
 *   2. Parse the postback envelope. Pull task_id + task-level status_code.
 *   3. Update the matching dataforseo_research row:
 *        success → status='ready', raw_payload=<full body>
 *        4xxxx/5xxxx → status='error', error_message=<status_message>
 *   4. Return 200 on no-match (idempotency / unknown task_id) so DataForSEO
 *      doesn't retry forever after a project deletion.
 *
 * The handler uses createAdminClient() because dataforseo_research has no
 * INSERT/UPDATE RLS policy (writes are service-role only — see migration
 * 0017_dataforseo_research.sql).
 */

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;

  // 1) Token check before reading the body so attackers can't probe payload
  // parsing with arbitrary input.
  let expected: string;
  try {
    expected = getWebhookToken();
  } catch (err) {
    console.error('[webhooks/dataforseo.POST] config error:', err);
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }
  if (!verifyWebhookToken(token, expected)) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // 2) Parse the envelope.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const parsed = parsePostback(body);
  if (!parsed) {
    return NextResponse.json({ error: 'Malformed postback envelope' }, { status: 400 });
  }

  // 3) Update by task_id. The unique constraint on task_id makes this
  // deterministic; we use update (not upsert) because the wizard route is
  // the only legitimate inserter — orphan postbacks must not create rows.
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('dataforseo_research')
    .update({
      status: parsed.status,
      raw_payload: body,
      error_message: parsed.errorMessage,
    })
    .eq('task_id', parsed.taskId)
    .select('id, project_id')
    .maybeSingle();

  if (error) {
    console.error('[webhooks/dataforseo.POST] update failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 4) Unknown task_id → 200 no-op. DataForSEO retries 5xx; returning ok
  // here keeps us off their retry treadmill for tasks whose project was
  // deleted between submit and postback.
  if (!data) {
    return NextResponse.json({ ok: true, matched: false });
  }

  return NextResponse.json({
    ok: true,
    matched: true,
    researchId: data.id,
    projectId: data.project_id,
    status: parsed.status,
  });
}
