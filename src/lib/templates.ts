// Template definitions for the landing page designer
// Each template includes design tokens, color schemes, and section configurations

export type TemplateCategory = 
  | 'saas' 
  | 'ecommerce' 
  | 'local-services' 
  | 'professional' 
  | 'lead-gen' 
  | 'coming-soon';

export interface TemplateDesign {
  colors: {
    primary: string;
    primaryDark: string;
    secondary: string;
    accent: string;
    background: string;
    backgroundAlt: string;
    text: string;
    textMuted: string;
  };
  colorUsage: {
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
  };
  colorHarmony: {
    scheme: string;
    saturation: string;
    contrast: string;
    dominantColor: string;
    accentUsage: string;
  };
  typography: {
    style: string;
    headingWeight: string;
    fontStack: string;
    headingCase: string;
  };
  layout: {
    style: string;
    borderRadius: string;
    spacing: string;
    buttonStyle: string;
    shadowIntensity: string;
  };
  mood: string;
  isDark: boolean;
}

export interface TemplateSections {
  hero: boolean;
  features: boolean;
  pricing: boolean;
  testimonials: boolean;
  gallery: boolean;
  contact: boolean;
  footer: boolean;
}

export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  previewColors: string[]; // 3-4 colors for thumbnail preview
  design: TemplateDesign;
  sections: TemplateSections;
  industryKeywords: string[]; // For AI content generation context
}

// SaaS Templates
const saasModern: Template = {
  id: 'saas-modern',
  name: 'SaaS Modern',
  category: 'saas',
  description: 'Clean, professional design for software products with blue tones',
  previewColors: ['#2563eb', '#1e40af', '#f8fafc', '#10b981'],
  design: {
    colors: {
      primary: '#2563eb',
      primaryDark: '#1e40af',
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
      footerText: '#f8fafc',
    },
    colorHarmony: {
      scheme: 'analogous',
      saturation: 'vibrant',
      contrast: 'high',
      dominantColor: '#2563eb',
      accentUsage: 'bold-pops',
    },
    typography: {
      style: 'modern',
      headingWeight: '700',
      fontStack: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      headingCase: 'normal',
    },
    layout: {
      style: 'modern',
      borderRadius: 'medium',
      spacing: 'normal',
      buttonStyle: 'solid',
      shadowIntensity: 'subtle',
    },
    mood: 'Professional, innovative, and trustworthy',
    isDark: false,
  },
  sections: {
    hero: true,
    features: true,
    pricing: true,
    testimonials: true,
    gallery: false,
    contact: true,
    footer: true,
  },
  industryKeywords: ['software', 'SaaS', 'technology', 'digital', 'platform', 'app'],
};

const saasDark: Template = {
  id: 'saas-dark',
  name: 'SaaS Dark Mode',
  category: 'saas',
  description: 'Sleek dark theme for tech products with purple accents',
  previewColors: ['#0f172a', '#8b5cf6', '#22d3ee', '#f8fafc'],
  design: {
    colors: {
      primary: '#8b5cf6',
      primaryDark: '#7c3aed',
      secondary: '#22d3ee',
      accent: '#22d3ee',
      background: '#0f172a',
      backgroundAlt: '#1e293b',
      text: '#f8fafc',
      textMuted: '#94a3b8',
    },
    colorUsage: {
      heroBackground: '#0f172a',
      heroText: '#f8fafc',
      ctaBackground: '#8b5cf6',
      ctaText: '#ffffff',
      sectionAltBackground: '#1e293b',
      sectionAltText: '#f8fafc',
      cardBackground: '#1e293b',
      cardText: '#f8fafc',
      headerBackground: '#0f172a',
      headerText: '#f8fafc',
      footerBackground: '#020617',
      footerText: '#94a3b8',
    },
    colorHarmony: {
      scheme: 'complementary',
      saturation: 'vibrant',
      contrast: 'high',
      dominantColor: '#0f172a',
      accentUsage: 'bold-pops',
    },
    typography: {
      style: 'modern',
      headingWeight: '700',
      fontStack: 'Inter, -apple-system, sans-serif',
      headingCase: 'normal',
    },
    layout: {
      style: 'modern',
      borderRadius: 'medium',
      spacing: 'normal',
      buttonStyle: 'gradient',
      shadowIntensity: 'medium',
    },
    mood: 'Cutting-edge, innovative, and premium',
    isDark: true,
  },
  sections: {
    hero: true,
    features: true,
    pricing: true,
    testimonials: true,
    gallery: false,
    contact: true,
    footer: true,
  },
  industryKeywords: ['technology', 'startup', 'developer', 'AI', 'platform'],
};

