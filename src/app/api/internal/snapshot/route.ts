import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { capturePageSnapshot } from '@/lib/snapshots/capture';

/**
 * POST /api/internal/snapshot
 *   Internal endpoint called fire-and-forget by the deployments polling route
 *   when a deployment transitions to status='ready'. Captures a full-page
 *   PNG of the live URL via headless Chromium, uploads it to the `snapshots`
 *   Supabase Storage bucket, and flips the matching page_snapshots row from
 *   'pending' → 'ready' (or 'error' on failure).
 *
 *   Authenticated with INTERNAL_SNAPSHOT_SECRET so it cannot be invoked by
 *   end users. The caller MUST pre-insert the page_snapshots row with
 *   status='pending' before firing this request, then pass the row id.
 *
 * Request JSON:
 *   { snapshotId: uuid, projectId: uuid, deploymentId: uuid,
 *     url: string, device?: 'desktop'|'tablet'|'mobile' }
 *
 * Runs on the Node.js runtime — Playwright + the sparticuz binary require it.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Snapshots routinely take 5–15s of wall time. 60s gives us headroom on the
// rare slow build while staying well under Vercel's hard ceiling.
export const maxDuration = 60;

const DEVICE_WIDTHS: Record<'desktop' | 'tablet' | 'mobile', number> = {
  desktop: 1440,
  tablet: 820,
  mobile: 390,
};

interface RequestBody {
  snapshotId: string;
  projectId: string;
  deploymentId: string;
  url: string;
  device?: 'desktop' | 'tablet' | 'mobile';
}

function unauthorized(): NextResponse {
  // Generic message — never reveal whether the secret env var is set so a
  // probe can't distinguish "wrong key" from "feature disabled".
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function POST(request: NextRequest) {
  const secret = process.env.INTERNAL_SNAPSHOT_SECRET;
  if (!secret) return unauthorized();
  const header = request.headers.get('authorization') || '';
  const expected = `Bearer ${secret}`;
  if (header !== expected) return unauthorized();

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const { snapshotId, projectId, deploymentId, url } = body;
  const device = body.device ?? 'desktop';
  if (!snapshotId || !projectId || !deploymentId || !url) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const admin = createAdminClient();
  const storagePath = `${projectId}/${deploymentId}/${device}.png`;

  try {
    const { png, widthPx, heightPx } = await capturePageSnapshot({
      url,
      width: DEVICE_WIDTHS[device],
    });

    const { error: upErr } = await admin.storage
      .from('snapshots')
      .upload(storagePath, png, {
        contentType: 'image/png',
        upsert: true,
      });
    if (upErr) throw new Error(`storage upload failed: ${upErr.message}`);

    const { error: dbErr } = await admin
      .from('page_snapshots')
      .update({
        storage_path: storagePath,
        width_px: widthPx,
        height_px: heightPx,
        status: 'ready',
        error_message: null,
      })
      .eq('id', snapshotId);
    if (dbErr) throw new Error(`db update failed: ${dbErr.message}`);

    return NextResponse.json({ ok: true, storagePath, widthPx, heightPx });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'snapshot failed';
    // Best-effort: record the failure on the row so the dashboard can show
    // why a heatmap has no background snapshot. Never throw from this branch.
    await admin
      .from('page_snapshots')
      .update({ status: 'error', error_message: message.slice(0, 500) })
      .eq('id', snapshotId)
      .then(
        () => {},
        () => {}
      );
    console.warn('[api/internal/snapshot] capture failed:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
