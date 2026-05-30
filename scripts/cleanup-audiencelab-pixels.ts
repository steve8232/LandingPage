/**
 * One-shot cleanup for legacy AudienceLab pixels.
 *
 * Background: before commit c82abaa, pixels were auto-provisioned on first
 * deploy against whichever URL the project happened to be live on — usually
 * *.pages.sparkpage.us. That cluttered the AudienceLab dashboard. The deploy
 * route now re-provisions a fresh pixel against a project's custom domain
 * when it goes 'ready'; this script scrubs the stale entries left behind.
 *
 * Scope: only pixels SparkPage created and still tracks in the projects
 * table. Pixels created manually outside SparkPage are left alone. A pixel
 * is treated as "legacy" when EITHER:
 *   • the project has no ready custom domain (so the stored pixel is inert
 *     post-c82abaa and just clutters AudienceLab); OR
 *   • the stored audiencelab_pixel_website_url is NULL (pre-migration row)
 *     or doesn't match `https://${project.custom_domain}` (e.g. the user
 *     attached a different brand domain).
 *
 * On --apply, each matching pixel is DELETEd in AudienceLab and the local
 * triple (audiencelab_pixel_id / _install_url / _pixel_website_url) is
 * NULLed so the next publish re-provisions cleanly when the project has a
 * ready custom domain.
 *
 * Usage (from landing-page-designer/):
 *   npm run cleanup:audiencelab            # dry-run, prints what would change
 *   npm run cleanup:audiencelab -- --apply # actually delete + null columns
 */

import { createAdminClient } from '../src/lib/supabase/admin';
import {
  applyCleanup,
  findCleanupCandidates,
  type CleanupCandidate,
  type CleanupOutcome,
} from '../src/lib/audiencelab/cleanup';

function describe(c: CleanupCandidate): string {
  const tag = `[${c.projectId.slice(0, 8)}] ${c.projectTitle ?? '(untitled)'}`;
  const why = c.reason === 'no_ready_custom_domain'
    ? 'no ready custom domain'
    : `stored ${JSON.stringify(c.currentWebsiteUrl)} != expected ${JSON.stringify(c.expectedUrl)}`;
  return `${tag} — pixel ${c.pixelId} — reason: ${why}`;
}

function logOutcome(o: CleanupOutcome): void {
  switch (o.outcome) {
    case 'deleted':
      console.log(`  ↳ AudienceLab DELETE ok; DB columns nulled`);
      break;
    case 'notFound':
      console.log(`  ↳ AudienceLab 404 (already gone); DB columns nulled`);
      break;
    case 'failed':
      console.warn(`  ↳ AudienceLab DELETE failed: ${o.message ?? 'unknown'} — leaving local row alone`);
      break;
    case 'db_failed':
      console.warn(`  ↳ AudienceLab DELETE ok but DB update failed: ${o.message ?? 'unknown'}`);
      break;
  }
}

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply');
  if (!process.env.AUDIENCELAB_API_KEY) {
    console.error('[cleanup] Missing AUDIENCELAB_API_KEY. Did you forget --env-file=.env.local?');
    process.exit(2);
  }

  const admin = createAdminClient();
  const { scanned, candidates } = await findCleanupCandidates(admin);

  console.log(`[cleanup] scanned ${scanned} project(s) with a pixel; ${candidates.length} candidate(s) for cleanup.`);
  console.log(`[cleanup] mode: ${apply ? 'APPLY (destructive)' : 'dry-run (read-only)'}\n`);

  for (const c of candidates) console.log(describe(c));

  if (!apply) {
    if (candidates.length > 0) {
      console.log(`\n[cleanup] re-run with --apply to perform the cleanup.`);
    }
    return;
  }

  console.log('');
  const { outcomes, deleted, notFound, failed, nulled } = await applyCleanup(admin, candidates);
  for (let i = 0; i < candidates.length; i++) {
    console.log(describe(candidates[i]));
    logOutcome(outcomes[i]);
  }

  console.log(`\n[cleanup] done. candidates=${candidates.length} deleted=${deleted} notFound=${notFound} failed=${failed} nulled=${nulled}`);
}

main().catch((err) => {
  console.error('[cleanup] fatal:', err);
  process.exit(1);
});
