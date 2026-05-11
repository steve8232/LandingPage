/**
 * Footer Section
 *
 * Brand wordmark, contact block, and quick links arranged in a grid.
 * Stacks single-column on mobile. Includes copyright + license line.
 */

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterProps {
  brandName?: string;
  tagline?: string;
  phone?: string;
  email?: string;
  address?: string;
  hours?: string;
  /** Quick links column (e.g. site anchors). */
  quickLinks?: FooterLink[];
  /** License / insurance / certification line (e.g. "Lic #12345 • Fully insured"). */
  licenseLine?: string;
  /** Copyright line. Default: "© <year> <brandName>. All rights reserved." */
  copyright?: string;
}

export function renderFooter(props: FooterProps): string {
  const brand = props.brandName || 'Your Business';
  const tagline = props.tagline || '';
  const phone = props.phone || '';
  const email = props.email || '';
  const address = props.address || '';
  const hours = props.hours || '';
  const license = props.licenseLine || '';
  const links = Array.isArray(props.quickLinks) && props.quickLinks.length
    ? props.quickLinks
    : [
        { label: 'Services', href: '#services' },
        { label: 'Why Us', href: '#why' },
        { label: 'Reviews', href: '#reviews' },
        { label: 'FAQ', href: '#faq' },
        { label: 'Contact', href: '#contact' },
      ];
  const year = new Date().getFullYear();
  const copyright = props.copyright || `© ${year} ${brand}. All rights reserved.`;

  const linksHtml = links
    .slice(0, 8)
    .map(
      (l, i) => `<li><a href="${escapeAttr(l.href)}" data-v1-field-key="quickLinks.${i}.label" style="
        color: var(--v1-color-footer-text);
        opacity: 0.85;
        font-size: var(--v1-font-size-sm);
      ">${escapeHtml(l.label)}</a></li>`
    )
    .join('');

  return `
<footer class="v1-footer" style="
  background: var(--v1-color-footer-bg);
  color: var(--v1-color-footer-text);
  padding: var(--v1-space-16) 0 var(--v1-space-8);
">
  <div class="v1-container" style="
    display:grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: var(--v1-space-10);
  ">
    <div>
      <div data-v1-field-key="brandName" style="
        font-weight: var(--v1-font-weight-extrabold);
        font-size: var(--v1-font-size-xl);
        color: #ffffff;
        margin-bottom: var(--v1-space-3);
      ">${escapeHtml(brand)}</div>
      ${tagline ? `<p data-v1-field-key="tagline" style="
        font-size: var(--v1-font-size-sm);
        opacity: 0.85;
        line-height: var(--v1-line-height-relaxed);
        max-width: 280px;
      ">${escapeHtml(tagline)}</p>` : ''}
    </div>

    <div>
      <h4 style="
        font-size: var(--v1-font-size-sm);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: var(--v1-space-4);
        color: #ffffff;
      ">Contact</h4>
      <ul style="list-style:none; display:grid; gap:8px; font-size: var(--v1-font-size-sm); opacity: 0.9;">
        ${phone ? `<li><a href="tel:${escapeAttr(phone.replace(/[^+0-9]/g, ''))}" data-v1-field-key="phone" style="color: var(--v1-color-footer-text);">${escapeHtml(phone)}</a></li>` : ''}
        ${email ? `<li><a href="mailto:${escapeAttr(email)}" data-v1-field-key="email" style="color: var(--v1-color-footer-text);">${escapeHtml(email)}</a></li>` : ''}
        ${address ? `<li data-v1-field-key="address">${escapeHtml(address)}</li>` : ''}
        ${hours ? `<li data-v1-field-key="hours">${escapeHtml(hours)}</li>` : ''}
      </ul>
    </div>

    <div>
      <h4 style="
        font-size: var(--v1-font-size-sm);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: var(--v1-space-4);
        color: #ffffff;
      ">Quick Links</h4>
      <ul style="list-style:none; display:grid; gap:8px;">${linksHtml}</ul>
    </div>
  </div>

  <div class="v1-container" style="
    margin-top: var(--v1-space-10);
    padding-top: var(--v1-space-6);
    border-top: 1px solid rgba(255,255,255,0.12);
    display:flex; flex-wrap:wrap; gap: var(--v1-space-3);
    justify-content: space-between;
    font-size: var(--v1-font-size-xs);
    opacity: 0.78;
  ">
    <span data-v1-field-key="copyright">${escapeHtml(copyright)}</span>
    ${license ? `<span data-v1-field-key="licenseLine">${escapeHtml(license)}</span>` : ''}
  </div>
</footer>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function escapeAttr(str: string): string {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
