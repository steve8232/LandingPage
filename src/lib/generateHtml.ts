import { FormData, GeneratedContent, Template } from '@/types';
import { getStockImages } from './stockImages';

// Default sections if no template specified
const defaultSections = {
  hero: true,
  features: true,
  pricing: true,
  testimonials: true,
  gallery: true,
  contact: true,
  footer: true,
};

export function generateHTML(
  formData: FormData,
  content: GeneratedContent,
  css: string,
  template?: Template
): { html: string; cssFile: string } {
  const { business, contact } = formData;
  const phoneFormatted = contact.phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  const phoneTel = contact.phone.replace(/\D/g, '');

  // Use template sections if available, otherwise use defaults
  const sections = template?.sections || defaultSections;

  // Stock images: auto-populate from niche when user hasn't uploaded any
  const category = template?.category || 'saas';
  const stock = getStockImages(category);
  const hasUserImages = business.images.length > 0;
  const galleryImages = hasUserImages ? business.images : stock.gallery;

  // Ensure content fields have defaults
  const safeContent = {
    headline: content?.headline || 'Transform Your Business Today',
    subheadline: content?.subheadline || 'Discover how we can help you achieve your goals',
    offerDescription: content?.offerDescription || 'Our comprehensive solution provides everything you need to succeed.',
    sellingPoints: Array.isArray(content?.sellingPoints) ? content.sellingPoints : ['Professional quality', 'Fast service', 'Expert support', 'Satisfaction guaranteed'],
    testimonials: Array.isArray(content?.testimonials) ? content.testimonials : [],
  };

  // Generate image gallery HTML — uses stock images when user hasn't uploaded any
  const imagesHtml = sections.gallery
    ? `<section class="images">
        <div class="container">
          <h2>See What We Offer</h2>
          <div class="image-gallery">
            ${galleryImages.map((img, i) => `<img src="${img}" alt="Product image ${i + 1}" class="gallery-img">`).join('\n            ')}
          </div>
        </div>
      </section>`
    : '';

  // Conditionally generate testimonials section
  const testimonialsHtml = (sections.testimonials && safeContent.testimonials.length > 0)
    ? `<!-- Testimonials -->
  <section class="testimonials">
    <div class="container">
      <h2>What Our Customers Say</h2>
      <div class="testimonial-grid">
        ${safeContent.testimonials.slice(0, 8).map(t => `
        <div class="testimonial-card">
          <p class="quote">"${t.quote}"</p>
          <div class="author">
            <strong>${t.name}</strong>
            <span>${t.title}</span>
          </div>
        </div>`).join('')}
      </div>
    </div>
  </section>`
    : '';

  // Conditionally generate contact section
  const contactHtml = sections.contact
    ? `<!-- Final CTA -->
  <section class="final-cta" id="contact">
    <div class="container">
      <h2>Ready to Get Started?</h2>
      <p>Take the first step today. Fill out the form below and we'll be in touch.</p>
      <form class="contact-form" action="https://formsubmit.co/${contact.email}" method="POST">
        <input type="hidden" name="_subject" value="New Lead from Landing Page">
        <input type="hidden" name="_captcha" value="false">
        <div class="form-row">
          <input type="text" name="name" placeholder="Your Name" required>
          <input type="email" name="email" placeholder="Your Email" required>
        </div>
        <div class="form-row">
          <input type="tel" name="phone" placeholder="Your Phone">
        </div>
        <textarea name="message" placeholder="Tell us about your needs..." rows="4"></textarea>
        <button type="submit" class="cta-btn">${business.cta}</button>
      </form>
    </div>
  </section>`
    : '';

  // Conditionally generate footer
  const footerHtml = sections.footer
    ? `<!-- Footer -->
  <footer>
    <div class="container">
      <p>&copy; ${new Date().getFullYear()} ${business.offer}. All rights reserved.</p>
      <p>Contact: <a href="tel:+1${phoneTel}">${phoneFormatted}</a> | <a href="mailto:${contact.email}">${contact.email}</a></p>
    </div>
  </footer>`
    : '';

  // Conditionally generate features/offer section
  const featuresHtml = sections.features
    ? `<!-- Offer Details -->
  <section class="offer">
    <div class="container">
      <h2>What You Get</h2>
      <div class="offer-grid">
        <div class="offer-card">
          <h3>${business.offer}</h3>
          <p>${safeContent.offerDescription}</p>
          ${sections.pricing ? `<div class="price-tag">${business.pricing}</div>` : ''}
        </div>
        <div class="offer-card">
          <h3>Why Choose Us</h3>
          <ul class="selling-points">
            ${safeContent.sellingPoints.map(point => `<li>${point}</li>`).join('\n            ')}
          </ul>
        </div>
      </div>
    </div>
  </section>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${safeContent.subheadline}">
  <title>${safeContent.headline}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <!-- Header -->
  <header>
    <div class="container header-content">
      ${business.logo
        ? `<img src="${business.logo}" alt="Logo" class="logo-img" style="max-height: 50px; width: auto;" />`
        : `<div class="logo">${business.offer}</div>`}
      <a href="tel:+1${phoneTel}" class="phone-link">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
        </svg>
        ${phoneFormatted}
      </a>
    </div>
  </header>

  ${sections.hero ? `<!-- Hero Section -->
  <section class="hero" style="background-image: linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url('${stock.hero}'); background-size: cover; background-position: center;">
    <div class="container">
      <h1>${safeContent.headline}</h1>
      <p class="subheadline">${safeContent.subheadline}</p>
      <a href="#contact" class="cta-btn">${business.cta}</a>
    </div>
  </section>` : ''}

  ${featuresHtml}

  ${imagesHtml}

  ${testimonialsHtml}

  ${contactHtml}

  ${footerHtml}
</body>
</html>`;

  return { html, cssFile: css };
}

