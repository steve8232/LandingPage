/**
 * v1 AI Content Generator
 *
 * Takes user form data (business info, contact info) and a v1 TemplateSpec,
 * calls OpenAI to generate persuasive marketing copy tailored to each section,
 * and returns V1ContentOverrides ready for the composer.
 */

import { TemplateSpec, V1SectionEntry } from '../specs/schema';
import { V1ContentOverrides } from './composeV1Template';
import { AVAILABLE_BADGES } from '../sections/SocialProofLogos';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface V1FormInput {
  business: {
    productService: string;
    offer: string;
    pricing: string;
    cta: string;
    uniqueValue: string;
    customerLove: string;
    images: string[];

    /**
     * Wizard-captured, typed business facts. These are the ground-truth values
     * the AI must NOT invent — they appear verbatim in brand wordmarks, contact
     * blocks, service-area chips, and license/insurance lines.
     */
    brandName?: string;
    address?: string;
    hours?: string;
    serviceAreas?: string[];
    licenseLine?: string;

    /** Optional template/category-specific answers coming from the wizard. */
    templateAnswers?: Record<string, string | boolean>;
  };
  contact: {
    email: string;
    phone: string;
  };
}

function formatTemplateAnswers(answers?: Record<string, string | boolean>): string {
  if (!answers || typeof answers !== 'object') return 'None provided.';
  const lines = Object.entries(answers)
    .filter(([_, v]) => (typeof v === 'string' ? v.trim().length > 0 : v === true))
    .map(([k, v]) => `- ${k}: ${typeof v === 'boolean' ? String(v) : v}`);
  return lines.length ? lines.join('\n') : 'None provided.';
}

interface AIGeneratedContent {
  heroHeadline: string;
  heroSubheadline: string;
  heroCta: string;
  heroTrustBadge?: string;
  socialProofHeading: string;
  socialProofLogos?: string[];
  servicesHeading: string;
  servicesSubheading?: string;
  services: Array<{ title: string; description: string; benefit?: string; icon?: string }>;
  imagePairHeading: string;
  imagePairSubheading?: string;
  imagePairCaption1?: string;
  imagePairCaption2?: string;
  testimonialsHeading: string;
  testimonialsSubheading?: string;
  testimonials: Array<{ quote: string; name: string; title: string; highlight?: string; rating?: number }>;
  ctaHeading: string;
  ctaSubheading: string;
  ctaButtonLabel: string;
  ctaUrgency?: string;
  ctaGuarantee?: string;
  imageSearchTerms?: {
    hero?: string;
    image1?: string;
    image2?: string;
    serviceIcon?: string;
  };
}

/**
 * Second-pass response covering the 12 niche-spec sections that the
 * marketing-spine pass leaves untouched. Every field is optional: any field
 * left blank by the model causes the corresponding section override slot to
 * be either dropped (so wizard-only fields still render) or omitted entirely
 * via `_omit: true` (for sections with no wizard fallback).
 */
interface AISupportingContent {
  // AnnouncementBar
  announcementBarText?: string;
  announcementBarHours?: string;
  // HeroLeadForm extras
  heroEyebrow?: string;
  heroBullets?: string[];
  heroProofPoints?: string[];
  heroFormHeading?: string;
  heroFormSubheading?: string;
  // TrustStrip
  trustStripItems?: Array<{
    label: string;
    detail?: string;
    icon?: 'star' | 'shield' | 'check' | 'clock' | 'phone' | 'badge' | 'medal';
  }>;
  // DifferentiatorBlock
  differentiatorEyebrow?: string;
  differentiatorHeading?: string;
  differentiatorSubheading?: string;
  differentiatorItems?: Array<{ title: string; description: string }>;
  // ChecklistSection
  checklistEyebrow?: string;
  checklistHeading?: string;
  checklistSubheading?: string;
  checklistItems?: string[];
  // MidPageCTA
  midCtaEyebrow?: string;
  midCtaHeadline?: string;
  midCtaSubheadline?: string;
  midCtaLabel?: string;
  midCtaSecondaryText?: string;
  // PhotoGalleryStrip
  galleryHeading?: string;
  gallerySubheading?: string;
  galleryCaptions?: string[];
  // ProcessSteps
  processEyebrow?: string;
  processHeading?: string;
  processSubheading?: string;
  processSteps?: Array<{ title: string; description: string }>;
  // FAQAccordion
  faqEyebrow?: string;
  faqHeading?: string;
  faqSubheading?: string;
  faqItems?: Array<{ question: string; answer: string }>;
  // ServiceAreas
  serviceAreasEyebrow?: string;
  serviceAreasHeading?: string;
  serviceAreasSubheading?: string;
  serviceAreasFootnote?: string;
  // GuaranteeBar
  guaranteeEyebrow?: string;
  guaranteeHeadline?: string;
  guaranteeDescription?: string;
  // FinalCTA extras
  finalCtaNextSteps?: string[];
  finalCtaPrivacyNote?: string;
  // Footer
  footerTagline?: string;
}

