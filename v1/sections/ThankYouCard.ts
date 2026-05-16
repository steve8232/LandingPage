/**
 * ThankYouCard Section
 *
 * Centered confirmation card rendered as the only section of the
 * secondary /thank-you page. Uses the same CSS variables as the
 * landing page so the visual identity is inherited automatically.
 *
 * Editable via the right-side "Thank You" panel tab (not click-to-edit
 * in PR1 — the iframe inline editor is scoped to landing-page sections).
 */

export interface ThankYouCardProps {
  headline: string;
  message: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
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

export function renderThankYouCard(props: ThankYouCardProps): string {
  const headline = props.headline || 'Thanks — we got your request';
  const message = props.message || 'We\u2019ll be in touch shortly.';
  const ctaLabel = props.primaryCtaLabel || 'Back to home';
  const ctaHref = props.primaryCtaHref || '/';

  // Success check icon, tinted via currentColor so it inherits the CTA color.
  const checkSvg = `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  return `
<section class="v1-thankyou" style="
  background: var(--v1-color-bg);
  padding: var(--v1-space-20) 0;
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
">
  <div class="v1-container" style="display: flex; justify-content: center;">
    <div class="v1-card" style="
      max-width: 560px;
      width: 100%;
      background: var(--v1-color-card-bg);
      color: var(--v1-color-card-text);
      border: 1px solid var(--v1-color-border);
      border-radius: var(--v1-radius-lg);
      padding: var(--v1-space-12);
      text-align: center;
      box-shadow: var(--v1-shadow-lg);
    ">
      <div style="
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 72px;
        height: 72px;
        border-radius: 999px;
        background: var(--v1-color-cta-bg);
        color: var(--v1-color-cta-text);
        margin-bottom: var(--v1-space-6);
      " aria-hidden="true">${checkSvg}</div>

      <h1 data-v1-field-key="thankYou.headline" style="
        font-size: var(--v1-font-size-3xl);
        font-weight: var(--v1-font-weight-bold);
        line-height: var(--v1-line-height-tight);
        color: var(--v1-color-text);
        margin: 0 0 var(--v1-space-4) 0;
      ">${escapeHtml(headline)}</h1>

      <p data-v1-field-key="thankYou.message" style="
        font-size: var(--v1-font-size-lg);
        line-height: var(--v1-line-height-relaxed);
        color: var(--v1-color-text-muted);
        margin: 0 0 var(--v1-space-8) 0;
      ">${escapeHtml(message)}</p>

      <a href="${escapeAttr(ctaHref)}" class="v1-btn v1-btn--primary" data-v1-field-key="thankYou.primaryCtaLabel" style="
        display: inline-block;
        background: var(--v1-color-cta-bg);
        color: var(--v1-color-cta-text);
        padding: var(--v1-space-4) var(--v1-space-8);
        font-size: var(--v1-font-size-lg);
        font-weight: var(--v1-font-weight-semibold);
        border-radius: var(--v1-radius-md);
        text-decoration: none;
      ">${escapeHtml(ctaLabel)}</a>
    </div>
  </div>
</section>`;
}
