import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  PROJECT_COLS,
  rowToDTO,
  type ProjectRow,
} from '@/lib/projects/types';
import { CallRailAuthError, listCompanies } from '@/lib/callrail/client';
import {
  CallRailNotConfiguredError,
  getCallRailAccountId,
  getCallRailApiKey,
} from '@/lib/callrail/server-config';

/**
 * PUT /api/projects/[id]/callrail   { companyId, signingKey? }
 *   Bind a SparkPage to one CallRail Company. Resolves the company name via
 *   the global CALLRAIL_API_KEY so the toolbar can render it without a
 *   second round-trip. `signingKey` is the per-webhook "secret token" copied
 *   out of CallRail's webhook config page; passing `null` clears it,
 *   `undefined` leaves the existing value alone.
 *
 * DELETE /api/projects/[id]/callrail
 *   Unbind. Leaves any cached rows in public.calls untouched (the leads tab
 *   still reads them); future webhook posts for this projectId will 404.
 */

interface OwnerRow { id: string; user_id: string }

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const companyId = typeof (body as { companyId?: unknown })?.companyId === 'string'
    ? ((body as { companyId: string }).companyId).trim()
    : '';
  if (!companyId) {
    return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
  }
  const sigRaw = (body as { signingKey?: unknown })?.signingKey;
  // undefined → leave as-is; null/'' → clear; string → set.
  let signingKeyPatch: { callrail_webhook_signing_key: string | null } | Record<string, never> = {};
  if (sigRaw === null) signingKeyPatch = { callrail_webhook_signing_key: null };
  else if (typeof sigRaw === 'string') {
    const s = sigRaw.trim();
    signingKeyPatch = { callrail_webhook_signing_key: s === '' ? null : s };
  }

  // Ownership check via RLS-respecting client.
  const { data: ownerRow } = await supabase
    .from('projects')
    .select('id, user_id')
    .eq('id', id)
    .maybeSingle<OwnerRow>();
  if (!ownerRow) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Resolve the company name via the global key.
  let companyName = '';
  try {
    const apiKey = getCallRailApiKey();
    const accountId = await getCallRailAccountId();
    const companies = await listCompanies(apiKey, accountId);
    const match = companies.find((c) => c.id === companyId);
    if (!match) {
      return NextResponse.json({ error: 'Company not found on this CallRail account.' }, { status: 404 });
    }
    companyName = match.name;
  } catch (err) {
    if (err instanceof CallRailNotConfiguredError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    if (err instanceof CallRailAuthError) {
      return NextResponse.json({ error: 'CallRail rejected CALLRAIL_API_KEY.' }, { status: 502 });
    }
    const message = err instanceof Error ? err.message : 'Failed to resolve company';
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const admin = createAdminClient();
  const { data: updated, error: updateErr } = await admin
    .from('projects')
    .update({
      callrail_company_id: companyId,
      callrail_company_name: companyName,
      ...signingKeyPatch,
    })
    .eq('id', id)
    .select(PROJECT_COLS)
    .single();
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  return NextResponse.json({ project: rowToDTO(updated as ProjectRow) });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: ownerRow } = await supabase
    .from('projects')
    .select('id')
    .eq('id', id)
    .maybeSingle();
  if (!ownerRow) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const admin = createAdminClient();
  const { data: updated, error: updateErr } = await admin
    .from('projects')
    .update({
      callrail_company_id: null,
      callrail_company_name: null,
      callrail_webhook_signing_key: null,
    })
    .eq('id', id)
    .select(PROJECT_COLS)
    .single();
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  return NextResponse.json({ project: rowToDTO(updated as ProjectRow) });
}
