import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  CallRailAuthError,
  listAccounts,
  listCompanies,
} from '@/lib/callrail/client';

/**
 * Per-user CallRail key + account binding lives in public.user_integrations
 * (service-role only — see migration 0006). This route is the only surface
 * that ever touches the raw API key: GET resolves the stored key into
 * connected state + company picklist; PUT validates and persists a new key;
 * DELETE wipes the row.
 */

interface UserIntegrationsRow {
  user_id: string;
  callrail_api_key: string | null;
  callrail_account_id: string | null;
}

const DISCONNECTED = {
  connected: false,
  accountId: null,
  accountName: null,
  companies: [] as Array<{ id: string; name: string; status: string | null }>,
  error: null,
} as const;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: row } = await admin
    .from('user_integrations')
    .select('user_id, callrail_api_key, callrail_account_id')
    .eq('user_id', user.id)
    .maybeSingle<UserIntegrationsRow>();

  if (!row?.callrail_api_key || !row?.callrail_account_id) {
    return NextResponse.json(DISCONNECTED);
  }

  try {
    const [accounts, companies] = await Promise.all([
      listAccounts(row.callrail_api_key),
      listCompanies(row.callrail_api_key, row.callrail_account_id),
    ]);
    const account = accounts.find((a) => a.id === row.callrail_account_id) ?? accounts[0] ?? null;
    return NextResponse.json({
      connected: true,
      accountId: row.callrail_account_id,
      accountName: account?.name ?? null,
      companies: companies.map((c) => ({ id: c.id, name: c.name, status: c.status ?? null })),
      error: null,
    });
  } catch (err) {
    if (err instanceof CallRailAuthError) {
      return NextResponse.json({
        connected: true,
        accountId: row.callrail_account_id,
        accountName: null,
        companies: [],
        error: 'CallRail rejected the stored API key. Reconnect to refresh.',
      });
    }
    const message = err instanceof Error ? err.message : 'Unknown CallRail error';
    return NextResponse.json({
      connected: true,
      accountId: row.callrail_account_id,
      accountName: null,
      companies: [],
      error: message,
    });
  }
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const apiKey = typeof (body as { apiKey?: unknown })?.apiKey === 'string'
    ? ((body as { apiKey: string }).apiKey).trim()
    : '';
  if (!apiKey) {
    return NextResponse.json({ error: 'apiKey is required' }, { status: 400 });
  }

  let accounts;
  try {
    accounts = await listAccounts(apiKey);
  } catch (err) {
    if (err instanceof CallRailAuthError) {
      return NextResponse.json({ error: 'CallRail rejected this API key.' }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : 'Failed to contact CallRail';
    return NextResponse.json({ error: message }, { status: 502 });
  }
  const account = accounts[0];
  if (!account?.id) {
    return NextResponse.json({ error: 'This API key has no CallRail accounts attached.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error: upsertErr } = await admin
    .from('user_integrations')
    .upsert(
      {
        user_id: user.id,
        callrail_api_key: apiKey,
        callrail_account_id: account.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
  if (upsertErr) {
    return NextResponse.json({ error: upsertErr.message }, { status: 500 });
  }

  let companies: Array<{ id: string; name: string; status: string | null }> = [];
  try {
    const cs = await listCompanies(apiKey, account.id);
    companies = cs.map((c) => ({ id: c.id, name: c.name, status: c.status ?? null }));
  } catch (err) {
    console.warn('[integrations/callrail.PUT] listCompanies failed:', err);
  }

  return NextResponse.json({
    connected: true,
    accountId: account.id,
    accountName: account.name,
    companies,
    error: null,
  });
}

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { error } = await admin
    .from('user_integrations')
    .delete()
    .eq('user_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
