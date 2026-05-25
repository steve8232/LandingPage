import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/role';

/**
 * POST /api/admin/users/invite  { email, role? }
 *
 * Admin-only. Calls supabase.auth.admin.inviteUserByEmail to send a Supabase
 * magic-link invite; on success the on_auth_user_created trigger inserts a
 * default profile row, which we then upsert to the requested role.
 *
 * Returns { user: { id, email, role } }.
 */
export async function POST(request: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  const b = (body || {}) as Record<string, unknown>;
  const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : '';
  const role = b.role === 'admin' ? 'admin' : 'user';
  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  const admin = createAdminClient();

  // If the user already exists, skip the invite and just adjust their role.
  const { data: existing } = await admin
    .from('profiles')
    .select('user_id, email, role')
    .ilike('email', email)
    .maybeSingle<{ user_id: string; email: string | null; role: 'admin' | 'user' }>();
  if (existing) {
    if (existing.role !== role) {
      const { error: updErr } = await admin
        .from('profiles')
        .update({ role })
        .eq('user_id', existing.user_id);
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
    }
    return NextResponse.json({
      user: { id: existing.user_id, email: existing.email, role },
      alreadyExisted: true,
    });
  }

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email);
  if (error || !data?.user) {
    return NextResponse.json(
      { error: error?.message || 'Invite failed' },
      { status: 500 }
    );
  }
  const invitedId = data.user.id;

  // The on_auth_user_created trigger creates a default profile (role='user').
  // Upsert to align role + email in case the trigger lost a race.
  const { error: upsertErr } = await admin
    .from('profiles')
    .upsert(
      { user_id: invitedId, email, role },
      { onConflict: 'user_id' }
    );
  if (upsertErr) {
    return NextResponse.json({ error: upsertErr.message }, { status: 500 });
  }

  return NextResponse.json(
    { user: { id: invitedId, email, role }, alreadyExisted: false },
    { status: 201 }
  );
}
