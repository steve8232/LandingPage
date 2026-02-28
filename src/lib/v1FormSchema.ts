/**
 * Client-safe helpers for template-driven (optional) wizard questions.
 *
 * We keep this separate from v1/specs so the client doesn't need to import the
 * full spec registry.
 */

export type V1FormArchetype =
  | 'saas'
  | 'local-service'
  | 'professional-service'
  | 'product'
  | 'event'
  | 'waitlist'
  | 'lead-magnet';

export type TemplateAnswerValue = string | boolean;
export type TemplateAnswers = Record<string, TemplateAnswerValue>;

export type WizardFieldType = 'text' | 'textarea' | 'select' | 'checkbox';

export interface WizardFieldDef {
  key: string;
  label: string;
  type: WizardFieldType;
  placeholder?: string;
  helpText?: string;
  options?: string[];
}

export function getV1FormArchetype(templateId?: string): V1FormArchetype {
  const id = (templateId || '').toLowerCase();
  if (id.includes('saas')) return 'saas';
  if (id.includes('ecommerce') || id.includes('product')) return 'product';
  if (id.includes('webinar') || id.includes('event')) return 'event';
  if (id.includes('coming-soon') || id.includes('waitlist')) return 'waitlist';
  if (id.includes('ebook') || id.includes('lead-magnet')) return 'lead-magnet';
  if (id.includes('local') || id.includes('services')) return 'local-service';
  if (id.includes('consulting') || id.includes('law') || id.includes('finance')) return 'professional-service';
  return 'professional-service';
}

export function isPhoneRequired(archetype: V1FormArchetype): boolean {
  return archetype === 'local-service';
}

export function getOptionalFields(archetype: V1FormArchetype): WizardFieldDef[] {
  // A small, high-signal set of optional fields. These should influence v1 copy.
  const archetypeFields: WizardFieldDef[] = (() => {
    switch (archetype) {
    case 'saas':
      return [
        { key: 'companyName', label: 'Company / product name', type: 'text', placeholder: 'e.g., Acme Analytics' },
        { key: 'targetCustomer', label: 'Ideal customer', type: 'text', placeholder: 'e.g., Ops leaders at 50–500 person teams' },
        { key: 'topFeatures', label: 'Top features (comma separated)', type: 'text', placeholder: 'e.g., Automations, Dashboards, Approvals' },
        { key: 'integrations', label: 'Integrations (comma separated)', type: 'text', placeholder: 'e.g., Slack, HubSpot, Zapier' },
        { key: 'pricingModel', label: 'Pricing model', type: 'select', options: ['Per seat', 'Usage-based', 'Flat monthly', 'Freemium', 'Enterprise'], helpText: 'Optional — helps shape pricing/CTA language.' },
        { key: 'hasFreeTrial', label: 'Offer a free trial?', type: 'checkbox' },
      ];

    case 'local-service':
      return [
        { key: 'businessName', label: 'Business name', type: 'text', placeholder: 'e.g., Greenleaf Cleaning Co.' },
        { key: 'serviceArea', label: 'Service area', type: 'text', placeholder: 'e.g., Austin + 25 miles' },
        { key: 'hours', label: 'Business hours', type: 'text', placeholder: 'e.g., Mon–Fri 8am–6pm, Sat 9am–1pm' },
        { key: 'licensedInsured', label: 'Licensed & insured?', type: 'checkbox' },
        { key: 'emergencyService', label: 'Emergency / same-day available?', type: 'checkbox' },
        { key: 'yearsInBusiness', label: 'Years in business', type: 'text', placeholder: 'e.g., 12' },
      ];

    case 'product':
      return [
        { key: 'brandName', label: 'Brand name', type: 'text', placeholder: 'e.g., Northwood' },
        { key: 'shipping', label: 'Shipping details', type: 'text', placeholder: 'e.g., Free shipping over $50; ships in 24h' },
        { key: 'returns', label: 'Returns policy', type: 'text', placeholder: 'e.g., 30-day returns, free exchanges' },
        { key: 'guarantee', label: 'Guarantee', type: 'text', placeholder: 'e.g., 2-year warranty' },
        { key: 'promo', label: 'Promo / offer (optional)', type: 'text', placeholder: 'e.g., SAVE10 for 10% off' },
      ];

    case 'event':
      return [
        { key: 'eventName', label: 'Event name', type: 'text', placeholder: 'e.g., The Growth Workshop' },
        { key: 'eventDate', label: 'Date', type: 'text', placeholder: 'e.g., April 12, 2026' },
        { key: 'eventTime', label: 'Time + timezone', type: 'text', placeholder: 'e.g., 1:00pm PT' },
        { key: 'speaker', label: 'Speaker / host', type: 'text', placeholder: 'e.g., Jamie L. (ex-Stripe)' },
        { key: 'agenda', label: 'Agenda highlights', type: 'textarea', placeholder: '3–5 bullets visitors will learn…' },
      ];

    case 'waitlist':
      return [
        { key: 'productName', label: 'Product name', type: 'text', placeholder: 'e.g., Orbit' },
        { key: 'launchTimeline', label: 'Launch timeline', type: 'text', placeholder: 'e.g., Summer 2026' },
        { key: 'earlyAccessIncentive', label: 'Early-access incentive', type: 'text', placeholder: 'e.g., 50% off for the first 3 months' },
        { key: 'waitlistGoal', label: 'Waitlist goal', type: 'text', placeholder: 'e.g., 500 early adopters' },
      ];

    case 'lead-magnet':
      return [
        { key: 'leadMagnetTitle', label: 'Lead magnet title', type: 'text', placeholder: 'e.g., The 2026 CFO Playbook' },
        { key: 'topic', label: 'Topic / audience', type: 'text', placeholder: 'e.g., For B2B SaaS founders preparing for Series A' },
        { key: 'whatYouGet', label: 'What they get (optional)', type: 'textarea', placeholder: 'Key takeaways, templates, checklists…' },
      ];

    default:
      return [];
    }
  })();

  // Common optional toggles that affect section inclusion.
  return [
    ...archetypeFields,
    { key: 'hideTestimonials', label: 'Hide the testimonials section', type: 'checkbox' },
    { key: 'hideImages', label: 'Hide the image section', type: 'checkbox', helpText: 'Useful if you don’t have good images yet.' },
  ];
}
