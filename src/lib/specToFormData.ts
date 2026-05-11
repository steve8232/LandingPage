/**
 * Derives wizard pre-fills (BusinessInfo + ContactInfo) from a v1 TemplateSpec.
 *
 * The 18 niche specs already contain niche-appropriate marketing copy, so we
 * surface that copy in the wizard form on template selection — no manual
 * "fill with dummy data" click required. The user can still edit anything.
 */

import { getV1Spec } from '../../v1/specs';
import type { BusinessInfo, ContactInfo } from '@/types';

type Props = Record<string, unknown>;

function findSection(specSections: { type: string; props: Props }[], type: string): Props | undefined {
  return specSections.find((s) => s.type === type)?.props;
}

function asString(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function firstOf(arr: unknown): string {
  if (!Array.isArray(arr)) return '';
  const v = arr[0];
  return typeof v === 'string' ? v : '';
}

/** Strip a phone string to digits only (matches Step3ContactInfo storage shape). */
function phoneToDigits(v: unknown): string {
  return asString(v).replace(/\D/g, '').slice(0, 10);
}

export interface SpecPrefill {
  business: BusinessInfo;
  contact: ContactInfo;
}

/**
 * Build wizard prefill values from the spec for `templateId`.
 * Returns `null` if the templateId is not a registered v1 spec.
 */
export function buildPrefillFromSpec(templateId: string): SpecPrefill | null {
  const spec = getV1Spec(templateId);
  if (!spec) return null;

  const sections = spec.sections as { type: string; props: Props }[];
  const hero = findSection(sections, 'HeroLeadForm') ?? findSection(sections, 'HeroSplit');
  const footer = findSection(sections, 'Footer');
  const testimonials = findSection(sections, 'TestimonialsCards');
  const guarantee = findSection(sections, 'GuaranteeBar');
  const differentiator = findSection(sections, 'DifferentiatorBlock');

  const brandName = asString(footer?.brandName);
  const niche = asString(spec.niche);
  // "Aqua Pro Plumbing — plumber" reads cleanly to the user and matches the
  // tone of the existing dummy preset copy.
  const productService = brandName && niche
    ? `${brandName} — ${niche.replace(/-/g, ' ')}`
    : brandName || asString(spec.metadata?.name);

  const offer = firstOf(hero?.bullets) || asString(hero?.eyebrow);
  // GuaranteeBar headline is the closest spec analogue to a pricing/value prop.
  const pricing = asString(guarantee?.headline) || asString(guarantee?.text);
  const cta = asString(hero?.ctaLabel);
  const uniqueValue = asString(hero?.subheadline) || asString(differentiator?.subheading);

  let customerLove = '';
  const tList = (testimonials?.testimonials as unknown[]) || [];
  if (Array.isArray(tList) && tList.length > 0) {
    const first = tList[0] as Props;
    customerLove = asString(first?.quote);
  }
  if (!customerLove) {
    customerLove = asString(footer?.tagline);
  }

  const business: BusinessInfo = {
    productService,
    offer,
    pricing,
    cta,
    uniqueValue,
    customerLove,
    images: [],
    templateAnswers: {
      hideTestimonials: false,
      hideImages: false,
    },
  };

  const contact: ContactInfo = {
    email: asString(footer?.email),
    phone: phoneToDigits(footer?.phone),
  };

  return { business, contact };
}