// E-commerce Templates
const ecommerceClean: Template = {
  id: 'ecommerce-clean',
  name: 'E-commerce Clean',
  category: 'ecommerce',
  description: 'Minimal, product-focused design with warm accents',
  previewColors: ['#ffffff', '#f97316', '#1f2937', '#fef3c7'],
  design: {
    colors: {
      primary: '#f97316',
      primaryDark: '#ea580c',
      secondary: '#fbbf24',
      accent: '#f97316',
      background: '#ffffff',
      backgroundAlt: '#fef3c7',
      text: '#1f2937',
      textMuted: '#6b7280',
    },
    colorUsage: {
      heroBackground: '#ffffff',
      heroText: '#1f2937',
      ctaBackground: '#f97316',
      ctaText: '#ffffff',
      sectionAltBackground: '#fef3c7',
      sectionAltText: '#1f2937',
      cardBackground: '#ffffff',
      cardText: '#1f2937',
      headerBackground: '#ffffff',
      headerText: '#1f2937',
      footerBackground: '#1f2937',
      footerText: '#f3f4f6',
    },
    colorHarmony: {
      scheme: 'warm',
      saturation: 'vibrant',
      contrast: 'high',
      dominantColor: '#ffffff',
      accentUsage: 'bold-pops',
    },
    typography: {
      style: 'elegant',
      headingWeight: '600',
      fontStack: '"Playfair Display", Georgia, serif',
      headingCase: 'normal',
    },
    layout: {
      style: 'minimal',
      borderRadius: 'small',
      spacing: 'spacious',
      buttonStyle: 'solid',
      shadowIntensity: 'subtle',
    },
    mood: 'Elegant, inviting, and premium',
    isDark: false,
  },
  sections: {
    hero: true,
    features: true,
    pricing: true,
    testimonials: true,
    gallery: true,
    contact: true,
    footer: true,
  },
  industryKeywords: ['product', 'shop', 'store', 'buy', 'retail', 'ecommerce'],
};

const ecommerceBold: Template = {
  id: 'ecommerce-bold',
  name: 'E-commerce Bold',
  category: 'ecommerce',
  description: 'High-energy design with bold red CTAs for sales',
  previewColors: ['#dc2626', '#fef2f2', '#1f2937', '#fbbf24'],
  design: {
    colors: {
      primary: '#dc2626',
      primaryDark: '#b91c1c',
      secondary: '#fbbf24',
      accent: '#fbbf24',
      background: '#ffffff',
      backgroundAlt: '#fef2f2',
      text: '#1f2937',
      textMuted: '#6b7280',
    },
    colorUsage: {
      heroBackground: '#fef2f2',
      heroText: '#1f2937',
      ctaBackground: '#dc2626',
      ctaText: '#ffffff',
      sectionAltBackground: '#ffffff',
      sectionAltText: '#1f2937',
      cardBackground: '#ffffff',
      cardText: '#1f2937',
      headerBackground: '#dc2626',
      headerText: '#ffffff',
      footerBackground: '#1f2937',
      footerText: '#f3f4f6',
    },
    colorHarmony: {
      scheme: 'complementary',
      saturation: 'vibrant',
      contrast: 'high',
      dominantColor: '#dc2626',
      accentUsage: 'bold-pops',
    },
    typography: {
      style: 'bold',
      headingWeight: '800',
      fontStack: 'Poppins, -apple-system, sans-serif',
      headingCase: 'uppercase',
    },
    layout: {
      style: 'modern',
      borderRadius: 'small',
      spacing: 'normal',
      buttonStyle: 'rounded-full',
      shadowIntensity: 'medium',
    },
    mood: 'Energetic, urgent, and compelling',
    isDark: false,
  },
  sections: {
    hero: true,
    features: true,
    pricing: true,
    testimonials: true,
    gallery: true,
    contact: true,
    footer: true,
  },
  industryKeywords: ['sale', 'deal', 'offer', 'limited', 'exclusive', 'shop'],
};

