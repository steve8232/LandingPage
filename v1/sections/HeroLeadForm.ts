/**
 * HeroLeadForm Section
 *
 * Two-column hero with copy on the left and an above-the-fold lead form
 * on the right. Used by local-service templates where the conversion
 * action is "request a quote / book a service" and we want the form
 * visible without scrolling.
 *
 * Props:
 *   eyebrow         – small kicker above the headline
 *   headline        – main headline
 *   subheadline     – supporting copy
 *   bullets         – short list of key benefits/promises
 *   ctaLabel        – submit button label
 *   formHeading     – optional small heading above the form fields
 *   formSubheading  – optional supporting line above the form fields
 *   trustBadge      – micro-trust line under the form
 *   imageAsset      – background image asset key (resolved by composer)
 *   _formHtml       – injected by the composer from spec.form
 */

export interface HeroLeadFormProps {
  eyebrow?: string;
  headline: string;
  subheadline: string;
  bullets?: string[];
  ctaLabel: string;
  formHeading?: string;
  formSubheading?: string;
  trustBadge?: string;
  proofPoints?: string[];

  /** Optional background image asset key (resolved by composer). */
  imageAsset?: string;
  /** Injected by composer */
  _resolvedImageUrl?: string;
  _fallbackImageUrl?: string;
  _altText?: string;
  _formHtml?: string;
}

export function renderHeroLeadForm(props: HeroLeadFormProps): string {
  const headline = props.headline || 'Get a free estimate today';
  const subheadline = props.subheadline || 'Tell us what you need — we will reply fast.';
  const ctaLabel = props.ctaLabel || 'Request my estimate';
  const formHeading = props.formHeading || 'Request your free estimate';
  const formSubheading = props.formSubheading || 'No obligation. Quick reply.';

  const checkSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  const bulletsHtml = Array.isArray(props.bullets) && props.bullets.length
    ? `<ul class="v1-checklist" style="margin-top: var(--v1-space-6);">
        ${props.bullets.slice(0, 5).map((b) => `<li style="color: var(--v1-color-hero-text); opacity: 0.92;">${checkSvg}<span>${escapeHtml(b)}</span></li>`).join('')}
      </ul>`
    : '';

  const proofHtml = Array.isArray(props.proofPoints) && props.proofPoints.length
    ? `<div style="display:flex; flex-wrap: wrap; gap: 10px; margin-top: var(--v1-space-6);">
        ${props.proofPoints.slice(0, 4).map((p) => `<span class="v1-chip">${escapeHtml(p)}</span>`).join('')}
      </div>`
    : '';

  const bgUrl = props._resolvedImageUrl || props._fallbackImageUrl || '';
  const fallbackUrl = props._fallbackImageUrl || '';
  const altText = props._altText || '';
  const heroBgStyle = bgUrl
    ? `background:
         linear-gradient(135deg, rgba(0,0,0,0.55), rgba(0,0,0,0.35)),
         var(--v1-color-hero-bg) url('${escapeAttr(bgUrl)}') center/cover no-repeat;`
    : `background: var(--v1-color-hero-bg);`;

  // Click-target overlay: lets editor click-to-edit pick up the hero asset
  // without enclosing the copy/form columns (which carry data-v1-field-key
  // elements that must not bubble up through an asset-key ancestor).
  const heroAssetOverlay = props.imageAsset
    ? `<img
         src="${escapeAttr(bgUrl)}"
         alt="${escapeAttr(altText)}"
         data-v1-asset-key="${escapeAttr(props.imageAsset)}"
         data-fallback="${escapeAttr(fallbackUrl)}"
         onerror="if(this.dataset.fallback&&this.src!==this.dataset.fallback){this.src=this.dataset.fallback;}"
         aria-hidden="true"
         style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:0; cursor:pointer; z-index:0;"
       />`
    : '';

  const formBody = props._formHtml
    ? `${props._formHtml}
       <button type="submit" class="v1-btn v1-btn--primary" data-v1-field-key="ctaLabel" style="width:100%; font-size: var(--v1-font-size-lg); padding: var(--v1-space-4) var(--v1-space-8); margin-top: var(--v1-space-2);">
         ${escapeHtml(ctaLabel)}
       </button>`
    : `<a href="#contact" class="v1-btn v1-btn--primary" data-v1-field-key="ctaLabel" style="width:100%; font-size: var(--v1-font-size-lg); padding: var(--v1-space-4) var(--v1-space-8);">
         ${escapeHtml(ctaLabel)}
       </a>`;

  return `
<section class="v1-hero-split v1-hero-leadform" style="
  ${heroBgStyle}
  color: var(--v1-color-hero-text);
  padding: var(--v1-space-20) 0;
  position: relative;
">
  ${heroAssetOverlay}
  <div class="v1-container" style="
    display: flex; flex-wrap: wrap; align-items: center; gap: var(--v1-space-12); width: 100%;
    position: relative; z-index: 1;
  ">
    <!-- Copy column -->
    <div style="flex: 1 1 440px; min-width: 0;">
      ${props.eyebrow ? `<p class="v1-eyebrow" data-v1-field-key="eyebrow" style="color: var(--v1-color-hero-text);">${escapeHtml(props.eyebrow)}</p>` : ''}
      <h1 data-v1-field-key="headline" style="
        font-size: var(--v1-font-size-5xl);
        font-weight: var(--v1-font-weight-bold);
        line-height: var(--v1-line-height-tight);
        margin-bottom: var(--v1-space-6);
        color: var(--v1-color-hero-text);
      ">${escapeHtml(headline)}</h1>
      <p data-v1-field-key="subheadline" style="
        font-size: var(--v1-font-size-lg);
        color: var(--v1-color-hero-text);
        opacity: 0.92;
        margin-bottom: var(--v1-space-4);
        max-width: 560px;
      ">${escapeHtml(subheadline)}</p>
      ${bulletsHtml}
      ${proofHtml}
      ${props.trustBadge ? `<p data-v1-field-key="trustBadge" style="
        margin-top: var(--v1-space-6);
        font-size: var(--v1-font-size-sm);
        color: var(--v1-color-hero-text);
        opacity: 0.78;
      ">${escapeHtml(props.trustBadge)}</p>` : ''}
    </div>

    <!-- Form column -->
    <div style="flex: 1 1 380px; min-width: 0;">
      <div class="v1-card" style="padding: var(--v1-space-8);">
        <h2 data-v1-field-key="formHeading" style="
          font-size: var(--v1-font-size-2xl);
          font-weight: var(--v1-font-weight-bold);
          color: var(--v1-color-text);
          margin-bottom: var(--v1-space-2);
        ">${escapeHtml(formHeading)}</h2>
        <p data-v1-field-key="formSubheading" style="
          font-size: var(--v1-font-size-sm);
          color: var(--v1-color-text-muted);
          margin-bottom: var(--v1-space-5);
        ">${escapeHtml(formSubheading)}</p>
        <form class="v1-contact-form" onsubmit="return false;" style="text-align: left;">
          ${formBody}
        </form>
      </div>
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

function escapeAttr(str: string): string {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
