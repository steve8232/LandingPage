import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rowToDTO, type ProjectRow } from '@/lib/projects/types';

/**
 * GET    /api/projects/[id]  — fetch one project (owner only, enforced by RLS)
 * PATCH  /api/projects/[id]  — update title and/or overrides; appends a revision
 * DELETE /api/projects/[id]  — hard delete (revisions + deployments cascade)
 */

const SELECT_COLS =
  'id, user_id, template_id, title, slug, overrides, created_at, updated_at';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('projects')
    .select(SELECT_COLS)
    .eq('id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ project: rowToDTO(data as ProjectRow) });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
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
  const patch: Record<string, unknown> = {};
  if (typeof b.title === 'string' && b.title.trim()) patch.title = b.title.trim();
  const hasOverrides = b.overrides !== undefined && b.overrides !== null
    && typeof b.overrides === 'object';
  if (hasOverrides) patch.overrides = b.overrides;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('projects')
    .update(patch)
    .eq('id', id)
    .select(SELECT_COLS)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Append-only revision row on every override mutation (history is cheap and
  // makes Phase 3 deployments + future undo possible).
  if (hasOverrides) {
    await supabase.from('project_revisions').insert({
      project_id: id,
      overrides: patch.overrides,
      created_by: user.id,
    });
  }

  return NextResponse.json({ project: rowToDTO(data as ProjectRow) });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
