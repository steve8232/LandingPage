#!/usr/bin/env node
/**
 * Replace 24 broken manifest entries (18 checklist + 6 avatar/gallery
 * stragglers) with verified Pexels photos borrowed from other niches.
 *
 * The new entries copy full attribution/source from the donor manifest
 * entry, retain the original manifest key + role, and refresh `notes`
 * to record the cross-niche origin and the standard "replace for
 * production" disclaimer.
 *
 * Idempotent — running twice is a no-op (the broken URL is gone after run 1).
 */
const fs = require('fs');
const path = require('path');

const manifestsDir = path.join(__dirname, '..', 'v1', 'assets', 'manifests');

// (targetNiche, targetKey)  →  (donorNiche, donorKey)
// Each donor is HEAD-verified (see scripts/audit-checklist-urls.cjs) and
// no donor collides with another slot already present on the target page.
const REASSIGNMENTS = [
  // ── 18 checklist entries ───────────────────────────────────────────────
  ['auto-detail',       'demo-auto-detail-checklist-01',       'personal-trainer', 'demo-personal-trainer-differentiator-01'],
  ['carpet-cleaning',   'demo-carpet-cleaning-checklist-01',   'house-cleaning',   'demo-house-cleaning-gallery-02'],
  ['dog-grooming',      'demo-dog-grooming-checklist-01',      'med-spa',          'demo-med-spa-differentiator-01'],
  ['electrical',        'demo-electrical-checklist-01',        'hvac',             'demo-hvac-differentiator-01'],
  ['fencing',           'demo-fencing-checklist-01',           'roofing',          'demo-roofing-differentiator-01'],
  ['house-cleaning',    'demo-house-cleaning-checklist-01',    'carpet-cleaning',  'demo-carpet-cleaning-differentiator-01'],
  ['hvac',              'demo-hvac-checklist-01',              'electrical',       'demo-electrical-differentiator-01'],
  ['junk-removal',      'demo-junk-removal-checklist-01',      'fencing',          'demo-fencing-gallery-02'],
  ['lawn-landscaping',  'demo-lawn-landscaping-checklist-01',  'tree-service',     'demo-tree-service-differentiator-01'],
  ['med-spa',           'demo-med-spa-checklist-01',           'personal-trainer', 'demo-personal-trainer-gallery-03'],
  ['painters',          'demo-painters-checklist-01',          'roofing',          'demo-roofing-gallery-02'],
  ['personal-trainer',  'demo-personal-trainer-checklist-01',  'med-spa',          'demo-med-spa-gallery-03'],
  ['plumber',           'demo-plumber-checklist-01',           'painters',         'demo-painters-differentiator-01'],
  ['pool-service',      'demo-pool-service-checklist-01',      'fencing',          'demo-fencing-differentiator-01'],
  ['pressure-washing',  'demo-pressure-washing-checklist-01',  'painters',         'demo-painters-gallery-02'],
  ['roofing',           'demo-roofing-checklist-01',           'carpet-cleaning',  'demo-carpet-cleaning-gallery-02'],
  ['tree-service',      'demo-tree-service-checklist-01',      'dog-grooming',     'demo-dog-grooming-gallery-02'],
  ['window-cleaning',   'demo-window-cleaning-checklist-01',   'house-cleaning',   'demo-house-cleaning-gallery-03'],

  // ── 6 avatar / gallery stragglers ──────────────────────────────────────
  ['dog-grooming',      'demo-dog-grooming-avatar-01',         'carpet-cleaning',  'demo-carpet-cleaning-avatar-01'],
  ['electrical',        'demo-electrical-avatar-03',           'hvac',             'demo-hvac-avatar-01'],
  ['house-cleaning',    'demo-house-cleaning-avatar-02',       'plumber',          'demo-plumber-avatar-01'],
  ['electrical',        'demo-electrical-gallery-03',          'roofing',          'demo-roofing-gallery-02'],
  ['hvac',              'demo-hvac-gallery-03',                'fencing',          'demo-fencing-gallery-02'],
  ['plumber',           'demo-plumber-gallery-03',             'painters',         'demo-painters-gallery-02'],
];

function load(niche) {
  return JSON.parse(fs.readFileSync(path.join(manifestsDir, `${niche}.demo.json`), 'utf8'));
}
function save(niche, data) {
  fs.writeFileSync(
    path.join(manifestsDir, `${niche}.demo.json`),
    JSON.stringify(data, null, 2) + '\n'
  );
}

// Cache donor manifests so we read each file at most once.
const donorCache = {};
function getDonor(niche) {
  if (!donorCache[niche]) donorCache[niche] = load(niche);
  return donorCache[niche];
}

let changed = 0;
const touchedTargets = new Set();

for (const [targetNiche, targetKey, donorNiche, donorKey] of REASSIGNMENTS) {
  const target = touchedTargets.has(targetNiche) ? donorCache[targetNiche] : load(targetNiche);
  donorCache[targetNiche] = target;
  touchedTargets.add(targetNiche);

  const donor = getDonor(donorNiche);
  const donorEntry = donor[donorKey];
  if (!donorEntry) {
    console.error(`[skip] donor missing: ${donorNiche}/${donorKey}`);
    continue;
  }
  const existing = target[targetKey];
  if (!existing) {
    console.error(`[skip] target missing: ${targetNiche}/${targetKey}`);
    continue;
  }

  const role = existing.role;
  target[targetKey] = {
    id: targetKey,
    role,
    url: donorEntry.url,
    source_page_url: donorEntry.source_page_url,
    provider: donorEntry.provider,
    license_summary: donorEntry.license_summary,
    attribution_text: donorEntry.attribution_text,
    attribution_url: donorEntry.attribution_url,
    notes: `Demo reference imagery for ${targetNiche} (${role}); donor=${donorNiche}/${donorKey}. Pexels License — replace with the operator's own photography for production.`,
  };
  changed++;
  console.log(`✔ ${targetNiche.padEnd(20)} ${targetKey.padEnd(45)} ← ${donorNiche}/${donorKey}`);
}

// Persist every touched manifest file.
for (const niche of touchedTargets) {
  save(niche, donorCache[niche]);
}

console.log(`\nUpdated ${changed} manifest entries across ${touchedTargets.size} files.`);
