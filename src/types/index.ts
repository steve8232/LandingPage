import { Template, TemplateCategory } from '@/lib/templates';

export interface DesignInput {
  option: 'url' | 'description';
  url?: string;
  description?: string;
  designAnalysis?: string;
}

// Re-export template types for convenience
export type { Template, TemplateCategory } from '@/lib/templates';

export interface BusinessInfo {
  productService: string;
  offer: string;
  pricing: string;
  cta: string;
  uniqueValue: string;
  customerLove: string;
  images: string[]; // base64 encoded images
  logo?: string; // base64 encoded logo image
}

export interface ContactInfo {
  email: string;
  phone: string;
}

export interface FormData {
  selectedTemplate?: Template;
  customizeWithUrl?: boolean;
  design: DesignInput;
  business: BusinessInfo;
  contact: ContactInfo;
}

export interface GeneratedContent {
  headline: string;
  subheadline: string;
  offerDescription: string;
  sellingPoints: string[];
  testimonials: Array<{
    quote: string;
    name: string;
    title: string;
  }>;
}

export interface GeneratedLandingPage {
  html: string;
  css: string;
  preview: string;
}

