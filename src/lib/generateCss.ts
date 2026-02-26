interface DesignColors {
  primary: string;
  primaryDark: string;
  secondary: string;
  accent: string;
  background: string;
  backgroundAlt: string;
  text: string;
  textMuted: string;
}

interface ColorUsage {
  heroBackground: string;
  heroText: string;
  ctaBackground: string;
  ctaText: string;
  sectionAltBackground: string;
  sectionAltText: string;
  cardBackground: string;
  cardText: string;
  headerBackground: string;
  headerText: string;
  footerBackground: string;
  footerText: string;
}

interface ColorHarmony {
  scheme: string;
  saturation: string;
  contrast: string;
  dominantColor: string;
  accentUsage: string;
}

interface DesignTypography {
  style: string;
  headingWeight: string;
  fontStack: string;
  headingCase: string;
}

interface DesignLayout {
  style: string;
  borderRadius: string;
  spacing: string;
  buttonStyle: string;
  shadowIntensity: string;
}

interface ParsedDesign {
  colors: DesignColors;
  colorUsage: ColorUsage;
  colorHarmony: ColorHarmony;
  typography: DesignTypography;
  layout: DesignLayout;
  mood: string;
  isDark: boolean;
}

import { Template } from './templates';

// Default design values when no template or analysis is provided
const defaultDesign: ParsedDesign = {
  colors: {
    primary: '#2563eb',
    primaryDark: '#1d4ed8',
    secondary: '#6366f1',
    accent: '#10b981',
    background: '#ffffff',
    backgroundAlt: '#f8fafc',
    text: '#1e293b',
    textMuted: '#64748b',
  },
  colorUsage: {
    heroBackground: '#ffffff',
    heroText: '#1e293b',
    ctaBackground: '#2563eb',
    ctaText: '#ffffff',
    sectionAltBackground: '#f8fafc',
    sectionAltText: '#1e293b',
    cardBackground: '#ffffff',
    cardText: '#1e293b',
    headerBackground: '#ffffff',
    headerText: '#1e293b',
    footerBackground: '#1e293b',
    footerText: '#ffffff',
  },
  colorHarmony: {
    scheme: 'complementary',
    saturation: 'moderate',
    contrast: 'high',
    dominantColor: '#ffffff',
    accentUsage: 'bold-pops',
  },
  typography: {
    style: 'modern',
    headingWeight: '700',
    fontStack: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    headingCase: 'normal',
  },
  layout: {
    style: 'modern',
    borderRadius: 'medium',
    spacing: 'normal',
    buttonStyle: 'solid',
    shadowIntensity: 'subtle',
  },
  mood: 'Professional and modern',
  isDark: false,
};

function templateToDesign(template: Template): ParsedDesign {
  return {
    colors: template.design.colors,
    colorUsage: template.design.colorUsage,
    colorHarmony: template.design.colorHarmony,
    typography: template.design.typography,
    layout: template.design.layout,
    mood: template.design.mood,
    isDark: template.design.isDark,
  };
}

function parseDesignAnalysis(designAnalysis: string, template?: Template): ParsedDesign {
  // Start with defaults, override with template if provided
  const baseDesign = template ? templateToDesign(template) : defaultDesign;

  if (!designAnalysis) return baseDesign;

  try {
    const parsed = JSON.parse(designAnalysis);
    // URL analysis overrides template/defaults
    return {
      colors: { ...baseDesign.colors, ...parsed.colors },
      colorUsage: { ...baseDesign.colorUsage, ...parsed.colorUsage },
      colorHarmony: { ...baseDesign.colorHarmony, ...parsed.colorHarmony },
      typography: { ...baseDesign.typography, ...parsed.typography },
      layout: { ...baseDesign.layout, ...parsed.layout },
      mood: parsed.mood || baseDesign.mood,
      isDark: parsed.isDark ?? baseDesign.isDark,
    };
  } catch {
    return baseDesign;
  }
}

function getBorderRadius(size: string): string {
  switch (size) {
    case 'none': return '0';
    case 'small': return '4px';
    case 'medium': return '8px';
    case 'large': return '16px';
    case 'full': return '9999px';
    default: return '8px';
  }
}

