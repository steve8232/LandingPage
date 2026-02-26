/**
 * Generator script — creates all placeholder SVGs and demo manifest JSONs.
 * Run: node v1/assets/_generate.cjs
 */
const fs = require('fs');
const path = require('path');
const BASE = path.resolve(__dirname);

// ── Style definitions ──────────────────────────────────────────────────────
const STYLES = [
  { id: 'saas-modern-light', cat: 'saas', fill: '#2563eb', label: 'SaaS Modern' },
  { id: 'saas-dark-purple', cat: 'saas', fill: '#7c3aed', label: 'SaaS Dark' },
  { id: 'ecommerce-clean-warm', cat: 'ecommerce', fill: '#d97706', label: 'E-com Clean' },
  { id: 'ecommerce-bold-red', cat: 'ecommerce', fill: '#dc2626', label: 'E-com Bold' },
  { id: 'local-services-trust', cat: 'local', fill: '#1e3a5f', label: 'Local Trust' },
  { id: 'eco-friendly-services', cat: 'eco', fill: '#059669', label: 'Eco Friendly' },
  { id: 'professional-consulting', cat: 'professional', fill: '#1e40af', label: 'Consulting' },
  { id: 'law-finance', cat: 'law', fill: '#1f2937', label: 'Law Finance' },
  { id: 'webinar-signup', cat: 'leadgen', fill: '#7c3aed', label: 'Webinar' },
  { id: 'ebook-download', cat: 'leadgen', fill: '#0891b2', label: 'Ebook' },
  { id: 'coming-soon-minimal-dark', cat: 'comingsoon', fill: '#111827', label: 'CS Minimal' },
  { id: 'coming-soon-vibrant-light', cat: 'comingsoon', fill: '#ec4899', label: 'CS Vibrant' },
];

// ── SVG generators ─────────────────────────────────────────────────────────
function heroSvg(fill) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <rect width="1200" height="675" fill="${fill}" opacity="0.12"/>
  <rect x="100" y="100" width="400" height="200" rx="16" fill="${fill}" opacity="0.18"/>
  <rect x="100" y="340" width="300" height="24" rx="4" fill="${fill}" opacity="0.22"/>
  <rect x="100" y="380" width="220" height="24" rx="4" fill="${fill}" opacity="0.15"/>
  <circle cx="850" cy="337" r="180" fill="${fill}" opacity="0.15"/>
  <rect x="700" y="200" width="300" height="200" rx="20" fill="${fill}" opacity="0.1"/>
</svg>`;
}
function cardSvg(fill, n) {
  const offset = n * 20;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <rect width="600" height="600" fill="${fill}" opacity="0.08"/>
  <rect x="80" y="${80 + offset}" width="440" height="260" rx="16" fill="${fill}" opacity="0.14"/>
  <rect x="120" y="${380 + offset / 2}" width="200" height="20" rx="4" fill="${fill}" opacity="0.18"/>
  <rect x="120" y="${420 + offset / 2}" width="140" height="20" rx="4" fill="${fill}" opacity="0.12"/>
  <circle cx="460" cy="${480}" r="40" fill="${fill}" opacity="0.15"/>
</svg>`;
}

// ── Common placeholders ────────────────────────────────────────────────────
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60">
  <rect width="200" height="60" fill="#e2e8f0" rx="8"/>
  <rect x="12" y="15" width="30" height="30" rx="6" fill="#94a3b8"/>
  <rect x="52" y="22" width="100" height="16" rx="4" fill="#94a3b8"/>
</svg>`;
const avatarSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <circle cx="60" cy="60" r="60" fill="#e2e8f0"/>
  <circle cx="60" cy="45" r="22" fill="#94a3b8"/>
  <ellipse cx="60" cy="100" rx="36" ry="28" fill="#94a3b8"/>
</svg>`;

fs.writeFileSync(path.join(BASE, 'placeholders/common/logo-placeholder.svg'), logoSvg);
fs.writeFileSync(path.join(BASE, 'placeholders/common/avatar-placeholder.svg'), avatarSvg);
console.log('  ✓ common/logo-placeholder.svg');
console.log('  ✓ common/avatar-placeholder.svg');

// ── Per-style SVG placeholders ─────────────────────────────────────────────
for (const s of STYLES) {
  const dir = path.join(BASE, 'placeholders', s.cat);
  fs.writeFileSync(path.join(dir, `${s.id}-hero-01.svg`), heroSvg(s.fill));
  fs.writeFileSync(path.join(dir, `${s.id}-card-01.svg`), cardSvg(s.fill, 0));
  fs.writeFileSync(path.join(dir, `${s.id}-card-02.svg`), cardSvg(s.fill, 1));
  console.log(`  ✓ ${s.cat}/${s.id}-hero-01.svg  card-01  card-02`);
}

console.log(`\nGenerated ${2 + STYLES.length * 3} SVG placeholders.`);

