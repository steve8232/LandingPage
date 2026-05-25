import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/role';

/**
 * PATCH /api/admin/users/[userId]/role  { role: 'admin' | 'user' }
 *
 * Admin-only. Promotes or demotes a profile.role. Blocks self-demotion
 * when it would leave zero admins — admins must promote a peer first.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const { userId } = await context.params;
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  const next = (body as { role?: unknown })?.role;
  if (next !== 'admin' && next !== 'user') {
    return NextResponse.json({ error: "role must be 'admin' or 'user'" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (next === 'user' && userId === gate.userId) {
    const { count, error: countErr } = await admin
      .from('profiles')
      .select('user_id', { count: 'exact', head: true })
      .eq('role', 'admin');
    if (countErr) {
      return NextResponse.json({ error: countErr.message }, { status: 500 });
    }
    if ((count ?? 0) <= 1) {
      return NextResponse.json(
        { error: 'Cannot demote the last remaining admin. Promote someone else first.' },
        { status: 400 }
      );
    }
  }

  const { error } = await admin
    .from('profiles')
    .update({ role: next })
    .eq('user_id', userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, userId, role: next });
}