// Local Services Templates
const localServicesTrust: Template = {
  id: 'local-trust',
  name: 'Local Services Trust',
  category: 'local-services',
  description: 'Trustworthy design for contractors, plumbers, electricians',
  previewColors: ['#1e3a5f', '#f97316', '#ffffff', '#f0f9ff'],
  design: {
    colors: {
      primary: '#1e3a5f',
      primaryDark: '#0f2744',
      secondary: '#f97316',
      accent: '#f97316',
      background: '#ffffff',
      backgroundAlt: '#f0f9ff',
      text: '#1e293b',
      textMuted: '#64748b',
    },
    colorUsage: {
      heroBackground: '#1e3a5f',
      heroText: '#ffffff',
      ctaBackground: '#f97316',
      ctaText: '#ffffff',
      sectionAltBackground: '#f0f9ff',
      sectionAltText: '#1e293b',
      cardBackground: '#ffffff',
      cardText: '#1e293b',
      headerBackground: '#1e3a5f',
      headerText: '#ffffff',
      footerBackground: '#0f2744',
      footerText: '#e2e8f0',
    },
    colorHarmony: {
      scheme: 'complementary',
      saturation: 'moderate',
      contrast: 'high',
      dominantColor: '#1e3a5f',
      accentUsage: 'bold-pops',
    },
    typography: {
      style: 'professional',
      headingWeight: '700',
      fontStack: 'Roboto, -apple-system, sans-serif',
      headingCase: 'normal',
    },
    layout: {
      style: 'classic',
      borderRadius: 'medium',
      spacing: 'normal',
      buttonStyle: 'rounded-full',
      shadowIntensity: 'subtle',
    },
    mood: 'Reliable, professional, and trustworthy',
    isDark: false,
  },
  sections: {
    hero: true,
    features: true,
    pricing: true,
    testimonials: true,
    gallery: true,
    contact: true,
    footer: true,
  },
  industryKeywords: ['contractor', 'plumber', 'electrician', 'repair', 'home', 'local'],
};

const localServicesGreen: Template = {
  id: 'local-eco',
  name: 'Eco-Friendly Services',
  category: 'local-services',
  description: 'Green-focused design for landscaping, cleaning, eco services',
  previewColors: ['#166534', '#22c55e', '#f0fdf4', '#ffffff'],
  design: {
    colors: {
      primary: '#166534',
      primaryDark: '#14532d',
      secondary: '#22c55e',
      accent: '#22c55e',
      background: '#ffffff',
      backgroundAlt: '#f0fdf4',
      text: '#1e293b',
      textMuted: '#64748b',
    },
    colorUsage: {
      heroBackground: '#166534',
      heroText: '#ffffff',
      ctaBackground: '#22c55e',
      ctaText: '#ffffff',
      sectionAltBackground: '#f0fdf4',
      sectionAltText: '#1e293b',
      cardBackground: '#ffffff',
      cardText: '#1e293b',
      headerBackground: '#166534',
      headerText: '#ffffff',
      footerBackground: '#14532d',
      footerText: '#dcfce7',
    },
    colorHarmony: {
      scheme: 'monochromatic',
      saturation: 'vibrant',
      contrast: 'high',
      dominantColor: '#166534',
      accentUsage: 'subtle-highlights',
    },
    typography: {
      style: 'friendly',
      headingWeight: '600',
      fontStack: '"Open Sans", -apple-system, sans-serif',
      headingCase: 'normal',
    },
    layout: {
      style: 'organic',
      borderRadius: 'large',
      spacing: 'spacious',
      buttonStyle: 'rounded-full',
      shadowIntensity: 'subtle',
    },
    mood: 'Fresh, natural, and environmentally conscious',
    isDark: false,
  },
  sections: {
    hero: true,
    features: true,
    pricing: true,
    testimonials: true,
    gallery: true,
    contact: true,
    footer: true,
  },
  industryKeywords: ['landscaping', 'cleaning', 'eco', 'green', 'natural', 'organic'],
};

