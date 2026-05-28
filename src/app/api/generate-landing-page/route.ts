import { NextRequest, NextResponse } from 'next/server';
import { FormData, GeneratedContent } from '@/types';
import { generateHTML } from '@/lib/generateHtml';
import { generateFullCSS } from '@/lib/generateCss';
import { requireAdmin } from '@/lib/auth/role';

// ── v1 adapter ─────────────────────────────────────────────────────────────────
// If the selected template is a v1 spec, we use the v1 composer instead of the
// legacy pipeline.  The legacy code below remains completely untouched.
import { isV1Template, getV1Spec } from '../../../../v1/specs/index';
import { composeV1Template } from '../../../../v1/composer/composeV1Template';
import type {
  V1ContentOverrides,
  V1ImageAttribution,
  V1MetaOverrides,
} from '../../../../v1/composer/composeV1Template';
import { generateV1Content, V1FormInput } from '../../../../v1/composer/generateV1Content';
import { enhanceV1Content } from '../../../../v1/composer/enhanceV1Content';
import { researchCompetitors } from '../../../../v1/composer/researchCompetitors';
import { expandNeighborhoods } from '../../../../v1/composer/expandNeighborhoods';
import { parseAreaChips } from '@/lib/chat/normalize';
import type { TemplateSpec } from '../../../../v1/specs/schema';
import {
  autoPickForSlots,
  trackAutoPickDownloads,
} from '@/lib/unsplash/autoPickForSlots';

// The v1 generation pipeline runs three OpenAI calls in sequence (optional
// competitor research → marketing spine + supporting in parallel → polish).
// Vercel's default function timeout (15s on newer Pro projects) is too tight
// for this on its own. 60s gives the pipeline room without changing the
// platform plan; the OpenAI calls themselves are still bounded by their own
// per-call timeouts so a hung upstream cannot pin the function open.
export const maxDuration = 60;