// ── Prompt builder ─────────────────────────────────────────────────────────────

function buildPrompt(input: V1FormInput, spec: TemplateSpec): string {
  const serviceCount = getServiceCount(spec);
  const testimonialCount = getTestimonialCount(spec);

  const categoryContext: Record<string, string> = {
    leadgen: 'trust-building, urgency-driven, local credibility',
    saas: 'innovation, ease-of-use, ROI-focused',
    product: 'desire, exclusivity, value-for-money',
    waitlist: 'anticipation, FOMO, early-adopter benefits',
    event: 'excitement, authority, limited-availability',
    booking: 'convenience, professionalism, availability',
  };

  const tone = categoryContext[spec.category] || 'professional, persuasive';
  const iconChoices = 'wrench, tool, shield, search';
  const badgeList = AVAILABLE_BADGES.join(', ');

  return `You are an elite direct-response copywriter who specializes in high-converting landing pages. You write with the specificity of David Ogilvy and the urgency of Gary Halbert.

BUSINESS BRIEF:
- What they sell: ${input.business.productService}
- Their offer: ${input.business.offer}
- Pricing: ${input.business.pricing}
- Desired CTA: ${input.business.cta}
- What makes them different: ${input.business.uniqueValue}
- Why customers love them: ${input.business.customerLove}
- Contact: ${input.contact.email}, ${input.contact.phone}

OPTIONAL TEMPLATE DETAILS (may be empty):
${formatTemplateAnswers(input.business.templateAnswers)}

LANDING PAGE BLUEPRINT:
- Template: ${spec.metadata.name}
- Category: ${spec.category}
- Conversion Goal: ${spec.goal}
- Tone: ${tone}${spec.niche ? `\n- Niche: ${spec.niche} — copy should sound like it was written for this exact business type, with niche-specific terms, common pains, and reassurances.` : ''}

SECTIONS TO FILL (in order of appearance):

1. HERO — First thing visitors see. Must stop the scroll.
2. SOCIAL PROOF — Trust signals below the hero. Must establish credibility instantly.
3. SERVICES/FEATURES (${serviceCount} items) — What the business offers. Each must sell a specific outcome.
4. IMAGE GALLERY — Visual showcase. Needs descriptive context.
5. TESTIMONIALS (${testimonialCount} cards) — Social proof stories. Must feel real and specific.
6. FINAL CTA — Last chance to convert. Must create urgency + remove risk.

COPYWRITING RULES:
- Lead with outcomes, not features ("Save 40% on energy bills" not "Energy-efficient system")
- Every testimonial must reference a SPECIFIC benefit of "${input.business.productService}"
- Use the customer's language from "${input.business.customerLove}"
- Include numbers wherever possible (percentages, time saved, money saved)
- Match the ${tone} voice throughout
- Service descriptions: max 15 words, benefit-first
- Testimonials: 15-30 words, must feel like a real person wrote it
- All CTA copy must use strong action verbs
- For socialProofLogos, pick 4 IDs from this list that are MOST relevant to the business type: ${badgeList}
- For imageSearchTerms, provide specific stock-photo search queries tailored to this exact business — NOT generic placeholders. Example for a plumber: "professional plumber repairing kitchen sink modern home"

OBJECTION HANDLING — weave these into the copy:
- Address the #1 reason someone would NOT buy (price, trust, timing, effort)
- Preemptively answer "Why should I choose you over competitors?"
- Include at least one "even if…" or "without…" qualifier in the hero or services

EMOTIONAL TRIGGERS — use where appropriate:
- Fear of missing out (limited availability, seasonal pricing)
- Social proof anchoring (specific numbers: "500+ projects", "12 years")
- Pain agitation (remind them what happens if they do nothing)
- Transformation language (before → after framing)

Generate JSON with these EXACT fields:
{
  "heroHeadline": "Power headline, max 10 words, lead with biggest benefit",
  "heroSubheadline": "Supporting value prop, max 30 words, include urgency trigger and an objection-handling qualifier",
  "heroCta": "CTA button text, max 5 words, action verb + value",
  "heroTrustBadge": "Micro-trust line under CTA, e.g. '✓ 500+ happy customers' or '✓ No credit card required'",
  "socialProofHeading": "Social proof bar heading, max 8 words",
  "socialProofLogos": ["badge-id-1", "badge-id-2", "badge-id-3", "badge-id-4"],
  "servicesHeading": "Services/features section heading, max 8 words",
  "servicesSubheading": "Intro paragraph for services section, max 25 words, set context and handle objection",
  "services": [${Array(serviceCount).fill(`{"title": "...", "description": "max 15 words, benefit-first, include transformation language", "benefit": "Single outcome statement with specific number, e.g. Save 40% on bills", "icon": "one of: ${iconChoices}"}`).join(', ')}],
  "imagePairHeading": "Gallery/showcase heading, max 6 words",
  "imagePairSubheading": "Descriptive line below heading, max 20 words",
  "imagePairCaption1": "Caption for first image, max 10 words",
  "imagePairCaption2": "Caption for second image, max 10 words",
  "testimonialsHeading": "Testimonials section heading, max 8 words",
  "testimonialsSubheading": "Intro line, e.g. 'Join 500+ satisfied customers', max 15 words",
  "testimonials": [${Array(testimonialCount).fill('{"quote": "Specific 15-25 word testimonial referencing a concrete result with a number", "name": "First L.", "title": "Role/Context", "highlight": "Key phrase from the quote to bold", "rating": 5}').join(', ')}],
  "ctaHeading": "Final CTA heading, max 8 words, creates urgency",
  "ctaSubheading": "Supporting text for CTA, max 20 words, handle final objection",
  "ctaButtonLabel": "CTA button text, max 4 words",
  "ctaUrgency": "Urgency line, e.g. 'Limited spots available this month'",
  "ctaGuarantee": "Risk reversal, e.g. '100% satisfaction guaranteed or your money back'",
  "imageSearchTerms": {
    "hero": "Specific stock photo search query for the hero image, tailored to this business",
    "image1": "Specific stock photo search query for gallery image 1",
    "image2": "Specific stock photo search query for gallery image 2",
    "serviceIcon": "General icon/illustration search term for this industry"
  }
}`;
}

