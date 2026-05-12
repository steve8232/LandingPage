/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * One-shot enrichment: add demo-{niche}-avatar-01/02/03 entries to every demo manifest
 * for the 18 local-service niches. Idempotent — re-running skips entries that already exist.
 */
const fs = require('fs');
const path = require('path');

const MANIFESTS_DIR = path.join(__dirname, '..', 'v1', 'assets', 'manifests');

// Verified Pexels portrait photo IDs (sourced via pexels.com search; free Pexels License).
// Each entry maps to https://www.pexels.com/photo/{slug}-{id}/.
const PORTRAITS = {
  A: { id: 26529933, slug: 'portrait-of-smiling-woman' },
  B: { id: 37065614, slug: 'portrait-of-a-smiling-woman-outdoors' },
  C: { id: 17059392, slug: 'close-up-portrait-of-a-young-man-smiling' },
  D: { id: 35103924, slug: 'casual-portrait-of-a-smiling-man-outdoors' },
  E: { id: 2379004, slug: 'portrait-photo-of-smiling-man-with-his-arms-crossed-standing-in-front-of-a-wall' },
  F: { id: 10031281, slug: 'portrait-of-smiling-businessman-sitting-on-desk-in-office' },
  G: { id: 3456882, slug: 'photo-of-woman-smiling' },
  H: { id: 31285126, slug: 'warm-portrait-of-smiling-woman-in-sunlight' },
  I: { id: 41008, slug: 'man-smiling' },
  J: { id: 6338370, slug: 'close-up-shot-of-a-person-smiling' },
  K: { id: 1139743, slug: 'portrait-photo-of-man-in-white-crew-neck-t-shirt-with-assorted-hand-tools-in-background' },
  L: { id: 26733183, slug: 'portrait-of-elderly-man' },
  M: { id: 11433421, slug: 'a-portrait-of-an-elderly-man' },
  N: { id: 33271175, slug: 'elegant-casual-portrait-of-a-man-outdoors' },
  O: { id: 19201205, slug: 'portrait-of-man-with-beard-in-light' },
  P: { id: 5793952, slug: 'a-woman-sitting-in-a-living-room' },
  Q: { id: 636619, slug: 'grayscale-photo-of-man-in-dress-shirt' },
  R: { id: 5838331, slug: 'woman-in-brown-long-sleeve-shirt-using-macbook-pro' },
  S: { id: 3760326, slug: 'portrait-photo-of-laughing-man-in-white-dress-shirt-and-black-framed-eyeglasses-celebrating' },
  T: { id: 3931603, slug: 'smiling-middle-aged-man-using-tablet-and-holding-apple-near-window-in-office' },
};

// Niche → 3 portrait pool letters (rotates through the pool, no duplicates within a niche).
const ASSIGN = {
  plumber:           ['A', 'B', 'C'],
  hvac:              ['D', 'E', 'F'],
  electrical:        ['G', 'H', 'I'],
  roofing:           ['J', 'K', 'L'],
  painters:          ['M', 'N', 'O'],
  fencing:           ['P', 'Q', 'R'],
  'pressure-washing':['S', 'T', 'A'],
  'window-cleaning': ['B', 'C', 'D'],
  'junk-removal':    ['E', 'F', 'G'],
  'house-cleaning':  ['H', 'I', 'J'],
  'carpet-cleaning': ['K', 'L', 'M'],
  'lawn-landscaping':['N', 'O', 'P'],
  'tree-service':    ['Q', 'R', 'S'],
  'pool-service':    ['T', 'A', 'B'],
  'med-spa':         ['C', 'D', 'E'],
  'personal-trainer':['F', 'G', 'H'],
  'dog-grooming':    ['I', 'J', 'K'],
  'auto-detail':     ['L', 'M', 'N'],
};

function entryFor(niche, slot, key) {
  const p = PORTRAITS[key];
  const idx = String(slot).padStart(2, '0');
  return {
    id: `demo-${niche}-avatar-${idx}`,
    role: 'avatar',
    url: `https://images.pexels.com/photos/${p.id}/pexels-photo-${p.id}.jpeg?auto=compress&cs=tinysrgb&w=400`,
    source_page_url: `https://www.pexels.com/photo/${p.slug}-${p.id}/`,
    provider: 'pexels',
    license_summary:
      'Pexels License — free to use, no attribution required, commercial use OK',
    attribution_text: 'Photo from Pexels',
    attribution_url: `https://www.pexels.com/photo/${p.slug}-${p.id}/`,
    notes:
      `Demo reference portrait for ${niche} (testimonial avatar slot ${slot}). ` +
      `Pexels License — replace with the operator's own customer photography for production.`,
  };
}

let touched = 0;
for (const [niche, letters] of Object.entries(ASSIGN)) {
  const filePath = path.join(MANIFESTS_DIR, `${niche}.demo.json`);
  if (!fs.existsSync(filePath)) {
    console.log(`! ${niche}.demo.json — missing, skipping`);
    continue;
  }
  const manifest = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let changed = false;
  for (let i = 0; i < 3; i++) {
    const slot = i + 1;
    const key = `demo-${niche}-avatar-${String(slot).padStart(2, '0')}`;
    if (manifest[key]) continue;
    manifest[key] = entryFor(niche, slot, letters[i]);
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(manifest, null, 2) + '\n');
    touched += 1;
    console.log(`✔ ${niche}.demo.json`);
  } else {
    console.log(`= ${niche}.demo.json (no change)`);
  }
}

console.log(`\nDone. Updated ${touched}/${Object.keys(ASSIGN).length} manifest files.`);