function getSpacing(size: string): { section: string; element: string } {
  switch (size) {
    case 'compact': return { section: '50px', element: '15px' };
    case 'spacious': return { section: '120px', element: '40px' };
    default: return { section: '80px', element: '30px' };
  }
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  // Handle invalid hex codes gracefully
  if (!hex || !hex.startsWith('#') || hex.length < 7) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Calculate relative luminance for WCAG contrast ratio
function getLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Calculate WCAG contrast ratio between two colors
function getContrastRatio(color1: string, color2: string): number {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Check if a color is "dark" (luminance < 0.5)
function isColorDark(hex: string): boolean {
  return getLuminance(hex) < 0.4;
}

// Ensure text has sufficient contrast against background
// WCAG AA requires 4.5:1 for normal text, 3:1 for large text
function ensureContrast(textColor: string, bgColor: string, minRatio: number = 4.5): string {
  const ratio = getContrastRatio(textColor, bgColor);
  if (ratio >= minRatio) {
    return textColor; // Already has good contrast
  }

  // If background is dark, use white text; if light, use dark text
  const bgIsDark = isColorDark(bgColor);
  const safeText = bgIsDark ? '#ffffff' : '#1e293b';

  // Verify the safe text has good contrast
  const safeRatio = getContrastRatio(safeText, bgColor);
  if (safeRatio >= minRatio) {
    return safeText;
  }

  // Fallback: use pure white or black for maximum contrast
  return bgIsDark ? '#ffffff' : '#000000';
}

// Validate and fix all colorUsage pairs for contrast
// Preserves all background colors from AI analysis, only adjusts text colors for WCAG AA compliance
function validateColorUsage(colorUsage: ColorUsage): ColorUsage {
  return {
    // Preserve all background colors exactly as extracted from URL analysis
    heroBackground: colorUsage.heroBackground,
    heroText: ensureContrast(colorUsage.heroText, colorUsage.heroBackground),
    ctaBackground: colorUsage.ctaBackground,
    ctaText: ensureContrast(colorUsage.ctaText, colorUsage.ctaBackground),
    sectionAltBackground: colorUsage.sectionAltBackground,
    sectionAltText: ensureContrast(colorUsage.sectionAltText || colorUsage.cardText, colorUsage.sectionAltBackground),
    cardBackground: colorUsage.cardBackground,
    cardText: ensureContrast(colorUsage.cardText, colorUsage.cardBackground),
    headerBackground: colorUsage.headerBackground,
    headerText: ensureContrast(colorUsage.headerText, colorUsage.headerBackground),
    footerBackground: colorUsage.footerBackground,
    footerText: ensureContrast(colorUsage.footerText, colorUsage.footerBackground),
  };
}

function getShadow(intensity: string, color: string): string {
  switch (intensity) {
    case 'none': return 'none';
    case 'subtle': return `0 2px 10px ${hexToRgba(color, 0.08)}`;
    case 'medium': return `0 4px 20px ${hexToRgba(color, 0.12)}`;
    case 'strong': return `0 8px 30px ${hexToRgba(color, 0.2)}`;
    default: return `0 4px 15px ${hexToRgba(color, 0.1)}`;
  }
}

function getButtonStyles(style: string, bgColor: string, textColor: string, radius: string): string {
  const base = `
  display: inline-block;
  padding: 16px 40px;
  font-size: 1.1rem;
  font-weight: 600;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;`;

  switch (style) {
    case 'outline':
      return `${base}
  background: transparent;
  color: ${bgColor};
  border: 2px solid ${bgColor};
  border-radius: ${radius};`;
    case 'gradient':
      return `${base}
  background: linear-gradient(135deg, ${bgColor} 0%, ${hexToRgba(bgColor, 0.8)} 100%);
  color: ${textColor};
  border-radius: ${radius};`;
    case 'rounded-full':
      return `${base}
  background: ${bgColor};
  color: ${textColor};
  border-radius: 9999px;`;
    default: // solid
      return `${base}
  background: ${bgColor};
  color: ${textColor};
  border-radius: ${radius};`;
  }
}

export function generateFullCSS(designAnalysis: string, template?: Template): string {
  const design = parseDesignAnalysis(designAnalysis, template);
  const { colors, colorHarmony, typography, layout, isDark } = design;

  // Validate and fix color contrast issues
  const validatedColorUsage = validateColorUsage(design.colorUsage);

  const borderRadius = getBorderRadius(layout.borderRadius);
  const spacing = getSpacing(layout.spacing);
  const shadow = getShadow(layout.shadowIntensity, isDark ? '#000000' : colors.text);

  // Use validated colorUsage for contextual color application
  const headerBg = validatedColorUsage.headerBackground;
  const headerText = validatedColorUsage.headerText;
  const heroBg = validatedColorUsage.heroBackground;
  const heroText = validatedColorUsage.heroText;
  const ctaBg = validatedColorUsage.ctaBackground;
  const ctaText = validatedColorUsage.ctaText;
  const sectionAltBg = validatedColorUsage.sectionAltBackground;
  const sectionAltText = validatedColorUsage.sectionAltText;
  const cardBg = validatedColorUsage.cardBackground;
  const cardText = validatedColorUsage.cardText;
  const footerBg = validatedColorUsage.footerBackground;
  const footerText = validatedColorUsage.footerText;

  // Determine text transform for headings
  const headingTransform = typography.headingCase === 'uppercase' ? 'uppercase' :
                           typography.headingCase === 'capitalize' ? 'capitalize' : 'none';

  // Generate border color based on theme and contrast
  const borderColor = isDark
    ? hexToRgba('#ffffff', 0.1)
    : hexToRgba(colors.text, 0.1);

  return `/* Generated Landing Page Styles */
/* Design Analysis Applied: ${design.mood} */
/* Color Harmony: ${colorHarmony.scheme} | Saturation: ${colorHarmony.saturation} | Contrast: ${colorHarmony.contrast} */

:root {
  --primary: ${colors.primary};
  --primary-dark: ${colors.primaryDark};
  --secondary: ${colors.secondary};
  --accent: ${colors.accent};
  --bg: ${colors.background};
  --bg-alt: ${colors.backgroundAlt};
  --text: ${colors.text};
  --text-muted: ${colors.textMuted};
  --hero-bg: ${heroBg};
  --hero-text: ${heroText};
  --cta-bg: ${ctaBg};
  --cta-text: ${ctaText};
  --section-alt-bg: ${sectionAltBg};
  --section-alt-text: ${sectionAltText};
  --card-bg: ${cardBg};
  --card-text: ${cardText};
  --header-bg: ${headerBg};
  --header-text: ${headerText};
  --footer-bg: ${footerBg};
  --footer-text: ${footerText};
  --border: ${borderColor};
  --radius: ${borderRadius};
  --radius-lg: ${layout.borderRadius === 'none' ? '0' : `calc(${borderRadius} * 1.5)`};
  --shadow: ${shadow};
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: ${typography.fontStack};
  background: ${colors.background};
  color: ${colors.text};
  line-height: 1.6;
}

.container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }

header {
  background: ${headerBg};
  padding: 15px 0;
  border-bottom: 1px solid ${isDark ? hexToRgba('#ffffff', 0.1) : hexToRgba(headerText, 0.1)};
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.logo {
  font-size: 1.4rem;
  font-weight: ${typography.headingWeight};
  color: ${ctaBg};
  text-transform: ${headingTransform};
}

.phone-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${ctaBg};
  text-decoration: none;
  font-weight: 600;
  font-size: 1.1rem;
}

.phone-link:hover { opacity: 0.8; }

.hero {
  padding: ${spacing.section} 0;
  text-align: center;
  background: ${heroBg};
  color: ${heroText};
}

.hero h1 {
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: ${typography.headingWeight};
  margin-bottom: 20px;
  line-height: 1.2;
  color: ${heroText};
  text-transform: ${headingTransform};
}

.hero .subheadline {
  font-size: clamp(1.1rem, 2.5vw, 1.4rem);
  color: ${isDark ? hexToRgba(heroText, 0.8) : hexToRgba(heroText, 0.7)};
  max-width: 600px;
  margin: 0 auto ${spacing.element};
}

.cta-btn {
  ${getButtonStyles(layout.buttonStyle, ctaBg, ctaText, borderRadius)}
}

.cta-btn:hover {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 10px 30px ${hexToRgba(ctaBg, 0.4)};
}

/* Secondary CTA button style */
.cta-btn-secondary {
  ${getButtonStyles('outline', ctaBg, ctaBg, borderRadius)}
}

.offer, .testimonials, .images, .final-cta { padding: ${spacing.section} 0; }

.offer {
  background: ${sectionAltBg};
  color: ${sectionAltText};
}

.offer h2, .testimonials h2, .images h2, .final-cta h2 {
  font-size: 2rem;
  font-weight: ${typography.headingWeight};
  text-align: center;
  margin-bottom: 40px;
  text-transform: ${headingTransform};
}

.offer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${spacing.element};
}

.offer-card {
  background: ${cardBg};
  color: ${cardText};
  padding: ${spacing.element};
  border-radius: var(--radius-lg);
  box-shadow: ${getShadow(layout.shadowIntensity, isDark ? '#000000' : cardText)};
}

.offer-card h3 {
  color: ${ctaBg};
  margin-bottom: 15px;
  font-size: 1.3rem;
  font-weight: ${typography.headingWeight};
}

.price-tag {
  display: inline-block;
  background: ${colors.accent};
  color: white;
  padding: 8px 20px;
  border-radius: 50px;
  font-weight: 700;
  font-size: 1.2rem;
  margin-top: 20px;
}

.selling-points { list-style: none; }
.selling-points li { padding: 10px 0 10px 30px; position: relative; color: ${cardText}; }
.selling-points li::before { content: "✓"; position: absolute; left: 0; color: ${colors.accent}; font-weight: bold; }

.images {
  background: ${heroBg};
  color: ${heroText};
}

.image-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.gallery-img {
  width: 100%;
  height: 250px;
  object-fit: cover;
  border-radius: var(--radius-lg);
  box-shadow: ${getShadow(layout.shadowIntensity, isDark ? '#000000' : colors.text)};
}

.testimonials {
  background: ${sectionAltBg};
  color: ${sectionAltText};
}

.testimonial-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
}

.testimonial-card {
  background: ${cardBg};
  padding: 25px;
  border-radius: var(--radius-lg);
  box-shadow: ${getShadow(layout.shadowIntensity, isDark ? '#000000' : cardText)};
}

.testimonial-card .quote {
  font-style: italic;
  margin-bottom: 15px;
  color: ${cardText};
}

.testimonial-card .author strong { display: block; color: ${cardText}; }
.testimonial-card .author span { font-size: 0.9rem; color: ${hexToRgba(cardText, 0.7)}; }

.final-cta {
  text-align: center;
  background: ${ctaBg};
  color: ${ctaText};
}
.final-cta h2 { color: ${ctaText}; }
.final-cta p { margin-bottom: ${spacing.element}; opacity: 0.9; }

.contact-form { max-width: 500px; margin: 0 auto; }
.form-row { display: flex; gap: 15px; margin-bottom: 15px; }
.form-row input { flex: 1; }

.contact-form input, .contact-form textarea {
  width: 100%;
  padding: 14px;
  border: 1px solid ${hexToRgba(ctaText, 0.3)};
  border-radius: var(--radius);
  font-size: 1rem;
  margin-bottom: 15px;
  background: ${hexToRgba(ctaText, 0.1)};
  color: ${ctaText};
}

.contact-form input::placeholder, .contact-form textarea::placeholder {
  color: ${hexToRgba(ctaText, 0.6)};
}

.contact-form input:focus, .contact-form textarea:focus {
  outline: none;
  border-color: ${ctaText};
  box-shadow: 0 0 0 3px ${hexToRgba(ctaText, 0.2)};
}

.contact-form .cta-btn {
  width: 100%;
  background: ${ctaText};
  color: ${ctaBg};
}
.contact-form .cta-btn:hover {
  opacity: 0.9;
}

footer {
  background: ${footerBg};
  color: ${footerText};
  padding: 40px 0;
  text-align: center;
}
footer a { color: ${colors.accent}; }

@media (max-width: 768px) {
  .hero { padding: 50px 0; }
  .offer, .testimonials, .images, .final-cta { padding: 50px 0; }
  .form-row { flex-direction: column; gap: 0; }
  .header-content { justify-content: center; text-align: center; }
}`;
}

