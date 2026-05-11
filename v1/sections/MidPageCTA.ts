/**
 * MidPageCTA Section
 *
 * Full-width colored band with a punchy headline and a single CTA button.
 * Used mid-scroll to re-engage visitors who have read the differentiator
 * + checklist sections but are not yet ready to scroll to the form.
 */

export interface MidPageCTAProps {
  eyebrow?: string;
  headline?: string;
  subheadline?: string;
  ctaLabel?: string;
  ctaHref?: string;
  /** Optional secondary tap-to-call (e.g. "or call (555) 123-4567"). */
  secondaryText?: string;
}

export function renderMidPageCTA(props: MidPageCTAProps): string {
  const eyebrow = props.eyebrow || '';
  const headline = props.headline || 'Stop guessing. Start getting results today.';
  const subheadline = props.subheadline || 'Free, no-obligation quote in under 30 minutes.';
  const ctaLabel = props.ctaLabel || 'Get my free quote';
  const ctaHref = props.ctaHref || '#contact';
  const secondaryText = props.secondaryText || '';

  return `
<section class="v1-mid-cta" style="
  background: linear-gradient(135deg, var(--v1-color-primary), var(--v1-color-primary-dark));
  color: #ffffff;
  padding: var(--v1-space-16) 0;
  text-align: center;
">
  <div class="v1-container">
    ${eyebrow ? `<p class="v1-eyebrow" data-v1-field-key="eyebrow" style="color: var(--v1-color-accent); margin-bottom: var(--v1-space-2);">${escapeHtml(eyebrow)}</p>` : ''}
    <h2 data-v1-field-key="headline" style="
      font-size: var(--v1-font-size-4xl);
      font-weight: var(--v1-font-weight-bold);
      line-height: var(--v1-line-height-tight);
      margin: 0 auto var(--v1-space-4);
      max-width: 760px;
      color: #ffffff;
    ">${escapeHtml(headline)}</h2>
    <p data-v1-field-key="subheadline" style="
      font-size: var(--v1-font-size-lg);
      opacity: 0.92;
      max-width: 620px;
      margin: 0 auto var(--v1-space-8);
      line-height: var(--v1-line-height-relaxed);
    ">${escapeHtml(subheadline)}</p>
    <div style="display:inline-flex; flex-wrap:wrap; align-items:center; gap: var(--v1-space-4); justify-content:center;">
      <a href="${escapeAttr(ctaHref)}" class="v1-btn v1-btn--primary" data-v1-field-key="ctaLabel" style="
        font-size: var(--v1-font-size-lg);
        padding: var(--v1-space-4) var(--v1-space-8);
      ">${escapeHtml(ctaLabel)}</a>
      ${secondaryText ? `<span data-v1-field-key="secondaryText" style="
        font-size: var(--v1-font-size-base);
        opacity: 0.9;
      ">${escapeHtml(secondaryText)}</span>` : ''}
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
