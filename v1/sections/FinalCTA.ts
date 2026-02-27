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
  /** Short checklist of what happens after someone submits (keeps CTA concrete) */
  nextSteps?: string[];
  /** Risk-reversal line displayed below the form/button (e.g. "100% satisfaction guaranteed") */
  guarantee?: string;
  /** Small privacy/disclaimer line under the form (e.g. "No spam. Replies within 1 business day.") */
  privacyNote?: string;
  /** Injected by the composer — pre-rendered form field HTML from spec.form */
  _formHtml?: string;
}

export function renderFinalCTA(props: FinalCTAProps): string {
  const heading = props.heading || 'Ready to Get Started?';
  const subheading =
    props.subheading || 'Fill out the form below and we will be in touch.';
  const ctaLabel = props.ctaLabel || 'Submit';

  const checkSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const clockSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const shieldSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`;

  const nextStepsHtml = Array.isArray(props.nextSteps) && props.nextSteps.length
    ? `<ul class="v1-checklist" style="margin: var(--v1-space-6) 0 0;">
        ${props.nextSteps.slice(0, 5).map((s) => `<li style="color: var(--v1-color-cta-text); opacity: 0.92;">${checkSvg}<span>${escapeHtml(s)}</span></li>`).join('')}
      </ul>`
    : '';

  // If the composer injected form HTML, use it; otherwise render a simple button
  const formBlock = props._formHtml
    ? `
    <form class="v1-contact-form" onsubmit="return false;" style="text-align: left;">
      ${props._formHtml}
      <button type="submit" class="v1-btn v1-btn--primary" style="width: 100%; font-size: var(--v1-font-size-lg); padding: var(--v1-space-4) var(--v1-space-8);">
        ${escapeHtml(ctaLabel)}
      </button>
    </form>`
    : `
    <a href="#contact" class="v1-btn v1-btn--primary" style="font-size: var(--v1-font-size-lg); padding: var(--v1-space-4) var(--v1-space-8);">
      ${escapeHtml(ctaLabel)}
    </a>`;

  return `
<section class="v1-final-cta" id="contact" style="
  background: var(--v1-color-cta-bg);
  color: var(--v1-color-cta-text);
  padding: var(--v1-space-20) 0;
">
  <div class="v1-container">
    <div class="v1-final-cta__grid">
      <div class="v1-final-cta__copy">
        <h2 style="
          font-size: var(--v1-font-size-3xl);
          font-weight: var(--v1-font-weight-bold);
          margin: 0 0 var(--v1-space-4) 0;
          color: var(--v1-color-cta-text);
        ">${escapeHtml(heading)}</h2>
        <p style="
          font-size: var(--v1-font-size-lg);
          opacity: 0.92;
          margin: 0;
          max-width: 620px;
          color: var(--v1-color-cta-text);
          line-height: var(--v1-line-height-relaxed);
        ">${escapeHtml(subheading)}</p>
        ${props.urgency ? `
        <p style="
          display:flex; align-items:center; justify-content:flex-start; gap: 10px;
          font-size: var(--v1-font-size-base);
          font-weight: var(--v1-font-weight-semibold);
          color: var(--v1-color-cta-text);
          opacity: 0.92;
          margin: var(--v1-space-6) 0 0;
        ">${clockSvg}<span>${escapeHtml(props.urgency)}</span></p>` : ''}
        ${nextStepsHtml}
      </div>

      <div class="v1-card v1-final-cta__card">
        ${formBlock}
        ${props.guarantee ? `
        <p style="
          display:flex; align-items:center; justify-content:flex-start; gap: 10px;
          font-size: var(--v1-font-size-sm);
          color: var(--v1-color-text);
          opacity: 0.8;
          margin-top: var(--v1-space-5);
        ">${shieldSvg}<span>${escapeHtml(props.guarantee)}</span></p>` : ''}
        ${props.privacyNote ? `
        <p style="
          font-size: var(--v1-font-size-sm);
          color: var(--v1-color-text-muted);
          margin-top: var(--v1-space-3);
          line-height: var(--v1-line-height-relaxed);
        ">${escapeHtml(props.privacyNote)}</p>` : ''}
      </div>
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

