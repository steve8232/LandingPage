/**
 * SocialProofLogos Section
 *
 * A horizontal strip of trust badges / partner logos with inline SVG icons.
 * The AI selects badge IDs from AVAILABLE_BADGES; unrecognised IDs fall back
 * to a styled text label so the section never breaks.
 *
 * Props:
 *   heading – text above the logo bar
 *   logos   – array of badge IDs (keys of BADGE_LIBRARY)
 */

export interface SocialProofLogosProps {
  heading?: string;
  logos: string[];
}

/* ── Badge SVG library ────────────────────────────────────────────────────── */

/**
 * Each entry: { label, svg }
 * SVGs are 24×24 viewBox, monochrome (uses currentColor so it inherits the
 * section text colour automatically).  Kept intentionally small so the
 * self-contained HTML stays lightweight.
 */
interface BadgeEntry { label: string; svg: string }

const BADGE_LIBRARY: Record<string, BadgeEntry> = {
  /* ── General trust ─────────────────────────────────────────────────────── */
  'bbb': {
    label: 'BBB Accredited',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 8h3c1.1 0 2 .9 2 2s-.9 2-2 2H8V8z"/><path d="M8 12h3.5c1.1 0 2 .9 2 2s-.9 2-2 2H8v-4z"/></svg>`,
  },
  'google-reviews': {
    label: 'Google Reviews',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  },
  'yelp': {
    label: 'Yelp',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v8l6 3-6 3v6"/><path d="M6 14l6-3"/><circle cx="12" cy="12" r="10"/></svg>`,
  },
  'trustpilot': {
    label: 'Trustpilot',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/><line x1="12" y1="17.77" x2="12" y2="21.5"/></svg>`,
  },
  'facebook': {
    label: 'Facebook',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>`,
  },
  'instagram': {
    label: 'Instagram',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r=".5" fill="currentColor"/></svg>`,
  },

  /* ── Security & compliance ─────────────────────────────────────────────── */
  'ssl-secure': {
    label: 'SSL Secure',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1" fill="currentColor"/></svg>`,
  },
  'hipaa': {
    label: 'HIPAA Compliant',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>`,
  },
  'iso-certified': {
    label: 'ISO Certified',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>`,
  },
  'gdpr': {
    label: 'GDPR Compliant',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="13"/><circle cx="12" cy="16" r=".5" fill="currentColor"/></svg>`,
  },

  /* ── Industry-specific ────────────────────────────────────────────────── */
  'licensed-insured': {
    label: 'Licensed & Insured',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  },
  'money-back': {
    label: 'Money-Back Guarantee',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="6" x2="12" y2="18"/><path d="M15 9.5c0-1.38-1.34-2.5-3-2.5S9 8.12 9 9.5 10.34 12 12 12s3 1.12 3 2.5-1.34 2.5-3 2.5"/></svg>`,
  },
  'free-estimates': {
    label: 'Free Estimates',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  },
  '5-star-rated': {
    label: '5-Star Rated',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor" stroke="none"/></svg>`,
  },
  'award-winning': {
    label: 'Award Winning',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>`,
  },
  'locally-owned': {
    label: 'Locally Owned',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  },
  'satisfaction-guaranteed': {
    label: 'Satisfaction Guaranteed',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-6 0v4"/><path d="M5 9h14l1 12H4L5 9z"/><path d="M9 14l2 2 4-4"/></svg>`,
  },
  'verified': {
    label: 'Verified',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  },
  'fast-response': {
    label: 'Fast Response',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  },
};

/** Exported so the AI prompt can list available badge IDs */
export const AVAILABLE_BADGES = Object.keys(BADGE_LIBRARY);

/* ── Renderer ─────────────────────────────────────────────────────────────── */

/**
 * Fuzzy-match an AI-returned badge name to a library key.
 * Normalises to lowercase, strips spaces/hyphens/underscores, and checks
 * for substring containment in both directions.
 */
function matchBadge(input: string): BadgeEntry | null {
  const norm = input.toLowerCase().replace(/[\s_-]+/g, '');
  // Exact normalised match
  for (const [key, entry] of Object.entries(BADGE_LIBRARY)) {
    const keyNorm = key.toLowerCase().replace(/[\s_-]+/g, '');
    if (keyNorm === norm) return entry;
  }
  // Substring match (badge key in input, or input in badge key)
  for (const [key, entry] of Object.entries(BADGE_LIBRARY)) {
    const keyNorm = key.toLowerCase().replace(/[\s_-]+/g, '');
    if (norm.includes(keyNorm) || keyNorm.includes(norm)) return entry;
  }
  // Label substring match
  for (const [, entry] of Object.entries(BADGE_LIBRARY)) {
    const labelNorm = entry.label.toLowerCase().replace(/[\s_-]+/g, '');
    if (norm.includes(labelNorm) || labelNorm.includes(norm)) return entry;
  }
  return null;
}

export function renderSocialProofLogos(props: SocialProofLogosProps): string {
  const heading = props.heading || 'Trusted By';

  const logosHtml = props.logos
    .map((id) => {
      const badge = matchBadge(id);

      if (badge) {
        // Render with inline SVG icon + label
        return `
      <div style="
        display: flex; align-items: center; gap: 8px;
        background: var(--v1-color-bg);
        border: 1px solid var(--v1-color-border);
        border-radius: var(--v1-radius-sm, 4px);
        padding: var(--v1-space-3) var(--v1-space-6);
        min-width: 130px; height: 52px;
        color: var(--v1-color-text-muted);
        transition: box-shadow .2s;
      ">
        <span style="width:24px; height:24px; flex-shrink:0; color: var(--v1-color-primary);">${badge.svg}</span>
        <span style="
          font-size: var(--v1-font-size-sm);
          font-weight: var(--v1-font-weight-semibold);
          line-height: 1.2;
          color: var(--v1-color-text);
        ">${escapeHtml(badge.label)}</span>
      </div>`;
      }

      // Fallback: plain text badge (for unrecognised names)
      return `
      <div style="
        display: flex; align-items: center; justify-content: center;
        background: var(--v1-color-bg);
        border: 1px solid var(--v1-color-border);
        border-radius: var(--v1-radius-sm, 4px);
        padding: var(--v1-space-3) var(--v1-space-6);
        min-width: 120px; height: 52px;
        font-size: var(--v1-font-size-sm);
        color: var(--v1-color-text-muted);
        font-weight: var(--v1-font-weight-medium);
        text-transform: capitalize;
      ">${escapeHtml(id.replace(/-/g, ' '))}</div>`;
    })
    .join('\n');

  return `
<section class="v1-social-proof" style="
  background: var(--v1-color-bg-alt);
  padding: var(--v1-space-10) 0;
  text-align: center;
">
  <div class="v1-container">
    <p style="
      font-size: var(--v1-font-size-sm);
      color: var(--v1-color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: var(--v1-space-6);
      font-weight: var(--v1-font-weight-semibold);
    ">${escapeHtml(heading)}</p>
    <div style="
      display: flex; flex-wrap: wrap; justify-content: center;
      gap: var(--v1-space-5);
    ">
      ${logosHtml}
    </div>
  </div>
</section>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

