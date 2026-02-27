/**
 * HeroSplit Section
 *
 * A two-column hero: text on the left, image on the right.
 * Uses v1 design tokens for all styling so the theme controls appearance.
 *
 * Props:
 *   headline    – main heading text
 *   subheadline – supporting copy below the heading
 *   ctaLabel    – button text
 *   ctaHref     – button link target (default "#contact")
 *   imageAsset  – logical asset ID resolved by the composer
 */

export interface HeroSplitProps {
  /** Small, uppercase kicker above the headline (e.g. "For fast-moving teams") */
  eyebrow?: string;
  headline: string;
  subheadline: string;
  ctaLabel: string;
  ctaHref?: string;
  /** Secondary CTA displayed next to the primary CTA (e.g. "See pricing") */
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  /** Bullet list under the subheadline for scannability */
  bullets?: string[];
  /** Small proof chips (e.g. "4.9★ avg rating", "SOC 2-ready") */
  proofPoints?: string[];
  /** Micro-trust line displayed under the CTA button (e.g. "✓ 500+ happy customers") */
  trustBadge?: string;
  imageAsset?: string;
  /** Resolved image URL — injected by the composer from the spec's asset map. */
  _resolvedImageUrl?: string;
  /** Local fallback URL — injected by the composer (used for data-fallback + initial load if needed). */
  _fallbackImageUrl?: string;
  /** Alt text for the hero image — injected by the composer from enhancement overrides. */
  _altText?: string;
}

export function renderHeroSplit(props: HeroSplitProps): string {
  const href = props.ctaHref || '#contact';
  const href2 = props.secondaryCtaHref || '#contact';
  const fallback = props._fallbackImageUrl || '/v1/assets/placeholders/common/logo-placeholder.svg';
  const imgUrl = props._resolvedImageUrl || fallback;

  const checkSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  const bulletsHtml = Array.isArray(props.bullets) && props.bullets.length
    ? `<ul class="v1-checklist" style="margin-top: var(--v1-space-6); margin-bottom: var(--v1-space-8);">
        ${props.bullets.slice(0, 5).map((b) => `<li style="color: var(--v1-color-hero-text); opacity: 0.92;">${checkSvg}<span>${escapeHtml(b)}</span></li>`).join('')}
      </ul>`
    : '';

  const proofHtml = Array.isArray(props.proofPoints) && props.proofPoints.length
    ? `<div style="display:flex; flex-wrap: wrap; gap: 10px; margin-top: var(--v1-space-8);">
        ${props.proofPoints.slice(0, 4).map((p) => `<span class="v1-chip">${escapeHtml(p)}</span>`).join('')}
      </div>`
    : '';

  return `
<section class="v1-hero-split" style="
  display: flex; flex-wrap: wrap; align-items: center;
  background: var(--v1-color-hero-bg);
  color: var(--v1-color-hero-text);
  padding: var(--v1-space-20) 0;
  min-height: 480px;
">
  <div class="v1-container" style="
    display: flex; flex-wrap: wrap; align-items: center; gap: var(--v1-space-12); width: 100%;
  ">
    <!-- Text column -->
    <div style="flex: 1 1 400px; min-width: 0;">
	      ${props.eyebrow ? `<p class="v1-eyebrow" style="color: var(--v1-color-hero-text);">${escapeHtml(props.eyebrow)}</p>` : ''}
      <h1 style="
        font-size: var(--v1-font-size-5xl);
        font-weight: var(--v1-font-weight-bold);
        line-height: var(--v1-line-height-tight);
        margin-bottom: var(--v1-space-6);
        color: var(--v1-color-hero-text);
      ">${escapeHtml(props.headline)}</h1>
      <p style="
        font-size: var(--v1-font-size-lg);
        color: var(--v1-color-hero-text);
        opacity: 0.9;
	        margin-bottom: ${bulletsHtml ? 'var(--v1-space-4)' : 'var(--v1-space-8)'};
        max-width: 540px;
      ">${escapeHtml(props.subheadline)}</p>
	      ${bulletsHtml}
	      <div style="display:flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-top: var(--v1-space-2);">
	        <a href="${escapeAttr(href)}" class="v1-btn v1-btn--primary" style="font-size: var(--v1-font-size-lg); padding: var(--v1-space-4) var(--v1-space-8);">
	          ${escapeHtml(props.ctaLabel)}
	        </a>
	        ${props.secondaryCtaLabel ? `<a href="${escapeAttr(href2)}" class="v1-btn v1-btn--ghost v1-btn--on-hero" style="font-size: var(--v1-font-size-base); padding: 12px 16px;">${escapeHtml(props.secondaryCtaLabel)}</a>` : ''}
	      </div>
	      ${props.trustBadge ? `
	      <p style="
	        margin-top: var(--v1-space-4);
	        font-size: var(--v1-font-size-sm);
	        color: var(--v1-color-hero-text);
	        opacity: 0.78;
	      ">${escapeHtml(props.trustBadge)}</p>` : ''}
	      ${proofHtml}
    </div>
    <!-- Image column -->
    <div style="flex: 1 1 360px; min-width: 0; text-align: center;">
      <img
        src="${escapeAttr(imgUrl)}"
        alt="${escapeAttr(props._altText || '')}"
        data-fallback="${escapeAttr(fallback)}"
        onerror="if(this.dataset.fallback&&this.src!==this.dataset.fallback){this.src=this.dataset.fallback;}"
        style="
          width: 100%; max-width: 520px;
          border-radius: var(--v1-radius-lg);
          box-shadow: var(--v1-shadow-lg);
          object-fit: cover;
        "
      />
    </div>
  </div>
</section>`;
}

/* ── Helpers ─────────────────────────────────────────────────────────── */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str: string): string {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

