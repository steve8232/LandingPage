import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  aggregateEvents,
  type HeatmapEventRow,
} from '@/lib/heatmap/aggregate';

/**
 * GET /api/projects/[id]/heatmap
 *   Dashboard data feed for the heatmap viewer. Returns aggregated event
 *   bins for the requested device + deployment along with a short-lived
 *   signed URL for the matching page snapshot.
 *
 *   Query params:
 *     device        'desktop' | 'mobile'           (default 'desktop')
 *     deploymentId  uuid (default: latest deployment with a ready snapshot
 *                   for the selected device)
 *     from, to      ISO timestamps                 (default last 30 days)
 *     sessionId     uuid — when set, restrict events to that one heatmap
 *                   session (used by the Spark-lead / call / identified-
 *                   visitor "View this visitor's heatmap" deep links).
 *
 *   Auth: user-scoped Supabase client; RLS scopes both `heatmap_events`
 *   and `page_snapshots` reads to the project owner. The signed URL is
 *   minted with the service-role admin client because the bucket is private.
 */

const DEVICES = new Set(['desktop', 'mobile']);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_ROWS = 50_000;
const SIGNED_URL_TTL_SECONDS = 60 * 60;

interface SnapshotRow {
  id: string;
  deployment_id: string;
  storage_path: string;
  width_px: number;
  height_px: number | null;
  status: 'pending' | 'ready' | 'error';
}

interface DeploymentMetaRow {
  id: string;
  url: string | null;
  created_at: string;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const deviceParam = params.get('device') || 'desktop';
  if (!DEVICES.has(deviceParam)) {
    return NextResponse.json({ error: 'Invalid device' }, { status: 400 });
  }
  const device = deviceParam as 'desktop' | 'mobile';

  const deploymentIdParam = params.get('deploymentId');
  if (deploymentIdParam && !UUID_RE.test(deploymentIdParam)) {
    return NextResponse.json({ error: 'Invalid deploymentId' }, { status: 400 });
  }

  const sessionIdParam = params.get('sessionId');
  if (sessionIdParam && !UUID_RE.test(sessionIdParam)) {
    return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });
  }

  const now = Date.now();
  const fromMs = parseIsoMs(params.get('from')) ?? now - 30 * 24 * 3600 * 1000;
  const toMs = parseIsoMs(params.get('to')) ?? now;
  if (fromMs >= toMs) {
    return NextResponse.json({ error: 'Invalid range' }, { status: 400 });
  }
  const fromIso = new Date(fromMs).toISOString();
  const toIso = new Date(toMs).toISOString();

  // Ownership check (also rejects unknown ids). RLS scopes the select.
  const { data: ownerRow } = await supabase
    .from('projects')
    .select('id')
    .eq('id', id)
    .maybeSingle();
  if (!ownerRow) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Resolve which snapshot/deployment we're attaching to. Either explicit
  // (caller passed deploymentId) or the most recent ready snapshot for the
  // selected device.
  let snapshot: SnapshotRow | null = null;
  if (deploymentIdParam) {
    const { data } = await supabase
      .from('page_snapshots')
      .select('id, deployment_id, storage_path, width_px, height_px, status')
      .eq('project_id', id)
      .eq('deployment_id', deploymentIdParam)
      .eq('device', device)
      .maybeSingle<SnapshotRow>();
    snapshot = data ?? null;
  } else {
    const { data } = await supabase
      .from('page_snapshots')
      .select('id, deployment_id, storage_path, width_px, height_px, status')
      .eq('project_id', id)
      .eq('device', device)
      .eq('status', 'ready')
      .order('created_at', { ascending: false })
      .limit(1);
    snapshot = (data?.[0] as SnapshotRow | undefined) ?? null;
  }

  let deployment: DeploymentMetaRow | null = null;
  if (snapshot) {
    const { data } = await supabase
      .from('deployments')
      .select('id, url, created_at')
      .eq('id', snapshot.deployment_id)
      .maybeSingle<DeploymentMetaRow>();
    deployment = data ?? null;
  }

  // Mint a signed URL for the snapshot PNG. Bucket is private; service-role
  // bypasses storage RLS.
  let snapshotUrl: string | null = null;
  if (snapshot && snapshot.status === 'ready' && snapshot.storage_path) {
    const admin = createAdminClient();
    const { data: signed } = await admin.storage
      .from('snapshots')
      .createSignedUrl(snapshot.storage_path, SIGNED_URL_TTL_SECONDS);
    snapshotUrl = signed?.signedUrl ?? null;
  }

  // Pull raw events for the device + time window. Capped — popular pages
  // can rack up millions of rows and the dashboard only needs an aggregate.
  // When sessionId is supplied we restrict to that one session so the viewer
  // can show a single visitor's clicks/scroll path.
  let eventsQuery = supabase
    .from('heatmap_events')
    .select('session_id, event_type, x_norm, y_norm, scroll_pct')
    .eq('project_id', id)
    .eq('device', device)
    .gte('created_at', fromIso)
    .lte('created_at', toIso);
  if (sessionIdParam) eventsQuery = eventsQuery.eq('session_id', sessionIdParam);
  const { data: eventRowsRaw } = await eventsQuery
    .order('created_at', { ascending: false })
    .limit(MAX_ROWS);
  const eventRows = (eventRowsRaw ?? []) as HeatmapEventRow[];
  const aggregate = aggregateEvents(eventRows);

  return NextResponse.json({
    device,
    range: { from: fromIso, to: toIso },
    sessionId: sessionIdParam ?? null,
    deployment: deployment
      ? { id: deployment.id, url: deployment.url, createdAt: deployment.created_at }
      : null,
    snapshot: snapshot
      ? {
          url: snapshotUrl,
          widthPx: snapshot.width_px,
          heightPx: snapshot.height_px,
          status: snapshot.status,
        }
      : null,
    totals: aggregate.totals,
    bins: aggregate.bins,
    scrollDepth: aggregate.scrollDepth,
    truncated: eventRows.length >= MAX_ROWS,
  });
}

function parseIsoMs(value: string | null): number | undefined {
  if (!value) return undefined;
  const t = Date.parse(value);
  return Number.isFinite(t) ? t : undefined;
}
