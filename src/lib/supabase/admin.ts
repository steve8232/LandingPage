import { createClient } from '@supabase/supabase-js';

/**
 * Service-role client. Bypasses Row-Level Security — server-only.
 * Use for admin operations (e.g. cross-user reads, deploy bookkeeping).
 *
 * NEVER import this from a Client Component. The service-role key is
 * not prefixed with NEXT_PUBLIC_ so Next won't expose it to the browser,
 * but accidental imports from client code will fail loudly at build time.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      '[supabase/admin] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    );
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
