import { NextResponse } from 'next/server';
import { getCurrentRole } from '@/lib/auth/role';

export const dynamic = 'force-dynamic';

/**
 * GET /api/me/role
 *
 * Returns the current session's resolved SparkPage role (with env-var admin
 * bootstrap applied) plus the user id/email. Used by client components that
 * need to gate UI without re-running server logic.
 */
export async function GET() {
  const { userId, email, role } = await getCurrentRole();
  return NextResponse.json({ userId, email, role });
}
