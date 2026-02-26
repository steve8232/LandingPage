/**
 * TestimonialsCards Section
 *
 * A responsive grid of testimonial quote cards.
 *
 * Props:
 *   heading      – section heading
 *   testimonials – array of { quote, name, title }
 */

export interface Testimonial {
  quote: string;
  name: string;
  title: string;
  /** Key phrase from the quote to render in bold */
  highlight?: string;
  /** Star rating 1-5 */
  rating?: number;
}

export interface TestimonialsCardsProps {
  heading?: string;
  /** Intro line below the heading (e.g. "Join 500+ satisfied customers") */
  subheading?: string;
  testimonials: Testimonial[];
}

export function renderTestimonialsCards(props: TestimonialsCardsProps): string {
  const heading = props.heading || 'What Our Customers Say';

  const cardsHtml = props.testimonials
    .map(
      (t) => `
    <div style="
      background: var(--v1-color-card-bg);
      color: var(--v1-color-card-text);
      padding: var(--v1-space-8);
      border-radius: var(--v1-radius-lg);
      box-shadow: var(--v1-shadow-md);
    ">
${t.rating ? `      <div style="margin-bottom: var(--v1-space-3); color: #f5a623; font-size: var(--v1-font-size-base);">${'★'.repeat(Math.min(5, Math.max(1, t.rating)))}${'☆'.repeat(5 - Math.min(5, Math.max(1, t.rating)))}</div>` : ''}
      <p style="
        font-style: italic;
        font-size: var(--v1-font-size-base);
        line-height: var(--v1-line-height-relaxed);
        margin-bottom: var(--v1-space-5);
        color: var(--v1-color-card-text);
      ">&ldquo;${t.highlight ? escapeHtml(t.quote).replace(escapeHtml(t.highlight), `<strong style="font-style: normal; color: var(--v1-color-primary);">${escapeHtml(t.highlight)}</strong>`) : escapeHtml(t.quote)}&rdquo;</p>
      <div>
        <strong style="
          display: block;
          font-weight: var(--v1-font-weight-semibold);
          color: var(--v1-color-primary);
        ">${escapeHtml(t.name)}</strong>
        <span style="
          font-size: var(--v1-font-size-sm);
          color: var(--v1-color-text-muted);
        ">${escapeHtml(t.title)}</span>
      </div>
    </div>`
    )
    .join('\n');

  return `
<section class="v1-testimonials" style="
  background: var(--v1-color-bg);
  padding: var(--v1-space-20) 0;
">
  <div class="v1-container">
    <h2 style="
      font-size: var(--v1-font-size-3xl);
      font-weight: var(--v1-font-weight-bold);
      text-align: center;
      margin-bottom: ${props.subheading ? 'var(--v1-space-4)' : 'var(--v1-space-12)'};
      color: var(--v1-color-text);
    ">${escapeHtml(heading)}</h2>${props.subheading ? `
    <p style="
      font-size: var(--v1-font-size-lg);
      color: var(--v1-color-text-muted);
      text-align: center;
      max-width: 540px;
      margin: 0 auto var(--v1-space-12);
      line-height: var(--v1-line-height-relaxed);
    ">${escapeHtml(props.subheading)}</p>` : ''}
    <div style="
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--v1-space-8);
    ">
      ${cardsHtml}
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

