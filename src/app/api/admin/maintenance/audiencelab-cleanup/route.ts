import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/role';
import {
  applyCleanup,
  findCleanupCandidates,
  type CleanupCandidate,
} from '@/lib/audiencelab/cleanup';

/**
 * GET  /api/admin/maintenance/audiencelab-cleanup
 *   Dry-run scan. Returns every project whose stored pixel is stale.
 *   Read-only — safe to poll.
 *
 * POST /api/admin/maintenance/audiencelab-cleanup  { pixelIds?: string[] }
 *   Destructive. With no body, deletes every current candidate (matches the
 *   CLI). With `pixelIds`, only the candidates whose pixelId is in that list
 *   are deleted (lets the UI guard against TOCTOU — if the scan that the
 *   admin saw is older than the apply, we won't delete anything they didn't
 *   explicitly confirm).
 */

export const dynamic = 'force-dynamic';

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  try {
    const admin = createAdminClient();
    const { scanned, candidates } = await findCleanupCandidates(admin);
    return NextResponse.json({ scanned, candidates });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Scan failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  let body: unknown = {};
  if (request.headers.get('content-length') !== '0') {
    try { body = await request.json(); } catch { body = {}; }
  }
  const b = (body || {}) as Record<string, unknown>;
  const rawIds = Array.isArray(b.pixelIds) ? b.pixelIds : null;
  const requestedIds = rawIds
    ? new Set(rawIds.filter((x): x is string => typeof x === 'string'))
    : null;

  try {
    const admin = createAdminClient();
    const { candidates: all } = await findCleanupCandidates(admin);
    const candidates: CleanupCandidate[] = requestedIds
      ? all.filter((c) => requestedIds.has(c.pixelId))
      : all;

    if (requestedIds && candidates.length !== requestedIds.size) {
      // Some requested pixelIds are no longer candidates (someone else
      // already cleaned them up, or the project was re-deployed). Continue
      // with the intersection but flag it so the UI can refresh.
      console.warn(
        `[admin/audiencelab-cleanup] requested ${requestedIds.size} pixels, ${candidates.length} still candidates`
      );
    }

    const { outcomes, deleted, notFound, failed, nulled } = await applyCleanup(
      admin,
      candidates,
    );

    return NextResponse.json({
      requested: requestedIds ? requestedIds.size : all.length,
      processed: candidates.length,
      deleted,
      notFound,
      failed,
      nulled,
      outcomes,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Cleanup failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
