/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * One-shot enrichment: add testimonialAvatar1/2/3 (+ fallbacks) to every v1-*.ts spec
 * and wire each of the first three testimonials with avatarAsset.
 *
 * Idempotent: re-running detects existing testimonialAvatar1 in the assets map and skips.
 */
const fs = require('fs');
const path = require('path');

const SPECS_DIR = path.join(__dirname, '..', 'v1', 'specs');

const SEED_FOR = (niche) => ({
  testimonialAvatar1: `real photo professional headshot of happy ${niche} customer, woman late 30s, warm friendly smile, residential setting`,
  testimonialAvatar2: `real photo professional headshot of satisfied ${niche} customer, man early 40s, casual confident, daylight`,
  testimonialAvatar3: `real photo warm portrait of mature ${niche} repeat customer, woman 50s, natural light, trustworthy expression`,
});

function nicheFromFile(name) {
  // v1-plumber.ts → plumber
  return name.replace(/^v1-/, '').replace(/\.ts$/, '');
}

function injectIntoAssets(src, niche) {
  // Skip if already added
  if (src.includes('testimonialAvatar1:')) return { src, changed: false };

  // Find the assets: { ... } block end ("  }," that closes it)
  const assetsStart = src.indexOf('\n  assets: {');
  if (assetsStart < 0) return { src, changed: false };
  const assetsEnd = src.indexOf('\n  },', assetsStart);
  if (assetsEnd < 0) return { src, changed: false };

  // Insert before the closing brace line. Place new keys right before the closing.
  const insertion =
    `\n    testimonialAvatar1: 'demo-${niche}-avatar-01',` +
    `\n    testimonialAvatar2: 'demo-${niche}-avatar-02',` +
    `\n    testimonialAvatar3: 'demo-${niche}-avatar-03',` +
    `\n    fallbackTestimonialAvatar1: '/v1/assets/placeholders/common/avatar-placeholder.svg',` +
    `\n    fallbackTestimonialAvatar2: '/v1/assets/placeholders/common/avatar-placeholder.svg',` +
    `\n    fallbackTestimonialAvatar3: '/v1/assets/placeholders/common/avatar-placeholder.svg',`;

  const updated = src.slice(0, assetsEnd) + insertion + src.slice(assetsEnd);
  return { src: updated, changed: true };
}

function injectIntoSearchSeeds(src, niche) {
  if (src.includes('testimonialAvatar1:') && src.split('testimonialAvatar1:').length > 2) {
    // already in both assets + seeds; skip
  }
  const seedsStart = src.indexOf('\n  assetSearchSeeds: {');
  if (seedsStart < 0) return src;
  const seedsEnd = src.indexOf('\n  },', seedsStart);
  if (seedsEnd < 0) return src;

  // Detect if seeds already contain testimonialAvatar1 anywhere between start/end
  const seedsBlock = src.slice(seedsStart, seedsEnd);
  if (seedsBlock.includes('testimonialAvatar1:')) return src;

  const seeds = SEED_FOR(niche);
  const insertion =
    `\n    testimonialAvatar1: '${seeds.testimonialAvatar1}',` +
    `\n    testimonialAvatar2: '${seeds.testimonialAvatar2}',` +
    `\n    testimonialAvatar3: '${seeds.testimonialAvatar3}',`;

  return src.slice(0, seedsEnd) + insertion + src.slice(seedsEnd);
}

function wireTestimonialAvatarAssets(src) {
  // Find the TestimonialsCards section block, then wire the first 3 testimonials with avatarAsset.
  const tcMarker = "type: 'TestimonialsCards',";
  const idx = src.indexOf(tcMarker);
  if (idx < 0) return src;

  // Find the testimonials: [ array start after the marker
  const arrStart = src.indexOf('testimonials: [', idx);
  if (arrStart < 0) return src;
  // Find matching closing "]," for testimonials array
  const arrEnd = src.indexOf(']', arrStart);
  if (arrEnd < 0) return src;

  const arrBlock = src.slice(arrStart, arrEnd);

  // If already wired, skip
  if (arrBlock.includes('avatarAsset:')) return src;

  // Each testimonial entry ends with " }," — inject avatarAsset right before the closing " }"
  let i = 0;
  const updatedBlock = arrBlock.replace(/(name: '[^']*',\s*title: '[^']*'\s*)\}/g, (_, prefix) => {
    i += 1;
    const idx = Math.min(i, 3);
    return `${prefix}, avatarAsset: 'testimonialAvatar${idx}', fallbackAsset: 'fallbackTestimonialAvatar${idx}' }`;
  });

  return src.slice(0, arrStart) + updatedBlock + src.slice(arrEnd);
}

const files = fs.readdirSync(SPECS_DIR).filter((f) => /^v1-.+\.ts$/.test(f));
let touched = 0;
for (const file of files) {
  const niche = nicheFromFile(file);
  const filePath = path.join(SPECS_DIR, file);
  let src = fs.readFileSync(filePath, 'utf8');
  const before = src;

  const a = injectIntoAssets(src, niche);
  src = a.src;
  src = injectIntoSearchSeeds(src, niche);
  src = wireTestimonialAvatarAssets(src);

  if (src !== before) {
    fs.writeFileSync(filePath, src);
    touched += 1;
    console.log(`✔ ${file}`);
  } else {
    console.log(`= ${file} (no change)`);
  }
}

console.log(`\nDone. Updated ${touched}/${files.length} spec files.`);
