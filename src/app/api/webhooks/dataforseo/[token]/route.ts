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

  // 2) Parse the envelope. DataForSEO postbacks arrive with
  // `Content-Encoding: gzip` by default and NextRequest.json() does not
  // transparently decompress them — so we read the raw bytes, inflate when
  // necessary, and only then parse JSON. Failures here log enough metadata
  // (encoding, byte length, leading snippet) to diagnose future shape drift
  // without dumping the whole payload to Vercel logs.
  const encoding = (request.headers.get('content-encoding') || '').toLowerCase();
  const contentType = request.headers.get('content-type') || '';
  let raw: ArrayBuffer;
  try {
    raw = await request.arrayBuffer();
  } catch (err) {
    console.error('[webhooks/dataforseo.POST] body read failed:', err);
    return NextResponse.json({ error: 'Body read failed' }, { status: 400 });
  }

  let bytes = new Uint8Array(raw);
  // Some clients send Content-Encoding: gzip; others omit the header but still
  // send a gzip stream. Detect the magic number (1F 8B) as a safety net.
  const looksGzipped =
    encoding.includes('gzip') ||
    (bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b);
  if (looksGzipped) {
    try {
      const ds = new DecompressionStream('gzip');
      const stream = new Response(bytes).body!.pipeThrough(ds);
      const inflated = await new Response(stream).arrayBuffer();
      bytes = new Uint8Array(inflated);
    } catch (err) {
      console.error(
        '[webhooks/dataforseo.POST] gzip decompress failed',
        JSON.stringify({
          encoding,
          contentType,
          byteLength: bytes.length,
          err: err instanceof Error ? err.message : String(err),
        }),
      );
      return NextResponse.json({ error: 'Gzip decompress failed' }, { status: 400 });
    }
  }

  let body: unknown;
  try {
    const text = new TextDecoder().decode(bytes);
    body = JSON.parse(text);
  } catch (err) {
    const snippet = new TextDecoder().decode(bytes.slice(0, 200));
    console.error(
      '[webhooks/dataforseo.POST] JSON parse failed',
      JSON.stringify({
        encoding,
        contentType,
        byteLength: bytes.length,
        snippet,
        err: err instanceof Error ? err.message : String(err),
      }),
    );
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const parsed = parsePostback(body);
  if (!parsed) {
    console.error(
      '[webhooks/dataforseo.POST] malformed envelope',
      JSON.stringify({
        encoding,
        contentType,
        byteLength: bytes.length,
        topLevelKeys:
          body && typeof body === 'object'
            ? Object.keys(body as Record<string, unknown>).slice(0, 10)
            : null,
      }),
    );
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
  // deleted between submit and postback. Log a warning with the incoming
  // task_id and the most recent pending task_ids so a stuck-row report
  // can be cross-referenced against the upstream id in Vercel logs.
  if (!data) {
    const { data: recent } = await admin
      .from('dataforseo_research')
      .select('task_id, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    console.warn(
      '[webhooks/dataforseo.POST] unmatched task_id',
      JSON.stringify({ incoming: parsed.taskId, recent: recent ?? [] }),
    );
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
