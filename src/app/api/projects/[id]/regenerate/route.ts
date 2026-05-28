import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/role';
import {
  rowToDTO,
  PROJECT_COLS,
  type ProjectRow,
} from '@/lib/projects/types';
import {
  normalizeResearchPayload,
  normalizeReviewsPayload,
  normalizeQuestionsPayload,
  type ResearchDraft,
} from '@/lib/dataforseo/normalize';
import { isV1Template, getV1Spec } from '../../../../../../v1/specs/index';
import type { V1ContentOverrides } from '../../../../../../v1/composer/composeV1Template';
import { generateV1Content, type V1FormInput } from '../../../../../../v1/composer/generateV1Content';
import { enhanceV1Content } from '../../../../../../v1/composer/enhanceV1Content';
import { researchCompetitors } from '../../../../../../v1/composer/researchCompetitors';
import { enrichNicheFromResearch } from '../../../../../../v1/composer/enrichNicheFromResearch';
import { expandNeighborhoods } from '../../../../../../v1/composer/expandNeighborhoods';
import { parseAreaChips } from '@/lib/chat/normalize';

/**
 * POST /api/projects/[id]/regenerate
 *
 * Admin-gated. Closes the research loop: takes the three DataForSEO research
 * rows already populated for this project (my_business_info, reviews,
 * questions_and_answers), builds a V1FormInput grounded in real business data,
 * runs the v1 AI generation + enhancement passes, and persists the resulting
 * overrides on the project. Existing meta fields (anything the apply route
 * already pinned) are preserved.
 *
 * Mirrors /api/projects/[id]/research/apply for auth, project loading, and
 * project_revisions append.
 */

// Same as /api/generate-landing-page — three serial OpenAI calls (optional
// competitor research → generate → enhance) need more than the 15s default.
export const maxDuration = 60;

