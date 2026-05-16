/**
 * v1 Thank-You Composer
 *
 * Renders the secondary /thank-you page for a v1 project. Shares the
 * landing page's theme so the visual identity is inherited automatically
 * — we reuse the same tokens.css and theme CSS via buildV1Document.
 *
 * Pipeline:
 *   1. Load spec (same as composeV1Template)
 *   2. Resolve copy: overrides.thankYou → niche/category defaults → generic
 *   3. Render ThankYouCard
 *   4. Wrap with buildV1Document, applying a thank-you specific page title
 *
 * No assets, no form, no attribution — this is a single-card page.
 */

import { getV1Spec } from '../specs/index';
import { validateSpec } from '../specs/schema';
import { renderThankYouCard } from '../sections/ThankYouCard';
import {
  buildV1Document,
  loadTokensCss,
  loadThemeCss,
  V1ContentOverrides,
} from './composeV1Template';
import { resolveThankYouDefaults } from './thankYouDefaults';

export interface ComposeV1ThankYouResult {
  html: string;
  templateId: string;
}

export function composeV1ThankYou(
  templateId: string,
  overrides?: V1ContentOverrides
): ComposeV1ThankYouResult {
  // 1. Load + validate spec (so theme + niche/category resolve correctly)
  const spec = getV1Spec(templateId);
  if (!spec) {
    throw new Error(`[composeV1ThankYou] Unknown templateId: ${templateId}`);
  }
  const validation = validateSpec(spec);
  if (!validation.valid) {
    throw new Error(
      `[composeV1ThankYou] Invalid spec for ${templateId}: ${validation.errors.join(', ')}`
    );
  }

  // 2. Resolve thank-you copy with the standard cascade.
  const defaults = resolveThankYouDefaults(spec.niche, spec.category);
  const ty = overrides?.thankYou || {};
  const headline = ty.headline?.trim() || defaults.headline;
  const message = ty.message?.trim() || defaults.message;
  const primaryCtaLabel = ty.primaryCtaLabel?.trim() || defaults.primaryCtaLabel;
  const primaryCtaHref = ty.primaryCtaHref?.trim() || defaults.primaryCtaHref;

  // 3. Render the single card section.
  const sectionsHtml = renderThankYouCard({
    headline,
    message,
    primaryCtaLabel,
    primaryCtaHref,
  });

  // 4. Wrap in the standard v1 document (inlines tokens + theme CSS).
  // Override the page title via meta so the browser tab reads "Thank you".
  const tokensCss = loadTokensCss();
  const themeCss = loadThemeCss(spec.theme);

  const baseTitle = overrides?.meta?.pageTitle?.trim() || spec.metadata.name;
  const thankYouMeta = {
    ...(overrides?.meta || {}),
    pageTitle: `Thank you — ${baseTitle}`,
    // metaDescription falls through from overrides.meta if present; otherwise
    // buildV1Document will use spec.metadata.description, which is fine for
    // this page (it's a confirmation, not an SEO entry point).
  };

  const html = buildV1Document(
    spec,
    tokensCss,
    themeCss,
    sectionsHtml,
    '', // no attribution footer on the thank-you page
    thankYouMeta
  );

  return { html, templateId };
}
