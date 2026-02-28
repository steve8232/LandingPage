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
- Tone: ${tone}

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

// ── Helpers ─────────────────────────────────────────────────────────────────────

function getServiceCount(spec: TemplateSpec): number {
  const svc = spec.sections.find((s) => s.type === 'ServiceList');
  if (!svc) return 4;
  const services = (svc.props as Record<string, unknown>).services;
  return Array.isArray(services) ? services.length : 4;
}

// ── OpenAI call ─────────────────────────────────────────────────────────────────

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function callOpenAI(prompt: string): Promise<AIGeneratedContent> {
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
      max_tokens: 3000,
      temperature: 0.8,
      response_format: { type: 'json_object' },
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(`OpenAI API error: ${data.error.message || JSON.stringify(data.error)}`);
  }

  const raw = data.choices?.[0]?.message?.content || '{}';
  return JSON.parse(raw) as AIGeneratedContent;
}

// ── Map AI content → V1ContentOverrides ─────────────────────────────────────────

function mapToOverrides(
  ai: AIGeneratedContent,
  spec: TemplateSpec,
  input: V1FormInput
): V1ContentOverrides {
  const validIcons = ['wrench', 'tool', 'shield', 'search'];

  const sectionOverrides: (Record<string, unknown> | null)[] = spec.sections.map(
    (entry: V1SectionEntry) => {
      switch (entry.type) {
        case 'HeroSplit':
          return {
            headline: ai.heroHeadline,
            subheadline: ai.heroSubheadline,
            ctaLabel: ai.heroCta,
            ...(ai.heroTrustBadge && { trustBadge: ai.heroTrustBadge }),
          };

        case 'SocialProofLogos':
          return {
            heading: ai.socialProofHeading,
            ...(ai.socialProofLogos?.length && { logos: ai.socialProofLogos }),
          };

        case 'ServiceList': {
          const origServices = (entry.props as Record<string, unknown>).services as
            Array<{ icon?: string }> | undefined;
          const services = ai.services.map((s, i) => ({
            title: s.title,
            description: s.description,
            ...(s.benefit && { benefit: s.benefit }),
            icon: (s.icon && validIcons.includes(s.icon)) ? s.icon : (origServices?.[i]?.icon || 'tool'),
          }));
          return {
            heading: ai.servicesHeading,
            ...(ai.servicesSubheading && { subheading: ai.servicesSubheading }),
            services,
          };
        }

        case 'ImagePair':
          return {
            heading: ai.imagePairHeading,
            ...(ai.imagePairSubheading && { subheading: ai.imagePairSubheading }),
            ...(ai.imagePairCaption1 && { caption1: ai.imagePairCaption1 }),
            ...(ai.imagePairCaption2 && { caption2: ai.imagePairCaption2 }),
          };

        case 'TestimonialsCards':
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

        case 'FinalCTA':
          return {
            heading: ai.ctaHeading,
            subheading: ai.ctaSubheading,
            ctaLabel: ai.ctaButtonLabel,
            ...(ai.ctaUrgency && { urgency: ai.ctaUrgency }),
            ...(ai.ctaGuarantee && { guarantee: ai.ctaGuarantee }),
          };

        default:
          return null;
      }
    }
  );

  // Map user-uploaded images to asset slots
  const assetOverrides: Record<string, string> = {};
  if (input.business.images && input.business.images.length > 0) {
    const imgKeys = ['heroImageId', 'supportImage1', 'supportImage2'];
    input.business.images.forEach((img, i) => {
      if (i < imgKeys.length && img) {
        assetOverrides[imgKeys[i]] = img;
      }
    });
  }

  return {
    sections: sectionOverrides,
    assets: Object.keys(assetOverrides).length > 0 ? assetOverrides : undefined,
    imageSearchTerms: ai.imageSearchTerms || undefined,
  };
}

// ── Fallback content (when OpenAI fails) ────────────────────────────────────────

function buildFallbackOverrides(
  spec: TemplateSpec,
  input: V1FormInput
): V1ContentOverrides {
  const biz = input.business;

  const sectionOverrides: (Record<string, unknown> | null)[] = spec.sections.map(
    (entry: V1SectionEntry) => {
      switch (entry.type) {
        case 'HeroSplit':
          return {
            headline: biz.uniqueValue || biz.productService || entry.props.headline,
            subheadline: biz.offer || entry.props.subheadline,
            ctaLabel: biz.cta || entry.props.ctaLabel,
            trustBadge: '✓ Trusted by businesses like yours',
          };
        case 'FinalCTA':
          return {
            ctaLabel: biz.cta || (entry.props as Record<string, unknown>).ctaLabel,
            guarantee: 'No obligation — get a response within 24 hours',
          };
        default:
          return null;
      }
    }
  );

  return { sections: sectionOverrides };
}

// ── Public API ──────────────────────────────────────────────────────────────────

export async function generateV1Content(
  input: V1FormInput,
  spec: TemplateSpec
): Promise<V1ContentOverrides> {
  try {
    const prompt = buildPrompt(input, spec);
    console.log('[v1 content] Calling OpenAI for content generation...');
    const ai = await callOpenAI(prompt);
    console.log('[v1 content] AI content received, mapping to overrides...');
    return mapToOverrides(ai, spec, input);
  } catch (err) {
    console.error('[v1 content] AI generation failed, using fallback:', err);
    return buildFallbackOverrides(spec, input);
  }
}

function getTestimonialCount(spec: TemplateSpec): number {
  const t = spec.sections.find((s) => s.type === 'TestimonialsCards');
  if (!t) return 3;
  const testimonials = (t.props as Record<string, unknown>).testimonials;
  return Array.isArray(testimonials) ? testimonials.length : 3;
}

