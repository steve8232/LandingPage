import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/role';

/**
 * PATCH /api/admin/projects/[id]/owner  { ownerId?, ownerEmail? }
 *
 * Admin-only. Reassigns projects.user_id to a new user. Accepts either an
 * explicit ownerId (preferred) or an ownerEmail looked up in profiles.
 *
 * Also clears any project_collaborators row for the new owner — the owner
 * is implicitly an editor, so leaving a duplicate row would be misleading.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: 'Project id required' }, { status: 400 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  const b = (body || {}) as Record<string, unknown>;
  const explicitId = typeof b.ownerId === 'string' ? b.ownerId.trim() : '';
  const email = typeof b.ownerEmail === 'string' ? b.ownerEmail.trim().toLowerCase() : '';
  if (!explicitId && !email) {
    return NextResponse.json(
      { error: 'ownerId or ownerEmail required' },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Resolve the target profile.
  const profileQuery = explicitId
    ? admin.from('profiles').select('user_id, email').eq('user_id', explicitId)
    : admin.from('profiles').select('user_id, email').ilike('email', email);
  const { data: targetProfile } = await profileQuery
    .maybeSingle<{ user_id: string; email: string | null }>();
  if (!targetProfile) {
    return NextResponse.json(
      { error: 'No SparkPage account found for that user.' },
      { status: 404 }
    );
  }

  // Confirm project exists.
  const { data: project } = await admin
    .from('projects')
    .select('id, user_id')
    .eq('id', id)
    .maybeSingle<{ id: string; user_id: string }>();
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  if (project.user_id === targetProfile.user_id) {
    return NextResponse.json({
      ok: true,
      ownerId: targetProfile.user_id,
      ownerEmail: targetProfile.email,
      unchanged: true,
    });
  }

  // Reassign owner.
  const { error: updErr } = await admin
    .from('projects')
    .update({ user_id: targetProfile.user_id })
    .eq('id', id);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  // Drop the new owner's collaborator row if present (owner implies edit).
  await admin
    .from('project_collaborators')
    .delete()
    .eq('project_id', id)
    .eq('user_id', targetProfile.user_id);

  return NextResponse.json({
    ok: true,
    ownerId: targetProfile.user_id,
    ownerEmail: targetProfile.email,
  });
}