// ── Supporting-content prompt ───────────────────────────────────────────────────

function buildSupportingPrompt(input: V1FormInput, spec: TemplateSpec): string {
  const biz = input.business;
  const trustCount = getArrayPropCount(spec, 'TrustStrip', 'items', 4);
  const differentiatorCount = getArrayPropCount(spec, 'DifferentiatorBlock', 'items', 3);
  const checklistCount = getArrayPropCount(spec, 'ChecklistSection', 'items', 6);
  const galleryCount = getArrayPropCount(spec, 'PhotoGalleryStrip', 'items', 4);
  const processCount = getArrayPropCount(spec, 'ProcessSteps', 'steps', 4);
  const faqCount = getArrayPropCount(spec, 'FAQAccordion', 'items', 5);

  const niche = spec.niche || spec.metadata.name;
  const brand = biz.brandName || biz.productService;
  const areas = (biz.serviceAreas || []).filter(Boolean).join(', ') || '(none provided)';

  return `You are an elite direct-response copywriter writing supporting page sections for a ${niche} landing page. The HERO, SERVICES, TESTIMONIALS and FINAL CTA have already been written in a separate pass — focus ONLY on the supporting sections listed below.

BUSINESS BRIEF:
- Brand name: ${brand}
- What they sell: ${biz.productService}
- Their offer: ${biz.offer}
- What makes them different: ${biz.uniqueValue}
- Why customers love them: ${biz.customerLove}
- Phone: ${input.contact.phone}
- Hours: ${biz.hours || '(not provided)'}
- Service areas: ${areas}
- License / insurance line: ${biz.licenseLine || '(not provided)'}

OPTIONAL TEMPLATE DETAILS:
${formatTemplateAnswers(biz.templateAnswers)}

RULES:
- Use the brand name "${brand}" verbatim. NEVER invent a different brand name.
- NEVER invent a phone number, address, hours, license number, or city/region — if the value isn't in the brief, leave that field out.
- Write in the voice of a credible local ${niche} business. Be specific, concrete, and benefit-first.
- Every list item must earn its place. No filler, no marketing fluff.

Generate JSON with these EXACT fields (omit any field you genuinely cannot write well — DO NOT pad with placeholders):
{
  "announcementBarText": "Short, scannable line for the top bar — emphasizes urgency or availability (e.g. 'Same-day service available'). Max 10 words.",
  "announcementBarHours": "Concise hours phrase if hours are provided, else omit. Max 8 words.",
  "heroEyebrow": "1–4 word eyebrow above the hero headline, e.g. 'Licensed & Insured'",
  "heroBullets": ["3 short benefit bullets, max 8 words each — appear under the hero subheadline"],
  "heroProofPoints": ["3 credibility chips, e.g. '24/7 emergency', '${biz.licenseLine ? 'Licensed' : 'Family-owned'}', '5-star rated'"],
  "heroFormHeading": "Heading above the lead form on the hero, max 6 words",
  "heroFormSubheading": "1 sentence under the form heading, max 18 words",
  "trustStripItems": [${Array(trustCount).fill('{"label": "Trust signal label, max 5 words", "detail": "Optional supporting detail, max 6 words", "icon": "one of: star, shield, check, clock, phone, badge, medal"}').join(', ')}],
  "differentiatorEyebrow": "Eyebrow for the differentiator section, max 4 words",
  "differentiatorHeading": "Headline, max 8 words — why customers pick this business",
  "differentiatorSubheading": "1 sentence intro, max 25 words",
  "differentiatorItems": [${Array(differentiatorCount).fill('{"title": "Differentiator title, max 6 words", "description": "1–2 sentence proof, max 25 words"}').join(', ')}],
  "checklistEyebrow": "Eyebrow, max 4 words",
  "checklistHeading": "Headline for the included/covered checklist, max 8 words",
  "checklistSubheading": "1 sentence intro, max 25 words",
  "checklistItems": [${Array(checklistCount).fill('"Specific item the customer gets / a problem solved, max 10 words"').join(', ')}],
  "midCtaEyebrow": "Short eyebrow, max 4 words",
  "midCtaHeadline": "Mid-page CTA headline, max 10 words",
  "midCtaSubheadline": "Supporting text, max 20 words",
  "midCtaLabel": "Button label, max 4 words",
  "midCtaSecondaryText": "Microcopy under the button, max 10 words (e.g. 'Call ${input.contact.phone}')",
  "galleryHeading": "Photo strip heading, max 6 words",
  "gallerySubheading": "1 sentence under the heading, max 18 words",
  "galleryCaptions": [${Array(galleryCount).fill('"Caption, max 8 words"').join(', ')}],
  "processEyebrow": "Eyebrow, max 4 words",
  "processHeading": "How-it-works headline, max 8 words",
  "processSubheading": "1 sentence, max 22 words",
  "processSteps": [${Array(processCount).fill('{"title": "Step title, max 5 words", "description": "1 sentence, max 22 words"}').join(', ')}],
  "faqEyebrow": "Eyebrow, max 3 words",
  "faqHeading": "FAQ headline, max 6 words",
  "faqSubheading": "1 sentence intro, max 20 words",
  "faqItems": [${Array(faqCount).fill('{"question": "Real question a ${niche} customer would ask, max 12 words", "answer": "Specific, honest answer, max 40 words"}').join(', ')}],
  "serviceAreasEyebrow": "Eyebrow, max 4 words",
  "serviceAreasHeading": "Service-area headline, max 8 words",
  "serviceAreasSubheading": "1 sentence about coverage, max 22 words",
  "serviceAreasFootnote": "Short footnote, e.g. 'Don't see your area? Give us a call.', max 14 words",
  "guaranteeEyebrow": "Eyebrow, max 3 words",
  "guaranteeHeadline": "Guarantee headline, max 8 words",
  "guaranteeDescription": "1–2 sentence guarantee explanation, max 35 words",
  "finalCtaNextSteps": ["3 short next-step lines, max 8 words each — appear above the final CTA button"],
  "finalCtaPrivacyNote": "Privacy/SMS-consent line, max 18 words",
  "footerTagline": "1 short line for the footer, max 12 words — sub-brand line, not a CTA"
}`;
}

