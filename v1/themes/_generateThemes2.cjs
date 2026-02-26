/**
 * Generator Part 2 — remaining 6 theme CSS files.
 * Run: node v1/themes/_generateThemes2.cjs
 */
const fs = require('fs');
const path = require('path');
const DIR = __dirname;

const themes = [
  { file: 'theme-professional', name: 'Professional Consulting (Light)', desc: 'Polished corporate blue for consultants and coaches.',
    primary:'#1e40af', primaryDark:'#1e3a8a', accent:'#0ea5e9', bg:'#ffffff', bgAlt:'#f8fafc', text:'#0f172a', textMuted:'#475569', border:'#cbd5e1',
    heroBg:'#f1f5f9', heroText:'#0f172a', ctaBg:'#1e40af', ctaText:'#ffffff', cardBg:'#ffffff', cardText:'#0f172a', footerBg:'#0f172a', footerText:'#cbd5e1',
    font:"'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", radiusMd:'8px', radiusLg:'12px',
    shadowMd:'0 4px 8px rgba(30,64,175,0.06)', shadowLg:'0 10px 20px rgba(30,64,175,0.1)' },
  { file: 'theme-law-finance', name: 'Law & Finance (Light)', desc: 'Authoritative dark tones with gold accent for legal/financial.',
    primary:'#1f2937', primaryDark:'#111827', accent:'#b45309', bg:'#ffffff', bgAlt:'#f9fafb', text:'#111827', textMuted:'#4b5563', border:'#d1d5db',
    heroBg:'#1f2937', heroText:'#ffffff', ctaBg:'#b45309', ctaText:'#ffffff', cardBg:'#ffffff', cardText:'#111827', footerBg:'#111827', footerText:'#9ca3af',
    font:"Georgia, 'Times New Roman', serif", radiusMd:'4px', radiusLg:'8px',
    shadowMd:'0 2px 8px rgba(31,41,55,0.08)', shadowLg:'0 6px 16px rgba(31,41,55,0.12)' },
  { file: 'theme-leadgen', name: 'Lead Gen (Light)', desc: 'Versatile purple/blue theme for webinars, ebooks, and lead gen pages.',
    primary:'#7c3aed', primaryDark:'#6d28d9', accent:'#06b6d4', bg:'#ffffff', bgAlt:'#f5f3ff', text:'#1e293b', textMuted:'#64748b', border:'#e2e8f0',
    heroBg:'#4c1d95', heroText:'#ffffff', ctaBg:'#7c3aed', ctaText:'#ffffff', cardBg:'#ffffff', cardText:'#1e293b', footerBg:'#1e1b4b', footerText:'#c4b5fd',
    font:"Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", radiusMd:'10px', radiusLg:'16px',
    shadowMd:'0 4px 10px rgba(124,58,237,0.08)', shadowLg:'0 10px 24px rgba(124,58,237,0.12)' },
  { file: 'theme-coming-soon-minimal-dark', name: 'Coming Soon Minimal (Dark)', desc: 'Dark, minimal, elegant — for pre-launch and waitlist pages.',
    primary:'#e2e8f0', primaryDark:'#cbd5e1', accent:'#38bdf8', bg:'#0f172a', bgAlt:'#1e293b', text:'#e2e8f0', textMuted:'#94a3b8', border:'#334155',
    heroBg:'#020617', heroText:'#f1f5f9', ctaBg:'#e2e8f0', ctaText:'#0f172a', cardBg:'#1e293b', cardText:'#e2e8f0', footerBg:'#020617', footerText:'#64748b',
    font:"Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", radiusMd:'8px', radiusLg:'12px',
    shadowMd:'0 4px 12px rgba(0,0,0,0.4)', shadowLg:'0 10px 24px rgba(0,0,0,0.5)' },
  { file: 'theme-coming-soon-vibrant', name: 'Coming Soon Vibrant (Light)', desc: 'Colorful gradient vibes for energetic launch countdowns.',
    primary:'#ec4899', primaryDark:'#db2777', accent:'#8b5cf6', bg:'#ffffff', bgAlt:'#fdf2f8', text:'#1e293b', textMuted:'#64748b', border:'#fce7f3',
    heroBg:'linear-gradient(135deg,#ec4899,#8b5cf6)', heroText:'#ffffff', ctaBg:'#ec4899', ctaText:'#ffffff', cardBg:'#ffffff', cardText:'#1e293b', footerBg:'#1e1b4b', footerText:'#c4b5fd',
    font:"'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", radiusMd:'12px', radiusLg:'20px',
    shadowMd:'0 4px 12px rgba(236,72,153,0.1)', shadowLg:'0 10px 24px rgba(236,72,153,0.15)' },
  { file: 'theme-ebook-download', name: 'Ebook Download (Light)', desc: 'Calm teal/cyan for resource downloads and content offers.',
    primary:'#0891b2', primaryDark:'#0e7490', accent:'#06b6d4', bg:'#ffffff', bgAlt:'#ecfeff', text:'#164e63', textMuted:'#64748b', border:'#cffafe',
    heroBg:'#164e63', heroText:'#ffffff', ctaBg:'#0891b2', ctaText:'#ffffff', cardBg:'#ffffff', cardText:'#164e63', footerBg:'#0c4a6e', footerText:'#bae6fd',
    font:"Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", radiusMd:'10px', radiusLg:'14px',
    shadowMd:'0 4px 8px rgba(8,145,178,0.06)', shadowLg:'0 8px 20px rgba(8,145,178,0.1)' },
];

for (const t of themes) {
  const css = `/*
 * Theme: ${t.name}
 *
 * ${t.desc}
 *
 * All overrides target .v1-page so they layer on top of tokens.css
 * without affecting any legacy styles.
 */

.v1-page {
  /* —— Colour overrides —— */
  --v1-color-primary: ${t.primary};
  --v1-color-primary-dark: ${t.primaryDark};
  --v1-color-accent: ${t.accent};
  --v1-color-bg: ${t.bg};
  --v1-color-bg-alt: ${t.bgAlt};
  --v1-color-text: ${t.text};
  --v1-color-text-muted: ${t.textMuted};
  --v1-color-border: ${t.border};
  --v1-color-hero-bg: ${t.heroBg};
  --v1-color-hero-text: ${t.heroText};
  --v1-color-cta-bg: ${t.ctaBg};
  --v1-color-cta-text: ${t.ctaText};
  --v1-color-card-bg: ${t.cardBg};
  --v1-color-card-text: ${t.cardText};
  --v1-color-footer-bg: ${t.footerBg};
  --v1-color-footer-text: ${t.footerText};

  /* —— Typography —— */
  --v1-font-family: ${t.font};

  /* —— Layout feel —— */
  --v1-radius-md: ${t.radiusMd};
  --v1-radius-lg: ${t.radiusLg};

  /* —— Shadow —— */
  --v1-shadow-md: ${t.shadowMd};
  --v1-shadow-lg: ${t.shadowLg};
}
`;
  fs.writeFileSync(path.join(DIR, `${t.file}.css`), css);
  console.log(`  ✓ ${t.file}.css`);
}
console.log(`\nPart 2 done — ${themes.length} themes written.`);

