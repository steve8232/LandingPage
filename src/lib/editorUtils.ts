import { EditorSection, EditorColors, EditorTypography, SectionType } from './editorTypes';
import { FormData } from '@/types';

// Generate unique ID
export function generateId(): string {
  return `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Parse HTML string into EditorSection array
export function parseHtmlToSections(html: string): EditorSection[] {
  const sections: EditorSection[] = [];

  // Create a temporary DOM parser
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Find all section elements
  const sectionElements = doc.querySelectorAll('section, header, footer');

  sectionElements.forEach((element, index) => {
    const section = parseElement(element as HTMLElement, index);
    if (section) {
      sections.push(section);
    }
  });

  return sections;
}

function parseElement(element: HTMLElement, order: number): EditorSection | null {
  const className = element.className || '';
  const tagName = element.tagName.toLowerCase();

  let type: SectionType = 'text-block';

  // Determine section type based on class or tag
  if (tagName === 'header') {
    type = 'hero'; // Header is part of hero
    return null; // Skip header, it's handled separately
  } else if (tagName === 'footer') {
    type = 'footer';
  } else if (className.includes('hero')) {
    type = 'hero';
  } else if (className.includes('offer') || className.includes('features')) {
    type = 'features';
  } else if (className.includes('testimonial')) {
    type = 'testimonials';
  } else if (className.includes('images') || className.includes('gallery')) {
    type = 'gallery';
  } else if (className.includes('cta') || className.includes('contact') || className.includes('final-cta')) {
    type = 'contact';
  }

  // Extract content based on type
  const content: Record<string, string> = {};

  const h1 = element.querySelector('h1');
  const h2 = element.querySelector('h2');
  const h3 = element.querySelector('h3');
  const p = element.querySelector('p');
  const subheadline = element.querySelector('.subheadline');
  const ctaBtn = element.querySelector('.cta-btn');

  if (h1) content.headline = h1.innerHTML;
  if (h2) content.title = h2.innerHTML;
  if (h3) content.subtitle = h3.innerHTML;
  if (subheadline) content.subheadline = subheadline.innerHTML;
  if (p && !subheadline) content.description = p.innerHTML;
  if (ctaBtn) content.ctaText = ctaBtn.innerHTML;

  // Store the raw HTML for complex sections
  // Strip h2 and container wrapper to avoid duplication when rebuilding via renderSection()
  const container = element.querySelector('.container');
  const sourceEl = container || element;

  // Try to find the grid/content area (skip h2 and container wrappers)
  const gridEl = sourceEl.querySelector(
    '.offer-grid, .testimonial-grid, .image-gallery, .image-grid, .pricing-grid, .features-grid, .testimonial-cards'
  );

  if (gridEl) {
    // Store just the grid's inner content (the cards/items)
    content.rawHtml = gridEl.innerHTML;
  } else {
    // Fallback: clone and remove h2 to avoid duplication
    const cloned = sourceEl.cloneNode(true) as HTMLElement;
    const h2InClone = cloned.querySelector('h2');
    if (h2InClone) h2InClone.remove();
    content.rawHtml = cloned.innerHTML;
  }

  return {
    id: generateId(),
    type,
    content,
    styles: {
      backgroundColor: element.style.backgroundColor || undefined,
      textColor: element.style.color || undefined,
      padding: element.style.padding || undefined,
      containerWidth: 'contained',
    },
    order,
  };
}

// Convert EditorSection array back to HTML
export function sectionsToHtml(
  sections: EditorSection[],
  colors: EditorColors,
  formData?: FormData
): string {
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  const contact = formData?.contact || { email: '', phone: '' };
  const business = formData?.business || { offer: '', cta: '', logo: undefined as string | undefined };
  const phoneFormatted = contact.phone?.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3') || '';
  const phoneTel = contact.phone?.replace(/\D/g, '') || '';

  let bodyContent = '';

  // Render logo as image or text
  const logoHtml = business.logo
    ? `<img src="${business.logo}" alt="Logo" class="logo-img" style="max-height: 50px; width: auto;" />`
    : `<div class="logo">${business.offer || 'Your Brand'}</div>`;

  // Add header
  bodyContent += `
  <header>
    <div class="container header-content">
      ${logoHtml}
      ${contact.phone ? `
      <a href="tel:+1${phoneTel}" class="phone-link">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
        </svg>
        ${phoneFormatted}
      </a>` : ''}
    </div>
  </header>`;

  // Add each section
  for (const section of sortedSections) {
    bodyContent += renderSection(section, colors, formData);
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Landing Page</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
${bodyContent}
</body>
</html>`;

  return html;
}