// ── Helpers ─────────────────────────────────────────────────────────────────────

function getServiceCount(spec: TemplateSpec): number {
  const svc = spec.sections.find((s) => s.type === 'ServiceList');
  if (!svc) return 4;
  const services = (svc.props as Record<string, unknown>).services;
  return Array.isArray(services) ? services.length : 4;
}

function getArrayPropCount(
  spec: TemplateSpec,
  sectionType: string,
  propName: string,
  fallback: number
): number {
  const entry = spec.sections.find((s) => s.type === sectionType);
  if (!entry) return fallback;
  const arr = (entry.props as Record<string, unknown>)[propName];
  return Array.isArray(arr) && arr.length > 0 ? arr.length : fallback;
}

// ── OpenAI call ─────────────────────────────────────────────────────────────────

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function callOpenAIJSON<T>(prompt: string, maxTokens: number = 3000): Promise<T> {
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
          content: 'You are an elite conversion copywriter. Always respond with valid JSON only. No markdown, no code fences.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.8,
      response_format: { type: 'json_object' },
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(`OpenAI API error: ${data.error.message || JSON.stringify(data.error)}`);
  }

  const raw = data.choices?.[0]?.message?.content || '{}';
  return JSON.parse(raw) as T;
}

// ── Map AI content → V1ContentOverrides ─────────────────────────────────────────

