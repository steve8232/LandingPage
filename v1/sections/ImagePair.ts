/**
 * ImagePair Section
 *
 * Two supporting images displayed side-by-side.
 * Used by catalog templates to showcase additional demo images (with fallbacks).
 */

export interface ImagePairProps {
  heading?: string;
  /** Descriptive line below the heading */
  subheading?: string;
  /** Caption for image 1 */
  caption1?: string;
  /** Caption for image 2 */
  caption2?: string;
  imageAsset1?: string;
  imageAsset2?: string;
  fallbackAsset1?: string;
  fallbackAsset2?: string;

  /** Injected by the composer */
  _resolvedImageUrl1?: string;
  _resolvedImageUrl2?: string;
  _fallbackImageUrl1?: string;
  _fallbackImageUrl2?: string;
  /** Alt text for images — injected by the composer from enhancement overrides. */
  _altText1?: string;
  _altText2?: string;
}

export function renderImagePair(props: ImagePairProps): string {
  const heading = props.heading || 'Highlights';
  const fb1 = props._fallbackImageUrl1 || '/v1/assets/placeholders/common/logo-placeholder.svg';
  const fb2 = props._fallbackImageUrl2 || '/v1/assets/placeholders/common/logo-placeholder.svg';
  const src1 = props._resolvedImageUrl1 || fb1;
  const src2 = props._resolvedImageUrl2 || fb2;

  const imgStyle = `
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    border-radius: var(--v1-radius-lg);
    box-shadow: var(--v1-shadow-md);
    background: var(--v1-color-card-bg);
  `;

  return `
<section class="v1-image-pair" style="
  background: var(--v1-color-bg);
  padding: var(--v1-space-16) 0;
">
  <div class="v1-container">
    <h2 style="
      font-size: var(--v1-font-size-3xl);
      font-weight: var(--v1-font-weight-bold);
      text-align: center;
      margin-bottom: ${props.subheading ? 'var(--v1-space-4)' : 'var(--v1-space-10)'};
      color: var(--v1-color-text);
    ">${escapeHtml(heading)}</h2>${props.subheading ? `
    <p style="
      font-size: var(--v1-font-size-lg);
      color: var(--v1-color-text-muted);
      text-align: center;
      max-width: 640px;
      margin: 0 auto var(--v1-space-10);
      line-height: var(--v1-line-height-relaxed);
    ">${escapeHtml(props.subheading)}</p>` : ''}

    <div style="
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--v1-space-8);
      align-items: stretch;
    ">
      <figure style="margin: 0;">
        <img
          src="${escapeAttr(src1)}"
          alt="${escapeAttr(props._altText1 || '')}"
          data-fallback="${escapeAttr(fb1)}"
          onerror="if(this.dataset.fallback&&this.src!==this.dataset.fallback){this.src=this.dataset.fallback;}"
          style="${escapeAttr(imgStyle)}"
        />${props.caption1 ? `
        <figcaption style="
          text-align: center;
          font-size: var(--v1-font-size-sm);
          color: var(--v1-color-text-muted);
          margin-top: var(--v1-space-3);
        ">${escapeHtml(props.caption1)}</figcaption>` : ''}
      </figure>
      <figure style="margin: 0;">
        <img
          src="${escapeAttr(src2)}"
          alt="${escapeAttr(props._altText2 || '')}"
          data-fallback="${escapeAttr(fb2)}"
          onerror="if(this.dataset.fallback&&this.src!==this.dataset.fallback){this.src=this.dataset.fallback;}"
          style="${escapeAttr(imgStyle)}"
        />${props.caption2 ? `
        <figcaption style="
          text-align: center;
          font-size: var(--v1-font-size-sm);
          color: var(--v1-color-text-muted);
          margin-top: var(--v1-space-3);
        ">${escapeHtml(props.caption2)}</figcaption>` : ''}
      </figure>
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
