/**
 * GuaranteeBanner Section
 *
 * A horizontal trust strip with 3–5 short guarantee/promise items.
 * Sits between the hero and content sections to reinforce reliability
 * (e.g. "Licensed & insured", "Same-day service", "Up-front pricing").
 */

export interface GuaranteeItem {
  label: string;
  description?: string;
  /** Optional icon name: 'shield' | 'check' | 'clock' | 'star' | 'phone'. */
  icon?: 'shield' | 'check' | 'clock' | 'star' | 'phone';
}

export interface GuaranteeBannerProps {
  heading?: string;
  subheading?: string;
  items?: GuaranteeItem[];
}

const ICONS: Record<string, string> = {
  shield: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`,
  check: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  clock: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  star: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`,
  phone: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M22 16.92V21a1 1 0 01-1.09 1 19.86 19.86 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.86 19.86 0 013.21 4.09 1 1 0 014.2 3h4.09a1 1 0 011 .75c.12.96.31 1.9.57 2.81a1 1 0 01-.23 1.05L8.1 9.14a16 16 0 006 6l1.53-1.53a1 1 0 011.05-.23c.91.26 1.85.45 2.81.57a1 1 0 01.75 1z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`,
};

export function renderGuaranteeBanner(props: GuaranteeBannerProps): string {
  const items = Array.isArray(props.items) ? props.items.slice(0, 5) : [];
  if (items.length === 0) return '';

  const itemsHtml = items
    .map((it, i) => {
      const icon = ICONS[it.icon || 'shield'] || ICONS.shield;
      return `
      <div style="
        flex: 1 1 200px; min-width: 200px; display: flex; align-items: flex-start; gap: 12px;
        padding: var(--v1-space-4) var(--v1-space-5);
      ">
        <span style="color: var(--v1-color-accent); flex-shrink: 0;" aria-hidden="true">${icon}</span>
        <div>
          <div data-v1-field-key="items.${i}.label" style="
            font-weight: var(--v1-font-weight-semibold);
            font-size: var(--v1-font-size-base);
            color: var(--v1-color-text);
            line-height: 1.3;
          ">${escapeHtml(it.label)}</div>
          ${it.description ? `<div data-v1-field-key="items.${i}.description" style="
            margin-top: 4px;
            font-size: var(--v1-font-size-sm);
            color: var(--v1-color-text-muted);
            line-height: 1.4;
          ">${escapeHtml(it.description)}</div>` : ''}
        </div>
      </div>`;
    })
    .join('');

  const headingHtml = props.heading
    ? `<h2 data-v1-field-key="heading" style="
        font-size: var(--v1-font-size-2xl);
        font-weight: var(--v1-font-weight-bold);
        color: var(--v1-color-text);
        margin-bottom: var(--v1-space-2);
        text-align: center;
      ">${escapeHtml(props.heading)}</h2>`
    : '';

  const subheadingHtml = props.subheading
    ? `<p data-v1-field-key="subheading" style="
        font-size: var(--v1-font-size-base);
        color: var(--v1-color-text-muted);
        text-align: center;
        margin-bottom: var(--v1-space-8);
        max-width: 640px;
        margin-left: auto; margin-right: auto;
      ">${escapeHtml(props.subheading)}</p>`
    : '';

  return `
<section class="v1-guarantee-banner" style="
  background: var(--v1-color-bg-alt);
  padding: var(--v1-space-12) 0;
  border-top: 1px solid var(--v1-color-border);
  border-bottom: 1px solid var(--v1-color-border);
">
  <div class="v1-container">
    ${headingHtml}
    ${subheadingHtml}
    <div style="
      display: flex; flex-wrap: wrap; align-items: stretch;
      gap: var(--v1-space-2);
      justify-content: center;
    ">
      ${itemsHtml}
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
