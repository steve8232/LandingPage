/**
 * ServiceList Section
 *
 * A responsive grid of service/feature cards.
 * Each card has an icon placeholder, title, and description.
 *
 * Props:
 *   heading  – section heading
 *   services – array of { title, description, icon }
 */

export interface ServiceItem {
  title: string;
  description: string;
  icon?: string;
  /** Single outcome statement (e.g. "Save 40% on energy bills") */
  benefit?: string;
}

export interface ServiceListProps {
  heading?: string;
  /** Intro paragraph displayed below the heading */
  subheading?: string;
  services: ServiceItem[];
}

/** Simple SVG icon lookup — keeps the section self-contained. */
function iconSvg(name?: string): string {
  const size = '32';
  const color = 'var(--v1-color-accent)';
  switch (name) {
    case 'wrench':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94L6.73 20.2a2 2 0 0 1-2.83-2.83l6.83-6.73A6 6 0 0 1 18.6 2.77z"/></svg>`;
    case 'shield':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
    case 'search':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
    case 'tool':
    default:
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/><path d="M12 2L2 7l10 5 10-5L12 2z"/></svg>`;
  }
}

export function renderServiceList(props: ServiceListProps): string {
  const heading = props.heading || 'Our Services';

  const cardsHtml = props.services
    .map(
      (svc) => `
    <div class="v1-card" style="padding: var(--v1-space-8);">
      <div style="display:flex; gap: 14px; align-items:flex-start;">
        <div style="
          width: 52px; height: 52px;
          border-radius: var(--v1-radius-lg);
          background: rgba(2, 6, 23, 0.04);
          border: 1px solid rgba(2, 6, 23, 0.06);
          display:flex; align-items:center; justify-content:center;
          flex-shrink: 0;
        ">${iconSvg(svc.icon)}</div>
        <div style="min-width: 0;">
          <h3 style="
            font-size: var(--v1-font-size-xl);
            font-weight: var(--v1-font-weight-semibold);
            margin: 0 0 var(--v1-space-2) 0;
            color: var(--v1-color-text);
          ">${escapeHtml(svc.title)}</h3>
          <p class="v1-muted" style="
            font-size: var(--v1-font-size-base);
            line-height: var(--v1-line-height-relaxed);
            margin: 0;
          ">${escapeHtml(svc.description)}</p>
          ${svc.benefit ? `
          <p style="
            font-size: var(--v1-font-size-sm);
            font-weight: var(--v1-font-weight-semibold);
            color: var(--v1-color-accent);
            margin: var(--v1-space-3) 0 0;
          ">${escapeHtml(svc.benefit)}</p>` : ''}
        </div>
      </div>
    </div>`
    )
    .join('\n');

  return `
<section class="v1-service-list" style="
  background: var(--v1-color-bg-alt);
  padding: var(--v1-space-20) 0;
">
  <div class="v1-container">
    <h2 style="
      font-size: var(--v1-font-size-3xl);
      font-weight: var(--v1-font-weight-bold);
      text-align: center;
      margin-bottom: ${props.subheading ? 'var(--v1-space-4)' : 'var(--v1-space-12)'};
      color: var(--v1-color-text);
    ">${escapeHtml(heading)}</h2>${props.subheading ? `
    <p style="
      font-size: var(--v1-font-size-lg);
      color: var(--v1-color-text-muted);
      text-align: center;
      max-width: 640px;
      margin: 0 auto var(--v1-space-12);
      line-height: var(--v1-line-height-relaxed);
    ">${escapeHtml(props.subheading)}</p>` : ''}
    <div style="
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: var(--v1-space-8);
    ">
      ${cardsHtml}
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