// Professional Services Templates
const professionalConsulting: Template = {
  id: 'pro-consulting',
  name: 'Professional Consulting',
  category: 'professional',
  description: 'Sophisticated design for consultants and coaches',
  previewColors: ['#1f2937', '#3b82f6', '#f8fafc', '#fbbf24'],
  design: {
    colors: {
      primary: '#1f2937',
      primaryDark: '#111827',
      secondary: '#3b82f6',
      accent: '#fbbf24',
      background: '#ffffff',
      backgroundAlt: '#f8fafc',
      text: '#1f2937',
      textMuted: '#6b7280',
    },
    colorUsage: {
      heroBackground: '#ffffff',
      heroText: '#1f2937',
      ctaBackground: '#1f2937',
      ctaText: '#ffffff',
      sectionAltBackground: '#f8fafc',
      sectionAltText: '#1f2937',
      cardBackground: '#ffffff',
      cardText: '#1f2937',
      headerBackground: '#ffffff',
      headerText: '#1f2937',
      footerBackground: '#111827',
      footerText: '#e5e7eb',
    },
    colorHarmony: {
      scheme: 'neutral',
      saturation: 'muted',
      contrast: 'high',
      dominantColor: '#1f2937',
      accentUsage: 'minimal',
    },
    typography: {
      style: 'elegant',
      headingWeight: '600',
      fontStack: '"Cormorant Garamond", Georgia, serif',
      headingCase: 'normal',
    },
    layout: {
      style: 'classic',
      borderRadius: 'small',
      spacing: 'spacious',
      buttonStyle: 'solid',
      shadowIntensity: 'subtle',
    },
    mood: 'Sophisticated, authoritative, and premium',
    isDark: false,
  },
  sections: {
    hero: true,
    features: true,
    pricing: false,
    testimonials: true,
    gallery: false,
    contact: true,
    footer: true,
  },
  industryKeywords: ['consulting', 'coach', 'advisor', 'expert', 'business', 'strategy'],
};

const professionalLaw: Template = {
  id: 'pro-law',
  name: 'Law & Finance',
  category: 'professional',
  description: 'Authoritative design for legal and financial services',
  previewColors: ['#1e3a5f', '#b8860b', '#ffffff', '#f1f5f9'],
  design: {
    colors: {
      primary: '#1e3a5f',
      primaryDark: '#0f2744',
      secondary: '#b8860b',
      accent: '#b8860b',
      background: '#ffffff',
      backgroundAlt: '#f1f5f9',
      text: '#1e293b',
      textMuted: '#64748b',
    },
    colorUsage: {
      heroBackground: '#1e3a5f',
      heroText: '#ffffff',
      ctaBackground: '#b8860b',
      ctaText: '#ffffff',
      sectionAltBackground: '#f1f5f9',
      sectionAltText: '#1e293b',
      cardBackground: '#ffffff',
      cardText: '#1e293b',
      headerBackground: '#1e3a5f',
      headerText: '#ffffff',
      footerBackground: '#0f2744',
      footerText: '#cbd5e1',
    },
    colorHarmony: {
      scheme: 'complementary',
      saturation: 'muted',
      contrast: 'high',
      dominantColor: '#1e3a5f',
      accentUsage: 'subtle-highlights',
    },
    typography: {
      style: 'classic',
      headingWeight: '700',
      fontStack: '"Libre Baskerville", Georgia, serif',
      headingCase: 'normal',
    },
    layout: {
      style: 'classic',
      borderRadius: 'small',
      spacing: 'normal',
      buttonStyle: 'solid',
      shadowIntensity: 'subtle',
    },
    mood: 'Trustworthy, established, and professional',
    isDark: false,
  },
  sections: {
    hero: true,
    features: true,
    pricing: false,
    testimonials: true,
    gallery: false,
    contact: true,
    footer: true,
  },
  industryKeywords: ['law', 'legal', 'attorney', 'finance', 'accounting', 'investment'],
};

