/**
 * FinalCTA Section
 *
 * A bold, full-width call-to-action with an optional embedded contact form.
 * The form fields are injected by the composer from the spec's `form` array.
 *
 * Props:
 *   heading    – CTA heading text
 *   subheading – supporting copy
 *   ctaLabel   – button text
 *   _formHtml  – (injected by composer) rendered form fields HTML
 */

export interface FinalCTAProps {
  heading?: string;
  subheading?: string;
  ctaLabel?: string;
  /** Urgency line displayed above the form/button (e.g. "Limited spots this month") */
  urgency?: string;
  /** Risk-reversal line displayed below the form/button (e.g. "100% satisfaction guaranteed") */
  guarantee?: string;
  /** Injected by the composer — pre-rendered form field HTML from spec.form */
  _formHtml?: string;
}

export function renderFinalCTA(props: FinalCTAProps): string {
  const heading = props.heading || 'Ready to Get Started?';
  const subheading =
    props.subheading || 'Fill out the form below and we will be in touch.';
  const ctaLabel = props.ctaLabel || 'Submit';

  // If the composer injected form HTML, use it; otherwise render a simple button
  const formBlock = props._formHtml
    ? `
    <form class="v1-contact-form" onsubmit="return false;" style="
      max-width: 500px; margin: 0 auto; text-align: left;
    ">
      ${props._formHtml}
      <button type="submit" style="
        display: block; width: 100%;
        background: var(--v1-color-hero-bg);
        color: var(--v1-color-hero-text);
        padding: var(--v1-space-4) var(--v1-space-8);
        border: none; border-radius: var(--v1-radius-md);
        font-size: var(--v1-font-size-lg);
        font-weight: var(--v1-font-weight-semibold);
        cursor: pointer;
        transition: opacity 0.2s;
      ">${escapeHtml(ctaLabel)}</button>
    </form>`
    : `
    <a href="#contact" style="
      display: inline-block;
      background: var(--v1-color-hero-bg);
      color: var(--v1-color-hero-text);
      padding: var(--v1-space-4) var(--v1-space-8);
      border-radius: var(--v1-radius-md);
      font-size: var(--v1-font-size-lg);
      font-weight: var(--v1-font-weight-semibold);
      text-decoration: none;
      transition: opacity 0.2s;
    ">${escapeHtml(ctaLabel)}</a>`;

  return `
<section class="v1-final-cta" id="contact" style="
  background: var(--v1-color-cta-bg);
  color: var(--v1-color-cta-text);
  padding: var(--v1-space-20) 0;
  text-align: center;
">
  <div class="v1-container">
    <h2 style="
      font-size: var(--v1-font-size-3xl);
      font-weight: var(--v1-font-weight-bold);
      margin-bottom: var(--v1-space-4);
      color: var(--v1-color-cta-text);
    ">${escapeHtml(heading)}</h2>
    <p style="
      font-size: var(--v1-font-size-lg);
      opacity: 0.9;
      margin-bottom: var(--v1-space-10);
      max-width: 540px; margin-left: auto; margin-right: auto;
      color: var(--v1-color-cta-text);
    ">${escapeHtml(subheading)}</p>${props.urgency ? `
    <p style="
      font-size: var(--v1-font-size-base);
      font-weight: var(--v1-font-weight-semibold);
      color: var(--v1-color-cta-text);
      opacity: 0.9;
      margin-bottom: var(--v1-space-6);
    ">⏰ ${escapeHtml(props.urgency)}</p>` : ''}
    ${formBlock}${props.guarantee ? `
    <p style="
      font-size: var(--v1-font-size-sm);
      color: var(--v1-color-cta-text);
      opacity: 0.75;
      margin-top: var(--v1-space-5);
    ">🛡️ ${escapeHtml(props.guarantee)}</p>` : ''}
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