const VALID_SERVICE_ICONS = ['wrench', 'tool', 'shield', 'search'];
const VALID_TRUST_ICONS = ['star', 'shield', 'check', 'clock', 'phone', 'badge', 'medal'];

function mapToOverrides(
  ai: AIGeneratedContent | null,
  supporting: AISupportingContent | null,
  spec: TemplateSpec,
  input: V1FormInput
): V1ContentOverrides {
  const biz = input.business;
  const brand = biz.brandName || biz.productService || 'Your Business';
  const phone = input.contact.phone || '';
  const email = input.contact.email || '';

  // Helper: when an AI-only section is missing required content, omit it so the
  // spec's demo strings never leak through to the rendered page.
  const omit = () => ({ _omit: true });

  const sectionOverrides: (Record<string, unknown> | null)[] = spec.sections.map(
    (entry: V1SectionEntry) => {
      switch (entry.type) {
        case 'AnnouncementBar': {
          // Omit entirely when the AI didn't supply a tailored message — the
          // wizard phone/hours alone aren't worth letting the spec's demo
          // promo line leak through the {...entry.props, ...override} merge.
          const text = supporting?.announcementBarText;
          if (!text) return omit();
          const hours = supporting?.announcementBarHours || biz.hours || '';
          return {
            text,
            ...(phone && { phone }),
            hours,
          };
        }

        case 'StickyHeader':
          return {
            brandName: brand,
            phone: phone || '',
            // Prefer AI CTA, fall back to wizard CTA, then a generic label.
            // Never let the spec's niche-flavored demo CTA survive.
            ctaLabel: ai?.heroCta || biz.cta || 'Get a free quote',
          };

        case 'HeroSplit':
        case 'HeroLeadForm': {
          const headline = ai?.heroHeadline || biz.uniqueValue || biz.productService;
          const subheadline = ai?.heroSubheadline || biz.offer;
          const ctaLabel = ai?.heroCta || biz.cta;
          if (!headline || !subheadline || !ctaLabel) return omit();
          // Explicitly clear every spec-controlled niche field so a partial
          // supporting-pass failure can't leak the demo eyebrow/bullets/
          // proofPoints through the composer's shallow merge.
          return {
            headline,
            subheadline,
            ctaLabel,
            eyebrow: supporting?.heroEyebrow || '',
            bullets: supporting?.heroBullets?.length ? supporting.heroBullets : [],
            proofPoints: supporting?.heroProofPoints?.length ? supporting.heroProofPoints : [],
            formHeading: supporting?.heroFormHeading || '',
            formSubheading: supporting?.heroFormSubheading || '',
            trustBadge: ai?.heroTrustBadge || '',
          };
        }

        case 'SocialProofLogos': {
          if (!ai?.socialProofHeading) return omit();
          return {
            heading: ai.socialProofHeading,
            ...(ai.socialProofLogos?.length && { logos: ai.socialProofLogos }),
          };
        }

        case 'TrustStrip': {
          const items = supporting?.trustStripItems?.filter((i) => i && i.label);
          if (!items?.length) return omit();
          return {
            items: items.map((i) => ({
              label: i.label,
              ...(i.detail && { detail: i.detail }),
              icon: i.icon && VALID_TRUST_ICONS.includes(i.icon) ? i.icon : 'check',
            })),
          };
        }

        case 'ServiceList': {
          if (!ai?.services?.length || !ai.servicesHeading) return omit();
          const origServices = (entry.props as Record<string, unknown>).services as
            Array<{ icon?: string }> | undefined;
          const services = ai.services.map((s, i) => ({
            title: s.title,
            description: s.description,
            ...(s.benefit && { benefit: s.benefit }),
            icon: (s.icon && VALID_SERVICE_ICONS.includes(s.icon))
              ? s.icon
              : (origServices?.[i]?.icon || 'tool'),
          }));
          return {
            heading: ai.servicesHeading,
            ...(ai.servicesSubheading && { subheading: ai.servicesSubheading }),
            services,
          };
        }

        case 'DifferentiatorBlock': {
          const items = supporting?.differentiatorItems?.filter((i) => i?.title && i.description);
          if (!items?.length || !supporting?.differentiatorHeading) return omit();
          return {
            ...(supporting.differentiatorEyebrow && { eyebrow: supporting.differentiatorEyebrow }),
            heading: supporting.differentiatorHeading,
            ...(supporting.differentiatorSubheading && { subheading: supporting.differentiatorSubheading }),
            items,
          };
        }

        case 'ChecklistSection': {
          const items = supporting?.checklistItems?.filter(Boolean);
          if (!items?.length || !supporting?.checklistHeading) return omit();
          return {
            ...(supporting.checklistEyebrow && { eyebrow: supporting.checklistEyebrow }),
            heading: supporting.checklistHeading,
            ...(supporting.checklistSubheading && { subheading: supporting.checklistSubheading }),
            items,
          };
        }

        case 'MidPageCTA': {
          if (!supporting?.midCtaHeadline || !supporting?.midCtaLabel) return omit();
          return {
            ...(supporting.midCtaEyebrow && { eyebrow: supporting.midCtaEyebrow }),
            headline: supporting.midCtaHeadline,
            ...(supporting.midCtaSubheadline && { subheadline: supporting.midCtaSubheadline }),
            ctaLabel: supporting.midCtaLabel,
            ...(supporting.midCtaSecondaryText && { secondaryText: supporting.midCtaSecondaryText }),
          };
        }

        case 'ImagePair': {
          if (!ai?.imagePairHeading) return omit();
          return {
            heading: ai.imagePairHeading,
            ...(ai.imagePairSubheading && { subheading: ai.imagePairSubheading }),
            ...(ai.imagePairCaption1 && { caption1: ai.imagePairCaption1 }),
            ...(ai.imagePairCaption2 && { caption2: ai.imagePairCaption2 }),
          };
        }

        case 'TestimonialsCards': {
          if (!ai?.testimonials?.length || !ai.testimonialsHeading) return omit();
          return {
            heading: ai.testimonialsHeading,
            ...(ai.testimonialsSubheading && { subheading: ai.testimonialsSubheading }),
            testimonials: ai.testimonials.map((t) => ({
              quote: t.quote,
              name: t.name,
              title: t.title,
              ...(t.highlight && { highlight: t.highlight }),
              ...(t.rating && { rating: Math.min(5, Math.max(1, t.rating)) }),
            })),
          };
        }

        case 'PhotoGalleryStrip': {
          if (!supporting?.galleryHeading) return omit();
          const captions = supporting.galleryCaptions || [];
          const origItems = (entry.props as Record<string, unknown>).items as
            Array<{ imageAsset: string; fallbackAsset?: string }> | undefined;
          const items = origItems?.map((it, i) => ({
            imageAsset: it.imageAsset,
            ...(it.fallbackAsset && { fallbackAsset: it.fallbackAsset }),
            ...(captions[i] && { caption: captions[i] }),
          }));
          return {
            heading: supporting.galleryHeading,
            ...(supporting.gallerySubheading && { subheading: supporting.gallerySubheading }),
            ...(items?.length && { items }),
          };
        }

        case 'ProcessSteps': {
          const steps = supporting?.processSteps?.filter((s) => s?.title && s.description);
          if (!steps?.length || !supporting?.processHeading) return omit();
          return {
            ...(supporting.processEyebrow && { eyebrow: supporting.processEyebrow }),
            heading: supporting.processHeading,
            ...(supporting.processSubheading && { subheading: supporting.processSubheading }),
            steps,
          };
        }

        case 'FAQAccordion': {
          const items = supporting?.faqItems?.filter((q) => q?.question && q.answer);
          if (!items?.length || !supporting?.faqHeading) return omit();
          return {
            ...(supporting.faqEyebrow && { eyebrow: supporting.faqEyebrow }),
            heading: supporting.faqHeading,
            ...(supporting.faqSubheading && { subheading: supporting.faqSubheading }),
            items,
          };
        }

        case 'ServiceAreas': {
          const areas = (biz.serviceAreas || []).filter(Boolean);
          if (!areas.length) return omit();
          return {
            eyebrow: supporting?.serviceAreasEyebrow || '',
            heading: supporting?.serviceAreasHeading || '',
            subheading: supporting?.serviceAreasSubheading || '',
            areas,
            footnote: supporting?.serviceAreasFootnote || '',
          };
        }

        case 'GuaranteeBar': {
          if (!supporting?.guaranteeHeadline) return omit();
          return {
            ...(supporting.guaranteeEyebrow && { eyebrow: supporting.guaranteeEyebrow }),
            headline: supporting.guaranteeHeadline,
            ...(supporting.guaranteeDescription && { description: supporting.guaranteeDescription }),
          };
        }

        case 'FinalCTA': {
          const heading = ai?.ctaHeading;
          const ctaLabel = ai?.ctaButtonLabel || biz.cta;
          if (!ctaLabel) return omit();
          return {
            heading: heading || '',
            subheading: ai?.ctaSubheading || '',
            ctaLabel,
            urgency: ai?.ctaUrgency || '',
            guarantee: ai?.ctaGuarantee || '',
            nextSteps: supporting?.finalCtaNextSteps?.length ? supporting.finalCtaNextSteps : [],
            privacyNote: supporting?.finalCtaPrivacyNote || '',
          };
        }

        case 'Footer':
          return {
            brandName: brand,
            tagline: supporting?.footerTagline || '',
            phone: phone || '',
            email: email || '',
            address: biz.address || '',
            hours: biz.hours || '',
            licenseLine: biz.licenseLine || '',
          };

        default:
          return null;
      }
    }
  );

  // Map user-uploaded images to asset slots
  const assetOverrides: Record<string, string> = {};
  if (biz.images && biz.images.length > 0) {
    const imgKeys = ['heroImageId', 'supportImage1', 'supportImage2'];
    biz.images.forEach((img, i) => {
      if (i < imgKeys.length && img) {
        assetOverrides[imgKeys[i]] = img;
      }
    });
  }

  // Build AI-grounded SEO metadata so the spec's stock `metadata.name` and
  // `metadata.description` never leak into <title> / <meta name="description">.
  // Page title: brand name first (so it appears in browser tabs and search
  // results), followed by a short tagline derived from AI or wizard copy.
  const titleTagline = ai?.heroHeadline || biz.uniqueValue || biz.productService || '';
  const pageTitle = titleTagline ? `${brand} — ${titleTagline}` : brand;
  // Meta description: prefer AI subheadline, then wizard offer/unique-value.
  // Capped at ~155 chars for SERP-friendly truncation.
  const metaSeed =
    ai?.heroSubheadline || ai?.ctaSubheading || biz.offer || biz.uniqueValue || biz.productService || '';
  const metaDescription = metaSeed.length > 155 ? `${metaSeed.slice(0, 152)}…` : metaSeed;

  return {
    sections: sectionOverrides,
    assets: Object.keys(assetOverrides).length > 0 ? assetOverrides : undefined,
    meta: {
      ...(phone && { businessPhone: phone }),
      ...(biz.brandName && { businessName: biz.brandName }),
      pageTitle,
      metaDescription,
    },
    imageSearchTerms: ai?.imageSearchTerms || undefined,
  };
}

