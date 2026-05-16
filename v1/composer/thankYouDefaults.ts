/**
 * Niche-aware defaults for the secondary /thank-you page.
 *
 * Resolution order in composeV1ThankYou:
 *   overrides.thankYou.* → niche default (matched by spec.niche or category)
 *                       → GENERIC_THANKYOU fallback
 *
 * Keeping the table here avoids polluting TemplateSpec with per-page copy and
 * lets the editor copy be edited independently of the landing-page spec.
 */

import type { V1Category } from '../specs/schema';

export interface ThankYouDefaults {
  headline: string;
  message: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
}

export const GENERIC_THANKYOU: ThankYouDefaults = {
  headline: 'Thanks — we got your request',
  message:
    'We’ll review the details and reach out shortly. Keep an eye on your phone and inbox.',
  primaryCtaLabel: 'Back to home',
  primaryCtaHref: '/',
};

/** Defaults keyed by spec.niche (slug). Add new niches here as templates land. */
const NICHE_DEFAULTS: Record<string, ThankYouDefaults> = {
  plumber: {
    headline: 'Thanks — your service request is in',
    message:
      'A licensed plumber will call you shortly to confirm the issue and schedule a visit. If it’s urgent, call us now.',
    primaryCtaLabel: 'Back to home',
    primaryCtaHref: '/',
  },
  'lawn-care': {
    headline: 'Thanks — your free estimate is on the way',
    message:
      'We’ll review your yard details and call within one business day with a quote tailored to your property.',
    primaryCtaLabel: 'Back to home',
    primaryCtaHref: '/',
  },
  'med-spa': {
    headline: 'Thanks — your consultation request is in',
    message:
      'Our team will reach out to confirm your preferred date and walk you through next steps.',
    primaryCtaLabel: 'Back to home',
    primaryCtaHref: '/',
  },
  hvac: {
    headline: 'Thanks — your service request is in',
    message:
      'A technician will call shortly to confirm the issue and schedule a visit. For emergencies, please call us directly.',
    primaryCtaLabel: 'Back to home',
    primaryCtaHref: '/',
  },
  roofing: {
    headline: 'Thanks — your free roof inspection is booked',
    message:
      'We’ll be in touch shortly to confirm a time that works for you. Inspections typically take 30–45 minutes.',
    primaryCtaLabel: 'Back to home',
    primaryCtaHref: '/',
  },
};

/** Defaults keyed by spec.category for templates without a specific niche. */
const CATEGORY_DEFAULTS: Partial<Record<V1Category, ThankYouDefaults>> = {
  leadgen: GENERIC_THANKYOU,
  booking: {
    headline: 'Thanks — your booking request is in',
    message:
      'We’ll confirm your appointment shortly. Watch your inbox for the confirmation email.',
    primaryCtaLabel: 'Back to home',
    primaryCtaHref: '/',
  },
  waitlist: {
    headline: 'You’re on the list',
    message:
      'We’ll email you the moment your spot opens up. Thanks for your interest!',
    primaryCtaLabel: 'Back to home',
    primaryCtaHref: '/',
  },
  saas: {
    headline: 'Thanks — check your inbox',
    message:
      'We’ve sent you the next steps. If you don’t see the email within a few minutes, check your spam folder.',
    primaryCtaLabel: 'Back to home',
    primaryCtaHref: '/',
  },
  event: {
    headline: 'You’re registered',
    message:
      'We’ll send the event details to your inbox shortly. Mark your calendar!',
    primaryCtaLabel: 'Back to home',
    primaryCtaHref: '/',
  },
  product: {
    headline: 'Thanks for your interest',
    message:
      'We’ll follow up shortly with everything you need to know about getting started.',
    primaryCtaLabel: 'Back to home',
    primaryCtaHref: '/',
  },
};

/**
 * Pick the best default copy for a (niche, category) pair.
 * Falls back through niche → category → generic.
 */
export function resolveThankYouDefaults(
  niche: string | undefined,
  category: V1Category
): ThankYouDefaults {
  if (niche && NICHE_DEFAULTS[niche]) return NICHE_DEFAULTS[niche];
  return CATEGORY_DEFAULTS[category] || GENERIC_THANKYOU;
}
