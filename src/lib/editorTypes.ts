// Types for the visual page editor

export interface EditorSection {
  id: string;
  type: SectionType;
  content: Record<string, string>;
  styles: SectionStyles;
  order: number;
}

export type SectionType = 
  | 'hero'
  | 'features'
  | 'testimonials'
  | 'gallery'
  | 'cta'
  | 'contact'
  | 'footer'
  | 'text-block'
  | 'image-block'
  | 'pricing';

export interface SectionStyles {
  backgroundColor?: string;
  textColor?: string;
  padding?: string;
  containerWidth?: 'full' | 'contained' | 'narrow';
  backgroundImage?: string; // base64 or URL
  backgroundOverlayOpacity?: number; // 0-1 for overlay darkness
}

export interface EditorColors {
  primary: string;
  primaryDark: string;
  secondary: string;
  accent: string;
  background: string;
  backgroundAlt: string;
  text: string;
  textMuted: string;
  ctaBackground: string;
  ctaText: string;
  heroBackground: string;
  heroText: string;
  sectionAltBackground: string;
  sectionAltText: string;
  cardBackground: string;
  cardText: string;
  headerBackground: string;
  headerText: string;
  footerBackground: string;
  footerText: string;
}

export interface EditorTypography {
  headingFont: string;
  bodyFont: string;
  headingWeight: string;
  baseFontSize: string;
}

export interface EditorState {
  sections: EditorSection[];
  colors: EditorColors;
  typography: EditorTypography;
  selectedSectionId: string | null;
  selectedElementId: string | null;
  editMode: 'preview' | 'edit';
  history: HistoryEntry[];
  historyIndex: number;
  isDirty: boolean;
}

export interface HistoryEntry {
  sections: EditorSection[];
  colors: EditorColors;
  typography: EditorTypography;
  timestamp: number;
}

export type EditorAction =
  | { type: 'SET_SECTIONS'; payload: EditorSection[] }
  | { type: 'UPDATE_SECTION'; payload: { id: string; updates: Partial<EditorSection> } }
  | { type: 'DELETE_SECTION'; payload: string }
  | { type: 'REORDER_SECTIONS'; payload: { fromIndex: number; toIndex: number } }
  | { type: 'ADD_SECTION'; payload: { section: EditorSection; afterId?: string } }
  | { type: 'SET_COLORS'; payload: Partial<EditorColors> }
  | { type: 'SET_TYPOGRAPHY'; payload: Partial<EditorTypography> }
  | { type: 'SELECT_SECTION'; payload: string | null }
  | { type: 'SELECT_ELEMENT'; payload: string | null }
  | { type: 'SET_EDIT_MODE'; payload: 'preview' | 'edit' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RESET' }
  | { type: 'SAVE_HISTORY' };

export interface ComponentTemplate {
  id: string;
  name: string;
  type: SectionType;
  icon: string;
  description: string;
  defaultContent: Record<string, string>;
  defaultStyles: SectionStyles;
}

// Available component templates for the sidebar
export const componentTemplates: ComponentTemplate[] = [
  {
    id: 'hero-basic',
    name: 'Hero Section',
    type: 'hero',
    icon: 'Layout',
    description: 'Main hero with headline and CTA',
    defaultContent: {
      headline: 'Your Compelling Headline Here',
      subheadline: 'A powerful subheadline that explains your value proposition',
      ctaText: 'Get Started',
    },
    defaultStyles: {
      backgroundColor: 'var(--hero-bg)',
      textColor: 'var(--hero-text)',
      padding: '80px 0',
      containerWidth: 'contained',
    },
  },
  {
    id: 'features-grid',
    name: 'Features Grid',
    type: 'features',
    icon: 'Grid3X3',
    description: 'Grid of feature cards',
    defaultContent: {
      title: 'Why Choose Us',
      features: JSON.stringify([
        { title: 'Feature 1', description: 'Description of feature 1' },
        { title: 'Feature 2', description: 'Description of feature 2' },
        { title: 'Feature 3', description: 'Description of feature 3' },
      ]),
    },
    defaultStyles: {
      backgroundColor: 'var(--section-alt-bg)',
      textColor: 'var(--text)',
      padding: '60px 0',
      containerWidth: 'contained',
    },
  },
  {
    id: 'testimonials-carousel',
    name: 'Testimonials',
    type: 'testimonials',
    icon: 'Quote',
    description: 'Customer testimonials section',
    defaultContent: {
      title: 'What Our Customers Say',
      testimonials: JSON.stringify([
        { quote: 'Amazing product!', name: 'John Doe', title: 'CEO' },
      ]),
    },
    defaultStyles: {
      backgroundColor: 'var(--background)',
      textColor: 'var(--text)',
      padding: '60px 0',
      containerWidth: 'contained',
    },
  },
  {
    id: 'cta-banner',
    name: 'CTA Banner',
    type: 'cta',
    icon: 'MousePointerClick',
    description: 'Call-to-action banner',
    defaultContent: {
      headline: 'Ready to Get Started?',
      subheadline: 'Join thousands of satisfied customers today.',
      ctaText: 'Sign Up Now',
    },
    defaultStyles: {
      backgroundColor: 'var(--primary)',
      textColor: '#ffffff',
      padding: '60px 0',
      containerWidth: 'full',
    },
  },
  {
    id: 'image-gallery',
    name: 'Image Gallery',
    type: 'gallery',
    icon: 'Images',
    description: 'Grid of images',
    defaultContent: {
      title: 'Our Gallery',
      images: JSON.stringify([]),
    },
    defaultStyles: {
      backgroundColor: 'var(--background)',
      textColor: 'var(--text)',
      padding: '60px 0',
      containerWidth: 'contained',
    },
  },
  {
    id: 'text-block',
    name: 'Text Block',
    type: 'text-block',
    icon: 'Type',
    description: 'Rich text content block',
    defaultContent: {
      content: '<p>Add your content here. You can include paragraphs, lists, and more.</p>',
    },
    defaultStyles: {
      backgroundColor: 'var(--background)',
      textColor: 'var(--text)',
      padding: '40px 0',
      containerWidth: 'narrow',
    },
  },
  {
    id: 'contact-form',
    name: 'Contact Form',
    type: 'contact',
    icon: 'Mail',
    description: 'Contact form section',
    defaultContent: {
      title: 'Get In Touch',
      subtitle: 'Fill out the form below and we\'ll get back to you.',
      ctaText: 'Send Message',
    },
    defaultStyles: {
      backgroundColor: 'var(--section-alt-bg)',
      textColor: 'var(--text)',
      padding: '60px 0',
      containerWidth: 'narrow',
    },
  },
  {
    id: 'pricing-table',
    name: 'Pricing Table',
    type: 'pricing',
    icon: 'DollarSign',
    description: 'Pricing plans display',
    defaultContent: {
      title: 'Choose Your Plan',
      plans: JSON.stringify([
        { name: 'Basic', price: '$9/mo', features: ['Feature 1', 'Feature 2'] },
        { name: 'Pro', price: '$29/mo', features: ['All Basic features', 'Feature 3', 'Feature 4'] },
      ]),
    },
    defaultStyles: {
      backgroundColor: 'var(--background)',
      textColor: 'var(--text)',
      padding: '60px 0',
      containerWidth: 'contained',
    },
  },
];