// Lead Generation Templates
const leadGenWebinar: Template = {
  id: 'leadgen-webinar',
  name: 'Webinar Signup',
  category: 'lead-gen',
  description: 'Focused design for webinar and event registrations',
  previewColors: ['#7c3aed', '#c4b5fd', '#ffffff', '#10b981'],
  design: {
    colors: {
      primary: '#7c3aed',
      primaryDark: '#6d28d9',
      secondary: '#c4b5fd',
      accent: '#10b981',
      background: '#ffffff',
      backgroundAlt: '#f5f3ff',
      text: '#1e293b',
      textMuted: '#64748b',
    },
    colorUsage: {
      heroBackground: '#7c3aed',
      heroText: '#ffffff',
      ctaBackground: '#10b981',
      ctaText: '#ffffff',
      sectionAltBackground: '#f5f3ff',
      sectionAltText: '#1e293b',
      cardBackground: '#ffffff',
      cardText: '#1e293b',
      headerBackground: '#7c3aed',
      headerText: '#ffffff',
      footerBackground: '#6d28d9',
      footerText: '#e9d5ff',
    },
    colorHarmony: {
      scheme: 'split-complementary',
      saturation: 'vibrant',
      contrast: 'high',
      dominantColor: '#7c3aed',
      accentUsage: 'bold-pops',
    },
    typography: {
      style: 'modern',
      headingWeight: '700',
      fontStack: 'Poppins, -apple-system, sans-serif',
      headingCase: 'normal',
    },
    layout: {
      style: 'focused',
      borderRadius: 'medium',
      spacing: 'normal',
      buttonStyle: 'rounded-full',
      shadowIntensity: 'medium',
    },
    mood: 'Exciting, educational, and action-oriented',
    isDark: false,
  },
  sections: {
    hero: true,
    features: true,
    pricing: false,
    testimonials: true,
    gallery: false,
    contact: true,
    footer: true,
  },
  industryKeywords: ['webinar', 'event', 'training', 'workshop', 'course', 'learn'],
};

const leadGenEbook: Template = {
  id: 'leadgen-ebook',
  name: 'Ebook Download',
  category: 'lead-gen',
  description: 'Clean design for ebook and resource downloads',
  previewColors: ['#0891b2', '#ffffff', '#ecfeff', '#f97316'],
  design: {
    colors: {
      primary: '#0891b2',
      primaryDark: '#0e7490',
      secondary: '#06b6d4',
      accent: '#f97316',
      background: '#ffffff',
      backgroundAlt: '#ecfeff',
      text: '#1e293b',
      textMuted: '#64748b',
    },
    colorUsage: {
      heroBackground: '#ffffff',
      heroText: '#1e293b',
      ctaBackground: '#f97316',
      ctaText: '#ffffff',
      sectionAltBackground: '#ecfeff',
      sectionAltText: '#1e293b',
      cardBackground: '#ffffff',
      cardText: '#1e293b',
      headerBackground: '#0891b2',
      headerText: '#ffffff',
      footerBackground: '#0e7490',
      footerText: '#cffafe',
    },
    colorHarmony: {
      scheme: 'complementary',
      saturation: 'vibrant',
      contrast: 'high',
      dominantColor: '#0891b2',
      accentUsage: 'bold-pops',
    },
    typography: {
      style: 'clean',
      headingWeight: '600',
      fontStack: '"Source Sans Pro", -apple-system, sans-serif',
      headingCase: 'normal',
    },
    layout: {
      style: 'minimal',
      borderRadius: 'medium',
      spacing: 'normal',
      buttonStyle: 'solid',
      shadowIntensity: 'subtle',
    },
    mood: 'Informative, helpful, and professional',
    isDark: false,
  },
  sections: {
    hero: true,
    features: true,
    pricing: false,
    testimonials: true,
    gallery: false,
    contact: true,
    footer: true,
  },
  industryKeywords: ['ebook', 'guide', 'download', 'resource', 'free', 'whitepaper'],
};

