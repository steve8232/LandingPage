/**
 * ProcessSteps Section
 *
 * Numbered "How it works" sequence, typically 3–5 steps. Each step has
 * a big numeral, a title, and a short description. Steps render in a
 * row on desktop and stack on mobile.
 */

export interface ProcessStep {
  title: string;
  description: string;
}

export interface ProcessStepsProps {
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  steps?: ProcessStep[];
}

export function renderProcessSteps(props: ProcessStepsProps): string {
  const eyebrow = props.eyebrow || '';
  const heading = props.heading || 'How it works';
  const subheading = props.subheading || 'Three simple steps from quote to results — no chasing, no surprises.';
  const steps = (Array.isArray(props.steps) ? props.steps : []).slice(0, 5);
  if (steps.length === 0) return '';

  const stepsHtml = steps
    .map(
      (s, i) => `
      <div style="
        flex: 1 1 220px; min-width: 0;
        position: relative;
        padding: var(--v1-space-6);
        background: var(--v1-color-card-bg);
        color: var(--v1-color-card-text);
        border: 1px solid var(--v1-color-border);
        border-radius: var(--v1-radius-lg);
        box-shadow: var(--v1-shadow-sm);
      ">
        <span aria-hidden="true" style="
          display:inline-flex; align-items:center; justify-content:center;
          width: 48px; height: 48px;
          margin-bottom: var(--v1-space-4);
          border-radius: var(--v1-radius-full);
          background: var(--v1-color-accent);
          color: var(--v1-color-cta-text);
          font-size: var(--v1-font-size-xl);
          font-weight: var(--v1-font-weight-extrabold);
        ">${i + 1}</span>
        <h3 data-v1-field-key="steps.${i}.title" style="
          font-size: var(--v1-font-size-xl);
          font-weight: var(--v1-font-weight-semibold);
          margin: 0 0 var(--v1-space-2);
          color: var(--v1-color-text);
        ">${escapeHtml(s.title)}</h3>
        <p data-v1-field-key="steps.${i}.description" style="
          font-size: var(--v1-font-size-base);
          color: var(--v1-color-text-muted);
          line-height: var(--v1-line-height-relaxed);
          margin: 0;
        ">${escapeHtml(s.description)}</p>
      </div>`
    )
    .join('');

  return `
<section class="v1-process-steps" style="
  background: var(--v1-color-bg-alt);
  padding: var(--v1-space-20) 0;
">
  <div class="v1-container">
    ${eyebrow ? `<p class="v1-eyebrow" data-v1-field-key="eyebrow" style="text-align:center; color: var(--v1-color-accent);">${escapeHtml(eyebrow)}</p>` : ''}
    <h2 data-v1-field-key="heading" style="
      font-size: var(--v1-font-size-3xl);
      font-weight: var(--v1-font-weight-bold);
      text-align:center;
      margin-bottom: var(--v1-space-4);
      color: var(--v1-color-text);
    ">${escapeHtml(heading)}</h2>
    <p data-v1-field-key="subheading" style="
      font-size: var(--v1-font-size-lg);
      color: var(--v1-color-text-muted);
      text-align:center;
      max-width: 620px;
      margin: 0 auto var(--v1-space-12);
      line-height: var(--v1-line-height-relaxed);
    ">${escapeHtml(subheading)}</p>
    <div style="
      display:flex; flex-wrap:wrap; gap: var(--v1-space-6);
      align-items: stretch;
      justify-content: center;
    ">
      ${stepsHtml}
    </div>
  </div>
</section>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
