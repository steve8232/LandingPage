/**
 * PhotoGalleryStrip Section
 *
 * Three wide before/after or action photos in a single row (stacks
 * vertically on mobile). Each image carries a data-v1-asset-key so the
 * editor can swap them, and an optional caption.
 */

export interface PhotoGalleryItem {
  imageAsset: string;
  fallbackAsset?: string;
  caption?: string;
}

export interface PhotoGalleryStripProps {
  heading?: string;
  subheading?: string;
  items?: PhotoGalleryItem[];

  // Composer-injected (per-index resolved URLs/alt texts)
  _resolvedImageUrls?: Record<string, string>;
  _altTexts?: Record<string, string>;
}

export function renderPhotoGalleryStrip(props: PhotoGalleryStripProps): string {
  const heading = props.heading || 'Recent jobs in your neighborhood';
  const subheading = props.subheading || 'A few snapshots of the kind of work — and cleanup — you can expect.';
  const items = (Array.isArray(props.items) ? props.items : []).slice(0, 4);
  if (items.length === 0) return '';

  const resolved = props._resolvedImageUrls || {};
  const alts = props._altTexts || {};

  const cardsHtml = items
    .map((it, i) => {
      const url = resolved[it.imageAsset] || resolved[`${it.imageAsset}__fallback`] || '';
      const fallback = resolved[`${it.imageAsset}__fallback`] || '';
      const alt = alts[it.imageAsset] || it.caption || '';
      return `
      <figure style="margin:0; flex: 1 1 280px; min-width: 0;">
        <img
          src="${escapeAttr(url)}"
          alt="${escapeAttr(alt)}"
          data-v1-asset-key="${escapeAttr(it.imageAsset)}"
          data-fallback="${escapeAttr(fallback)}"
          onerror="if(this.dataset.fallback&&this.src!==this.dataset.fallback){this.src=this.dataset.fallback;}"
          style="
            width:100%;
            border-radius: var(--v1-radius-lg);
            box-shadow: var(--v1-shadow-md);
            object-fit: cover;
            aspect-ratio: 4 / 3;
          "
        />
        ${it.caption ? `<figcaption data-v1-field-key="items.${i}.caption" style="
          margin-top: var(--v1-space-3);
          font-size: var(--v1-font-size-sm);
          color: var(--v1-color-text-muted);
          line-height: var(--v1-line-height-relaxed);
          text-align: center;
        ">${escapeHtml(it.caption)}</figcaption>` : ''}
      </figure>`;
    })
    .join('');

  return `
<section class="v1-photo-gallery" style="
  background: var(--v1-color-bg);
  padding: var(--v1-space-20) 0;
">
  <div class="v1-container">
    <h2 data-v1-field-key="heading" style="
      font-size: var(--v1-font-size-3xl);
      font-weight: var(--v1-font-weight-bold);
      text-align:center;
      margin-bottom: var(--v1-space-4);
      color: var(--v1-color-text);
    ">${escapeHtml(heading)}</h2>
    <p data-v1-field-key="subheading" style="
      font-size: var(--v1-font-size-lg);
      color: var(--v1-color-text-muted);
      text-align:center;
      max-width: 620px;
      margin: 0 auto var(--v1-space-12);
      line-height: var(--v1-line-height-relaxed);
    ">${escapeHtml(subheading)}</p>
    <div style="
      display:flex; flex-wrap:wrap; gap: var(--v1-space-6);
      justify-content: center;
    ">
      ${cardsHtml}
    </div>
  </div>
</section>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function escapeAttr(str: string): string {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
