/**
 * GuaranteeBar Section
 *
 * Single full-width accent-colored strip that puts the business's
 * satisfaction guarantee front-and-center right before the FinalCTA.
 * Visually different from the multi-item TrustStrip — one big promise.
 */

export interface GuaranteeBarProps {
  eyebrow?: string;
  headline?: string;
  description?: string;
}

export function renderGuaranteeBar(props: GuaranteeBarProps): string {
  const eyebrow = props.eyebrow || 'Our promise';
  const headline = props.headline || '100% Satisfaction Guarantee — or we make it right.';
  const description = props.description || 'If anything is not exactly the way you wanted, we come back free of charge until it is. No questions, no fine print.';

  const shieldSvg = `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4" stroke-linecap="round"/></svg>`;

  return `
<section class="v1-guarantee-bar" style="
  background: var(--v1-color-accent);
  color: var(--v1-color-cta-text);
  padding: var(--v1-space-10) 0;
">
  <div class="v1-container" style="
    display:flex; flex-wrap:wrap; align-items:center;
    gap: var(--v1-space-8);
    justify-content: center;
    text-align: center;
  ">
    <span aria-hidden="true" style="
      flex-shrink:0;
      display:inline-flex; align-items:center; justify-content:center;
      width: 64px; height: 64px;
      border-radius: var(--v1-radius-full);
      background: rgba(255,255,255,0.18);
      color: var(--v1-color-cta-text);
    ">${shieldSvg}</span>
    <span style="
      display:flex; flex-direction:column; align-items:center;
      max-width: 720px;
    ">
      <span data-v1-field-key="eyebrow" style="
        font-size: var(--v1-font-size-sm);
        font-weight: var(--v1-font-weight-semibold);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        opacity: 0.9;
        margin-bottom: 4px;
      ">${escapeHtml(eyebrow)}</span>
      <strong data-v1-field-key="headline" style="
        font-size: var(--v1-font-size-2xl);
        font-weight: var(--v1-font-weight-bold);
        line-height: var(--v1-line-height-tight);
        margin-bottom: var(--v1-space-2);
      ">${escapeHtml(headline)}</strong>
      <span data-v1-field-key="description" style="
        font-size: var(--v1-font-size-base);
        opacity: 0.92;
        line-height: var(--v1-line-height-relaxed);
      ">${escapeHtml(description)}</span>
    </span>
  </div>
</section>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
