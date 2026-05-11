/**
 * DifferentiatorBlock Section
 *
 * Image + text split that addresses the buyer's biggest pain points
 * ("no-shows, hidden fees, sloppy work") and contrasts with what we do
 * differently. Reverses the visual flow on mobile so copy comes first.
 */

export interface DifferentiatorItem {
  /** Pain point or contrasting promise (e.g. "Up-front pricing"). */
  title: string;
  /** Supporting one-liner. */
  description: string;
}

export interface DifferentiatorBlockProps {
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  items?: DifferentiatorItem[];
  /** Logical asset key for the lifestyle/action photo. */
  imageAsset?: string;
  fallbackAsset?: string;
  /** Image side: 'left' or 'right' (default 'right'). */
  imageSide?: 'left' | 'right';

  // Composer-injected
  _resolvedImageUrl?: string;
  _fallbackImageUrl?: string;
  _altText?: string;
}

export function renderDifferentiatorBlock(props: DifferentiatorBlockProps): string {
  const eyebrow = props.eyebrow || 'Why homeowners choose us';
  const heading = props.heading || 'Tired of the same old service-business runaround?';
  const subheading = props.subheading || 'No-shows, surprise add-ons, and sloppy work end here. Here is what working with us actually looks like.';
  const items = Array.isArray(props.items) ? props.items.slice(0, 6) : [];
  const imageSide = props.imageSide || 'right';
  const imgUrl = props._resolvedImageUrl || props._fallbackImageUrl || '';
  const fallback = props._fallbackImageUrl || '';

  const checkSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>`;

  const itemsHtml = items
    .map(
      (it, i) => `
      <div style="display:flex; gap: 14px; align-items:flex-start;">
        <span style="
          width:36px; height:36px; flex-shrink:0;
          border-radius: var(--v1-radius-full);
          background: var(--v1-color-accent);
          color: var(--v1-color-cta-text);
          display:inline-flex; align-items:center; justify-content:center;
        ">${checkSvg}</span>
        <span style="min-width:0;">
          <strong data-v1-field-key="items.${i}.title" style="
            display:block;
            font-weight: var(--v1-font-weight-semibold);
            font-size: var(--v1-font-size-lg);
            color: var(--v1-color-text);
            margin-bottom: 4px;
          ">${escapeHtml(it.title)}</strong>
          <span data-v1-field-key="items.${i}.description" style="
            color: var(--v1-color-text-muted);
            font-size: var(--v1-font-size-base);
            line-height: var(--v1-line-height-relaxed);
          ">${escapeHtml(it.description)}</span>
        </span>
      </div>`
    )
    .join('');

  const copyCol = `
    <div style="flex: 1 1 420px; min-width:0;">
      <p class="v1-eyebrow" data-v1-field-key="eyebrow" style="color: var(--v1-color-accent);">${escapeHtml(eyebrow)}</p>
      <h2 data-v1-field-key="heading" style="
        font-size: var(--v1-font-size-4xl);
        font-weight: var(--v1-font-weight-bold);
        line-height: var(--v1-line-height-tight);
        margin-bottom: var(--v1-space-4);
        color: var(--v1-color-text);
      ">${escapeHtml(heading)}</h2>
      <p data-v1-field-key="subheading" style="
        color: var(--v1-color-text-muted);
        font-size: var(--v1-font-size-lg);
        line-height: var(--v1-line-height-relaxed);
        margin-bottom: var(--v1-space-8);
        max-width: 560px;
      ">${escapeHtml(subheading)}</p>
      <div style="display:grid; gap: var(--v1-space-6);">
        ${itemsHtml}
      </div>
    </div>`;

  const imageCol = props.imageAsset
    ? `<div style="flex: 1 1 360px; min-width:0;">
        <img
          src="${escapeAttr(imgUrl)}"
          alt="${escapeAttr(props._altText || '')}"
          data-v1-asset-key="${escapeAttr(props.imageAsset)}"
          data-fallback="${escapeAttr(fallback)}"
          onerror="if(this.dataset.fallback&&this.src!==this.dataset.fallback){this.src=this.dataset.fallback;}"
          style="
            width:100%; max-width:520px; margin: 0 auto;
            border-radius: var(--v1-radius-lg);
            box-shadow: var(--v1-shadow-lg);
            object-fit: cover;
            aspect-ratio: 4 / 3;
          "
        />
      </div>`
    : '';

  return `
<section class="v1-differentiator" id="why" style="
  background: var(--v1-color-bg);
  padding: var(--v1-space-20) 0;
">
  <div class="v1-container" style="
    display:flex; flex-wrap:wrap; align-items:center;
    gap: var(--v1-space-12);
    flex-direction: ${imageSide === 'left' ? 'row-reverse' : 'row'};
  ">
    ${copyCol}
    ${imageCol}
  </div>
</section>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function escapeAttr(str: string): string {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
