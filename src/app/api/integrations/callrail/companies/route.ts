import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CallRailAuthError, listCompanies } from '@/lib/callrail/client';
import {
  CallRailNotConfiguredError,
  getCallRailAccountId,
  getCallRailApiKey,
} from '@/lib/callrail/server-config';

/**
 * GET /api/integrations/callrail/companies
 *   Returns the Company picklist for the CallRailPicker. Auth is via the
 *   global CALLRAIL_API_KEY env var (set on the server), so this route is
 *   just an auth-gated proxy that hides the key from the browser.
 *
 *   Response:
 *     { configured: true,  companies: [{ id, name, status }] }
 *     { configured: false, companies: [] }                       (env missing)
 *     { configured: true,  companies: [], error: '...' }         (CallRail rejected the key)
 */

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let apiKey: string;
  let accountId: string;
  try {
    apiKey = getCallRailApiKey();
    accountId = await getCallRailAccountId();
  } catch (err) {
    if (err instanceof CallRailNotConfiguredError) {
      return NextResponse.json({ configured: false, companies: [], error: null });
    }
    if (err instanceof CallRailAuthError) {
      return NextResponse.json({ configured: true, companies: [], error: 'CallRail rejected CALLRAIL_API_KEY.' });
    }
    const message = err instanceof Error ? err.message : 'Failed to resolve CallRail account';
    return NextResponse.json({ configured: true, companies: [], error: message });
  }

  try {
    const companies = await listCompanies(apiKey, accountId);
    return NextResponse.json({
      configured: true,
      companies: companies.map((c) => ({ id: c.id, name: c.name, status: c.status ?? null })),
      error: null,
    });
  } catch (err) {
    if (err instanceof CallRailAuthError) {
      return NextResponse.json({ configured: true, companies: [], error: 'CallRail rejected CALLRAIL_API_KEY.' });
    }
    const message = err instanceof Error ? err.message : 'Unknown CallRail error';
    return NextResponse.json({ configured: true, companies: [], error: message });
  }
}
