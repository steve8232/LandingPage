import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match every request path except:
     * - _next/static  (build artifacts)
     * - _next/image   (image optimizer)
     * - favicon.ico
     * - image files served from /public
     * The composer API + editor flow keep working unauthenticated; auth
     * gating happens inside individual routes once Phase 2 lands.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
