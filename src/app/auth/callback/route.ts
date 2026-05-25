import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Magic-link landing endpoint. Supabase emails a URL of the form
 *   /auth/callback?code=...&next=/
 * which exchanges the code for a session cookie, then redirects.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/auth/auth-code-error?reason=${encodeURIComponent(error.message)}`
    );
  }

  // Honor a relative `next` path; ignore anything that escapes the origin.
  const safeNext = next.startsWith('/') ? next : '/';

  // First-time / invited users land here without a password chosen. Gate the
  // entire app behind /auth/set-password until they pick one.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('password_set')
      .eq('user_id', user.id)
      .maybeSingle<{ password_set: boolean }>();
    if (!profile?.password_set && !safeNext.startsWith('/auth/')) {
      return NextResponse.redirect(
        `${origin}/auth/set-password?next=${encodeURIComponent(safeNext)}`
      );
    }
  }

  return NextResponse.redirect(`${origin}${safeNext}`);
}
