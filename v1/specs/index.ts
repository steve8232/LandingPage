/**
 * v1 Spec Registry
 *
 * Central index of all v1 template specs.  The composer and adapter use this
 * to look up specs by templateId.
 *
 * To add a new spec:
 *   1. Create a file in /v1/specs/ that default-exports a TemplateSpec
 *   2. Import and register it here
 */

import { TemplateSpec } from './schema';
import v1LeadgenLocal01 from './v1-leadgen-local-01';
import v1SaasModernLight from './v1-saas-modern-light';
import v1SaasDarkPurple from './v1-saas-dark-purple';
import v1EcommerceCleanWarm from './v1-ecommerce-clean-warm';
import v1EcommerceBoldRed from './v1-ecommerce-bold-red';
import v1LocalServicesTrust from './v1-local-services-trust';
import v1EcoFriendlyServices from './v1-eco-friendly-services';
import v1ProfessionalConsulting from './v1-professional-consulting';
import v1LawFinance from './v1-law-finance';
import v1WebinarSignup from './v1-webinar-signup';
import v1EbookDownload from './v1-ebook-download';
import v1ComingSoonMinimalDark from './v1-coming-soon-minimal-dark';
import v1ComingSoonVibrantLight from './v1-coming-soon-vibrant-light';

/** All registered v1 specs, keyed by templateId. */
export const v1Specs: Record<string, TemplateSpec> = {
  [v1LeadgenLocal01.templateId]: v1LeadgenLocal01,
  [v1SaasModernLight.templateId]: v1SaasModernLight,
  [v1SaasDarkPurple.templateId]: v1SaasDarkPurple,
  [v1EcommerceCleanWarm.templateId]: v1EcommerceCleanWarm,
  [v1EcommerceBoldRed.templateId]: v1EcommerceBoldRed,
  [v1LocalServicesTrust.templateId]: v1LocalServicesTrust,
  [v1EcoFriendlyServices.templateId]: v1EcoFriendlyServices,
  [v1ProfessionalConsulting.templateId]: v1ProfessionalConsulting,
  [v1LawFinance.templateId]: v1LawFinance,
  [v1WebinarSignup.templateId]: v1WebinarSignup,
  [v1EbookDownload.templateId]: v1EbookDownload,
  [v1ComingSoonMinimalDark.templateId]: v1ComingSoonMinimalDark,
  [v1ComingSoonVibrantLight.templateId]: v1ComingSoonVibrantLight,
};

/** Check if a templateId belongs to the v1 system. */
export function isV1Template(templateId: string): boolean {
  return templateId in v1Specs;
}

/** Get a v1 spec by templateId, or undefined if not found. */
export function getV1Spec(templateId: string): TemplateSpec | undefined {
  return v1Specs[templateId];
}

/** Get all registered v1 templateIds. */
export function getAllV1TemplateIds(): string[] {
  return Object.keys(v1Specs);
}

