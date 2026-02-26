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
  headline: string;
  subheadline: string;
  ctaLabel: string;
  ctaHref?: string;
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
  const fallback = props._fallbackImageUrl || '/v1/assets/placeholders/common/logo-placeholder.svg';
  const imgUrl = props._resolvedImageUrl || fallback;

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
        margin-bottom: var(--v1-space-8);
        max-width: 540px;
      ">${escapeHtml(props.subheadline)}</p>
      <a href="${escapeAttr(href)}" style="
        display: inline-block;
        background: var(--v1-color-cta-bg);
        color: var(--v1-color-cta-text);
        padding: var(--v1-space-4) var(--v1-space-8);
        border-radius: var(--v1-radius-md);
        font-weight: var(--v1-font-weight-semibold);
        font-size: var(--v1-font-size-lg);
        text-decoration: none;
        transition: opacity 0.2s;
      ">${escapeHtml(props.ctaLabel)}</a>${props.trustBadge ? `
      <p style="
        margin-top: var(--v1-space-4);
        font-size: var(--v1-font-size-sm);
        color: var(--v1-color-hero-text);
        opacity: 0.75;
      ">${escapeHtml(props.trustBadge)}</p>` : ''}
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

