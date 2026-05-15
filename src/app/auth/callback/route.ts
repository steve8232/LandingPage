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
  return NextResponse.redirect(`${origin}${safeNext}`);
}
