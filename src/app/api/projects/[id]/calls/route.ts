import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  CallRailAuthError,
  listCalls,
  type CallRailCall,
} from '@/lib/callrail/client';
import { normalizeCallsFromApi, type CallDTO } from '@/lib/callrail/calls';

/**
 * GET /api/projects/[id]/calls
 *   Dashboard data feed for the Leads "Calls" tab. Reads webhook-cached rows
 *   from public.calls (fast, authoritative for historical data) and, when the
 *   project is bound + the user is connected, tops them off with a fresh
 *   listCalls() pull so the tab reflects calls that haven't been webhooked yet.
 *
 *   Response: { calls: CallDTO[], cached: boolean }
 *     `cached: true` ⇢ no live API hit (returned DB-only).
 */

interface ProjectMetaRow {
  id: string;
  callrail_company_id: string | null;
  callrail_company_name: string | null;
}

interface CallsTableRow {
  callrail_call_id: string;
  start_time: string | null;
  direction: string | null;
  answered: boolean | null;
  duration: number | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_city: string | null;
  customer_state: string | null;
  tracking_phone: string | null;
  source: string | null;
  campaign: string | null;
  landing_page_url: string | null;
  recording_url: string | null;
  transcription: string | null;
}

interface IntegrationsRow {
  callrail_api_key: string | null;
  callrail_account_id: string | null;
}

const PAGE_LIMIT = 200;

function rowToDto(r: CallsTableRow, projectId: string): CallDTO {
  const direction = r.direction === 'outbound' ? 'outbound' : 'inbound';
  return {
    id: r.callrail_call_id,
    projectId,
    startTime: r.start_time ?? '',
    direction,
    answered: r.answered === true,
    duration: typeof r.duration === 'number' ? r.duration : 0,
    voicemail: false,
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    customerCity: r.customer_city,
    customerState: r.customer_state,
    trackingPhone: r.tracking_phone,
    source: r.source,
    campaign: r.campaign,
    landingPageUrl: r.landing_page_url,
    recordingUrl: r.recording_url,
    transcription: r.transcription,
  };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Ownership + binding lookup through the user-scoped client so RLS enforces
  // it.  Company id/name are public to the owner, so they're on the DTO.
  const { data: projectMeta } = await supabase
    .from('projects')
    .select('id, callrail_company_id, callrail_company_name')
    .eq('id', id)
    .maybeSingle<ProjectMetaRow>();
  if (!projectMeta) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // DB-cached rows first.  RLS lets owners SELECT their own project's calls
  // (see migration 0006), so the user client works here.
  const { data: dbRowsRaw } = await supabase
    .from('calls')
    .select(
      'callrail_call_id, start_time, direction, answered, duration, customer_name, customer_phone, customer_city, customer_state, tracking_phone, source, campaign, landing_page_url, recording_url, transcription'
    )
    .eq('project_id', id)
    .order('start_time', { ascending: false, nullsFirst: false })
    .limit(PAGE_LIMIT);
  const dbRows = (dbRowsRaw ?? []) as CallsTableRow[];
  const dbCalls: CallDTO[] = dbRows.map((r) => rowToDto(r, id));

  // If unbound, return DB-only.  (Same shape as if we'd hit the API.)
  if (!projectMeta.callrail_company_id) {
    return NextResponse.json({ calls: dbCalls, cached: true });
  }

  // Pull live tail.  Admin client so we can read the stored API key.
  const admin = createAdminClient();
  const { data: integ } = await admin
    .from('user_integrations')
    .select('callrail_api_key, callrail_account_id')
    .eq('user_id', user.id)
    .maybeSingle<IntegrationsRow>();
  if (!integ?.callrail_api_key || !integ?.callrail_account_id) {
    return NextResponse.json({ calls: dbCalls, cached: true });
  }

  let liveCalls: CallRailCall[] = [];
  try {
    const res = await listCalls({
      apiKey: integ.callrail_api_key,
      accountId: integ.callrail_account_id,
      companyId: projectMeta.callrail_company_id,
      dateRange: 'last_30_days',
      perPage: 100,
    });
    liveCalls = res.calls;
  } catch (err) {
    if (!(err instanceof CallRailAuthError)) {
      console.warn('[projects/[id]/calls.GET] listCalls failed:', err);
    }
    return NextResponse.json({ calls: dbCalls, cached: true });
  }

  // Merge: live wins on overlap (fresher field selection like recording_player).
  const liveDtos = normalizeCallsFromApi(liveCalls, id);
  const byId = new Map<string, CallDTO>();
  for (const c of dbCalls) byId.set(c.id, c);
  for (const c of liveDtos) byId.set(c.id, c);
  const merged = [...byId.values()].sort((a, b) =>
    (b.startTime || '').localeCompare(a.startTime || '')
  );
  return NextResponse.json({ calls: merged.slice(0, PAGE_LIMIT), cached: false });
}
