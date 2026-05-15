import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isV1Template } from '../../../../v1/specs';
import { makeSlug, rowToDTO, type ProjectRow } from '@/lib/projects/types';

/**
 * GET  /api/projects        — list current user's projects (most-recent first)
 * POST /api/projects        — create a new project (auto-creates on first cloud save)
 *
 * Auth is enforced by Supabase RLS via the SSR cookie. We still gate at the
 * route layer so 401s are clean.
 */

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('projects')
    .select('id, user_id, template_id, title, slug, overrides, created_at, updated_at')
    .order('updated_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as ProjectRow[];
  return NextResponse.json({ projects: rows.map(rowToDTO) });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const b = (body || {}) as Record<string, unknown>;
  const templateId = typeof b.templateId === 'string' ? b.templateId : '';
  const titleInput = typeof b.title === 'string' ? b.title.trim() : '';
  const overrides = (b.overrides && typeof b.overrides === 'object') ? b.overrides : {};

  if (!templateId || !isV1Template(templateId)) {
    return NextResponse.json({ error: 'Unknown templateId' }, { status: 400 });
  }

  const title = titleInput || `Untitled SparkPage`;
  const slug = makeSlug(title);

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      template_id: templateId,
      title,
      slug,
      overrides,
    })
    .select('id, user_id, template_id, title, slug, overrides, created_at, updated_at')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Insert failed' }, { status: 500 });
  }

  // Best-effort initial revision so history is non-empty from day one.
  await supabase.from('project_revisions').insert({
    project_id: data.id,
    overrides,
    created_by: user.id,
  });

  return NextResponse.json({ project: rowToDTO(data as ProjectRow) }, { status: 201 });
}
