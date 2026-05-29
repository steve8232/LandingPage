import type { SupabaseClient } from '@supabase/supabase-js';
import { isV1Template, getV1Spec } from '../../../v1/specs';
import {
  generateV1Content,
  type V1FormInput,
} from '../../../v1/composer/generateV1Content';
import { enhanceV1Content } from '../../../v1/composer/enhanceV1Content';
import { expandNeighborhoods } from '../../../v1/composer/expandNeighborhoods';
import type {
  V1ContentOverrides,
  V1ImageAttribution,
  V1MetaOverrides,
} from '../../../v1/composer/composeV1Template';
import {
  autoPickForSlots,
  trackAutoPickDownloads,
} from '@/lib/unsplash/autoPickForSlots';
import { parseAreaChips } from '@/lib/chat/normalize';
import { makeSlug, type OnboardingState } from '@/lib/projects/types';
import { scrapeUrl } from '@/lib/firecrawl/client';
import {
  extractBusinessInfo,
  type ExtractedBusinessInfo,
} from '@/lib/firecrawl/extractBusinessInfo';

/**
 * Stages reported on `projects.build_stage` so the /building page's poll
 * loop can show meaningful progress instead of a single indeterminate
 * spinner. Plain English — surfaced verbatim to the user.
 */
const STAGE = {
  scraping: 'Scanning your site',
  extracting: 'Reading the page',
  generating: 'Drafting your new copy',
  enhancing: 'Polishing tone and headlines',
  areas: 'Finding nearby neighborhoods',
  images: 'Sourcing photos',
  finalizing: 'Almost done',
} as const;

interface PipelineInput {
  projectId: string;
  userId: string;
  url: string;
}

interface ExtractPhaseInput {
  projectId: string;
  url: string;
}

interface GeneratePhaseInput {
  projectId: string;
  userId: string;
}

/**
 * Phase 1 of the URL onboarding pipeline: Firecrawl scrape + OpenAI
 * extract. Persists the editable draft to `projects.onboarding_state`
 * and pins `template_id` + `title` so the /confirm and /building pages
 * have the right context. Does **not** touch `build_status` — the
 * caller decides whether the next step is the awaiting-confirm gate
 * (Phase 2) or the immediate handoff to runGeneratePhase (Phase 1).
 *
 * Throws on any unrecoverable error; callers wrap in try/catch and
 * flip the row to 'failed' with the message.
 */
export async function runUrlExtractPhase(
  admin: SupabaseClient,
  { projectId, url }: ExtractPhaseInput,
): Promise<void> {
  await setStage(admin, projectId, STAGE.scraping);

  const scrape = await scrapeUrl(url);
  if (!scrape.markdown.trim()) {
    throw new Error('No readable content at that URL — is the site reachable?');
  }

  await setStage(admin, projectId, STAGE.extracting);

  const extracted = await extractBusinessInfo({
    url,
    markdown: scrape.markdown,
    metadata: scrape.metadata,
  });
  const templateId = extracted.templateId;
  if (!isV1Template(templateId)) {
    throw new Error(`Unknown templateId returned by extractor: ${templateId}`);
  }

  const brandName = extracted.brandName || scrape.metadata.title || 'Your Business';
  const onboardingState: OnboardingState = {
    source: 'url',
    url,
    scrape: {
      ...(scrape.screenshotUrl ? { screenshotUrl: scrape.screenshotUrl } : {}),
      metadata: scrape.metadata as unknown as Record<string, unknown>,
    },
    draft: { ...extracted, brandName },
  };

  const { error: updateErr } = await admin
    .from('projects')
    .update({
      template_id: templateId,
      title: brandName.trim() || 'Untitled SparkPage',
      onboarding_state: onboardingState,
    })
    .eq('id', projectId);
  if (updateErr) throw new Error(`Project update failed: ${updateErr.message}`);
}

/**
 * Phase 2 of the URL onboarding pipeline: generate + enhance copy,
 * expand neighborhoods, auto-pick photos, finalize. Reads the draft
 * the user (optionally) edited on /confirm from
 * `projects.onboarding_state.draft` and produces a complete
 * `overrides` payload, then flips `build_status` to 'ready'.
 *
 * Throws on unrecoverable errors; callers handle the 'failed' flip.
 */
