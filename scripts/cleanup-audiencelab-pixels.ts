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
import { deletePixel } from '../src/lib/audiencelab/client';

interface Row {
  id: string;
  title: string | null;
  custom_domain: string | null;
  custom_domain_status: string | null;
  audiencelab_pixel_id: string | null;
  audiencelab_install_url: string | null;
  audiencelab_pixel_website_url: string | null;
}

interface Candidate {
  row: Row;
  reason: 'no_ready_custom_domain' | 'website_url_mismatch';
  expectedUrl: string | null;
}

function classify(row: Row): Candidate | null {
  if (!row.audiencelab_pixel_id) return null;
  const ready =
    !!row.custom_domain && row.custom_domain_status === 'ready';
  const expectedUrl = ready ? `https://${row.custom_domain}` : null;
  if (!ready) {
    return { row, reason: 'no_ready_custom_domain', expectedUrl: null };
  }
  if (row.audiencelab_pixel_website_url !== expectedUrl) {
    return { row, reason: 'website_url_mismatch', expectedUrl };
  }
  return null;
}

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply');
  if (!process.env.AUDIENCELAB_API_KEY) {
    console.error('[cleanup] Missing AUDIENCELAB_API_KEY. Did you forget --env-file=.env.local?');
    process.exit(2);
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('projects')
    .select(
      'id, title, custom_domain, custom_domain_status, audiencelab_pixel_id, audiencelab_install_url, audiencelab_pixel_website_url'
    )
    .not('audiencelab_pixel_id', 'is', null);

  if (error) {
    console.error('[cleanup] query failed:', error.message);
    process.exit(1);
  }
  const rows = (data ?? []) as Row[];
  const candidates = rows.map(classify).filter((c): c is Candidate => c !== null);

  console.log(`[cleanup] scanned ${rows.length} project(s) with a pixel; ${candidates.length} candidate(s) for cleanup.`);
  console.log(`[cleanup] mode: ${apply ? 'APPLY (destructive)' : 'dry-run (read-only)'}\n`);

  let deleted = 0;
  let notFound = 0;
  let failed = 0;
  let nulled = 0;

  for (const c of candidates) {
    const tag = `[${c.row.id.slice(0, 8)}] ${c.row.title ?? '(untitled)'}`;
    const why = c.reason === 'no_ready_custom_domain'
      ? 'no ready custom domain'
      : `stored ${JSON.stringify(c.row.audiencelab_pixel_website_url)} != expected ${JSON.stringify(c.expectedUrl)}`;
    console.log(`${tag} — pixel ${c.row.audiencelab_pixel_id} — reason: ${why}`);

    if (!apply) continue;

    try {
      const res = await deletePixel(c.row.audiencelab_pixel_id!);
      if (res.notFound) {
        notFound++;
        console.log(`  ↳ AudienceLab 404 (already gone) — treating as success`);
      } else {
        deleted++;
        console.log(`  ↳ AudienceLab DELETE ok`);
      }
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`  ↳ AudienceLab DELETE failed: ${msg} — leaving local row alone`);
      continue;
    }

    const { error: updErr } = await admin
      .from('projects')
      .update({
        audiencelab_pixel_id: null,
        audiencelab_install_url: null,
        audiencelab_pixel_website_url: null,
      })
      .eq('id', c.row.id);
    if (updErr) {
      console.warn(`  ↳ DB update failed: ${updErr.message}`);
    } else {
      nulled++;
      console.log(`  ↳ DB columns nulled`);
    }
  }

  console.log(`\n[cleanup] done. candidates=${candidates.length} deleted=${deleted} notFound=${notFound} failed=${failed} nulled=${nulled}`);
  if (!apply && candidates.length > 0) {
    console.log(`[cleanup] re-run with --apply to perform the cleanup.`);
  }
}

main().catch((err) => {
  console.error('[cleanup] fatal:', err);
  process.exit(1);
});
