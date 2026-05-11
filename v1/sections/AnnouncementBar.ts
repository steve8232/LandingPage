/**
 * AnnouncementBar Section
 *
 * Slim full-width strip pinned to the very top of the page used for
 * promos, social proof, or a phone number. Mobile-first: collapses to
 * a single centered line on small screens.
 */

export interface AnnouncementBarProps {
  /** Main message (e.g. "Free quotes in 30 mins • Same-day service"). */
  text?: string;
  /** Optional phone number rendered as a tap-to-call link on the right. */
  phone?: string;
  /** Optional secondary line shown next to the phone (e.g. "Mon–Sat 7a–8p"). */
  hours?: string;
}

export function renderAnnouncementBar(props: AnnouncementBarProps): string {
  const text = props.text || '⭐ 4.9/5 from 500+ local customers • Free quotes in under 30 minutes';
  const phone = props.phone || '';
  const hours = props.hours || '';

  const phoneSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92V21a1 1 0 01-1.09 1 19.86 19.86 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.86 19.86 0 013.21 4.09 1 1 0 014.2 3h4.09a1 1 0 011 .75c.12.96.31 1.9.57 2.81a1 1 0 01-.23 1.05L8.1 9.14a16 16 0 006 6l1.53-1.53a1 1 0 011.05-.23c.91.26 1.85.45 2.81.57a1 1 0 01.75 1z"/></svg>`;

  const phoneHtml = phone
    ? `<a href="tel:${escapeAttr(phone.replace(/[^+0-9]/g, ''))}" data-v1-field-key="phone" style="
        display:inline-flex; align-items:center; gap:6px;
        font-weight: var(--v1-font-weight-semibold);
        color: inherit;
      ">${phoneSvg}<span>${escapeHtml(phone)}</span></a>`
    : '';

  const hoursHtml = hours
    ? `<span data-v1-field-key="hours" style="opacity:0.8;">${escapeHtml(hours)}</span>`
    : '';

  return `
<section class="v1-announcement-bar" style="
  background: var(--v1-color-primary-dark);
  color: #ffffff;
  font-size: var(--v1-font-size-sm);
  padding: 8px 0;
  border-bottom: 1px solid rgba(255,255,255,0.08);
">
  <div class="v1-container" style="
    display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between;
    gap: 8px;
  ">
    <span data-v1-field-key="text" style="opacity:0.95;">${escapeHtml(text)}</span>
    <span style="display:inline-flex; align-items:center; gap:14px;">
      ${hoursHtml}
      ${phoneHtml}
    </span>
  </div>
</section>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function escapeAttr(str: string): string {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