function applyV1SectionOmissions(
  spec: TemplateSpec,
  overrides: V1ContentOverrides | undefined,
  templateAnswers?: Record<string, unknown>
): V1ContentOverrides | undefined {
  const hideTestimonials = Boolean(templateAnswers?.hideTestimonials);
  const hideImages = Boolean(templateAnswers?.hideImages);
  if (!hideTestimonials && !hideImages) return overrides;

  const next: V1ContentOverrides = { ...(overrides || {}) };
  const sections = next.sections
    ? [...next.sections]
    : Array.from({ length: spec.sections.length }, () => null);

  // Ensure the override array is at least the length of spec.sections
  while (sections.length < spec.sections.length) sections.push(null);

  spec.sections.forEach((entry, i) => {
    if (hideTestimonials && entry.type === 'TestimonialsCards') {
      const cur = sections[i];
      const base = cur && typeof cur === 'object' ? (cur as Record<string, unknown>) : {};
      sections[i] = { ...base, _omit: true };
    }
    if (hideImages && entry.type === 'ImagePair') {
      const cur = sections[i];
      const base = cur && typeof cur === 'object' ? (cur as Record<string, unknown>) : {};
      sections[i] = { ...base, _omit: true };
    }
  });

  next.sections = sections;
  return next;
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function generateContent(formData: FormData): Promise<GeneratedContent> {
  // Use template industry keywords if available for context
  const industryContext = formData.selectedTemplate?.industryKeywords?.join(', ') || '';
  const templateMood = formData.selectedTemplate?.design?.mood || '';

  const prompt = `You are a conversion copywriter. Generate compelling landing page content based on this information:

Product/Service: ${formData.business.productService}
Offer: ${formData.business.offer}
Pricing: ${formData.business.pricing}
Call-to-Action: ${formData.business.cta}
Unique Value: ${formData.business.uniqueValue}
Why Customers Love Them: ${formData.business.customerLove}
${industryContext ? `Industry Context: ${industryContext}` : ''}
${templateMood ? `Desired Mood: ${templateMood}` : ''}

Design Style: ${formData.design.designAnalysis || 'Modern, professional, conversion-focused'}

Generate the following in JSON format:
{
  "headline": "A powerful, persuasive headline (max 10 words)",
  "subheadline": "A compelling value proposition (max 25 words)",
  "offerDescription": "Clear description of the offer and what's included (2-3 sentences)",
  "sellingPoints": ["4 unique selling points as short bullet points"],
  "testimonials": [
    {"quote": "A realistic, short testimonial quote", "name": "First Last", "title": "Title/Role"},
    // Generate 7 more testimonials (8 total)
  ]
}

Make testimonials realistic and varied, based on the customer benefits mentioned. Each should highlight different aspects of why customers love this business.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a professional copywriter. Always respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    }),
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error.message || 'OpenAI API error');
  }

  const parsed = JSON.parse(data.choices[0]?.message?.content || '{}');

  // Ensure all required fields have defaults
  return {
    headline: parsed.headline || 'Transform Your Business Today',
    subheadline: parsed.subheadline || 'Discover how we can help you achieve your goals',
    offerDescription: parsed.offerDescription || 'Our comprehensive solution provides everything you need to succeed.',
    sellingPoints: Array.isArray(parsed.sellingPoints) ? parsed.sellingPoints : [
      'Professional quality results',
      'Fast and reliable service',
      'Expert support available',
      'Satisfaction guaranteed',
    ],
    testimonials: Array.isArray(parsed.testimonials) ? parsed.testimonials : [
      { quote: 'Excellent service! Highly recommended.', name: 'John D.', title: 'Business Owner' },
      { quote: 'Transformed the way we work.', name: 'Sarah M.', title: 'Marketing Director' },
      { quote: 'Best decision we ever made.', name: 'Mike R.', title: 'CEO' },
      { quote: 'Outstanding results every time.', name: 'Emily W.', title: 'Project Manager' },
    ],
  };
}

export async function POST(request: NextRequest) {
  try {
    const gate = await requireAdmin();
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });
    const formData: FormData = await request.json();

    // ── v1 adapter: intercept v1 template IDs ──────────────────────────────
    // If the templateId belongs to the v1 spec system, render via the v1
    // composer and return early.  Legacy logic below is never reached.
    const templateId = formData.selectedTemplate?.id;
    if (templateId && isV1Template(templateId)) {
      console.log(`[v1 adapter] Rendering v1 template: ${templateId}`);

      // Map form data to v1 input shape. The wizard collects several business
      // facts under `templateAnswers` (loose Record<string, string|boolean>);
      // we promote the ones the AI must never invent into typed first-class
      // fields on V1FormInput.business so the generator can rely on them.
      const ta = (formData.business.templateAnswers || {}) as Record<string, string | boolean>;
      const taStr = (k: string): string | undefined => {
        const v = ta[k];
        return typeof v === 'string' && v.trim() ? v.trim() : undefined;
      };
      // First-class fields promoted onto BusinessInfo (Step 2) take precedence
      // over the legacy templateAnswers map. The map is still read so older
      // saved drafts keep working.
      const biz = formData.business;
      const brandName =
        (biz.brandName && biz.brandName.trim()) ||
        taStr('businessName') ||
        taStr('brandName') ||
        taStr('companyName');
      const hours = taStr('hours');
      const street = (biz.streetAddress || '').trim();
      const city = (biz.city || '').trim();
      const state = (biz.state || '').trim();
      const zip = (biz.zip || '').trim();
      const cityStateZip = [city, state].filter(Boolean).join(', ')
        + (zip ? ` ${zip}` : '');
      const composedAddress = [street, cityStateZip].filter((s) => s.trim()).join(', ');
      const address = composedAddress || taStr('address');
      const displayAddress = biz.displayAddress !== false; // default true
      const serviceAreaText = (biz.serviceAreaText || '').trim() || taStr('serviceArea') || taStr('serviceAreas') || '';
      const seedAreas = parseAreaChips(serviceAreaText);
      const serviceAreas = seedAreas.length ? seedAreas : undefined;
      const licensedInsured = ta['licensedInsured'] === true;
      const yearsInBusiness = taStr('yearsInBusiness');
      const licenseLineParts: string[] = [];
      if (licensedInsured) licenseLineParts.push('Licensed & insured');
      if (yearsInBusiness) licenseLineParts.push(`${yearsInBusiness}+ years in business`);
      const licenseLine = licenseLineParts.length ? licenseLineParts.join(' · ') : undefined;

      const v1Input: V1FormInput = {
        business: {
          productService: formData.business.productService || '',
          offer: formData.business.offer || '',
          pricing: formData.business.pricing || '',
          cta: formData.business.cta || '',
          uniqueValue: formData.business.uniqueValue || '',
          customerLove: formData.business.customerLove || '',
          images: formData.business.images || [],
          ...(brandName && { brandName }),
          ...(address && { address }),
          ...(hours && { hours }),
          ...(serviceAreas && serviceAreas.length && { serviceAreas }),
          ...(licenseLine && { licenseLine }),
          templateAnswers: formData.business.templateAnswers,
        },
        contact: {
          email: formData.contact?.email || '',
          phone: formData.contact?.phone || '',
        },
      };

      // Load spec and generate AI content overrides
	      const spec = getV1Spec(templateId);
	      let overrides: V1ContentOverrides | undefined;
	      const sectionTypes = spec?.sections?.map((s) => s.type) || undefined;

      // If the user did not supply meaningful business info, preserve the
      // spec's curated defaults verbatim (no AI rewrite). The editor sidebar
      // can still capture overrides afterwards.
      const hasBusinessInput = Boolean(
        v1Input.business.productService?.trim() ||
          v1Input.business.offer?.trim() ||
          v1Input.business.uniqueValue?.trim() ||
          v1Input.business.customerLove?.trim() ||
          v1Input.business.cta?.trim() ||
          v1Input.business.pricing?.trim() ||
          (v1Input.business.images && v1Input.business.images.length > 0)
      );

      if (spec && hasBusinessInput) {
        // Best-effort competitor research via OpenAI web_search. Gated behind
        // OPENAI_WEB_SEARCH_ENABLED so it can be turned on per-environment
        // without redeploying — the marketing prompt degrades gracefully when
        // competitorContext is absent. Off by default so the generation
        // pipeline doesn't pick up an extra serial OpenAI call unannounced.
        const niche = v1Input.business.productService?.trim();
        const locationSignal =
          v1Input.business.address?.trim() ||
          v1Input.business.serviceAreas?.[0] ||
          taStr('city') ||
          taStr('serviceArea') ||
          undefined;
        if (niche && process.env.OPENAI_WEB_SEARCH_ENABLED === 'true') {
          const research = await researchCompetitors({
            niche,
            location: locationSignal,
            excludeBrand: v1Input.business.brandName,
          });
          if (research && research.brief) {
            v1Input.business.competitorContext = research.brief;
            console.log(`[v1 adapter] Competitor research: ${research.competitors.length} entries`);
          }
        }

        overrides = await generateV1Content(v1Input, spec);
        console.log('[v1 adapter] Content overrides generated');

        // Second pass: polish copy + generate SEO metadata, alt texts, form labels
        overrides = await enhanceV1Content(v1Input, spec, overrides);
        console.log('[v1 adapter] Enhancement pass complete');
      } else if (spec) {
        console.log('[v1 adapter] Empty business input — using spec defaults verbatim');
      }

      if (spec) {
        // Apply any template-driven visibility toggles (e.g. hideTestimonials)
        overrides = applyV1SectionOmissions(spec, overrides, v1Input.business.templateAnswers);
      }

      // Best-effort AI neighborhood expansion. Runs whenever we have a city
      // and the spec includes a ServiceAreas section, even if the user typed
      // only a single blurb or a few seed chips. Failure → keep whatever
      // chips the user typed (or none) and let the composer's placeholder
      // filter strip any spec demo data.
      if (spec && city) {
        const hasServiceAreasSection = spec.sections.some((s) => s.type === 'ServiceAreas');
        if (hasServiceAreasSection) {
          try {
            const expanded = await expandNeighborhoods({
              niche: v1Input.business.productService || undefined,
              city,
              state,
              zip: zip || undefined,
              serviceAreaText: serviceAreaText || undefined,
              excludeBrand: brandName,
            });
            const finalAreas = expanded && expanded.length ? expanded : seedAreas;
            if (finalAreas.length) {
              const idx = spec.sections.findIndex((s) => s.type === 'ServiceAreas');
              const nextSections: (Record<string, unknown> | null)[] = overrides?.sections
                ? [...overrides.sections]
                : Array.from({ length: spec.sections.length }, () => null);
              while (nextSections.length < spec.sections.length) nextSections.push(null);
              const cur = nextSections[idx];
              const base = cur && typeof cur === 'object' ? (cur as Record<string, unknown>) : {};
              nextSections[idx] = { ...base, areas: finalAreas };
              overrides = { ...(overrides || {}), sections: nextSections };
              console.log(`[v1 adapter] Service areas resolved: ${finalAreas.length} chips (${expanded ? 'expanded' : 'seed'})`);
            }
          } catch (err) {
            console.warn('[v1 adapter] expandNeighborhoods failed:', err);
          }
        }
      }

      // Persist the wizard's destination phone in overrides.meta.businessPhone
      // so it's available to CallRail provisioning + swap.js without a separate
      // round-trip through the form data. Source of truth for both the
      // tracker's destination_number and DNI swap_targets.
      const wizardPhone = v1Input.contact.phone?.trim();
      if (wizardPhone) {
        overrides = {
          ...(overrides || {}),
          meta: { ...((overrides && overrides.meta) || {}), businessPhone: wizardPhone },
        };
      }

      // Persist the wizard's business name in overrides.meta.businessName.
      // CallRail provision reads this as the Company name. Prefers the new
      // first-class `brandName` field, falling back to legacy templateAnswers
      // for projects whose draft was saved before the Step 2 promotion.
      const rawTaBusinessName = v1Input.business.templateAnswers?.businessName;
      const taBusinessName = typeof rawTaBusinessName === 'string' ? rawTaBusinessName.trim() : '';
      const wizardBusinessName = (brandName || taBusinessName || '').trim();
      if (wizardBusinessName) {
        overrides = {
          ...(overrides || {}),
          meta: { ...((overrides && overrides.meta) || {}), businessName: wizardBusinessName },
        };
      }

      // Persist the wizard's mailing address, raw service-area text, and
      // display-address toggle on meta so the regenerate route, CallRail
      // provisioning, and the composer's address-stripping pass all have a
      // single source of truth.
      if (address) {
        overrides = {
          ...(overrides || {}),
          meta: { ...((overrides && overrides.meta) || {}), businessAddress: address },
        };
      }
      if (city) {
        overrides = {
          ...(overrides || {}),
          meta: { ...((overrides && overrides.meta) || {}), city },
        };
      }
      if (state) {
        overrides = {
          ...(overrides || {}),
          meta: { ...((overrides && overrides.meta) || {}), state },
        };
      }
      if (serviceAreaText) {
        overrides = {
          ...(overrides || {}),
          meta: { ...((overrides && overrides.meta) || {}), serviceAreaText },
        };
      }
      if (!displayAddress) {
        overrides = {
          ...(overrides || {}),
          meta: { ...((overrides && overrides.meta) || {}), displayAddress: false },
        };
      }

      // Auto-pick niche-relevant Unsplash photos for every demo image slot so
      // first-load pages are fully illustrated without per-spec long-tail
      // search seeds. Best-effort: failures here fall back to demo images.
      if (spec && spec.niche) {
        try {
          const slotKeys = Object.entries(spec.assets || {})
            .filter(([, v]) => typeof v === 'string' && v.startsWith('demo-'))
            .map(([k]) => k);
          if (slotKeys.length > 0) {
            const picked = await autoPickForSlots(spec.niche, slotKeys);
            if (Object.keys(picked.picks).length > 0) {
              await trackAutoPickDownloads(picked.picks);
              const prevAssets = (overrides && overrides.assets) || {};
              const nextAssets: Record<string, string> = { ...prevAssets };
              const prevMeta: V1MetaOverrides = (overrides && overrides.meta) || {};
              const nextAttrs: Record<string, V1ImageAttribution> = {
                ...((prevMeta.imageAttributions || {}) as Record<string, V1ImageAttribution>),
              };
              for (const [key, pick] of Object.entries(picked.picks)) {
                nextAssets[key] = pick.src;
                nextAttrs[key] = pick.attribution;
              }
              overrides = {
                ...(overrides || {}),
                assets: nextAssets,
                meta: { ...prevMeta, imageAttributions: nextAttrs },
              };
              console.log(
                `[v1 adapter] Auto-picked ${Object.keys(picked.picks).length}/${slotKeys.length} Unsplash images for niche "${spec.niche}"`
              );
            }
          }
        } catch (err) {
          console.warn('[v1 adapter] Auto-pick failed (using demo images):', err);
        }
      }

	      // For the interactive app output we allow remote demo images (when used)
	      // so pages look richly illustrated without requiring user uploads.
	      // Previews/build artifacts can still opt to stay fully offline.
	      const { html } = composeV1Template(templateId, overrides, { allowRemoteDemoImages: true });
	      return NextResponse.json({
	        html,
	        css: '',       // CSS is inlined in the v1 HTML
	        preview: html, // v1 output is already self-contained
	        content: null,
	        v1: {
	          templateId,
	          overrides,
	          sectionTypes,
	        },
	      });
    }
    // ── end v1 adapter ─────────────────────────────────────────────────────

    // Debug logging
    console.log('=== DEBUG: Generate Landing Page ===');
    console.log('Selected Template:', formData.selectedTemplate?.name || 'None');
    console.log('Design Analysis:', formData.design.designAnalysis ? 'Present (length: ' + formData.design.designAnalysis.length + ')' : 'Empty');
    console.log('Template colors primary:', formData.selectedTemplate?.design?.colors?.primary);

    // Generate content using OpenAI
    const content = await generateContent(formData);

    console.log('=== DEBUG: Generated Content ===');
    console.log('Headline:', content.headline);
    console.log('Subheadline:', content.subheadline);
    console.log('Selling Points count:', content.sellingPoints?.length || 0);
    console.log('Testimonials count:', content.testimonials?.length || 0);

    // Generate CSS using the full generator (pass template for design defaults)
    const css = generateFullCSS(
      formData.design.designAnalysis || '',
      formData.selectedTemplate
    );

    // Log first 500 chars of CSS to verify colors
    console.log('=== DEBUG: CSS (first 500 chars) ===');
    console.log(css.substring(0, 500));

    // Generate HTML (pass template for section control)
    const { html } = generateHTML(formData, content, css, formData.selectedTemplate);

    // Create inline preview (CSS embedded in HTML)
    const preview = html.replace(
      '<link rel="stylesheet" href="styles.css">',
      `<style>${css}</style>`
    );

    return NextResponse.json({
      html,
      css,
      preview,
      content
    });
  } catch (error) {
    console.error('Error generating landing page:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate landing page' },
      { status: 500 }
    );
  }
}

