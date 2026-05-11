/**
 * ChecklistSection Section
 *
 * Two-column "What's Included" list paired with a lifestyle photo.
 * Items render as a check-list grid (2 columns on desktop, 1 on mobile)
 * to convey scope without intimidating wall-of-text.
 */

export interface ChecklistSectionProps {
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  items?: string[];
  /** Lifestyle/scene photo of the service in action. */
  imageAsset?: string;
  fallbackAsset?: string;
  imageSide?: 'left' | 'right';

  // Composer-injected
  _resolvedImageUrl?: string;
  _fallbackImageUrl?: string;
  _altText?: string;
}

export function renderChecklistSection(props: ChecklistSectionProps): string {
  const eyebrow = props.eyebrow || 'Every job, every visit';
  const heading = props.heading || 'What is included — no fine print';
  const subheading = props.subheading || 'Every service includes the items below at the price we quote you. No upsells, no surprises.';
  const items = Array.isArray(props.items) ? props.items.slice(0, 12) : [];
  const imageSide = props.imageSide || 'left';
  const imgUrl = props._resolvedImageUrl || props._fallbackImageUrl || '';
  const fallback = props._fallbackImageUrl || '';

  const checkSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>`;

  const itemsHtml = items
    .map(
      (txt, i) => `
      <li style="
        display:flex; gap:10px; align-items:flex-start;
        font-size: var(--v1-font-size-base);
        line-height: var(--v1-line-height-relaxed);
        color: var(--v1-color-text);
      ">
        <span style="color: var(--v1-color-accent); flex-shrink:0; margin-top:2px;">${checkSvg}</span>
        <span data-v1-field-key="items.${i}">${escapeHtml(txt)}</span>
      </li>`
    )
    .join('');

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

  const copyCol = `
    <div style="flex: 1 1 420px; min-width:0;">
      <p class="v1-eyebrow" data-v1-field-key="eyebrow" style="color: var(--v1-color-accent);">${escapeHtml(eyebrow)}</p>
      <h2 data-v1-field-key="heading" style="
        font-size: var(--v1-font-size-3xl);
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
      <ul style="
        list-style:none;
        display:grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: var(--v1-space-3) var(--v1-space-6);
      ">
        ${itemsHtml}
      </ul>
    </div>`;

  return `
<section class="v1-checklist-section" style="
  background: var(--v1-color-bg-alt);
  padding: var(--v1-space-20) 0;
">
  <div class="v1-container" style="
    display:flex; flex-wrap:wrap; align-items:center;
    gap: var(--v1-space-12);
    flex-direction: ${imageSide === 'left' ? 'row' : 'row-reverse'};
  ">
    ${imageCol}
    ${copyCol}
  </div>
</section>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function escapeAttr(str: string): string {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
