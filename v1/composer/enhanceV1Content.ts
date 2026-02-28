/**
 * v1 AI Enhancement Pass (Polish Step)
 *
 * Takes already-generated V1ContentOverrides and refines the copy for higher
 * conversion. Also generates additional metadata: SEO title/description,
 * tagline, image alt texts, and personalized form-field placeholders.
 *
 * If the enhancement fails for any reason, the original overrides are
 * returned unchanged — the pipeline never breaks.
 */

import { TemplateSpec } from '../specs/schema';
import { V1ContentOverrides, V1MetaOverrides } from './composeV1Template';
import { V1FormInput } from './generateV1Content';
import { AVAILABLE_BADGES } from '../sections/SocialProofLogos';

// ── Types ──────────────────────────────────────────────────────────────────────

interface EnhancementResult {
  /** Polished section overrides (same shape as input) */
  sections?: (Record<string, unknown> | null)[];
  /** SEO and branding metadata */
  meta: V1MetaOverrides;
  /** Personalized form-field placeholders */
  formOverrides: Record<string, { placeholder?: string; label?: string }>;
}

interface AIEnhanceResponse {
  // Hero polish
  heroHeadline?: string;
  heroSubheadline?: string;
  heroCta?: string;
  heroTrustBadge?: string;
  // Service polish
  services?: Array<{ title: string; description: string; benefit?: string }>;
  // Testimonial polish
  testimonials?: Array<{ quote: string; name: string; title: string; highlight?: string; rating?: number }>;
  // Social proof polish
  socialProofLogos?: string[];
  // ImagePair polish
  imagePairCaption1?: string;
  imagePairCaption2?: string;
  // Final CTA polish
  ctaHeading?: string;
  ctaSubheading?: string;
  ctaButtonLabel?: string;
  ctaUrgency?: string;
  ctaGuarantee?: string;
  // Metadata
  pageTitle: string;
  metaDescription: string;
  tagline: string;
  imageAltTexts?: Record<string, string>;
  formFields?: Record<string, { placeholder?: string; label?: string }>;
}

function formatTemplateAnswers(answers?: Record<string, string | boolean>): string {
  if (!answers || typeof answers !== 'object') return 'None provided.';
  const lines = Object.entries(answers)
    .filter(([_, v]) => (typeof v === 'string' ? v.trim().length > 0 : v === true))
    .map(([k, v]) => `- ${k}: ${typeof v === 'boolean' ? String(v) : v}`);
  return lines.length ? lines.join('\n') : 'None provided.';
}

// ── Prompt ──────────────────────────────────────────────────────────────────────

