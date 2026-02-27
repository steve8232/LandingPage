/**
 * TestimonialsCards Section
 *
 * A responsive grid of testimonial quote cards with CSS-styled star ratings,
 * avatar placeholders, decorative quote marks, and polished card styling.
 *
 * Props:
 *   heading      – section heading
 *   subheading   – optional intro line
 *   testimonials – array of { quote, name, title, highlight?, rating? }
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

/* ── Helpers ───────────────────────────────────────────────────────────── */

/** Render a CSS-styled star rating using inline clip-path for partial/full stars */
function renderStars(rating: number): string {
  const clamped = Math.min(5, Math.max(1, Math.round(rating)));
  const stars = Array.from({ length: 5 }, (_, i) => {
    const filled = i < clamped;
    return `<span style="
      display: inline-block;
      width: 18px; height: 18px;
      margin-right: 2px;
      position: relative;
    ">
      <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
          fill="${filled ? 'var(--v1-color-primary)' : 'none'}"
          stroke="var(--v1-color-primary)"
          stroke-width="1.5"
          stroke-linejoin="round"
        />
      </svg>
    </span>`;
  });
  return `<div style="display:flex; align-items:center; margin-bottom: var(--v1-space-4);" aria-label="${clamped} out of 5 stars">${stars.join('')}</div>`;
}

/** Generate initials-based avatar placeholder */
function renderAvatar(name: string): string {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return `<div style="
    width: 44px; height: 44px;
    border-radius: 50%;
    background: var(--v1-color-primary);
    color: var(--v1-color-cta-text, #fff);
    display: flex; align-items: center; justify-content: center;
    font-size: var(--v1-font-size-sm);
    font-weight: var(--v1-font-weight-bold);
    flex-shrink: 0;
    letter-spacing: 0.03em;
  ">${escapeHtml(initials)}</div>`;
}

/** Decorative open-quote SVG */
const QUOTE_SVG = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity:0.12;">
  <path d="M3 21c3-3 4-6 4-9H3V3h9v9c0 4.97-3.58 8.44-6.5 10L3 21zm13 0c3-3 4-6 4-9h-4V3h9v9c0 4.97-3.58 8.44-6.5 10L16 21z" fill="var(--v1-color-primary)"/>
</svg>`;

/* ── Main renderer ─────────────────────────────────────────────────────── */

export function renderTestimonialsCards(props: TestimonialsCardsProps): string {
  const heading = props.heading || 'What Our Customers Say';

  const cardsHtml = props.testimonials
    .map(
      (t) => `
    <div style="
      background: var(--v1-color-card-bg);
      color: var(--v1-color-card-text);
      padding: var(--v1-space-8);
      padding-top: var(--v1-space-6);
      border-radius: var(--v1-radius-lg);
      box-shadow: var(--v1-shadow-md);
      border-left: 4px solid var(--v1-color-primary);
      position: relative;
      display: flex;
      flex-direction: column;
    ">
      <!-- Decorative quote mark -->
      <div style="position:absolute; top:12px; right:16px;">${QUOTE_SVG}</div>

${t.rating ? `      ${renderStars(t.rating)}` : ''}
      <p style="
        font-style: italic;
        font-size: var(--v1-font-size-base);
        line-height: var(--v1-line-height-relaxed);
        margin-bottom: var(--v1-space-6);
        color: var(--v1-color-card-text);
        flex: 1;
      ">&ldquo;${t.highlight ? escapeHtml(t.quote).replace(escapeHtml(t.highlight), `<strong style="font-style: normal; color: var(--v1-color-primary);">${escapeHtml(t.highlight)}</strong>`) : escapeHtml(t.quote)}&rdquo;</p>

      <!-- Attribution row with avatar -->
      <div style="
        display: flex;
        align-items: center;
        gap: var(--v1-space-3);
        padding-top: var(--v1-space-4);
        border-top: 1px solid var(--v1-color-border, rgba(0,0,0,0.08));
      ">
        ${renderAvatar(t.name)}
        <div>
          <strong style="
            display: block;
            font-weight: var(--v1-font-weight-semibold);
            color: var(--v1-color-text);
            font-size: var(--v1-font-size-base);
          ">${escapeHtml(t.name)}</strong>
          <span style="
            font-size: var(--v1-font-size-sm);
            color: var(--v1-color-text-muted);
          ">${escapeHtml(t.title)}</span>
        </div>
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
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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

