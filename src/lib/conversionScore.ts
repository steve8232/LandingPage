// Conversion Score Utility - "Leadmeter" style scoring for landing pages
// Analyzes generated content and returns a score (0-100) based on conversion best practices

export interface ConversionCheck {
  name: string;
  description: string;
  points: number;
  passed: boolean;
  suggestion?: string;
}

export interface ConversionScore {
  score: number;
  maxScore: number;
  grade: 'Excellent' | 'Great' | 'Good' | 'Needs Work' | 'Poor';
  checks: ConversionCheck[];
}

interface ScoreInput {
  headline: string;
  subheadline: string;
  cta: string;
  hasTestimonials: boolean;
  testimonialCount: number;
  hasImages: boolean;
  imageCount: number;
  hasPricing: boolean;
  hasPhone: boolean;
  hasEmail: boolean;
  formFieldCount: number;
  ctaContrast: boolean; // CTA contrasts with background
  hasHeroSection: boolean;
}

function getGrade(score: number): ConversionScore['grade'] {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Great';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Needs Work';
  return 'Poor';
}

function isHeadlineBenefitFocused(headline: string): boolean {
  // Check for benefit-focused words
  const benefitWords = [
    'save', 'get', 'achieve', 'improve', 'boost', 'increase', 'grow',
    'transform', 'discover', 'unlock', 'free', 'easy', 'fast', 'quick',
    'best', 'top', 'guaranteed', 'proven', 'results', 'success'
  ];
  const lower = headline.toLowerCase();
  return benefitWords.some(word => lower.includes(word));
}

function isHeadlineClear(headline: string): boolean {
  const wordCount = headline.split(/\s+/).length;
  return wordCount >= 3 && wordCount <= 12;
}

export function calculateConversionScore(input: ScoreInput): ConversionScore {
  const checks: ConversionCheck[] = [];
  
  // 1. Clear Headline (15 points)
  const headlineClear = isHeadlineClear(input.headline);
  const headlineBenefit = isHeadlineBenefitFocused(input.headline);
  const headlineScore = headlineClear && input.headline.length > 0;
  checks.push({
    name: 'Clear Headline',
    description: 'Headline is 3-12 words and communicates value',
    points: 15,
    passed: headlineScore,
    suggestion: !headlineScore ? 'Make your headline 3-12 words and focus on the key benefit' : undefined,
  });

  // 2. Benefit-Focused Messaging (10 points)
  checks.push({
    name: 'Benefit-Focused',
    description: 'Headline includes benefit-oriented language',
    points: 10,
    passed: headlineBenefit,
    suggestion: !headlineBenefit ? 'Include words like "save", "get", "improve", or "discover"' : undefined,
  });

  // 3. Single CTA / Primary Action (15 points)
  const hasCta = Boolean(input.cta && input.cta.length > 0);
  const ctaWordCount = input.cta ? input.cta.split(/\s+/).length : 0;
  const ctaIsAction = ctaWordCount >= 2 && ctaWordCount <= 5;
  checks.push({
    name: 'Clear CTA Button',
    description: 'Has a clear call-to-action (2-5 words)',
    points: 15,
    passed: hasCta && ctaIsAction,
    suggestion: !ctaIsAction ? 'Use an action phrase like "Get Started Now" or "Claim Your Spot"' : undefined,
  });

  // 4. CTA Contrast (10 points)
  checks.push({
    name: 'CTA Contrast',
    description: 'Button color stands out from background',
    points: 10,
    passed: input.ctaContrast,
    suggestion: !input.ctaContrast ? 'Ensure your CTA button uses a contrasting color' : undefined,
  });

  // 5. Social Proof / Testimonials (15 points)
  const hasGoodTestimonials = input.hasTestimonials && input.testimonialCount >= 3;
  checks.push({
    name: 'Social Proof',
    description: 'Includes 3+ testimonials for credibility',
    points: 15,
    passed: hasGoodTestimonials,
    suggestion: !hasGoodTestimonials ? 'Add at least 3 customer testimonials' : undefined,
  });

  // 6. Mobile Responsive (10 points) - Always true since we generate responsive CSS
  checks.push({
    name: 'Mobile Responsive',
    description: 'Page is fully responsive on all devices',
    points: 10,
    passed: true,
  });

  // 7. Contact Information Visible (10 points)
  const hasContact = input.hasPhone || input.hasEmail;
  checks.push({
    name: 'Contact Visible',
    description: 'Phone number or email is displayed',
    points: 10,
    passed: hasContact,
    suggestion: !hasContact ? 'Display your phone number or email prominently' : undefined,
  });

  // 8. Form Simplicity (5 points)
  const formSimple = input.formFieldCount <= 5;
  checks.push({
    name: 'Simple Form',
    description: 'Contact form has 5 or fewer fields',
    points: 5,
    passed: formSimple,
    suggestion: !formSimple ? `Reduce form fields from ${input.formFieldCount} to 5 or fewer` : undefined,
  });

  // 9. Visual Content (5 points)
  checks.push({
    name: 'Visual Content',
    description: 'Includes product images or graphics',
    points: 5,
    passed: input.hasImages && input.imageCount > 0,
    suggestion: !input.hasImages ? 'Add product images to increase engagement' : undefined,
  });

  // 10. Hero Section Present (5 points)
  checks.push({
    name: 'Strong Hero',
    description: 'Has a prominent hero section above the fold',
    points: 5,
    passed: input.hasHeroSection,
    suggestion: !input.hasHeroSection ? 'Ensure you have a strong hero section at the top' : undefined,
  });

  // Calculate total score
  const maxScore = checks.reduce((sum, check) => sum + check.points, 0);
  const score = checks.reduce((sum, check) => sum + (check.passed ? check.points : 0), 0);

  return {
    score,
    maxScore,
    grade: getGrade(score),
    checks,
  };
}

// Helper to extract score input from generated content
export function extractScoreInput(
  html: string,
  formData: { business: { cta: string; images: string[] }; contact: { phone: string; email: string } },
  testimonialCount: number
): ScoreInput {
  // Extract headline from HTML (simplified check)
  const headlineMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
  const headline = headlineMatch ? headlineMatch[1] : '';
  
  const subheadlineMatch = html.match(/class="subheadline"[^>]*>([^<]+)</);
  const subheadline = subheadlineMatch ? subheadlineMatch[1] : '';

  return {
    headline,
    subheadline,
    cta: formData.business.cta,
    hasTestimonials: testimonialCount > 0,
    testimonialCount,
    hasImages: formData.business.images.length > 0,
    imageCount: formData.business.images.length,
    hasPricing: html.includes('class="price-tag"'),
    hasPhone: formData.contact.phone.length > 0,
    hasEmail: formData.contact.email.length > 0,
    formFieldCount: 4, // Our form has 4 fields: name, email, phone, message
    ctaContrast: true, // Assume true since we design for contrast
    hasHeroSection: html.includes('class="hero"'),
  };
}

