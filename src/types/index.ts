import { Template, TemplateCategory } from '@/lib/templates';
import type { TemplateAnswers } from '@/lib/v1FormSchema';
import type { V1ContentOverrides } from '../../v1/composer/composeV1Template';

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
  /**
   * Promoted from `templateAnswers.businessName`. The legal/display business
   * name that appears in the wordmark, page title, and CallRail Company
   * field. Required by Step 2 for the local-service archetype.
   */
  brandName?: string;
  /**
   * Physical street address. Required by Step 2 for the local-service
   * archetype. Stored in meta.businessAddress (assembled with city/state/zip)
   * for research, CallRail, and billing regardless of `displayAddress`.
   */
  streetAddress?: string;
  /** City portion of the business address. Required for local-service. */
  city?: string;
  /** State portion of the business address (two-letter or full). */
  state?: string;
  /** ZIP / postal code of the business address. Optional. */
  zip?: string;
  /**
   * Free-form service-area text the user typed in Step 2 — comma-separated
   * neighborhoods/cities or a single blurb like "Within 30 miles of Austin".
   * Used as the seed for AI neighborhood expansion and as a chip fallback
   * when expansion fails. Required for local-service.
   */
  serviceAreaText?: string;
  /**
   * When false, the street address is omitted from the rendered Footer (and
   * any other section whose props declare an `address` field) on the live
   * page. The address is still persisted in meta.businessAddress for
   * research/billing. Defaults to true.
   */
  displayAddress?: boolean;
  /** Optional template/category-specific answers (kept flexible on purpose). */
  templateAnswers?: TemplateAnswers;
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

  /** Present when the generated output was produced by the v1 composer. */
  v1?: {
    /** Stable (client-generated) id for this generated result; used for local persistence. */
    resultId?: string;
    templateId: string;
    overrides?: V1ContentOverrides;
    /** Optional helper data for UI editors (does not affect composition). */
    sectionTypes?: string[];
    /** Supabase project id when this page is bound to a saved cloud project. */
    projectId?: string;
  };
}

