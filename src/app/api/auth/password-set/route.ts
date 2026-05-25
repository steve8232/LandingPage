import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/auth/password-set
 *
 * Marks the current user's profile as having chosen a password. Called from
 * /auth/set-password and /auth/reset-password immediately after a successful
 * supabase.auth.updateUser({ password }).
 *
 * Uses the service-role client because the profiles UPDATE policy from
 * 0012_rbac.sql is admin-only.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('profiles')
    .update({ password_set: true })
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
