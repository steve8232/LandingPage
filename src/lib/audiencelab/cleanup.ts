/**
 * Shared AudienceLab pixel-cleanup logic.
 *
 * Single source of truth for both the CLI (`scripts/cleanup-audiencelab-pixels.ts`)
 * and the admin UI (`/admin/integrations`). See the CLI script header for the
 * full rationale; in short, a pixel is "legacy" when EITHER:
 *   - the project has no ready custom domain (the stored pixel is inert
 *     post the custom-domain gate and just clutters AudienceLab); OR
 *   - the stored audiencelab_pixel_website_url is NULL (pre-migration row)
 *     or doesn't match `https://${project.custom_domain}` (user attached a
 *     different brand domain).
 */

import type { createAdminClient } from '../supabase/admin';
import { deletePixel as defaultDeletePixel } from './client';

type AdminClient = ReturnType<typeof createAdminClient>;
type DeletePixelFn = typeof defaultDeletePixel;

export type CleanupReason = 'no_ready_custom_domain' | 'website_url_mismatch';

export interface CleanupCandidate {
  projectId: string;
  projectTitle: string | null;
  pixelId: string;
  reason: CleanupReason;
  /** `https://<custom_domain>` when the project has one, else null. */
  expectedUrl: string | null;
  /** What's stored in `audiencelab_pixel_website_url` today. */
  currentWebsiteUrl: string | null;
}

export interface CleanupScanResult {
  scanned: number;
  candidates: CleanupCandidate[];
}

export type CleanupOutcomeKind =
  | 'deleted'      // AudienceLab DELETE returned 2xx, DB row nulled.
  | 'notFound'     // AudienceLab returned 404 (already gone), DB row nulled.
  | 'failed'       // AudienceLab DELETE threw; DB row left alone.
  | 'db_failed';   // AudienceLab DELETE succeeded but DB update failed.

export interface CleanupOutcome {
  projectId: string;
  pixelId: string;
  outcome: CleanupOutcomeKind;
  message?: string;
}

export interface CleanupApplyResult {
  outcomes: CleanupOutcome[];
  deleted: number;
  notFound: number;
  failed: number;
  nulled: number;
}

interface Row {
  id: string;
  title: string | null;
  custom_domain: string | null;
  custom_domain_status: string | null;
  audiencelab_pixel_id: string | null;
  audiencelab_pixel_website_url: string | null;
}

function classify(row: Row): CleanupCandidate | null {
  if (!row.audiencelab_pixel_id) return null;
  const ready = !!row.custom_domain && row.custom_domain_status === 'ready';
  const expectedUrl = ready ? `https://${row.custom_domain}` : null;
  if (!ready) {
    return {
      projectId: row.id,
      projectTitle: row.title,
      pixelId: row.audiencelab_pixel_id,
      reason: 'no_ready_custom_domain',
      expectedUrl: null,
      currentWebsiteUrl: row.audiencelab_pixel_website_url,
    };
  }
  if (row.audiencelab_pixel_website_url !== expectedUrl) {
    return {
      projectId: row.id,
      projectTitle: row.title,
      pixelId: row.audiencelab_pixel_id,
      reason: 'website_url_mismatch',
      expectedUrl,
      currentWebsiteUrl: row.audiencelab_pixel_website_url,
    };
  }
  return null;
}

/**
 * Read-only scan. Returns every project whose stored pixel is now stale.
 * Safe to call from any admin surface — no side effects.
 */
export async function findCleanupCandidates(
  admin: AdminClient,
): Promise<CleanupScanResult> {
  const { data, error } = await admin
    .from('projects')
    .select(
      'id, title, custom_domain, custom_domain_status, audiencelab_pixel_id, audiencelab_pixel_website_url'
    )
    .not('audiencelab_pixel_id', 'is', null);
  if (error) throw new Error(`findCleanupCandidates: ${error.message}`);
  const rows = (data ?? []) as Row[];
  const candidates = rows
    .map(classify)
    .filter((c): c is CleanupCandidate => c !== null);
  return { scanned: rows.length, candidates };
}

/**
 * Destructive. For each candidate: DELETE in AudienceLab, then NULL the
 * local triple. A 404 from AudienceLab is folded into success (re-runnable).
 * Per-row failures don't abort the batch — every candidate gets an outcome.
 */
export async function applyCleanup(
  admin: AdminClient,
  candidates: CleanupCandidate[],
  deletePixelFn: DeletePixelFn = defaultDeletePixel,
): Promise<CleanupApplyResult> {
  const outcomes: CleanupOutcome[] = [];
  let deleted = 0, notFound = 0, failed = 0, nulled = 0;

  for (const c of candidates) {
    let label: 'deleted' | 'notFound';
    try {
      const res = await deletePixelFn(c.pixelId);
      if (res.notFound) { notFound++; label = 'notFound'; }
      else { deleted++; label = 'deleted'; }
    } catch (err) {
      failed++;
      outcomes.push({
        projectId: c.projectId, pixelId: c.pixelId, outcome: 'failed',
        message: err instanceof Error ? err.message : String(err),
      });
      continue;
    }

    const { error: updErr } = await admin
      .from('projects')
      .update({
        audiencelab_pixel_id: null,
        audiencelab_install_url: null,
        audiencelab_pixel_website_url: null,
      })
      .eq('id', c.projectId);
    if (updErr) {
      outcomes.push({
        projectId: c.projectId, pixelId: c.pixelId, outcome: 'db_failed',
        message: updErr.message,
      });
    } else {
      nulled++;
      outcomes.push({ projectId: c.projectId, pixelId: c.pixelId, outcome: label });
    }
  }

  return { outcomes, deleted, notFound, failed, nulled };
}
