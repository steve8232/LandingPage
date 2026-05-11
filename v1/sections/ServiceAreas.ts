/**
 * ServiceAreas Section
 *
 * Pill-shaped tags listing neighborhoods, cities, or ZIPs the business
 * services. Strong signal for local SEO + hyperlocal trust ("they
 * serve my neighborhood").
 */

export interface ServiceAreasProps {
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  /** Plain string list of city/neighborhood names. */
  areas?: string[];
  /** Optional micro-line under the chips (e.g. "Don't see your area? Just ask."). */
  footnote?: string;
}

export function renderServiceAreas(props: ServiceAreasProps): string {
  const eyebrow = props.eyebrow || '';
  const heading = props.heading || 'Proudly serving your neighborhood';
  const subheading = props.subheading || 'Local crews, local routes, local trust. We service these communities and the surrounding areas every week.';
  const areas = (Array.isArray(props.areas) ? props.areas : []).slice(0, 24);
  if (areas.length === 0) return '';
  const footnote = props.footnote || '';

  const pinSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>`;

  const areasHtml = areas
    .map(
      (a, i) => `
      <span data-v1-field-key="areas.${i}" style="
        display:inline-flex; align-items:center; gap: 6px;
        padding: 8px 14px;
        border-radius: var(--v1-radius-full);
        background: var(--v1-color-bg);
        border: 1px solid var(--v1-color-border);
        font-size: var(--v1-font-size-sm);
        font-weight: var(--v1-font-weight-medium);
        color: var(--v1-color-text);
      ">
        <span style="color: var(--v1-color-accent);">${pinSvg}</span>${escapeHtml(a)}
      </span>`
    )
    .join('');

  return `
<section class="v1-service-areas" style="
  background: var(--v1-color-bg-alt);
  padding: var(--v1-space-16) 0;
">
  <div class="v1-container" style="text-align:center;">
    ${eyebrow ? `<p class="v1-eyebrow" data-v1-field-key="eyebrow" style="color: var(--v1-color-accent);">${escapeHtml(eyebrow)}</p>` : ''}
    <h2 data-v1-field-key="heading" style="
      font-size: var(--v1-font-size-3xl);
      font-weight: var(--v1-font-weight-bold);
      margin-bottom: var(--v1-space-3);
      color: var(--v1-color-text);
    ">${escapeHtml(heading)}</h2>
    <p data-v1-field-key="subheading" style="
      font-size: var(--v1-font-size-base);
      color: var(--v1-color-text-muted);
      max-width: 620px;
      margin: 0 auto var(--v1-space-8);
      line-height: var(--v1-line-height-relaxed);
    ">${escapeHtml(subheading)}</p>
    <div style="
      display:flex; flex-wrap:wrap; gap: 10px;
      justify-content:center; max-width: 920px; margin: 0 auto;
    ">
      ${areasHtml}
    </div>
    ${footnote ? `<p data-v1-field-key="footnote" style="
      margin-top: var(--v1-space-6);
      font-size: var(--v1-font-size-sm);
      color: var(--v1-color-text-muted);
    ">${escapeHtml(footnote)}</p>` : ''}
  </div>
</section>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
