import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/role';

/**
 * Per-project collaborator management.
 *
 *   GET    /api/projects/[id]/collaborators
 *     Visible to anyone with project access (RLS on project_collaborators).
 *     Returns { owner, collaborators[] } enriched with profile.email.
 *
 *   POST   /api/projects/[id]/collaborators       { email, role }
 *     Admin-only. Looks up the user by email in `profiles`; 404s when the
 *     person hasn't signed up yet.
 *
 *   DELETE /api/projects/[id]/collaborators?userId=...
 *     Admin-only. Removes the collaborator row.
 */

export interface CollaboratorDTO {
  userId: string;
  email: string | null;
  role: 'viewer' | 'editor';
  addedAt: string;
}

export interface OwnerDTO {
  userId: string;
  email: string | null;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Confirm project visibility (RLS will hide it otherwise).
  const { data: project } = await supabase
    .from('projects')
    .select('id, user_id')
    .eq('id', id)
    .maybeSingle<{ id: string; user_id: string }>();
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Admin client used for the cross-user profile lookup so we can render
  // emails even when the caller can't see other profiles directly.
  const admin = createAdminClient();
  const { data: ownerProfile } = await admin
    .from('profiles')
    .select('email')
    .eq('user_id', project.user_id)
    .maybeSingle<{ email: string | null }>();

  const { data: rows } = await supabase
    .from('project_collaborators')
    .select('user_id, role, added_at')
    .eq('project_id', id);
  const collaboratorRows = (rows ?? []) as Array<{
    user_id: string;
    role: 'viewer' | 'editor';
    added_at: string;
  }>;

  let emailById = new Map<string, string | null>();
  if (collaboratorRows.length > 0) {
    const { data: profs } = await admin
      .from('profiles')
      .select('user_id, email')
      .in('user_id', collaboratorRows.map((r) => r.user_id));
    emailById = new Map(
      ((profs ?? []) as Array<{ user_id: string; email: string | null }>).map(
        (p) => [p.user_id, p.email]
      )
    );
  }

  const owner: OwnerDTO = {
    userId: project.user_id,
    email: ownerProfile?.email ?? null,
  };
  const collaborators: CollaboratorDTO[] = collaboratorRows.map((r) => ({
    userId: r.user_id,
    email: emailById.get(r.user_id) ?? null,
    role: r.role,
    addedAt: r.added_at,
  }));

  return NextResponse.json({ owner, collaborators });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  const b = (body || {}) as Record<string, unknown>;
  const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : '';
  const role = b.role === 'viewer' ? 'viewer' : 'editor';
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  const admin = createAdminClient();
  const { data: prof } = await admin
    .from('profiles')
    .select('user_id, email')
    .ilike('email', email)
    .maybeSingle<{ user_id: string; email: string | null }>();
  if (!prof) {
    return NextResponse.json(
      { error: 'No SparkPage account found for that email. Ask them to sign up first.' },
      { status: 404 }
    );
  }

  const { error } = await admin
    .from('project_collaborators')
    .upsert(
      { project_id: id, user_id: prof.user_id, role, added_by: gate.userId },
      { onConflict: 'project_id,user_id' }
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const dto: CollaboratorDTO = {
    userId: prof.user_id,
    email: prof.email,
    role,
    addedAt: new Date().toISOString(),
  };
  return NextResponse.json({ collaborator: dto }, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const userId = new URL(request.url).searchParams.get('userId') || '';
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin
    .from('project_collaborators')
    .delete()
    .eq('project_id', id)
    .eq('user_id', userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
