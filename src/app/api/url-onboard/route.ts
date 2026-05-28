import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/role';
import {
  makeSlug,
  rowToDTO,
  PROJECT_COLS,
  type ProjectRow,
} from '@/lib/projects/types';
import { isV1Template, getV1Spec } from '../../../../v1/specs';
import {
  generateV1Content,
  type V1FormInput,
} from '../../../../v1/composer/generateV1Content';
import { enhanceV1Content } from '../../../../v1/composer/enhanceV1Content';
import { expandNeighborhoods } from '../../../../v1/composer/expandNeighborhoods';
import type {
  V1ContentOverrides,
  V1ImageAttribution,
  V1MetaOverrides,
} from '../../../../v1/composer/composeV1Template';
import {
  autoPickForSlots,
  trackAutoPickDownloads,
} from '@/lib/unsplash/autoPickForSlots';
import { parseAreaChips } from '@/lib/chat/normalize';
import {
  scrapeUrl,
  FirecrawlAuthError,
  FirecrawlError,
} from '@/lib/firecrawl/client';
import { extractBusinessInfo } from '@/lib/firecrawl/extractBusinessInfo';

/**
 * POST /api/url-onboard — Lane D "already have a site" submission.
 *
 * Pipeline (each stage gated by the previous; first failure short-circuits):
 *   1. Firecrawl /v2/scrape → markdown + full-page screenshot.
 *   2. OpenAI extract → typed business facts + best-fit v1 template id.
 *   3. generateV1Content → enhanceV1Content (same pipeline as Lanes A/B/C).
 *   4. expandNeighborhoods when a city is present and the spec has a
 *      ServiceAreas section.
 *   5. autoPickForSlots → fill every demo-* slot with niche-relevant
 *      Unsplash photos.
 *   6. Override the hero slot with the Firecrawl screenshot so the page
 *      feels familiar to the user.
 *   7. Insert project (creation_method='url') + initial revision.
 *
 * Admin-only — mirrors /api/chat for the auth + DB-write order. The full
 * pipeline runs serially with up to 5 OpenAI round-trips, so we bump
 * maxDuration past the platform's tighter default.
 */
export const maxDuration = 90;

interface RequestBody {
  url?: string;
}

/**
 * Normalize a user-typed URL. Adds an https:// scheme when missing and
 * rejects anything that doesn't parse cleanly into http(s).
 */
function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.toString();
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const url = normalizeUrl(typeof body.url === 'string' ? body.url : '');
  if (!url) {
    return NextResponse.json({ error: 'A valid URL is required' }, { status: 400 });
  }

  // 1) Firecrawl scrape — markdown + full-page screenshot.
  let scrape;
  try {
    scrape = await scrapeUrl(url);
  } catch (err) {
    if (err instanceof FirecrawlAuthError) {
      console.error('[url-onboard] Firecrawl auth failed:', err);
      return NextResponse.json({ error: 'Firecrawl credentials rejected' }, { status: 502 });
    }
    const msg = err instanceof FirecrawlError ? err.message : 'Firecrawl scrape failed';
    console.error('[url-onboard] Firecrawl scrape failed:', err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
  if (!scrape.markdown.trim()) {
    return NextResponse.json(
      { error: 'No readable content at that URL — is the site reachable?' },
      { status: 422 },
    );
  }

  // 2) OpenAI extraction — structured fields + template pick.
  let extracted;
  try {
    extracted = await extractBusinessInfo({
      url,
      markdown: scrape.markdown,
      metadata: scrape.metadata,
    });
  } catch (err) {
    console.error('[url-onboard] extractBusinessInfo failed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Extraction failed' },
      { status: 502 },
    );
  }

  const templateId = extracted.templateId;
  if (!isV1Template(templateId)) {
    return NextResponse.json({ error: `Unknown templateId: ${templateId}` }, { status: 500 });
  }
  const spec = getV1Spec(templateId);
  if (!spec) {
    return NextResponse.json({ error: 'Template spec missing' }, { status: 500 });
  }

  // 3) Build V1FormInput from the extracted fields. Address parts are
  //    rejoined into a single display string for the Footer.
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
  if (extracted.yearsInBusiness) licenseParts.push(`${extracted.yearsInBusiness}+ years in business`);
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

  // 4) Generate + enhance content (same pipeline as Lanes A/B/C).
  let overrides: V1ContentOverrides | undefined;
  try {
    overrides = await generateV1Content(v1Input, spec);
    overrides = await enhanceV1Content(v1Input, spec, overrides);
  } catch (err) {
    console.error('[url-onboard] content generation failed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Content generation failed' },
      { status: 502 },
    );
  }

  // 5) Best-effort AI neighborhood expansion. Skips silently when no city
  //    is known or the spec has no ServiceAreas slot.
  if (city) {
    const hasServiceAreasSection = spec.sections.some((s) => s.type === 'ServiceAreas');
    if (hasServiceAreasSection) {
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
        console.warn('[url-onboard] expandNeighborhoods failed:', err);
      }
    }
  }

  // 6) Persist meta facts so CallRail / regenerate / the composer all have
  //    a single source of truth.
  const meta: V1MetaOverrides = { ...((overrides && overrides.meta) || {}) };
  if (v1Input.contact.phone) meta.businessPhone = v1Input.contact.phone;
  if (brandName) meta.businessName = brandName;
  if (composedAddress) meta.businessAddress = composedAddress;
  if (city) meta.city = city;
  if (state) meta.state = state;
  if (serviceAreaText) meta.serviceAreaText = serviceAreaText;
  overrides = { ...(overrides || {}), meta };

  // 7) Auto-pick Unsplash images for every demo-* slot (best-effort).
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
    console.warn('[url-onboard] auto-pick failed:', err);
  }

  // 8) Override the hero slot with the Firecrawl screenshot so the live
  //    page feels familiar to the user. Strip any Unsplash attribution
  //    we just attached to the hero — the screenshot is the user's own.
  if (scrape.screenshotUrl && spec.assets?.heroImageId) {
    const prevAssets = (overrides && overrides.assets) || {};
    const prevMeta: V1MetaOverrides = (overrides && overrides.meta) || {};
    const nextAttrs: Record<string, V1ImageAttribution> = {
      ...((prevMeta.imageAttributions || {}) as Record<string, V1ImageAttribution>),
    };
    delete nextAttrs.heroImageId;
    overrides = {
      ...(overrides || {}),
      assets: { ...prevAssets, heroImageId: scrape.screenshotUrl },
      meta: {
        ...prevMeta,
        imageAttributions: Object.keys(nextAttrs).length ? nextAttrs : undefined,
      },
    };
  }

  // 9) Insert project + initial revision.
  const title = brandName.trim() || 'Untitled SparkPage';
  const slug = makeSlug(title);
  const { data: project, error: projectErr } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      template_id: templateId,
      title,
      slug,
      overrides,
      business_phone: v1Input.contact.phone || null,
      creation_method: 'url',
    })
    .select(PROJECT_COLS)
    .single();
  if (projectErr || !project) {
    return NextResponse.json(
      { error: projectErr?.message || 'Project insert failed' },
      { status: 500 },
    );
  }

  await supabase.from('project_revisions').insert({
    project_id: (project as ProjectRow).id,
    overrides,
    created_by: user.id,
  });

  return NextResponse.json(
    { project: rowToDTO(project as ProjectRow) },
    { status: 201 },
  );
}
