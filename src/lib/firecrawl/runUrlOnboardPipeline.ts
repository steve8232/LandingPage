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
import { makeSlug } from '@/lib/projects/types';
import { scrapeUrl } from '@/lib/firecrawl/client';
import { extractBusinessInfo } from '@/lib/firecrawl/extractBusinessInfo';

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

/**
 * Background continuation kicked off by /api/url-onboard's `after()`.
 *
 * The POST handler inserts a project shell with `build_status='building'`
 * and immediately returns the project id. This runs the heavy work
 * (scrape -> extract -> generate -> enhance -> expandNeighborhoods ->
 * autoPick) using the service-role admin client, updates `build_stage`
 * at each step, and finally flips `build_status` to 'ready' (or
 * 'failed' with `build_error` set).
 *
 * Never throws — all error paths are caught and surfaced via
 * `build_status='failed'` so the /building page can show them.
 */
export async function runUrlOnboardPipeline(
  admin: SupabaseClient,
  { projectId, userId, url }: PipelineInput,
): Promise<void> {
  try {
    await setStage(admin, projectId, STAGE.scraping);

    // 1) Firecrawl scrape.
    const scrape = await scrapeUrl(url);
    if (!scrape.markdown.trim()) {
      throw new Error('No readable content at that URL — is the site reachable?');
    }

    await setStage(admin, projectId, STAGE.extracting);

    // 2) OpenAI extraction.
    const extracted = await extractBusinessInfo({
      url,
      markdown: scrape.markdown,
      metadata: scrape.metadata,
    });
    const templateId = extracted.templateId;
    if (!isV1Template(templateId)) {
      throw new Error(`Unknown templateId returned by extractor: ${templateId}`);
    }
    const spec = getV1Spec(templateId);
    if (!spec) throw new Error('Template spec missing');

    // 3) Build V1FormInput from extracted fields.
    const street = extracted.streetAddress;
    const city = extracted.city;
    const state = extracted.state;
    const zip = extracted.zip;
    const cityStateZip =
      [city, state].filter(Boolean).join(', ') + (zip ? ` ${zip}` : '');
    const composedAddress =
      extracted.fullAddress ||
      [street, cityStateZip].filter((s) => s.trim()).join(', ').trim();
    const serviceAreaText = extracted.serviceAreaText;
    const seedAreas = parseAreaChips(serviceAreaText);
    const serviceAreas = seedAreas.length ? seedAreas : undefined;
    const licenseParts: string[] = [];
    if (extracted.licensedInsured) licenseParts.push('Licensed & insured');
    if (extracted.yearsInBusiness) {
      licenseParts.push(`${extracted.yearsInBusiness}+ years in business`);
    }
    const licenseLine = licenseParts.length ? licenseParts.join(' · ') : undefined;
    const brandName = extracted.brandName || scrape.metadata.title || 'Your Business';

    const v1Input: V1FormInput = {
      business: {
        productService: extracted.productService,
        offer: extracted.offer,
        pricing: extracted.pricing,
        cta: extracted.cta || 'Get a free quote',
        uniqueValue: extracted.uniqueValue,
        customerLove: extracted.customerLove,
        images: [],
        brandName,
        ...(composedAddress && { address: composedAddress }),
        ...(extracted.hours && { hours: extracted.hours }),
        ...(serviceAreas && { serviceAreas }),
        ...(licenseLine && { licenseLine }),
      },
      contact: {
        email: extracted.email || '',
        phone: extracted.phone || '',
      },
    };

    // Pin the picked template + real title onto the project row as soon as
    // we know them so the /building UI can show the right brand name.
    await admin
      .from('projects')
      .update({ template_id: templateId, title: brandName.trim() || 'Untitled SparkPage' })
      .eq('id', projectId);

    await setStage(admin, projectId, STAGE.generating);

    // 4) Generate + enhance content.
    let overrides: V1ContentOverrides | undefined = await generateV1Content(v1Input, spec);
    await setStage(admin, projectId, STAGE.enhancing);
    overrides = await enhanceV1Content(v1Input, spec, overrides);

    // 5) AI neighborhood expansion (best-effort).
    if (city) {
      const hasServiceAreasSection = spec.sections.some((s) => s.type === 'ServiceAreas');
      if (hasServiceAreasSection) {
        await setStage(admin, projectId, STAGE.areas);
        try {
          const expanded = await expandNeighborhoods({
            niche: v1Input.business.productService || undefined,
            city,
            state: state || undefined,
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

    // 6) Persist meta facts + source-site references.
    const meta: V1MetaOverrides = { ...((overrides && overrides.meta) || {}) };
    if (v1Input.contact.phone) meta.businessPhone = v1Input.contact.phone;
    if (brandName) meta.businessName = brandName;
    if (composedAddress) meta.businessAddress = composedAddress;
    if (city) meta.city = city;
    if (state) meta.state = state;
    if (serviceAreaText) meta.serviceAreaText = serviceAreaText;
    meta.sourceUrl = url;
    if (scrape.screenshotUrl) meta.sourceScreenshotUrl = scrape.screenshotUrl;
    overrides = { ...(overrides || {}), meta };

    // 7) Auto-pick Unsplash images for every demo-* slot (best-effort).
    //    The hero is left to the auto-picker just like every other lane;
    //    the Firecrawl screenshot lives only on meta.sourceScreenshotUrl.
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

    // 8) Finalize: write overrides + slug + flip status, then initial revision.
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
