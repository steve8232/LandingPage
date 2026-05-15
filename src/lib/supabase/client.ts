import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase client for Client Components (runs in the browser).
 * Uses the anon key; RLS policies enforce per-user access on the DB side.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
