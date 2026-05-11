/**
 * TrustStrip Section
 *
 * Horizontal credibility bar with 4-5 short proof items: review rating,
 * licensed/insured, years in business, response time, etc. Sits directly
 * under the hero to convert hesitant visitors before they scroll.
 */

export interface TrustStripItem {
  /** Short label, e.g. "4.9★ Google" */
  label: string;
  /** Optional micro-line below, e.g. "from 500+ reviews" */
  detail?: string;
  /** Icon: 'star' | 'shield' | 'check' | 'clock' | 'phone' | 'badge' | 'medal' */
  icon?: 'star' | 'shield' | 'check' | 'clock' | 'phone' | 'badge' | 'medal';
}

export interface TrustStripProps {
  items?: TrustStripItem[];
}

const ICONS: Record<string, string> = {
  star: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>`,
  shield: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  check: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>`,
  clock: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
  phone: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92V21a1 1 0 01-1.09 1 19.86 19.86 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.86 19.86 0 013.21 4.09 1 1 0 014.2 3h4.09a1 1 0 011 .75c.12.96.31 1.9.57 2.81a1 1 0 01-.23 1.05L8.1 9.14a16 16 0 006 6l1.53-1.53a1 1 0 011.05-.23c.91.26 1.85.45 2.81.57a1 1 0 01.75 1z"/></svg>`,
  badge: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="6"/><path d="M9 14l-2 7 5-3 5 3-2-7"/></svg>`,
  medal: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="14" r="6"/><path d="M8 8L6 2h12l-2 6"/></svg>`,
};

export function renderTrustStrip(props: TrustStripProps): string {
  const items = (Array.isArray(props.items) ? props.items : []).slice(0, 5);
  if (items.length === 0) return '';

  const itemsHtml = items
    .map(
      (it, i) => `
      <div style="
        flex: 1 1 180px; min-width: 160px;
        display:flex; align-items:center; gap: 10px;
        padding: var(--v1-space-3) var(--v1-space-4);
      ">
        <span style="color: var(--v1-color-accent); flex-shrink:0;" aria-hidden="true">${ICONS[it.icon || 'check'] || ICONS.check}</span>
        <span style="display:flex; flex-direction:column; min-width:0;">
          <strong data-v1-field-key="items.${i}.label" style="
            font-weight: var(--v1-font-weight-semibold);
            font-size: var(--v1-font-size-base);
            color: var(--v1-color-text);
            line-height: 1.2;
          ">${escapeHtml(it.label)}</strong>
          ${it.detail ? `<span data-v1-field-key="items.${i}.detail" style="
            font-size: var(--v1-font-size-xs);
            color: var(--v1-color-text-muted);
          ">${escapeHtml(it.detail)}</span>` : ''}
        </span>
      </div>`
    )
    .join('');

  return `
<section class="v1-trust-strip" style="
  background: var(--v1-color-bg);
  padding: var(--v1-space-6) 0;
  border-bottom: 1px solid var(--v1-color-border);
">
  <div class="v1-container" style="
    display:flex; flex-wrap:wrap; align-items:stretch;
    justify-content:center; gap: var(--v1-space-2);
  ">
    ${itemsHtml}
  </div>
</section>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
