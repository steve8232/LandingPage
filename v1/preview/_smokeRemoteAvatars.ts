/**
 * Smoke test (remote-image path): compose every 18 niche template with
 * allowRemoteDemoImages=true and verify every testimonialAvatar1/2/3 marker
 * resolves to a real Pexels portrait URL.
 *
 * Run from landing-page-designer/:
 *   npx tsx v1/preview/_smokeRemoteAvatars.ts
 */
import { composeV1Template } from '../composer/composeV1Template';
import { getV1Spec } from '../specs/index';

const NICHE_IDS = [
  'v1-plumber', 'v1-hvac', 'v1-electrical', 'v1-roofing', 'v1-painters',
  'v1-fencing', 'v1-pressure-washing', 'v1-window-cleaning', 'v1-junk-removal',
  'v1-house-cleaning', 'v1-carpet-cleaning', 'v1-lawn-landscaping',
  'v1-tree-service', 'v1-pool-service', 'v1-med-spa', 'v1-personal-trainer',
  'v1-dog-grooming', 'v1-auto-detail',
];

const failures: string[] = [];
let passes = 0;

for (const id of NICHE_IDS) {
  const spec = getV1Spec(id);
  if (!spec) {
    failures.push(`${id}: spec not found`);
    continue;
  }
  try {
    const out = composeV1Template(id, undefined, { allowRemoteDemoImages: true });
    const html = out.html;

    const markers = ['testimonialAvatar1', 'testimonialAvatar2', 'testimonialAvatar3'];
    const missing = markers.filter((m) => !html.includes(`data-v1-asset-key="${m}"`));
    const pexelsCount = (html.match(/https:\/\/images\.pexels\.com\/photos\/\d+\/pexels-photo-\d+\.jpeg/g) || []).length;
    // Multiline-aware: match an <img …> tag (any whitespace incl. newlines) whose
    // src points to a Pexels w=400 portrait URL and which carries a testimonialAvatarN key.
    const avatarPexels = (html.match(/<img[\s\S]*?src="https:\/\/images\.pexels\.com\/photos\/\d+\/pexels-photo-\d+\.jpeg[^"]*w=400[^"]*"[\s\S]*?data-v1-asset-key="testimonialAvatar[123]"/g) || []).length;

    if (missing.length) {
      failures.push(`${id}: missing marker(s) ${missing.join(',')}`);
    } else if (avatarPexels < 3) {
      failures.push(`${id}: only ${avatarPexels}/3 avatars resolved to Pexels URLs (total pexels images=${pexelsCount})`);
    } else {
      passes += 1;
      console.log(`✔ ${id} → ${avatarPexels}/3 avatars resolved to Pexels (total pexels imgs=${pexelsCount})`);
    }
  } catch (err) {
    failures.push(`${id}: composer threw → ${(err as Error).message}`);
  }
}

console.log(`\n${passes}/${NICHE_IDS.length} templates passed.`);
if (failures.length) {
  console.error('\nFAILURES:');
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}
