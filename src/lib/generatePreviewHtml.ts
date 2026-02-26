// Generates self-contained HTML preview for a template using example preview content
// Used in the template selection step (Step 0) to show realistic mockups

import { Template } from './templates';
import { PreviewContent, getPreviewContent } from './templatePreviewData';
import { generateFullCSS } from './generateCss';
import { getStockImages } from './stockImages';

/**
 * Generate a complete self-contained HTML document for template preview.
 * Embeds CSS inline so it can be rendered directly in an iframe via srcdoc.
 */
export function generateTemplatePreviewHtml(template: Template): string {
  const content = getPreviewContent(template.id);
  const css = generateFullCSS('', template);
  const sections = template.sections;

  // Stock images based on template category
  const stock = getStockImages(template.category);

  const phoneTel = content.phone.replace(/\D/g, '');

  // Hero section — with stock background image
  const heroHtml = sections.hero ? `
  <section class="hero" style="background-image: linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url('${stock.hero}'); background-size: cover; background-position: center;">
    <div class="container">
      <h1>${content.headline}</h1>
      <p class="subheadline">${content.subheadline}</p>
      <a href="#contact" class="cta-btn">${content.cta}</a>
    </div>
  </section>` : '';

  // Features/offer section
  const featuresHtml = sections.features ? `
  <section class="offer">
    <div class="container">
      <h2>What You Get</h2>
      <div class="offer-grid">
        <div class="offer-card">
          <h3>${content.offerName}</h3>
          <p>${content.offerDescription}</p>
          ${sections.pricing ? '<div class="price-tag">$49/mo</div>' : ''}
        </div>
        <div class="offer-card">
          <h3>Why Choose Us</h3>
          <ul class="selling-points">
            ${content.sellingPoints.map(p => `<li>${p}</li>`).join('\n            ')}
          </ul>
        </div>
      </div>
    </div>
  </section>` : '';

  // Testimonials section
  const testimonialsHtml = sections.testimonials ? `
  <section class="testimonials">
    <div class="container">
      <h2>What Our Customers Say</h2>
      <div class="testimonial-grid">
        ${content.testimonials.map(t => `
        <div class="testimonial-card">
          <p class="quote">"${t.quote}"</p>
          <div class="author">
            <strong>${t.name}</strong>
            <span>${t.title}</span>
          </div>
        </div>`).join('')}
      </div>
    </div>
  </section>` : '';

  // Contact/CTA section
  const contactHtml = sections.contact ? `
  <section class="final-cta" id="contact">
    <div class="container">
      <h2>Ready to Get Started?</h2>
      <p>Take the first step today. Fill out the form below and we'll be in touch.</p>
      <form class="contact-form" onsubmit="return false;">
        <div class="form-row">
          <input type="text" placeholder="Your Name" disabled>
          <input type="email" placeholder="Your Email" disabled>
        </div>
        <div class="form-row">
          <input type="tel" placeholder="Your Phone" disabled>
        </div>
        <textarea placeholder="Tell us about your needs..." rows="3" disabled></textarea>
        <button type="button" class="cta-btn">${content.cta}</button>
      </form>
    </div>
  </section>` : '';

  // Footer section
  const footerHtml = sections.footer ? `
  <footer>
    <div class="container">
      <p>&copy; 2025 ${content.companyName}. All rights reserved.</p>
      <p>Contact: <a href="#">${content.phone}</a> | <a href="#">${content.email}</a></p>
    </div>
  </footer>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.headline}</title>
  <style>${css}</style>
</head>
<body>
  <header>
    <div class="container header-content">
      <div class="logo">${content.companyName}</div>
      <a href="#" class="phone-link" onclick="return false;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
        </svg>
        ${content.phone}
      </a>
    </div>
  </header>
  ${heroHtml}
  ${featuresHtml}
  ${sections.gallery ? `
  <section class="images">
    <div class="container">
      <h2>See What We Offer</h2>
      <div class="image-gallery">
        ${stock.gallery.map((img, i) => `<img src="${img}" alt="Product image ${i + 1}" class="gallery-img">`).join('\n        ')}
      </div>
    </div>
  </section>` : ''}
  ${testimonialsHtml}
  ${contactHtml}
  ${footerHtml}
</body>
</html>`;
}

