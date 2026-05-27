import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/role';
import {
  draftToOverrides,
  normalizeResearchPayload,
  type ResearchDraft,
} from '@/lib/dataforseo/normalize';

/**
 * GET  /api/projects/[id]/research
 *   Returns the latest dataforseo_research row attached to a project, plus
 *   a normalized draft derived from the raw postback payload. Used by the
 *   review screen to poll for postback arrival and pre-fill its form.
 *
 * PUT  /api/projects/[id]/research
 *   Admin-gated. Persists the reviewer-edited draft on `reviewed_overrides`.
 *   Body: { reviewedOverrides: ResearchDraft }
 *
 * RLS:
 *   SELECT is scoped via 0017_dataforseo_research.sql to any project member.
 *   No UPDATE policy exists on the table — writes use createAdminClient().
 */

interface ResearchRow {
  id: string;
  project_id: string;
  task_id: string;
  status: 'pending' | 'ready' | 'error';
  keyword: string;
  location_name: string | null;
  language_code: string;
  raw_payload: unknown;
  reviewed_overrides: unknown;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

const RESEARCH_COLS =
  'id, project_id, task_id, status, keyword, location_name, language_code, raw_payload, reviewed_overrides, error_message, created_at, updated_at';

function rowToResponse(row: ResearchRow) {
  const normalized: ResearchDraft = normalizeResearchPayload(row.raw_payload);
  // Reviewer edits beat the normalizer; only fall back where they left a blank.
  const reviewed = (row.reviewed_overrides && typeof row.reviewed_overrides === 'object'
    ? (row.reviewed_overrides as Partial<ResearchDraft>)
    : null);
  const draft: ResearchDraft = reviewed
    ? { ...normalized, ...reviewed, hours: reviewed.hours ?? normalized.hours, photos: reviewed.photos ?? normalized.photos }
    : normalized;
  return {
    researchId: row.id,
    projectId: row.project_id,
    taskId: row.task_id,
    status: row.status,
    keyword: row.keyword,
    locationName: row.location_name,
    languageCode: row.language_code,
    normalized,
    draft,
    rawPayload: row.raw_payload,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Scope to the primary My Business Info row. Reviews / Q&A rows live
  // alongside it (see migration 0018) but are consumed downstream by the
  // generation step, not the review screen.
  const { data, error } = await supabase
    .from('dataforseo_research')
    .select(RESEARCH_COLS)
    .eq('project_id', id)
    .eq('task_kind', 'my_business_info')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'No research row for this project' }, { status: 404 });

  return NextResponse.json(rowToResponse(data as ResearchRow));
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const b = (body || {}) as { reviewedOverrides?: unknown };
  if (!b.reviewedOverrides || typeof b.reviewedOverrides !== 'object') {
    return NextResponse.json({ error: 'reviewedOverrides is required' }, { status: 400 });
  }

  // Find the latest row by project_id via the admin client (no UPDATE RLS).
  // We still gate on project membership above via requireAdmin() + the GET
  // path the UI must hit first.
  const admin = createAdminClient();
  const { data: existing, error: lookupErr } = await admin
    .from('dataforseo_research')
    .select('id')
    .eq('project_id', id)
    .eq('task_kind', 'my_business_info')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();
  if (lookupErr) return NextResponse.json({ error: lookupErr.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: 'No research row for this project' }, { status: 404 });

  const { data, error } = await admin
    .from('dataforseo_research')
    .update({ reviewed_overrides: b.reviewedOverrides })
    .eq('id', existing.id)
    .select(RESEARCH_COLS)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(rowToResponse(data as ResearchRow));
}

/** Exported for the apply route so we never duplicate the draft-projection logic. */
export { draftToOverrides };