function renderSection(
  section: EditorSection,
  colors: EditorColors,
  formData?: FormData
): string {
  const { type, content, styles } = section;
  const containerClass = styles.containerWidth === 'full' ? '' : 'container';
  const contact = formData?.contact || { email: '' };

  // Generate background image inline style if present
  const getBackgroundStyle = () => {
    if (styles.backgroundImage) {
      const opacity = styles.backgroundOverlayOpacity ?? 0.4;
      return ` style="background-image: linear-gradient(rgba(0,0,0,${opacity}), rgba(0,0,0,${opacity})), url(${styles.backgroundImage}); background-size: cover; background-position: center;"`;
    }
    return '';
  };

  switch (type) {
    case 'hero':
      return `
  <section class="hero"${getBackgroundStyle()}>
    <div class="${containerClass}">
      <h1>${content.headline || 'Your Headline'}</h1>
      <p class="subheadline">${content.subheadline || 'Your subheadline goes here'}</p>
      <a href="#contact" class="cta-btn">${content.ctaText || 'Get Started'}</a>
    </div>
  </section>`;

    case 'features':
      return `
  <section class="offer">
    <div class="${containerClass}">
      <h2>${content.title || 'Why Choose Us'}</h2>
      <div class="features-grid">
        ${content.rawHtml || '<div class="feature-card"><h3>Feature 1</h3><p>Description</p></div>'}
      </div>
    </div>
  </section>`;

    case 'testimonials':
      return `
  <section class="testimonials">
    <div class="${containerClass}">
      <h2>${content.title || 'What Our Customers Say'}</h2>
      <div class="testimonial-grid">
        ${content.rawHtml || '<div class="testimonial-card"><p>"Great service!"</p><p class="testimonial-author">- Happy Customer</p></div>'}
      </div>
    </div>
  </section>`;

    case 'gallery':
      return `
  <section class="images">
    <div class="${containerClass}">
      <h2>${content.title || 'Gallery'}</h2>
      <div class="image-grid">
        ${content.rawHtml || ''}
      </div>
    </div>
  </section>`;

    case 'cta':
      return `
  <section class="cta-banner"${getBackgroundStyle()}>
    <div class="${containerClass}">
      <h2>${content.headline || 'Ready to Get Started?'}</h2>
      <p>${content.subheadline || 'Join thousands of satisfied customers today.'}</p>
      <a href="#contact" class="cta-btn">${content.ctaText || 'Sign Up Now'}</a>
    </div>
  </section>`;

    case 'contact':
      return `
  <section class="final-cta" id="contact">
    <div class="${containerClass}">
      <h2>${content.title || 'Get In Touch'}</h2>
      <p>${content.subtitle || 'Fill out the form below'}</p>
      <form action="https://formsubmit.co/${contact.email || 'your@email.com'}" method="POST" class="contact-form">
        <input type="hidden" name="_subject" value="New Contact Form Submission">
        <div class="form-group">
          <input type="text" name="name" placeholder="Your Name" required>
        </div>
        <div class="form-group">
          <input type="email" name="email" placeholder="Your Email" required>
        </div>
        <div class="form-group">
          <input type="tel" name="phone" placeholder="Your Phone">
        </div>
        <div class="form-group">
          <textarea name="message" placeholder="Your Message" rows="4"></textarea>
        </div>
        <button type="submit" class="cta-btn">${content.ctaText || 'Send Message'}</button>
      </form>
    </div>
  </section>`;

    case 'footer':
      return `
  <footer>
    <div class="${containerClass}">
      <p>${content.text || '© 2024 Your Company. All rights reserved.'}</p>
    </div>
  </footer>`;

    case 'text-block':
      return `
  <section class="text-block">
    <div class="${containerClass}">
      ${content.content || content.rawHtml || '<p>Your content here</p>'}
    </div>
  </section>`;

    case 'pricing':
      return `
  <section class="pricing">
    <div class="${containerClass}">
      <h2>${content.title || 'Choose Your Plan'}</h2>
      <div class="pricing-grid">
        ${content.rawHtml || '<div class="pricing-card"><h3>Basic</h3><p class="price">$9/mo</p></div>'}
      </div>
    </div>
  </section>`;

    case 'image-block':
      return `
  <section class="image-block">
    <div class="${containerClass}">
      <img src="${content.src || 'https://via.placeholder.com/800x400'}" alt="${content.alt || 'Image'}" />
      ${content.caption ? `<p class="caption">${content.caption}</p>` : ''}
    </div>
  </section>`;

    default:
      // Fallback to raw HTML if available
      return content.rawHtml ? `
  <section class="${type}">
    <div class="${containerClass}">
      ${content.rawHtml}
    </div>
  </section>` : '';
  }
}


