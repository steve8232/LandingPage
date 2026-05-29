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
  draftToOverrides,
  normalizeResearchPayload,
  type ResearchDraft,
} from '@/lib/dataforseo/normalize';
import type { V1ContentOverrides } from '../../../../../../../v1/composer/composeV1Template';

/**
 * POST /api/projects/[id]/research/apply
 *
 * Admin-gated. Promotes the reviewer-edited draft on the research row into
 * the project's `overrides` so the next deploy ships with the looked-up
 * business info. Steps:
 *
 *   1. Load the latest research row for the project (admin client, since the
 *      apply path is admin-only anyway and the row may carry no reviewed
 *      edits if the operator skipped the form — in which case we apply the
 *      normalizer output verbatim).
 *   2. Compose the meta-only overrides slice via draftToOverrides().
 *   3. Read current project.overrides, shallow-merge meta on top, leave
 *      sections / assets / formOverrides untouched.
 *   4. UPDATE projects + append a project_revisions row (mirrors PATCH
 *      /api/projects/[id]).
 */

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

  // 1) Latest primary research row for this project (the My Business Info
  // task — Reviews and Q&A live alongside it but aren't applied to overrides
  // here; they feed the generation step).
  const { data: research, error: rErr } = await admin
    .from('dataforseo_research')
    .select('id, status, raw_payload, reviewed_overrides')
    .eq('project_id', id)
    .eq('task_kind', 'my_business_info')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<{
      id: string;
      status: 'pending' | 'ready' | 'error';
      raw_payload: unknown;
      reviewed_overrides: unknown;
    }>();
  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 });
  if (!research) {
    return NextResponse.json({ error: 'No research row for this project' }, { status: 404 });
  }
  if (research.status !== 'ready') {
    return NextResponse.json(
      { error: `Research not ready (status=${research.status})` },
      { status: 409 },
    );
  }

  // 2) Read the project first so draftToOverrides can honor any values the
  // user already supplied at wizard time (research enriches, never clobbers).
  const { data: project, error: pErr } = await supabase
    .from('projects')
    .select('id, overrides, business_phone')
    .eq('id', id)
    .maybeSingle<{ id: string; overrides: V1ContentOverrides | null; business_phone: string | null }>();
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // 3) Compose the meta slice.
  //
  // Two paths converge here with different intents:
  //   • Reviewed apply  (reviewed_overrides set): the operator stared at the
  //     draft on the review screen and clicked Apply. Their edits must land
  //     on the page, even if `project.overrides.meta` already carries a
  //     value from the wizard. We pass `undefined` for `existing` so the
  //     draft is treated as authoritative.
  //   • Auto apply (reviewed_overrides null): nothing's been reviewed —
  //     we're enriching the project with the raw normalizer output. Keep
  //     the "research enriches, never clobbers" default by passing the
  //     current meta as `existing`.
  const normalized = normalizeResearchPayload(research.raw_payload);
  const reviewed = (research.reviewed_overrides && typeof research.reviewed_overrides === 'object'
    ? (research.reviewed_overrides as Partial<ResearchDraft>)
    : null);
  const draft: ResearchDraft = reviewed
    ? { ...normalized, ...reviewed, hours: reviewed.hours ?? normalized.hours, photos: reviewed.photos ?? normalized.photos }
    : normalized;
  const currentOverrides: V1ContentOverrides = project.overrides || {};
  const slice = draftToOverrides(draft, reviewed ? undefined : currentOverrides.meta);

  const nextOverrides: V1ContentOverrides = {
    ...currentOverrides,
    meta: { ...(currentOverrides.meta || {}), ...(slice.meta || {}) },
  };

  // Also bubble the business phone up to the dedicated column so CallRail
  // provision picks it up without a re-read of the override JSON. Existing
  // value wins so a user-typed phone survives a research postback.
  const nextBusinessPhone =
    project.business_phone || draft.phone || null;

  // 4) Persist + append revision.
  const { data: updated, error: uErr } = await supabase
    .from('projects')
    .update({
      overrides: nextOverrides,
      business_phone: nextBusinessPhone,
    })
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

  // Stamp applied_at on the research row so the review screen can show
  // "Applied X ago" and tell saved-but-not-applied from already-applied.
  // Best-effort — failure to stamp doesn't fail the apply itself.
  const appliedAt = new Date().toISOString();
  await admin
    .from('dataforseo_research')
    .update({ applied_at: appliedAt })
    .eq('id', research.id);

  return NextResponse.json({
    project: rowToDTO(updated as ProjectRow),
    appliedMeta: slice.meta || {},
    appliedAt,
  });
}
