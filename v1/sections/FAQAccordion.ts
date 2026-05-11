/**
 * FAQAccordion Section
 *
 * Niche-specific objection handlers as a native <details>/<summary>
 * accordion (works without JavaScript). Designed for 5–7 questions
 * that defuse the buyer's last hesitations before the form.
 */

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQAccordionProps {
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  items?: FAQItem[];
}

export function renderFAQAccordion(props: FAQAccordionProps): string {
  const eyebrow = props.eyebrow || '';
  const heading = props.heading || 'Frequently asked questions';
  const subheading = props.subheading || 'Quick answers to the questions homeowners ask us most. Not seeing yours? Just ask in the form below.';
  const items = (Array.isArray(props.items) ? props.items : []).slice(0, 8);
  if (items.length === 0) return '';

  const itemsHtml = items
    .map(
      (it, i) => `
      <details style="
        background: var(--v1-color-card-bg);
        border: 1px solid var(--v1-color-border);
        border-radius: var(--v1-radius-md);
        padding: var(--v1-space-4) var(--v1-space-6);
        box-shadow: var(--v1-shadow-sm);
      "${i === 0 ? ' open' : ''}>
        <summary data-v1-field-key="items.${i}.question" style="
          cursor: pointer;
          list-style: none;
          font-weight: var(--v1-font-weight-semibold);
          font-size: var(--v1-font-size-lg);
          color: var(--v1-color-text);
          display:flex; align-items:center; justify-content:space-between;
          gap: 12px;
        ">
          <span>${escapeHtml(it.question)}</span>
          <span aria-hidden="true" style="
            color: var(--v1-color-accent);
            font-size: 22px; font-weight: var(--v1-font-weight-bold);
            line-height: 1;
          ">+</span>
        </summary>
        <p data-v1-field-key="items.${i}.answer" style="
          margin: var(--v1-space-3) 0 0;
          color: var(--v1-color-text-muted);
          font-size: var(--v1-font-size-base);
          line-height: var(--v1-line-height-relaxed);
        ">${escapeHtml(it.answer)}</p>
      </details>`
    )
    .join('');

  return `
<section class="v1-faq" id="faq" style="
  background: var(--v1-color-bg);
  padding: var(--v1-space-20) 0;
">
  <div class="v1-container" style="max-width: 820px;">
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
      margin: 0 auto var(--v1-space-10);
      line-height: var(--v1-line-height-relaxed);
    ">${escapeHtml(subheading)}</p>
    <div style="display:grid; gap: var(--v1-space-3);">
      ${itemsHtml}
    </div>
  </div>
  <style>
    .v1-faq details > summary::-webkit-details-marker { display:none; }
    .v1-faq details[open] > summary > span:last-child { transform: rotate(45deg); transition: transform 0.15s ease; }
    .v1-faq details > summary > span:last-child { transition: transform 0.15s ease; display:inline-block; }
  </style>
</section>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