// Coming Soon Templates
const comingSoonMinimal: Template = {
  id: 'coming-soon-minimal',
  name: 'Coming Soon Minimal',
  category: 'coming-soon',
  description: 'Clean, focused landing page for product launches',
  previewColors: ['#0f172a', '#f8fafc', '#3b82f6', '#fbbf24'],
  design: {
    colors: {
      primary: '#0f172a',
      primaryDark: '#020617',
      secondary: '#3b82f6',
      accent: '#fbbf24',
      background: '#0f172a',
      backgroundAlt: '#1e293b',
      text: '#f8fafc',
      textMuted: '#94a3b8',
    },
    colorUsage: {
      heroBackground: '#0f172a',
      heroText: '#f8fafc',
      ctaBackground: '#3b82f6',
      ctaText: '#ffffff',
      sectionAltBackground: '#1e293b',
      sectionAltText: '#f8fafc',
      cardBackground: '#1e293b',
      cardText: '#f8fafc',
      headerBackground: '#0f172a',
      headerText: '#f8fafc',
      footerBackground: '#020617',
      footerText: '#94a3b8',
    },
    colorHarmony: {
      scheme: 'monochromatic',
      saturation: 'muted',
      contrast: 'high',
      dominantColor: '#0f172a',
      accentUsage: 'subtle-highlights',
    },
    typography: {
      style: 'modern',
      headingWeight: '700',
      fontStack: 'Inter, -apple-system, sans-serif',
      headingCase: 'normal',
    },
    layout: {
      style: 'minimal',
      borderRadius: 'medium',
      spacing: 'spacious',
      buttonStyle: 'solid',
      shadowIntensity: 'medium',
    },
    mood: 'Anticipation, exclusivity, and modern',
    isDark: true,
  },
  sections: {
    hero: true,
    features: false,
    pricing: false,
    testimonials: false,
    gallery: false,
    contact: true,
    footer: true,
  },
  industryKeywords: ['launch', 'coming soon', 'waitlist', 'early access', 'beta', 'notify'],
};

const comingSoonVibrant: Template = {
  id: 'coming-soon-vibrant',
  name: 'Coming Soon Vibrant',
  category: 'coming-soon',
  description: 'Eye-catching gradient design for exciting launches',
  previewColors: ['#ec4899', '#8b5cf6', '#ffffff', '#06b6d4'],
  design: {
    colors: {
      primary: '#ec4899',
      primaryDark: '#db2777',
      secondary: '#8b5cf6',
      accent: '#06b6d4',
      background: '#fdf2f8',
      backgroundAlt: '#fce7f3',
      text: '#1e293b',
      textMuted: '#64748b',
    },
    colorUsage: {
      heroBackground: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
      heroText: '#ffffff',
      ctaBackground: '#ffffff',
      ctaText: '#ec4899',
      sectionAltBackground: '#fdf2f8',
      sectionAltText: '#1e293b',
      cardBackground: '#ffffff',
      cardText: '#1e293b',
      headerBackground: 'transparent',
      headerText: '#ffffff',
      footerBackground: '#8b5cf6',
      footerText: '#f5f3ff',
    },
    colorHarmony: {
      scheme: 'gradient',
      saturation: 'vibrant',
      contrast: 'high',
      dominantColor: '#ec4899',
      accentUsage: 'bold-pops',
    },
    typography: {
      style: 'playful',
      headingWeight: '800',
      fontStack: 'Poppins, -apple-system, sans-serif',
      headingCase: 'normal',
    },
    layout: {
      style: 'modern',
      borderRadius: 'large',
      spacing: 'spacious',
      buttonStyle: 'rounded-full',
      shadowIntensity: 'strong',
    },
    mood: 'Exciting, playful, and energetic',
    isDark: false,
  },
  sections: {
    hero: true,
    features: false,
    pricing: false,
    testimonials: false,
    gallery: false,
    contact: true,
    footer: true,
  },
  industryKeywords: ['startup', 'app', 'exciting', 'new', 'innovation', 'launch'],
};

// Export all templates
export const templates: Template[] = [
  saasModern,
  saasDark,
  ecommerceClean,
  ecommerceBold,
  localServicesTrust,
  localServicesGreen,
  professionalConsulting,
  professionalLaw,
  leadGenWebinar,
  leadGenEbook,
  comingSoonMinimal,
  comingSoonVibrant,
];

// Helper functions
export function getTemplateById(id: string): Template | undefined {
  return templates.find(t => t.id === id);
}

export function getTemplatesByCategory(category: TemplateCategory): Template[] {
  return templates.filter(t => t.category === category);
}

export const categoryLabels: Record<TemplateCategory, string> = {
  'saas': 'SaaS',
  'ecommerce': 'E-commerce',
  'local-services': 'Local Services',
  'professional': 'Professional',
  'lead-gen': 'Lead Gen',
  'coming-soon': 'Coming Soon',
};

