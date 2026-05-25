import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ResetPasswordClient from './ResetPasswordClient';

/**
 * Reached from the password-recovery email. /auth/callback has already
 * exchanged the code for a session, so getUser() returns the recovering
 * account. Without a session we punt back to /auth/forgot-password.
 */
export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/forgot-password');
  }
  return <ResetPasswordClient email={user.email ?? ''} />;
}
