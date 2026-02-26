/**
 * SocialProofLogos Section
 *
 * A horizontal strip of trust badges / partner logos.
 * Uses placeholder SVG rectangles when real logo assets aren't available.
 *
 * Props:
 *   heading – text above the logo bar
 *   logos   – array of logo IDs (used as alt text; real URLs TBD via assets)
 */

export interface SocialProofLogosProps {
  heading?: string;
  logos: string[];
}

export function renderSocialProofLogos(props: SocialProofLogosProps): string {
  const heading = props.heading || 'Trusted By';

  // Generate placeholder logo boxes — in production these would be real images
  const logosHtml = props.logos
    .map(
      (id) => `
      <div style="
        display: flex; align-items: center; justify-content: center;
        background: var(--v1-color-bg);
        border: 1px solid var(--v1-color-border);
        border-radius: var(--v1-radius-sm, 4px);
        padding: var(--v1-space-3) var(--v1-space-6);
        min-width: 120px; height: 48px;
        font-size: var(--v1-font-size-sm);
        color: var(--v1-color-text-muted);
        font-weight: var(--v1-font-weight-medium);
        text-transform: capitalize;
      ">${escapeHtml(id.replace(/-/g, ' '))}</div>`
    )
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

