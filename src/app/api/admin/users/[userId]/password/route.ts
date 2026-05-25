import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/role';

const MIN_LENGTH = 8;

/**
 * POST /api/admin/users/[userId]/password  { password: string }
 *
 * Admin-only. Sets the target user's password via the service-role
 * auth.admin.updateUserById and flips profiles.password_set=true so the
 * /auth/callback gate skips set-password for the new credential.
 *
 * Self-targeting is rejected — admins should use /auth/forgot-password
 * to change their own password.
 */
export async function POST(
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
  if (userId === gate.userId) {
    return NextResponse.json(
      { error: 'Use the password-reset flow to change your own password.' },
      { status: 400 }
    );
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  const password = typeof (body as { password?: unknown })?.password === 'string'
    ? ((body as { password: string }).password)
    : '';
  if (password.length < MIN_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_LENGTH} characters.` },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { error: authErr } = await admin.auth.admin.updateUserById(userId, { password });
  if (authErr) {
    return NextResponse.json({ error: authErr.message }, { status: 500 });
  }

  const { error: profErr } = await admin
    .from('profiles')
    .update({ password_set: true })
    .eq('user_id', userId);
  if (profErr) {
    return NextResponse.json({ error: profErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
