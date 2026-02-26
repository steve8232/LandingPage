/**
 * Generator — creates theme CSS files for all 12 template styles.
 * Run: node v1/themes/_generateThemes.cjs
 */
const fs = require('fs');
const path = require('path');
const DIR = __dirname;

const themes = [
  { file: 'theme-saas-modern-light', name: 'SaaS Modern (Light)', desc: 'Clean blue tones with green accent. Modern SaaS product feel.',
    primary:'#2563eb', primaryDark:'#1e40af', accent:'#10b981', bg:'#ffffff', bgAlt:'#f0f4ff', text:'#1e293b', textMuted:'#64748b', border:'#e2e8f0',
    heroBg:'#f8fafc', heroText:'#1e293b', ctaBg:'#2563eb', ctaText:'#ffffff', cardBg:'#ffffff', cardText:'#1e293b', footerBg:'#1e293b', footerText:'#f8fafc',
    font:"Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", radiusMd:'10px', radiusLg:'16px',
    shadowMd:'0 4px 6px rgba(37,99,235,0.06)', shadowLg:'0 10px 20px rgba(37,99,235,0.08)' },
  { file: 'theme-saas-dark-purple', name: 'SaaS Dark (Purple)', desc: 'Dark mode with vibrant purple accents for tech/SaaS.',
    primary:'#7c3aed', primaryDark:'#6d28d9', accent:'#a78bfa', bg:'#0f172a', bgAlt:'#1e293b', text:'#e2e8f0', textMuted:'#94a3b8', border:'#334155',
    heroBg:'#0f172a', heroText:'#f1f5f9', ctaBg:'#7c3aed', ctaText:'#ffffff', cardBg:'#1e293b', cardText:'#e2e8f0', footerBg:'#020617', footerText:'#94a3b8',
    font:"Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", radiusMd:'10px', radiusLg:'16px',
    shadowMd:'0 4px 12px rgba(0,0,0,0.3)', shadowLg:'0 10px 24px rgba(0,0,0,0.4)' },
  { file: 'theme-ecommerce-clean-warm', name: 'E-commerce Clean (Warm)', desc: 'Warm accents with clean layout for product stores.',
    primary:'#92400e', primaryDark:'#78350f', accent:'#d97706', bg:'#ffffff', bgAlt:'#fffbeb', text:'#1c1917', textMuted:'#78716c', border:'#e7e5e4',
    heroBg:'#fffbeb', heroText:'#1c1917', ctaBg:'#d97706', ctaText:'#ffffff', cardBg:'#ffffff', cardText:'#1c1917', footerBg:'#292524', footerText:'#e7e5e4',
    font:"'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", radiusMd:'8px', radiusLg:'12px',
    shadowMd:'0 4px 8px rgba(146,64,14,0.06)', shadowLg:'0 8px 20px rgba(146,64,14,0.1)' },
  { file: 'theme-ecommerce-bold-red', name: 'E-commerce Bold (Red)', desc: 'Bold red CTAs with high-contrast layout for aggressive e-commerce.',
    primary:'#dc2626', primaryDark:'#b91c1c', accent:'#f59e0b', bg:'#ffffff', bgAlt:'#fef2f2', text:'#171717', textMuted:'#525252', border:'#e5e5e5',
    heroBg:'#171717', heroText:'#ffffff', ctaBg:'#dc2626', ctaText:'#ffffff', cardBg:'#ffffff', cardText:'#171717', footerBg:'#171717', footerText:'#d4d4d4',
    font:"'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", radiusMd:'6px', radiusLg:'10px',
    shadowMd:'0 4px 10px rgba(220,38,38,0.08)', shadowLg:'0 8px 24px rgba(220,38,38,0.12)' },
  { file: 'theme-local-services-trust', name: 'Local Services Trust (Light)', desc: 'Trustworthy navy + bold orange for contractors, plumbers, etc.',
    primary:'#1e3a5f', primaryDark:'#0f2744', accent:'#f97316', bg:'#ffffff', bgAlt:'#f0f9ff', text:'#1e293b', textMuted:'#64748b', border:'#cbd5e1',
    heroBg:'#1e3a5f', heroText:'#ffffff', ctaBg:'#f97316', ctaText:'#ffffff', cardBg:'#ffffff', cardText:'#1e293b', footerBg:'#0f2744', footerText:'#e2e8f0',
    font:"Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", radiusMd:'8px', radiusLg:'12px',
    shadowMd:'0 4px 12px rgba(30,58,95,0.08)', shadowLg:'0 8px 24px rgba(30,58,95,0.12)' },
  { file: 'theme-eco-friendly', name: 'Eco-Friendly Services (Light)', desc: 'Green palette for landscaping, eco cleaning, sustainable services.',
    primary:'#059669', primaryDark:'#047857', accent:'#84cc16', bg:'#ffffff', bgAlt:'#f0fdf4', text:'#1a2e05', textMuted:'#4b5563', border:'#d1d5db',
    heroBg:'#064e3b', heroText:'#ffffff', ctaBg:'#059669', ctaText:'#ffffff', cardBg:'#ffffff', cardText:'#1a2e05', footerBg:'#064e3b', footerText:'#d1fae5',
    font:"'Nunito Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", radiusMd:'10px', radiusLg:'16px',
    shadowMd:'0 4px 10px rgba(5,150,105,0.06)', shadowLg:'0 8px 20px rgba(5,150,105,0.1)' },
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
console.log(`\nPart 1 done — ${themes.length} themes written.`);

