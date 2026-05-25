import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SetPasswordClient from './SetPasswordClient';

/**
 * Blocking password-setup screen. Reached on first sign-in (magic link or
 * invite) when profiles.password_set is still false. The /auth/callback
 * route enforces the redirect; this page double-checks the session.
 */
export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { next } = await searchParams;
  const safeNext = next && next.startsWith('/') && !next.startsWith('/auth/') ? next : '/dashboard';

  return <SetPasswordClient email={user.email ?? ''} next={safeNext} />;
}