// Generate CSS from editor colors and typography
export function generateEditorCss(
  colors: EditorColors,
  typography: EditorTypography
): string {
  return `/* Generated Landing Page Styles */
:root {
  --primary: ${colors.primary};
  --primary-dark: ${colors.primaryDark};
  --secondary: ${colors.secondary};
  --accent: ${colors.accent};
  --bg: ${colors.background};
  --bg-alt: ${colors.backgroundAlt};
  --text: ${colors.text};
  --text-muted: ${colors.textMuted};
  --hero-bg: ${colors.heroBackground};
  --hero-text: ${colors.heroText};
  --cta-bg: ${colors.ctaBackground};
  --cta-text: ${colors.ctaText};
  --section-alt-bg: ${colors.sectionAltBackground};
  --section-alt-text: ${colors.sectionAltText};
  --card-bg: ${colors.cardBackground};
  --card-text: ${colors.cardText};
  --header-bg: ${colors.headerBackground};
  --header-text: ${colors.headerText};
  --footer-bg: ${colors.footerBackground};
  --footer-text: ${colors.footerText};
  --heading-font: ${typography.headingFont};
  --body-font: ${typography.bodyFont};
  --heading-weight: ${typography.headingWeight};
  --base-font-size: ${typography.baseFontSize};
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--body-font);
  font-size: var(--base-font-size);
  line-height: 1.6;
  color: var(--text);
  background-color: var(--bg);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--heading-font);
  font-weight: var(--heading-weight);
  line-height: 1.2;
}

h1 { font-size: 3rem; }
h2 { font-size: 2.25rem; margin-bottom: 1rem; }
h3 { font-size: 1.5rem; }

/* Header */
header {
  background: var(--header-bg);
  color: var(--header-text);
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--cta-bg);
}

.phone-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--cta-bg);
  text-decoration: none;
  font-weight: 500;
}

.phone-link:hover {
  opacity: 0.9;
}

/* Hero Section */
.hero {
  background: var(--hero-bg);
  color: var(--hero-text);
  padding: 80px 0;
  text-align: center;
}

.hero h1 {
  margin-bottom: 1rem;
  color: var(--hero-text);
}

.subheadline {
  font-size: 1.25rem;
  opacity: 0.85;
  margin-bottom: 2rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

/* CTA Button */
.cta-btn {
  display: inline-block;
  background: var(--cta-bg);
  color: var(--cta-text);
  padding: 1rem 2rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 1.1rem;
  border: none;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.cta-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Sections */
section {
  padding: 60px 0;
}

.offer, .features {
  background: var(--section-alt-bg);
  color: var(--section-alt-text);
}

.offer h2, .testimonials h2, .images h2, .final-cta h2 {
  font-size: 2rem;
  text-align: center;
  margin-bottom: 40px;
}

.features-grid, .offer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.feature-card, .offer-card {
  background: var(--card-bg);
  color: var(--card-text);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.offer-card h3, .feature-card h3 {
  color: var(--cta-bg);
  margin-bottom: 15px;
  font-size: 1.3rem;
}

.selling-points { list-style: none; }
.selling-points li { padding: 10px 0 10px 30px; position: relative; color: var(--card-text); }
.selling-points li::before { content: "✓"; position: absolute; left: 0; color: var(--accent); font-weight: bold; }

/* Testimonials */
.testimonials {
  background: var(--section-alt-bg);
  color: var(--section-alt-text);
}

.testimonial-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.testimonial-card {
  background: var(--card-bg);
  color: var(--card-text);
  padding: 2rem;
  border-radius: 12px;
  border-left: 4px solid var(--primary);
}

.testimonial-card .quote {
  font-style: italic;
  margin-bottom: 15px;
  color: var(--card-text);
}

.testimonial-author, .testimonial-card .author strong {
  font-weight: 600;
  color: var(--card-text);
}
.testimonial-card .author span {
  font-size: 0.9rem;
  color: var(--text-muted);
}

/* Images / Gallery */
.images {
  background: var(--hero-bg);
  color: var(--hero-text);
}

.image-grid, .image-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.images img, .gallery-img {
  width: 100%;
  border-radius: 8px;
  object-fit: cover;
}

/* CTA Banner */
.cta-banner {
  background: var(--primary);
  color: white;
  text-align: center;
  padding: 60px 0;
}

/* Contact / Final CTA */
.final-cta {
  background: var(--cta-bg);
  color: var(--cta-text);
  text-align: center;
}
.final-cta h2 { color: var(--cta-text); }

.contact-form {
  max-width: 500px;
  margin: 2rem auto 0;
}

.form-group {
  margin-bottom: 1rem;
}

.form-row { display: flex; gap: 15px; margin-bottom: 15px; }
.form-row input { flex: 1; }

.form-group input,
.form-group textarea,
.contact-form input,
.contact-form textarea {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  background: rgba(255,255,255,0.1);
  color: var(--cta-text);
  margin-bottom: 15px;
}

.form-group input:focus,
.form-group textarea:focus,
.contact-form input:focus,
.contact-form textarea:focus {
  outline: none;
  border-color: var(--cta-text);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.2);
}

.contact-form .cta-btn {
  width: 100%;
  background: var(--cta-text);
  color: var(--cta-bg);
}

.price-tag {
  display: inline-block;
  background: var(--accent);
  color: white;
  padding: 8px 20px;
  border-radius: 50px;
  font-weight: 700;
  font-size: 1.2rem;
  margin-top: 20px;
}

/* Pricing */
.pricing {
  background: var(--bg);
  text-align: center;
}

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
}

.pricing-card {
  background: var(--bg-alt);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.pricing-card .price {
  font-size: 2.5rem;
  font-weight: bold;
  color: var(--primary);
  margin: 1rem 0;
}

/* Footer */
footer {
  background: var(--footer-bg);
  color: var(--footer-text);
  text-align: center;
  padding: 2rem 0;
}
footer a { color: var(--accent); }

/* Responsive */
@media (max-width: 768px) {
  h1 { font-size: 2rem; }
  h2 { font-size: 1.75rem; }

  .hero {
    padding: 60px 0;
  }

  section {
    padding: 40px 0;
  }

  .features-grid,
  .offer-grid,
  .testimonial-grid,
  .pricing-grid {
    grid-template-columns: 1fr;
  }

  .form-row { flex-direction: column; gap: 0; }
  .header-content { justify-content: center; text-align: center; }
}
`;
}