export async function runGeneratePhase(
  admin: SupabaseClient,
  { projectId, userId }: GeneratePhaseInput,
): Promise<void> {
  const { data: row, error: readErr } = await admin
    .from('projects')
    .select('template_id, onboarding_state, overrides')
    .eq('id', projectId)
    .single();
  if (readErr || !row) {
    throw new Error(`Project read failed: ${readErr?.message || 'not found'}`);
  }
  const state = row.onboarding_state as OnboardingState | null;
  if (!state || !state.draft) {
    throw new Error('Missing onboarding_state — cannot run generate phase');
  }
  const draft: ExtractedBusinessInfo = state.draft;
  const templateId = row.template_id as string;
  if (!isV1Template(templateId)) {
    throw new Error(`Invalid template_id on project: ${templateId}`);
  }
  const spec = getV1Spec(templateId);
  if (!spec) throw new Error('Template spec missing');

  const v1Input = buildV1FormInput(draft);
  const { city, state: stateAbbr, zip, serviceAreaText } = draft;
  const seedAreas = parseAreaChips(serviceAreaText);
  const brandName = v1Input.business.brandName!;
  const composedAddress = v1Input.business.address;
  const sourceUrl = state.url;
  const sourceScreenshotUrl = state.scrape?.screenshotUrl;

  await setStage(admin, projectId, STAGE.generating);
  let overrides: V1ContentOverrides | undefined = await generateV1Content(v1Input, spec);
  await setStage(admin, projectId, STAGE.enhancing);
  overrides = await enhanceV1Content(v1Input, spec, overrides);

  // AI neighborhood expansion (best-effort).
  if (city) {
    const hasServiceAreasSection = spec.sections.some((s) => s.type === 'ServiceAreas');
    if (hasServiceAreasSection) {
      await setStage(admin, projectId, STAGE.areas);
      try {
        const expanded = await expandNeighborhoods({
          niche: v1Input.business.productService || undefined,
          city,
          state: stateAbbr || undefined,
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
        }
      } catch (err) {
        console.warn('[url-onboard:pipeline] expandNeighborhoods failed:', err);
      }
    }
  }

  // Persist meta facts + source-site references.
  const meta: V1MetaOverrides = { ...((overrides && overrides.meta) || {}) };
  if (v1Input.contact.phone) meta.businessPhone = v1Input.contact.phone;
  if (brandName) meta.businessName = brandName;
  if (composedAddress) meta.businessAddress = composedAddress;
  if (city) meta.city = city;
  if (stateAbbr) meta.state = stateAbbr;
  if (serviceAreaText) meta.serviceAreaText = serviceAreaText;
  if (sourceUrl) meta.sourceUrl = sourceUrl;
  if (sourceScreenshotUrl) meta.sourceScreenshotUrl = sourceScreenshotUrl;
  overrides = { ...(overrides || {}), meta };

  // Auto-pick Unsplash images for every demo-* slot (best-effort).
  await setStage(admin, projectId, STAGE.images);
  try {
    const slotKeys = Object.entries(spec.assets || {})
      .filter(([, v]) => typeof v === 'string' && v.startsWith('demo-'))
      .map(([k]) => k);
    if (spec.niche && slotKeys.length > 0) {
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
      }
    }
  } catch (err) {
    console.warn('[url-onboard:pipeline] auto-pick failed:', err);
  }

  // Finalize: write overrides + slug + flip status, then initial revision.
  await setStage(admin, projectId, STAGE.finalizing);
  const title = brandName.trim() || 'Untitled SparkPage';
  const slug = makeSlug(title);
  const { error: updateErr } = await admin
    .from('projects')
    .update({
      title,
      slug,
      overrides,
      business_phone: v1Input.contact.phone || null,
      build_status: 'ready',
      build_stage: null,
      build_error: null,
    })
    .eq('id', projectId);
  if (updateErr) throw new Error(`Project update failed: ${updateErr.message}`);

  await admin.from('project_revisions').insert({
    project_id: projectId,
    overrides,
    created_by: userId,
  });
}

/**
 * Reconstruct a V1FormInput from the editable draft persisted on
 * `onboarding_state.draft`. Mirrors the inline build that lived in the
 * pre-split pipeline; shared so the /confirm submit path can sanity-
 * check the draft before kicking the generate phase.
 */
function buildV1FormInput(draft: ExtractedBusinessInfo): V1FormInput {
  const street = draft.streetAddress;
  const { city, state, zip } = draft;
  const cityStateZip =
    [city, state].filter(Boolean).join(', ') + (zip ? ` ${zip}` : '');
  const composedAddress =
    draft.fullAddress ||
    [street, cityStateZip].filter((s) => s.trim()).join(', ').trim();
  const seedAreas = parseAreaChips(draft.serviceAreaText);
  const serviceAreas = seedAreas.length ? seedAreas : undefined;
  const licenseParts: string[] = [];
  if (draft.licensedInsured) licenseParts.push('Licensed & insured');
  if (draft.yearsInBusiness) {
    licenseParts.push(`${draft.yearsInBusiness}+ years in business`);
  }
  const licenseLine = licenseParts.length ? licenseParts.join(' · ') : undefined;
  const brandName = draft.brandName || 'Your Business';

  return {
    business: {
      productService: draft.productService,
      offer: draft.offer,
      pricing: draft.pricing,
      cta: draft.cta || 'Get a free quote',
      uniqueValue: draft.uniqueValue,
      customerLove: draft.customerLove,
      images: [],
      brandName,
      ...(composedAddress && { address: composedAddress }),
      ...(draft.hours && { hours: draft.hours }),
      ...(serviceAreas && { serviceAreas }),
      ...(licenseLine && { licenseLine }),
    },
    contact: {
      email: draft.email || '',
      phone: draft.phone || '',
    },
  };
}

/**
 * Background continuation kicked off by /api/url-onboard's `after()`.
 *
 * Thin wrapper that runs the extract phase, then immediately runs the
 * generate phase — preserves the pre-split behavior so Phase 1 of the
 * funnel restructure is invisible to callers. Phase 2 will replace
 * this call site with an awaiting-confirm gate.
 *
 * Never throws — all error paths are caught and surfaced via
 * `build_status='failed'` so the /building page can show them.
 */
export async function runUrlOnboardPipeline(
  admin: SupabaseClient,
  { projectId, userId, url }: PipelineInput,
): Promise<void> {
  try {
    await runUrlExtractPhase(admin, { projectId, url });
    await runGeneratePhase(admin, { projectId, userId });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Pipeline failed';
    console.error('[url-onboard:pipeline] failed:', err);
    await admin
      .from('projects')
      .update({
        build_status: 'failed',
        build_stage: null,
        build_error: message.slice(0, 1000),
      })
      .eq('id', projectId);
  }
}

async function setStage(
  admin: SupabaseClient,
  projectId: string,
  stage: string,
): Promise<void> {
  await admin.from('projects').update({ build_stage: stage }).eq('id', projectId);
}