// ── Public API ──────────────────────────────────────────────────────────────────

/**
 * Two-pass AI generation:
 *   1. Marketing spine (Hero, SocialProof, Services, Testimonials, FinalCTA,
 *      ImagePair). The original `buildPrompt`/`AIGeneratedContent` payload.
 *   2. Supporting content (the 12 niche-only sections). The new
 *      `buildSupportingPrompt`/`AISupportingContent` payload.
 *
 * The two passes run in parallel via `Promise.allSettled` so a failure in one
 * never cascades to the other. `mapToOverrides` then merges whichever passes
 * succeeded with the typed wizard fields from `input.business` and the contact
 * block. Any section that ends up without enough content is marked
 * `_omit: true` so the composer drops it rather than rendering the spec's
 * demo strings (e.g. "Aqua Pro Plumbing").
 */
export async function generateV1Content(
  input: V1FormInput,
  spec: TemplateSpec
): Promise<V1ContentOverrides> {
  const marketingPrompt = buildPrompt(input, spec);
  const supportingPrompt = buildSupportingPrompt(input, spec);

  console.log('[v1 content] Calling OpenAI (marketing + supporting passes)...');
  const [marketingRes, supportingRes] = await Promise.allSettled([
    callOpenAIJSON<AIGeneratedContent>(marketingPrompt, 3000),
    callOpenAIJSON<AISupportingContent>(supportingPrompt, 3500),
  ]);

  const marketing = marketingRes.status === 'fulfilled' ? marketingRes.value : null;
  const supporting = supportingRes.status === 'fulfilled' ? supportingRes.value : null;

  if (marketingRes.status === 'rejected') {
    console.error('[v1 content] Marketing pass failed:', marketingRes.reason);
  }
  if (supportingRes.status === 'rejected') {
    console.error('[v1 content] Supporting pass failed:', supportingRes.reason);
  }

  console.log(
    `[v1 content] Mapping (marketing=${marketing ? 'ok' : 'failed'}, supporting=${supporting ? 'ok' : 'failed'})`
  );
  return mapToOverrides(marketing, supporting, spec, input);
}

function getTestimonialCount(spec: TemplateSpec): number {
  const t = spec.sections.find((s) => s.type === 'TestimonialsCards');
  if (!t) return 3;
  const testimonials = (t.props as Record<string, unknown>).testimonials;
  return Array.isArray(testimonials) ? testimonials.length : 3;
}

