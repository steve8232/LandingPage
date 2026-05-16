import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/leads/[projectId]
 *   Public endpoint hit by submitted forms on published v1 pages
 *   (`*.pages.sparkpage.us` and `*.vercel.app`). Accepts JSON or
 *   form-encoded bodies, persists a row in `public.leads` via the
 *   service-role admin client (RLS blocks anon inserts by design), and
 *   returns `{ ok: true, redirect: '/thank-you' }`.
 *
 * OPTIONS /api/leads/[projectId]
 *   CORS preflight — submissions originate from arbitrary subdomains.
 *
 * Notes:
 * - We never trust the client to send the project id in the body; it
 *   comes from the URL path which the composer bakes into the form action.
 * - The payload is stored as raw jsonb; field-name validation happens at
 *   the read side when surfacing leads in the dashboard.
 * - We cap the payload at MAX_PAYLOAD_BYTES to prevent abuse.
 */

const MAX_PAYLOAD_BYTES = 32 * 1024; // 32 KB ≫ any legit form submission
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    // The inlined form handler sends both headers. If `Accept` is omitted here,
    // some browsers fail the preflight before the POST ever reaches this route.
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get('origin')),
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  if (!UUID_RE.test(projectId)) {
    return NextResponse.json(
      { error: 'Invalid projectId' },
      { status: 400, headers }
    );
  }

  // Read raw body once so we can both size-check and parse it.
  const raw = await request.text();
  if (raw.length > MAX_PAYLOAD_BYTES) {
    return NextResponse.json(
      { error: 'Payload too large' },
      { status: 413, headers }
    );
  }

  // Accept JSON, application/x-www-form-urlencoded, or multipart/form-data.
  const contentType = (request.headers.get('content-type') || '').toLowerCase();
  let payload: Record<string, unknown> = {};
  try {
    if (contentType.includes('application/json')) {
      payload = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const params = new URLSearchParams(raw);
      payload = Object.fromEntries(params.entries());
    } else {
      // Fallback: attempt JSON, then form-encoded.
      try {
        payload = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      } catch {
        payload = Object.fromEntries(new URLSearchParams(raw).entries());
      }
    }
  } catch {
    return NextResponse.json(
      { error: 'Malformed body' },
      { status: 400, headers }
    );
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return NextResponse.json(
      { error: 'Expected an object payload' },
      { status: 400, headers }
    );
  }

  // Service-role insert: RLS denies anon writes, and the visitor submitting
  // the form is not the project owner.
  const admin = createAdminClient();

  // Confirm the project exists before inserting so we don't accumulate
  // orphan leads from typo'd / spoofed ids.
  const { data: projectRow, error: projectErr } = await admin
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .maybeSingle();
  if (projectErr) {
    return NextResponse.json({ error: projectErr.message }, { status: 500, headers });
  }
  if (!projectRow) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404, headers });
  }

  const userAgent = request.headers.get('user-agent') || null;
  const referer = request.headers.get('referer') || null;
  const xff = request.headers.get('x-forwarded-for') || '';
  const ip = xff.split(',')[0]?.trim() || null;

  const { error: insertErr } = await admin.from('leads').insert({
    project_id: projectId,
    payload,
    user_agent: userAgent,
    referer,
    ip,
  });

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500, headers });
  }

  return NextResponse.json(
    { ok: true, redirect: '/thank-you' },
    { status: 201, headers }
  );
}
