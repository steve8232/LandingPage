import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Server-side RBAC helpers for SparkPage.
 *
 * Source of truth is the `profiles.role` column (see 0012_rbac.sql).
 * On first call for an authenticated session, we also consult the
 * `SPARKPAGE_ADMIN_EMAILS` env var — if the user's email appears in that
 * comma-separated list and their stored role is still 'user', we upsert
 * to 'admin' via the service-role client. This is the bootstrap path that
 * keeps a Postgres-only deploy from needing manual SQL edits.
 */

export type SparkPageRole = 'admin' | 'user';

/** Lowercase, trimmed admin email allowlist from the env var. */
function adminEmailAllowlist(): Set<string> {
  const raw = process.env.SPARKPAGE_ADMIN_EMAILS || '';
  return new Set(
    raw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

export interface CurrentRoleResult {
  /** Auth user id, or null when not signed in. */
  userId: string | null;
  /** Auth email, or null when not signed in / not available. */
  email: string | null;
  /** Resolved role, or null when not signed in. */
  role: SparkPageRole | null;
}

/**
 * Returns the role of the current session's user, applying env-var admin
 * bootstrap on the fly. Safe to call from Server Components / Route Handlers.
 *
 * Never throws — on any error returns role=null and lets the caller decide.
 */
export async function getCurrentRole(): Promise<CurrentRoleResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { userId: null, email: null, role: null };

  const email = (user.email ?? '').toLowerCase();
  const allowlist = adminEmailAllowlist();
  const shouldBeAdmin = !!email && allowlist.has(email);

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle<{ role: SparkPageRole }>();

  let role: SparkPageRole = (profile?.role as SparkPageRole) || 'user';

  // Bootstrap: promote to admin on first match. Uses the service-role client
  // because the RLS update policy on profiles is admin-only and we may not
  // be one yet.
  if (shouldBeAdmin && role !== 'admin') {
    try {
      const admin = createAdminClient();
      await admin
        .from('profiles')
        .upsert(
          { user_id: user.id, email: user.email, role: 'admin' },
          { onConflict: 'user_id' }
        );
      role = 'admin';
    } catch (err) {
      console.warn('[auth/role] admin bootstrap upsert failed:', err);
    }
  }

  return { userId: user.id, email: user.email ?? null, role };
}

export interface RequireAdminOk {
  ok: true;
  userId: string;
  email: string | null;
}
export interface RequireAdminErr {
  ok: false;
  status: 401 | 403;
  error: string;
}
export type RequireAdminResult = RequireAdminOk | RequireAdminErr;

/**
 * Route-handler gate. Returns { ok:true, userId } when the caller is an
 * admin; { ok:false, status, error } otherwise so the route can do:
 *
 *   const gate = await requireAdmin();
 *   if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });
 */
export async function requireAdmin(): Promise<RequireAdminResult> {
  const { userId, email, role } = await getCurrentRole();
  if (!userId) return { ok: false, status: 401, error: 'Unauthorized' };
  if (role !== 'admin') return { ok: false, status: 403, error: 'Admin role required' };
  return { ok: true, userId, email };
}
