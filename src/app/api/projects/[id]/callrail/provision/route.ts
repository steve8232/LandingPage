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
  CallRailSwapTargetTakenError,
  createCompany,
  createTracker,
  findAdoptableTracker,
  getTracker,
  listCompanies,
  listTrackers,
  normalizeCallRailScriptUrl,
  updateTracker,
  type CallRailNumberPreference,
  type CallRailTracker,
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

/**
 * Build the swap_targets list for CallRail. We register every common visual
 * form of the wizard phone so swap.js matches whatever rendered text and
 * `tel:` hrefs the page happens to contain. CallRail's swap engine treats
 * each entry as an independent string to search-and-replace.
 */
function buildSwapTargets(rawPhone: string): string[] {
  const d = digits(rawPhone);
  if (d.length < 10) return [rawPhone];
  const ten = d.length === 11 && d.startsWith('1') ? d.slice(1) : d.slice(-10);
  const npa = ten.slice(0, 3);
  const nxx = ten.slice(3, 6);
  const line = ten.slice(6);
  const targets = new Set<string>([
    ten,                          // 5551234567
    `(${npa}) ${nxx}-${line}`,    // (555) 123-4567 (composer + wizard formatter)
    `${npa}-${nxx}-${line}`,      // 555-123-4567
    `${npa}.${nxx}.${line}`,      // 555.123.4567
    `+1${ten}`,                   // +15551234567 (tel: href form)
    `1${ten}`,                    // 15551234567
  ]);
  return Array.from(targets);
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

  // Priority: explicit body > overrides.meta.businessPhone (live editor value)
  // > projects.business_phone (cached from a prior provision). The editor is
  // the source of truth for what's actually on the page, so a re-provision
  // after editing must use the freshly edited number.
  const overridesMeta = (project.overrides as { meta?: { businessPhone?: string; businessName?: string } } | null)?.meta;
  const overridesPhone = overridesMeta?.businessPhone;
  const destPhone = digits(body.destinationPhone || overridesPhone || project.business_phone || '');
  if (destPhone.length < 10) {
    return NextResponse.json({ error: 'Missing or invalid business phone on this project.' }, { status: 400 });
  }

  // CallRail Company name: prefer the user-entered business name from the
  // wizard's optional template fields over the auto-generated project title
  // (e.g. "Junk Removal – May 20"). Falls back to project.title for legacy
  // projects created before the businessName plumbing existed.
  const wizardBusinessName = typeof overridesMeta?.businessName === 'string' ? overridesMeta.businessName.trim() : '';
  const companyDisplayName = wizardBusinessName || project.title || 'SparkPage';

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

  // Step 1: adopt an existing tracker if one already covers this phone.
  // CallRail enforces global uniqueness on swap_targets across active AND
  // disabled trackers, so a prior test run that left a disabled tracker
  // owning this number would otherwise produce a "swap targets already taken"
  // error with no path to recovery. We scan both statuses and reactivate any
  // disabled match we adopt.
  let adopted: CallRailTracker | null = null;
  try {
    if (project.callrail_tracker_id) {
      adopted = await getTracker(apiKey, accountId, project.callrail_tracker_id);
      // Keep the project's prior binding even if it's disabled — we'll
      // reactivate below before binding.
    }
    if (!adopted) {
      const [active, disabled] = await Promise.all([
        listTrackers(apiKey, accountId, { status: 'active' }),
        listTrackers(apiKey, accountId, { status: 'disabled' }),
      ]);
      adopted = findAdoptableTracker([...active, ...disabled], destPhone);
    }
    // Reactivate adopted disabled trackers so the swap.js they serve resumes
    // matching visitors immediately after we bind them to the project.
    if (adopted && adopted.status !== 'active') {
      adopted = await updateTracker(apiKey, accountId, adopted.id, { status: 'active' });
    }
  } catch (err) {
    return mapErrorResponse(err);
  }

  // Step 2: ensure a Company. Adoption may have surfaced a tracker bound to
  // a different company than the project — bind to that company instead of
  // creating a duplicate. Otherwise reuse the project's company or create one.
  let companyId = project.callrail_company_id;
  let companyName = project.callrail_company_name;
  let scriptUrl = project.callrail_script_url;
  const timeZone = typeof body.timeZone === 'string' && body.timeZone.trim()
    ? body.timeZone.trim()
    : 'America/New_York';

  if (adopted) {
    const adoptedCompanyId = adopted.company?.id ?? null;
    if (adoptedCompanyId) companyId = adoptedCompanyId;
  }

  try {
    if (!companyId) {
      const created = await createCompany(apiKey, accountId, {
        name: companyDisplayName,
        timeZone,
      });
      companyId = created.id;
      companyName = created.name;
      scriptUrl = normalizeCallRailScriptUrl(created.script_url);
    } else if (!scriptUrl || (adopted && companyId !== project.callrail_company_id)) {
      // Either: existing binding without a cached script URL, or we just
      // switched companies via adoption. Refresh the name + script_url.
      const all = await listCompanies(apiKey, accountId);
      const match = all.find((c) => c.id === companyId);
      if (match) {
        companyName = match.name;
        const full = match as unknown as { script_url?: string | null };
        scriptUrl = normalizeCallRailScriptUrl(full.script_url ?? null) ?? scriptUrl;
      }
    }
  } catch (err) {
    return mapErrorResponse(err);
  }

  if (!companyId) {
    return NextResponse.json({ error: 'Failed to resolve CallRail company.' }, { status: 502 });
  }

  // Step 3: provision the tracker (unless we adopted one above). swap_targets
  // covers every common visual form of the wizard phone so DNI matches
  // whatever the page renders.
  let tracker: CallRailTracker;
  if (adopted) {
    tracker = adopted;
  } else {
    try {
      tracker = await createTracker(apiKey, accountId, {
        companyId,
        name: `SparkPage — ${project.title || project.id.slice(0, 8)}`,
        destinationNumber: destPhone,
        preference,
        swapTargets: buildSwapTargets(destPhone),
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
      if (err instanceof CallRailSwapTargetTakenError) {
        // Race-narrow or stale-state recovery: a tracker (possibly disabled)
        // was already holding this swap target between our initial scan and
        // now. Re-scan both statuses; if we find a match, reactivate any
        // disabled hit and adopt it. Otherwise surface a clear message.
        try {
          const [active, disabled] = await Promise.all([
            listTrackers(apiKey, accountId, { status: 'active' }),
            listTrackers(apiKey, accountId, { status: 'disabled' }),
          ]);
          let found = findAdoptableTracker([...active, ...disabled], destPhone);
          if (found && found.status !== 'active') {
            found = await updateTracker(apiKey, accountId, found.id, { status: 'active' });
          }
          if (found) {
            tracker = found;
          } else {
            // No adoption candidate — persist the company we just created so
            // a follow-up attempt doesn't orphan another CallRail company on
            // the user's account, then surface the 409.
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
              { error: 'This phone number is already in use by another tracker on your CallRail account.', code: 'swap_target_taken' },
              { status: 409 }
            );
          }
        } catch (innerErr) {
          return mapErrorResponse(innerErr);
        }
      } else {
        return mapErrorResponse(err);
      }
    }
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