type ResearchRowLite = {
  status: 'pending' | 'ready' | 'error';
  raw_payload: unknown;
  reviewed_overrides: unknown;
  keyword: string | null;
  location_name: string | null;
};

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  // 1) Load the project (RLS-respecting). Need template_id to pick the v1 spec.
  const { data: project, error: pErr } = await supabase
    .from('projects')
    .select('id, template_id, overrides, business_phone')
    .eq('id', id)
    .maybeSingle<{
      id: string;
      template_id: string;
      overrides: V1ContentOverrides | null;
      business_phone: string | null;
    }>();
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const templateId = project.template_id;
  if (!isV1Template(templateId)) {
    return NextResponse.json(
      { error: `Project template is not a v1 spec: ${templateId}` },
      { status: 400 },
    );
  }
  const spec = getV1Spec(templateId);
  if (!spec) {
    return NextResponse.json({ error: `Spec not found for template: ${templateId}` }, { status: 500 });
  }

  // 2) Load the latest row per task_kind. Service-role read — the table has
  //    no UPDATE RLS, but SELECT is member-scoped; admin client keeps this
  //    route consistent with /research/apply's load pattern.
  const { data: rows, error: rErr } = await admin
    .from('dataforseo_research')
    .select('task_kind, status, raw_payload, reviewed_overrides, keyword, location_name, created_at')
    .eq('project_id', id)
    .in('task_kind', ['my_business_info', 'reviews', 'questions_and_answers'])
    .order('created_at', { ascending: false });
  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 });

  const latestByKind = new Map<string, ResearchRowLite>();
  for (const r of (rows || []) as Array<ResearchRowLite & { task_kind: string }>) {
    if (!latestByKind.has(r.task_kind)) latestByKind.set(r.task_kind, r);
  }
  const primary = latestByKind.get('my_business_info');
  if (!primary) {
    return NextResponse.json({ error: 'No research row for this project' }, { status: 404 });
  }
  if (primary.status !== 'ready') {
    return NextResponse.json(
      { error: `Research not ready (status=${primary.status})` },
      { status: 409 },
    );
  }

  // 3) Normalize the three payloads. Reviewer edits on the primary row win
  //    over the raw normalizer output (mirrors /research/apply).
  const normalized = normalizeResearchPayload(primary.raw_payload);
  const reviewed = (primary.reviewed_overrides && typeof primary.reviewed_overrides === 'object'
    ? (primary.reviewed_overrides as Partial<ResearchDraft>)
    : null);
  const draft: ResearchDraft = reviewed
    ? { ...normalized, ...reviewed, hours: reviewed.hours ?? normalized.hours, photos: reviewed.photos ?? normalized.photos }
    : normalized;

  const reviewsRow = latestByKind.get('reviews');
  const reviewQuotes = reviewsRow && reviewsRow.status === 'ready'
    ? normalizeReviewsPayload(reviewsRow.raw_payload).map((r) => r.text).slice(0, 5)
    : [];

  const questionsRow = latestByKind.get('questions_and_answers');
  const faqs = questionsRow && questionsRow.status === 'ready'
    ? normalizeQuestionsPayload(questionsRow.raw_payload).slice(0, 6)
    : [];

  // 4) Build V1FormInput. Prefer the DataForSEO `category` label over the raw
  //    search keyword for the niche signal — the keyword often contains brand
  //    name ("Allied Roofing Inc") which makes terrible niche grounding,
  //    whereas `category` ("Roofing contractor") is clean and consistent.
  const currentOverrides: V1ContentOverrides = project.overrides || {};
  const currentMeta = currentOverrides.meta || {};
  const rawKeyword = (primary.keyword || '').trim();
  const niche = (draft.category || rawKeyword).trim();
  const brandName = currentMeta.businessName || draft.businessName || undefined;
  const address = currentMeta.businessAddress || draft.address || undefined;
  const phone = project.business_phone || draft.phone || '';
  const hoursLine = draft.hours.length ? draft.hours.join('; ') : undefined;

  // place_topics → backstop "customer love" line when the reviews task failed.
  // Top 3 themes by mention count, joined into a single phrase. Same shape the
  // AI would otherwise hallucinate from review quotes.
  const topThemes = (draft.placeTopics || []).slice(0, 3).map((t) => t.topic);
  const placeTopicsLove = topThemes.length
    ? `Customers consistently mention ${topThemes.join(', ')}.`
    : '';

  // 5) Enrichment + grounded competitor research in parallel. Both are
  //    best-effort: either failing returns null and we degrade to whatever
  //    grounding we already have. Same 60s budget as before because both
  //    helpers cap at ~12s and the two downstream generation passes need ~30s.
  const locationSignal = address || primary.location_name || undefined;
  const competitorEnabled = process.env.OPENAI_WEB_SEARCH_ENABLED !== 'false' && Boolean(process.env.OPENAI_API_KEY);
  const knownCompetitors = (draft.relatedBusinesses || [])
    .map((b) => b.name)
    .filter(Boolean)
    .slice(0, 5);

  const [enrichmentRes, competitorRes] = await Promise.allSettled([
    (draft.category || draft.description) && (draft.addressCity || draft.addressRegion)
      ? enrichNicheFromResearch({
          category: draft.category,
          description: draft.description,
          ...(brandName && { brandName }),
          city: draft.addressCity,
          region: draft.addressRegion,
          ...(draft.addressBorough && { borough: draft.addressBorough }),
          ...(draft.addressZip && { zip: draft.addressZip }),
          ...(draft.placeTopics.length && { placeTopics: draft.placeTopics }),
        })
      : Promise.resolve(null),
    competitorEnabled && niche
      ? researchCompetitors({
          niche,
          location: locationSignal,
          excludeBrand: brandName,
          ...(knownCompetitors.length && { knownCompetitors }),
        })
      : Promise.resolve(null),
  ]);

  const enrichment = enrichmentRes.status === 'fulfilled' ? enrichmentRes.value : null;
  const competitor = competitorRes.status === 'fulfilled' ? competitorRes.value : null;
  if (enrichmentRes.status === 'rejected') console.warn('[regenerate] Enrichment failed:', enrichmentRes.reason);
  if (competitorRes.status === 'rejected') console.warn('[regenerate] Competitor research failed:', competitorRes.reason);

  // 6) Resolve service areas with a five-step fallback chain:
  //      reviewer-supplied  >  enrichment pre-pass  >  competitor-derived
  //      >  chat-wizard freeform text (parsed for chip-able items)
  //      >  on-demand AI expansion seeded by city/region + freeform text
  //    Only the first non-empty source wins so we never blend hallucinated
  //    areas with operator-vetted ones.
  let serviceAreas: string[] = [];
  let serviceAreasSource: 'reviewer' | 'enrichment' | 'competitors' | 'meta' | 'expand' | 'none' = 'none';
  if (draft.serviceAreas && draft.serviceAreas.length) {
    serviceAreas = draft.serviceAreas.slice(0, 16);
    serviceAreasSource = 'reviewer';
  } else if (enrichment && enrichment.serviceAreas.length) {
    serviceAreas = enrichment.serviceAreas.slice(0, 16);
    serviceAreasSource = 'enrichment';
  } else if (competitor && competitor.serviceAreas.length) {
    serviceAreas = competitor.serviceAreas.slice(0, 16);
    serviceAreasSource = 'competitors';
  } else if (currentMeta.serviceAreaText) {
    const metaChips = parseAreaChips(currentMeta.serviceAreaText);
    if (metaChips.length) {
      serviceAreas = metaChips;
      serviceAreasSource = 'meta';
    }
  }
  if (!serviceAreas.length && draft.addressCity) {
    try {
      const expanded = await expandNeighborhoods({
        niche: niche || undefined,
        city: draft.addressCity,
        state: draft.addressRegion || undefined,
        zip: draft.addressZip || undefined,
        serviceAreaText: currentMeta.serviceAreaText || undefined,
        excludeBrand: brandName,
      });
      if (expanded && expanded.length) {
        serviceAreas = expanded.slice(0, 16);
        serviceAreasSource = 'expand';
      }
    } catch (err) {
      console.warn('[regenerate] expandNeighborhoods failed:', err);
    }
  }

  // Soft-grounding fields: only fall back to enrichment when the primary
  // source is blank — never clobber actual reviews/description content.
  const uniqueValue = draft.description || enrichment?.uniqueValue || '';
  const customerLove = placeTopicsLove
    || (reviewQuotes.length ? '' : enrichment?.customerLove || '')
    || '';
  const productService = niche || enrichment?.productService || '';

  const v1Input: V1FormInput = {
    business: {
      productService,
      offer: '',
      pricing: '',
      cta: '',
      uniqueValue,
      customerLove,
      images: draft.photos || [],
      ...(brandName && { brandName }),
      ...(address && { address }),
      ...(hoursLine && { hours: hoursLine }),
      ...(serviceAreas.length && { serviceAreas }),
      ...(draft.rating != null && { rating: draft.rating }),
      ...(draft.reviewCount != null && { reviewCount: draft.reviewCount }),
      ...(reviewQuotes.length && { reviewQuotes }),
      ...(faqs.length && { faqs }),
      ...(competitor?.brief && { competitorContext: competitor.brief }),
    },
    contact: {
      email: '',
      phone,
    },
  };

  console.log(
    `[regenerate] grounding: niche="${productService}" serviceAreas=${serviceAreas.length}(${serviceAreasSource})`
    + ` enrichment=${enrichment ? 'ok' : 'none'} competitors=${competitor?.competitors.length ?? 0}`
    + ` reviews=${reviewQuotes.length} faqs=${faqs.length} topics=${draft.placeTopics.length}`,
  );

  // 6) Run the two AI passes. Failures bubble as 500 — unlike the legacy
  //    route, there's no fallback content path here; the project already has
  //    spec defaults applied at apply time.
  let nextOverrides: V1ContentOverrides;
  try {
    let overrides = await generateV1Content(v1Input, spec);
    console.log('[regenerate] Content overrides generated');
    overrides = await enhanceV1Content(v1Input, spec, overrides);
    console.log('[regenerate] Enhancement pass complete');

    // 7) Merge: AI-generated sections/formOverrides win, but the meta block
    //    we already applied at /research/apply time wins over the AI's meta
    //    (it carries phone, verified business name, etc.). Same shape rule
    //    as /research/apply's nextOverrides. City/state from the research
    //    draft are backfilled when the meta hasn't been seeded with them
    //    yet so the composer's token-interpolation pass can resolve [City].
    const cityFallback = draft.addressCity || undefined;
    const stateFallback = draft.addressRegion || undefined;
    nextOverrides = {
      ...currentOverrides,
      ...overrides,
      meta: {
        ...(overrides.meta || {}),
        ...(cityFallback && { city: cityFallback }),
        ...(stateFallback && { state: stateFallback }),
        ...currentMeta,
      },
    };
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Generation failed' },
      { status: 500 },
    );
  }

  // 8) Persist + append revision (mirrors /research/apply).
  const { data: updated, error: uErr } = await supabase
    .from('projects')
    .update({ overrides: nextOverrides })
    .eq('id', id)
    .select(PROJECT_COLS)
    .maybeSingle();
  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await supabase.from('project_revisions').insert({
    project_id: id,
    overrides: nextOverrides,
    created_by: user.id,
  });

  return NextResponse.json({
    project: rowToDTO(updated as ProjectRow),
    sources: {
      myBusinessInfo: primary.status === 'ready',
      reviews: reviewQuotes.length,
      questions: faqs.length,
      competitorContext: Boolean(v1Input.business.competitorContext),
      competitors: competitor?.competitors.length ?? 0,
      enrichment: Boolean(enrichment),
      serviceAreas: serviceAreas.length,
      serviceAreasSource,
      placeTopics: draft.placeTopics.length,
    },
  });
}