function buildEnhancePrompt(
  input: V1FormInput,
  spec: TemplateSpec,
  currentOverrides: V1ContentOverrides
): string {
  const currentSections = currentOverrides.sections || [];

  // Extract current content from all section types
  const heroSection = currentSections.find((s) => s && 'headline' in s) as Record<string, unknown> | undefined;
  const serviceSection = currentSections.find((s) => s && 'services' in s) as Record<string, unknown> | undefined;
  const testimonialSection = currentSections.find((s) => s && 'testimonials' in s) as Record<string, unknown> | undefined;
  const ctaSection = currentSections.find((s) => s && 'ctaLabel' in s && 'heading' in s) as Record<string, unknown> | undefined;
  const socialSection = currentSections.find((s) => s && 'logos' in s) as Record<string, unknown> | undefined;
  const imageSection = currentSections.find((s) => s && 'caption1' in s || s && 'imagePairHeading' in s) as Record<string, unknown> | undefined;

  // Build services summary for the prompt
  const currentServices = (serviceSection?.services as Array<{ title: string; description: string; benefit?: string }>) || [];
  const servicesText = currentServices.map((s, i) => `  ${i + 1}. "${s.title}": "${s.description}"${s.benefit ? ` → "${s.benefit}"` : ''}`).join('\n');

  // Build testimonials summary
  const currentTestimonials = (testimonialSection?.testimonials as Array<{ quote: string; name: string; title: string }>) || [];
  const testimonialsText = currentTestimonials.map((t, i) => `  ${i + 1}. ${t.name} (${t.title}): "${t.quote}"`).join('\n');

  // Build current social proof logos
  const currentLogos = (socialSection?.logos as string[]) || [];

  const formFieldNames = spec.form.map((f) => f.name).join(', ');
  const assetKeys = Object.keys(spec.assets).join(', ');

  return `You are a conversion rate optimization specialist reviewing a landing page before it goes live. Your job is to make every word count harder.

BUSINESS:
- Product/Service: ${input.business.productService}
- Offer: ${input.business.offer}
- Pricing: ${input.business.pricing}
- CTA intent: ${input.business.cta}
- Unique value: ${input.business.uniqueValue}
- Why customers love them: ${input.business.customerLove}

OPTIONAL TEMPLATE DETAILS (may be empty):
${formatTemplateAnswers(input.business.templateAnswers)}

TEMPLATE: ${spec.metadata.name} (${spec.category}, goal: ${spec.goal})

CURRENT PAGE COPY TO POLISH:

HERO:
- Headline: "${heroSection?.headline || ''}"
- Subheadline: "${heroSection?.subheadline || ''}"
- CTA: "${heroSection?.ctaLabel || ''}"
- Trust badge: "${heroSection?.trustBadge || ''}"

SERVICES:
${servicesText || '  (none)'}

TESTIMONIALS:
${testimonialsText || '  (none)'}

SOCIAL PROOF BADGES: ${currentLogos.join(', ') || '(none)'}

IMAGE CAPTIONS:
- Caption 1: "${imageSection?.caption1 || ''}"
- Caption 2: "${imageSection?.caption2 || ''}"

FINAL CTA:
- Heading: "${ctaSection?.heading || ''}"
- Subheading: "${ctaSection?.subheading || ''}"
- Button: "${ctaSection?.ctaLabel || ''}"
- Urgency: "${ctaSection?.urgency || ''}"
- Guarantee: "${ctaSection?.guarantee || ''}"

FORM FIELDS: ${formFieldNames}
IMAGE ASSET KEYS: ${assetKeys}

Generate JSON with these EXACT fields:
{
  "heroHeadline": "Polished headline — punchier, more emotional, max 10 words",
  "heroSubheadline": "Polished subheadline — sharper rhythm, stronger urgency, max 25 words",
  "heroCta": "Polished CTA — max 5 words, irresistible action verb",
  "heroTrustBadge": "Polished trust badge — more specific and credible",
  "services": [${currentServices.map(() => '{"title": "Tighter title", "description": "Cut filler, lead with verb or benefit, max 15 words", "benefit": "Crisper outcome statement"}').join(', ')}],
  "testimonials": [${currentTestimonials.map(() => '{"quote": "More vivid and specific — add sensory detail or a number, 15-25 words", "name": "First L.", "title": "Role", "highlight": "Key phrase to bold", "rating": 5}').join(', ')}],
  "socialProofLogos": ["Pick 4 from: ${AVAILABLE_BADGES.join(', ')}"],
  "imagePairCaption1": "More descriptive caption for image 1",
  "imagePairCaption2": "More descriptive caption for image 2",
  "ctaHeading": "Polished final CTA heading — max 8 words",
  "ctaSubheading": "Polished final CTA supporting text — max 20 words",
  "ctaButtonLabel": "Polished CTA button — max 4 words",
  "ctaUrgency": "Stronger urgency — more specific and time-bound",
  "ctaGuarantee": "Stronger risk reversal — more specific and reassuring",
  "pageTitle": "SEO-optimized page title, 50-60 chars, includes business name/service",
  "metaDescription": "SEO meta description, 150-160 chars, compelling with CTA",
  "tagline": "Memorable brand tagline/slogan, 3-8 words",
  "imageAltTexts": { ${assetKeys.split(', ').map((k) => `"${k}": "Descriptive alt text for this image"`).join(', ')} },
  "formFields": { ${spec.form.map((f) => `"${f.name}": {"placeholder": "Personalized placeholder for ${f.name}", "label": "Friendly label"}`).join(', ')} }
}

POLISH RULES:
1. Hero: Sharpen rhythm, increase emotional punch, max 10 words headline
2. Services: Tighten each description — cut filler words, lead with verb or benefit
3. Testimonials: Make each quote more vivid and specific — add sensory detail or a number
4. Social proof: Pick badge IDs from the available list that are MOST credible for this business type
5. CTA: Increase urgency, strengthen risk reversal language
6. Keep the same meaning — just make every word work harder
7. Page title MUST include the core service/product
8. Alt texts should describe what the image would show for this specific business
9. Form placeholders should feel personal and reduce friction`;
}

// ── OpenAI call ────────────────────────────────────────────────────────────────

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function callEnhanceAI(prompt: string): Promise<AIEnhanceResponse> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a conversion optimization specialist. Always respond with valid JSON only.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 3000,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(`OpenAI API error: ${data.error.message || JSON.stringify(data.error)}`);
  }
  const raw = data.choices?.[0]?.message?.content || '{}';
  return JSON.parse(raw) as AIEnhanceResponse;
}

// ── Map AI response → EnhancementResult ────────────────────────────────────────

