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

  // 4) Build V1FormInput. The research keyword is the niche signal —
  //    productService must be non-empty for the AI passes to fire, otherwise
  //    the route in generate-landing-page bails to spec defaults verbatim.
  const currentOverrides: V1ContentOverrides = project.overrides || {};
  const currentMeta = currentOverrides.meta || {};
  const niche = (primary.keyword || '').trim();
  const brandName = currentMeta.businessName || draft.businessName || undefined;
  const address = currentMeta.businessAddress || draft.address || undefined;
  const phone = project.business_phone || draft.phone || '';
  const hoursLine = draft.hours.length ? draft.hours.join('; ') : undefined;

  const v1Input: V1FormInput = {
    business: {
      productService: niche,
      offer: '',
      pricing: '',
      cta: '',
      uniqueValue: draft.description || '',
      customerLove: '',
      images: draft.photos || [],
      ...(brandName && { brandName }),
      ...(address && { address }),
      ...(hoursLine && { hours: hoursLine }),
      ...(draft.rating != null && { rating: draft.rating }),
      ...(draft.reviewCount != null && { reviewCount: draft.reviewCount }),
      ...(reviewQuotes.length && { reviewQuotes }),
      ...(faqs.length && { faqs }),
    },
    contact: {
      email: '',
      phone,
    },
  };

  // 5) Optional competitor research, gated by env var (same gate as the
  //    legacy wizard route). The marketing prompt degrades gracefully when
  //    competitorContext is absent.
  if (niche && process.env.OPENAI_WEB_SEARCH_ENABLED === 'true') {
    try {
      const locationSignal = address || primary.location_name || undefined;
      const research = await researchCompetitors({
        niche,
        location: locationSignal,
        excludeBrand: brandName,
      });
      if (research && research.brief) {
        v1Input.business.competitorContext = research.brief;
        console.log(`[regenerate] Competitor research: ${research.competitors.length} entries`);
      }
    } catch (err) {
      console.warn('[regenerate] Competitor research failed (continuing):', err);
    }
  }

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
    //    as /research/apply's nextOverrides.
    nextOverrides = {
      ...currentOverrides,
      ...overrides,
      meta: { ...(overrides.meta || {}), ...currentMeta },
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
    },
  });
}
