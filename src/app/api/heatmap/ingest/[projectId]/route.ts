import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/heatmap/ingest/[projectId]
 *   Public endpoint hit by /h.js on published v1 pages. Accepts a JSON batch
 *   of click / rage-click / dead-click / scroll events, validates each item,
 *   and bulk-inserts into `public.heatmap_events` via the service-role admin
 *   client (RLS denies anon writes by design — same pattern as /api/leads).
 *
 * OPTIONS /api/heatmap/ingest/[projectId]
 *   CORS preflight — submissions originate from arbitrary subdomains.
 *
 * Notes:
 * - projectId is taken from the URL path; never trusted from the body.
 * - Coordinates arrive normalised (0..1). Out-of-range values are dropped.
 * - target_text is server-side scrubbed: only persisted for BUTTON / A /
 *   H1..H6 tags (defence-in-depth against a tampered tracker).
 * - Failed inserts return 500 but the tracker is fire-and-forget so the
 *   visitor never sees an error.
 */

const MAX_PAYLOAD_BYTES = 64 * 1024; // 64 KB ≫ a batch of 20 events
const MAX_BATCH = 50;                // hard cap regardless of body size
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EVENT_TYPES = new Set(['click', 'rage_click', 'dead_click', 'scroll']);
const DEVICES = new Set(['desktop', 'tablet', 'mobile']);
const TEXT_OK_TAGS = new Set(['BUTTON', 'A', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6']);

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

interface ClientEvent {
  t?: unknown; x?: unknown; y?: unknown; pct?: unknown;
  tag?: unknown; text?: unknown;
}

interface InsertRow {
  project_id: string;
  session_id: string;
  event_type: 'click' | 'rage_click' | 'dead_click' | 'scroll';
  x_norm: number | null;
  y_norm: number | null;
  scroll_pct: number | null;
  viewport_w: number;
  viewport_h: number;
  device: string | null;
  pathname: string;
  target_tag: string | null;
  target_text: string | null;
}

function clampNorm(v: unknown): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  if (v < 0 || v > 1) return null;
  return Math.round(v * 1_000_000) / 1_000_000; // matches numeric(7,6)
}

function clampDimension(v: unknown): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  if (v < 1 || v > 32_000) return null;
  return Math.floor(v);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;
  const headers = corsHeaders(request.headers.get('origin'));

  if (!UUID_RE.test(projectId)) {
    return NextResponse.json({ error: 'Invalid projectId' }, { status: 400, headers });
  }

  const raw = await request.text();
  if (raw.length > MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413, headers });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Malformed body' }, { status: 400, headers });
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Expected an object payload' }, { status: 400, headers });
  }

  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.slice(0, 64) : '';
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400, headers });
  }

  const viewport = body.viewport as { w?: unknown; h?: unknown } | undefined;
  const vw = clampDimension(viewport?.w);
  const vh = clampDimension(viewport?.h);
  if (vw === null || vh === null) {
    return NextResponse.json({ error: 'Bad viewport' }, { status: 400, headers });
  }

  const device = typeof body.device === 'string' && DEVICES.has(body.device) ? body.device : null;
  const pathname = typeof body.pathname === 'string' && body.pathname.length <= 512
    ? body.pathname
    : '/';

  const events = Array.isArray(body.events) ? (body.events as ClientEvent[]).slice(0, MAX_BATCH) : [];
  if (events.length === 0) {
    return NextResponse.json({ ok: true, inserted: 0 }, { status: 200, headers });
  }

  const rows: InsertRow[] = [];
  for (const ev of events) {
    const t = typeof ev?.t === 'string' ? ev.t : '';
    if (!EVENT_TYPES.has(t)) continue;

    let x_norm: number | null = null;
    let y_norm: number | null = null;
    let scroll_pct: number | null = null;
    if (t === 'scroll') {
      const pct = typeof ev.pct === 'number' && Number.isFinite(ev.pct)
        ? Math.max(0, Math.min(100, Math.round(ev.pct)))
        : null;
      if (pct === null) continue;
      scroll_pct = pct;
    } else {
      x_norm = clampNorm(ev.x);
      y_norm = clampNorm(ev.y);
      if (x_norm === null || y_norm === null) continue;
    }

    const tagRaw = typeof ev.tag === 'string' ? ev.tag.toUpperCase().slice(0, 16) : null;
    const tag = tagRaw && /^[A-Z0-9]+$/.test(tagRaw) ? tagRaw : null;
    const text = (typeof ev.text === 'string' && tag && TEXT_OK_TAGS.has(tag))
      ? ev.text.slice(0, 60)
      : null;

    rows.push({
      project_id: projectId,
      session_id: sessionId,
      event_type: t as InsertRow['event_type'],
      x_norm, y_norm, scroll_pct,
      viewport_w: vw, viewport_h: vh,
      device, pathname,
      target_tag: tag,
      target_text: text,
    });
  }

  if (rows.length === 0) {
    return NextResponse.json({ ok: true, inserted: 0 }, { status: 200, headers });
  }

  const admin = createAdminClient();
  const { error: insertErr } = await admin.from('heatmap_events').insert(rows);
  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500, headers });
  }
  return NextResponse.json({ ok: true, inserted: rows.length }, { status: 201, headers });
}
