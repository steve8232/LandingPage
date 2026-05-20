import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  PROJECT_COLS,
  rowToDTO,
  type ProjectRow,
} from '@/lib/projects/types';
import {
  CallRailAuthError,
  CallRailNoInventoryError,
  createCompany,
  createTracker,
  listCompanies,
  normalizeCallRailScriptUrl,
  type CallRailNumberPreference,
} from '@/lib/callrail/client';
import {
  CallRailNotConfiguredError,
  getCallRailAccountId,
  getCallRailApiKey,
} from '@/lib/callrail/server-config';

/**
 * POST /api/projects/[id]/callrail/provision
 *   Single-step orchestration:
 *     1. Ensure a CallRail Company exists (create one named after the
 *        project when the project isn't already bound).
 *     2. Create a tracker with `destination_number` set to the wizard's
 *        business phone and `swap_targets` set so swap.js replaces that
 *        same number on the published page.
 *     3. Persist tracker id + tracking phone + script_url on the project so
 *        the deploy route can inject the DNI script.
 *
 *   The caller picks the number preference (`local` w/ area_code or
 *   `toll_free` w/ prefix). On a 422 we surface CallRailNoInventoryError to
 *   the UI so the user can retry with a different area code or toll-free.
 *
 *   The tracker step **incurs a monthly charge** on the user's CallRail
 *   account — the UI must surface that before calling this endpoint.
 */

interface ProvisionBody {
  preference?: { type?: 'local'; areaCode?: string } | { type?: 'toll_free'; prefix?: string };
  /** Optional: override the destination phone (defaults to overrides.meta.businessPhone). */
  destinationPhone?: string;
  /** IANA time zone for the company. Required by CallRail when creating one. */
  timeZone?: string;
}

function digits(input: string | null | undefined): string {
  return (input ?? '').replace(/\D/g, '');
}

function parsePreference(input: ProvisionBody['preference']): CallRailNumberPreference | { error: string } {
  if (!input || typeof input !== 'object') return { error: 'preference is required' };
  if (input.type === 'local') {
    const areaCode = digits(input.areaCode).slice(0, 3);
    if (areaCode.length !== 3) return { error: 'preference.areaCode must be a 3-digit NPA' };
    return { type: 'local', areaCode };
  }
  if (input.type === 'toll_free') {
    const allowed: ReadonlyArray<'800' | '888' | '877' | '866' | '855' | '844' | '833'> = ['800', '888', '877', '866', '855', '844', '833'];
    const raw = typeof input.prefix === 'string' ? input.prefix : '888';
    const prefix = (allowed as readonly string[]).includes(raw) ? (raw as '800' | '888' | '877' | '866' | '855' | '844' | '833') : '888';
    return { type: 'toll_free', prefix };
  }
  return { error: 'preference.type must be "local" or "toll_free"' };
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: ProvisionBody;
  try { body = (await request.json()) as ProvisionBody; } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const preference = parsePreference(body.preference);
  if ('error' in preference) {
    return NextResponse.json({ error: preference.error }, { status: 400 });
  }

  const { data: projectRow } = await supabase
    .from('projects')
    .select(PROJECT_COLS)
    .eq('id', id)
    .maybeSingle();
  if (!projectRow) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const project = projectRow as ProjectRow;

  const overridesPhone = (project.overrides as { meta?: { businessPhone?: string } } | null)?.meta?.businessPhone;
  const destPhone = digits(body.destinationPhone || project.business_phone || overridesPhone || '');
  if (destPhone.length < 10) {
    return NextResponse.json({ error: 'Missing or invalid business phone on this project.' }, { status: 400 });
  }

  let apiKey: string;
  let accountId: string;
  try {
    apiKey = getCallRailApiKey();
    accountId = await getCallRailAccountId();
  } catch (err) {
    if (err instanceof CallRailNotConfiguredError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    throw err;
  }

  // Step 1: ensure a Company. Reuse the binding if present; otherwise create.
  let companyId = project.callrail_company_id;
  let companyName = project.callrail_company_name;
  let scriptUrl = project.callrail_script_url;
  const timeZone = typeof body.timeZone === 'string' && body.timeZone.trim()
    ? body.timeZone.trim()
    : 'America/New_York';

  try {
    if (!companyId) {
      const created = await createCompany(apiKey, accountId, {
        name: project.title || 'SparkPage',
        timeZone,
      });
      companyId = created.id;
      companyName = created.name;
      scriptUrl = normalizeCallRailScriptUrl(created.script_url);
    } else if (!scriptUrl) {
      // Existing binding but we never captured the script URL — fetch it now.
      const all = await listCompanies(apiKey, accountId);
      const match = all.find((c) => c.id === companyId);
      if (match) {
        const full = match as unknown as { script_url?: string | null };
        scriptUrl = normalizeCallRailScriptUrl(full.script_url ?? null);
      }
    }
  } catch (err) {
    return mapErrorResponse(err);
  }

  if (!companyId) {
    return NextResponse.json({ error: 'Failed to resolve CallRail company.' }, { status: 502 });
  }

  // Step 2: provision the tracker. swap_targets uses the digits form so swap.js
  // matches whatever local formatting the published page renders.
  let tracker;
  try {
    tracker = await createTracker(apiKey, accountId, {
      companyId,
      name: `SparkPage — ${project.title || project.id.slice(0, 8)}`,
      destinationNumber: destPhone,
      preference,
      swapTargets: [destPhone],
    });
  } catch (err) {
    if (err instanceof CallRailNoInventoryError) {
      // Persist whatever we managed to create (company + scriptUrl) so a
      // retry with a different area code skips company creation.
      const admin = createAdminClient();
      await admin
        .from('projects')
        .update({
          callrail_company_id: companyId,
          callrail_company_name: companyName,
          callrail_script_url: scriptUrl,
          business_phone: destPhone,
        })
        .eq('id', id);
      return NextResponse.json(
        { error: err.message, code: 'no_inventory' },
        { status: 409 }
      );
    }
    return mapErrorResponse(err);
  }

  const issuedNumber = Array.isArray(tracker.tracking_numbers) && tracker.tracking_numbers.length
    ? tracker.tracking_numbers[0]
    : null;

  const admin = createAdminClient();
  const { data: updated, error: updateErr } = await admin
    .from('projects')
    .update({
      callrail_company_id: companyId,
      callrail_company_name: companyName,
      callrail_tracker_id: tracker.id,
      callrail_tracking_phone: issuedNumber,
      callrail_script_url: scriptUrl,
      business_phone: destPhone,
    })
    .eq('id', id)
    .select(PROJECT_COLS)
    .single();
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  return NextResponse.json({ project: rowToDTO(updated as ProjectRow) });
}

function mapErrorResponse(err: unknown): NextResponse {
  if (err instanceof CallRailNotConfiguredError) {
    return NextResponse.json({ error: err.message }, { status: 503 });
  }
  if (err instanceof CallRailAuthError) {
    return NextResponse.json({ error: 'CallRail rejected CALLRAIL_API_KEY.' }, { status: 502 });
  }
  const message = err instanceof Error ? err.message : 'CallRail provisioning failed';
  return NextResponse.json({ error: message }, { status: 502 });
}
