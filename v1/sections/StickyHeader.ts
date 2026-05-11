/**
 * StickyHeader Section
 *
 * Site header with a logo/wordmark on the left, anchor nav links in the
 * center (hidden on mobile), and a primary "Get Quote" CTA on the right.
 * Marked position: sticky so it stays visible during scroll.
 */

export interface StickyHeaderNavLink {
  label: string;
  href: string; // e.g. "#services"
}

export interface StickyHeaderProps {
  /** Brand wordmark text (e.g. "Aqua Pro Plumbing"). */
  brandName?: string;
  /** Anchor nav links shown in the center on tablet/desktop. */
  navLinks?: StickyHeaderNavLink[];
  /** CTA button label (e.g. "Get Free Quote"). */
  ctaLabel?: string;
  /** CTA target — anchor or tel: link. */
  ctaHref?: string;
  /** Optional phone shown next to the CTA on desktop. */
  phone?: string;
}

export function renderStickyHeader(props: StickyHeaderProps): string {
  const brand = props.brandName || 'Your Business';
  const nav = Array.isArray(props.navLinks) && props.navLinks.length
    ? props.navLinks
    : [
        { label: 'Services', href: '#services' },
        { label: 'Why Us', href: '#why' },
        { label: 'Reviews', href: '#reviews' },
        { label: 'FAQ', href: '#faq' },
        { label: 'Contact', href: '#contact' },
      ];
  const ctaLabel = props.ctaLabel || 'Get Free Quote';
  const ctaHref = props.ctaHref || '#contact';
  const phone = props.phone || '';

  const navHtml = nav
    .slice(0, 6)
    .map(
      (l, i) => `<a href="${escapeAttr(l.href)}" data-v1-field-key="navLinks.${i}.label" style="
          color: var(--v1-color-text);
          font-weight: var(--v1-font-weight-medium);
          font-size: var(--v1-font-size-sm);
          opacity: 0.85;
        ">${escapeHtml(l.label)}</a>`
    )
    .join('');

  const phoneHtml = phone
    ? `<a href="tel:${escapeAttr(phone.replace(/[^+0-9]/g, ''))}" data-v1-field-key="phone" style="
        display:none;
        font-weight: var(--v1-font-weight-semibold);
        font-size: var(--v1-font-size-sm);
        color: var(--v1-color-text);
      " class="v1-header-phone">${escapeHtml(phone)}</a>`
    : '';

  return `
<section class="v1-sticky-header" style="
  position: sticky; top: 0; z-index: 100;
  background: var(--v1-color-bg);
  border-bottom: 1px solid var(--v1-color-border);
  box-shadow: var(--v1-shadow-sm);
">
  <div class="v1-container" style="
    display:flex; align-items:center; justify-content:space-between;
    gap: var(--v1-space-6);
    padding: 14px var(--v1-space-5);
  ">
    <a href="#top" data-v1-field-key="brandName" style="
      font-weight: var(--v1-font-weight-extrabold);
      font-size: var(--v1-font-size-xl);
      color: var(--v1-color-primary);
      letter-spacing: -0.01em;
    ">${escapeHtml(brand)}</a>

    <nav class="v1-header-nav" style="
      display: none;
      gap: var(--v1-space-8);
      align-items: center;
    ">${navHtml}</nav>

    <span style="display:inline-flex; align-items:center; gap: var(--v1-space-4);">
      ${phoneHtml}
      <a href="${escapeAttr(ctaHref)}" class="v1-btn v1-btn--primary" data-v1-field-key="ctaLabel" style="
        font-size: var(--v1-font-size-sm);
        padding: 10px 16px;
      ">${escapeHtml(ctaLabel)}</a>
    </span>
  </div>
  <style>
    @media (min-width: 768px) {
      .v1-sticky-header .v1-header-nav { display: inline-flex !important; }
      .v1-sticky-header .v1-header-phone { display: inline-flex !important; }
    }
  </style>
</section>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function escapeAttr(str: string): string {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