function mapEnhancement(
  ai: AIEnhanceResponse,
  spec: TemplateSpec,
  originalOverrides: V1ContentOverrides
): EnhancementResult {
  const sections = (originalOverrides.sections || []).map((original, i) => {
    if (!original) return null;
    const entry = spec.sections[i];
    if (!entry) return original;

    switch (entry.type) {
      case 'HeroSplit':
        return {
          ...original,
          ...(ai.heroHeadline && { headline: ai.heroHeadline }),
          ...(ai.heroSubheadline && { subheadline: ai.heroSubheadline }),
          ...(ai.heroCta && { ctaLabel: ai.heroCta }),
          ...(ai.heroTrustBadge && { trustBadge: ai.heroTrustBadge }),
        };

      case 'SocialProofLogos':
        return {
          ...original,
          ...(ai.socialProofLogos?.length && { logos: ai.socialProofLogos }),
        };

      case 'ServiceList': {
        const origServices = (original as Record<string, unknown>).services as
          Array<Record<string, unknown>> | undefined;
        let polishedServices = origServices;
        if (ai.services?.length && origServices?.length) {
          polishedServices = origServices.map((orig, si) => {
            const polished = ai.services![si];
            if (!polished) return orig;
            return {
              ...orig,
              ...(polished.title && { title: polished.title }),
              ...(polished.description && { description: polished.description }),
              ...(polished.benefit && { benefit: polished.benefit }),
            };
          });
        }
        return {
          ...original,
          ...(polishedServices && { services: polishedServices }),
        };
      }

      case 'ImagePair':
        return {
          ...original,
          ...(ai.imagePairCaption1 && { caption1: ai.imagePairCaption1 }),
          ...(ai.imagePairCaption2 && { caption2: ai.imagePairCaption2 }),
        };

      case 'TestimonialsCards': {
        const origTestimonials = (original as Record<string, unknown>).testimonials as
          Array<Record<string, unknown>> | undefined;
        let polishedTestimonials = origTestimonials;
        if (ai.testimonials?.length && origTestimonials?.length) {
          polishedTestimonials = origTestimonials.map((orig, ti) => {
            const polished = ai.testimonials![ti];
            if (!polished) return orig;
            return {
              ...orig,
              ...(polished.quote && { quote: polished.quote }),
              ...(polished.name && { name: polished.name }),
              ...(polished.title && { title: polished.title }),
              ...(polished.highlight && { highlight: polished.highlight }),
              ...(polished.rating && { rating: Math.min(5, Math.max(1, polished.rating)) }),
            };
          });
        }
        return {
          ...original,
          ...(polishedTestimonials && { testimonials: polishedTestimonials }),
        };
      }

      case 'FinalCTA':
        return {
          ...original,
          ...(ai.ctaHeading && { heading: ai.ctaHeading }),
          ...(ai.ctaSubheading && { subheading: ai.ctaSubheading }),
          ...(ai.ctaButtonLabel && { ctaLabel: ai.ctaButtonLabel }),
          ...(ai.ctaUrgency && { urgency: ai.ctaUrgency }),
          ...(ai.ctaGuarantee && { guarantee: ai.ctaGuarantee }),
        };

      default:
        return original;
    }
  });

  return {
    sections,
    meta: {
      pageTitle: ai.pageTitle || undefined,
      metaDescription: ai.metaDescription || undefined,
      tagline: ai.tagline || undefined,
      imageAltTexts: ai.imageAltTexts || undefined,
    },
    formOverrides: ai.formFields || {},
  };
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Enhancement pass: polishes existing overrides and generates metadata.
 * If it fails, returns the original overrides unchanged.
 */
export async function enhanceV1Content(
  input: V1FormInput,
  spec: TemplateSpec,
  originalOverrides: V1ContentOverrides
): Promise<V1ContentOverrides> {
  try {
    const prompt = buildEnhancePrompt(input, spec, originalOverrides);
    console.log('[v1 enhance] Calling OpenAI for content polish...');
    const ai = await callEnhanceAI(prompt);
    console.log('[v1 enhance] Polish received, merging into overrides...');

    const enhancement = mapEnhancement(ai, spec, originalOverrides);

    // Merge enhanced sections, meta, and formOverrides into the original overrides
    return {
      ...originalOverrides,
      sections: enhancement.sections || originalOverrides.sections,
      meta: enhancement.meta,
      formOverrides: Object.keys(enhancement.formOverrides).length > 0
        ? enhancement.formOverrides
        : undefined,
    };
  } catch (err) {
    console.error('[v1 enhance] Enhancement failed, using original overrides:', err);
    return originalOverrides;
  }
}

