import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { leadRowToDTO, type LeadRow } from '@/lib/leads/types';
import { lookupPixelV4 } from '@/lib/audiencelab/client';
import {
  normalizeIdentifiedVisitors,
  type IdentifiedVisitorDTO,
} from '@/lib/audiencelab/identified';
import { CallRailAuthError, listCalls } from '@/lib/callrail/client';
import { normalizeCallsFromApi, type CallDTO } from '@/lib/callrail/calls';
import {
  getCallRailAccountId,
  getCallRailApiKey,
  isCallRailConfigured,
} from '@/lib/callrail/server-config';
import LeadsClient from './LeadsClient';

export const dynamic = 'force-dynamic';

/**
 * /dashboard/leads — owner-scoped lead viewer.
 *
 * Two data sources are co-rendered here:
 *   1. `leads` (form submissions) — Supabase RLS scopes by project owner.
 *   2. `identifiedVisitors` (AudienceLab V4 resolution) — fetched per-project
 *      using the global `AUDIENCELAB_API_KEY`. Pixel ids come from
 *      `projects.audiencelab_pixel_id`, which the deploy route stamps on
 *      first publish. Any per-pixel fetch failure is swallowed so a single
 *      bad pixel doesn't blank out the whole page.
 */
export default async function LeadsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/dashboard/leads');
  }

  const [leadsRes, projectsRes, callsRes] = await Promise.all([
    supabase
      .from('leads')
      .select('id, project_id, payload, user_agent, referer, ip, created_at')
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('projects')
      .select('id, title, slug, audiencelab_pixel_id, callrail_company_id, callrail_company_name')
      .order('updated_at', { ascending: false }),
    supabase
      .from('calls')
      .select(
        'project_id, callrail_call_id, start_time, direction, answered, duration, customer_name, customer_phone, customer_city, customer_state, tracking_phone, source, campaign, landing_page_url, recording_url, transcription'
      )
      .order('start_time', { ascending: false, nullsFirst: false })
      .limit(500),
  ]);

  const leads = ((leadsRes.data ?? []) as LeadRow[]).map(leadRowToDTO);
  const projectRows = (projectsRes.data ?? []) as Array<{
    id: string; title: string; slug: string;
    audiencelab_pixel_id: string | null;
    callrail_company_id: string | null;
    callrail_company_name: string | null;
  }>;
  const projects = projectRows.map(({ id, title, slug }) => ({ id, title, slug }));

  const identifiedResults = await Promise.all(
    projectRows
      .filter((p) => !!p.audiencelab_pixel_id && !!process.env.AUDIENCELAB_API_KEY)
      .map(async (p) => {
        try {
          const data = await lookupPixelV4({
            pixelId: p.audiencelab_pixel_id as string,
            pageSize: 500,
          });
          return normalizeIdentifiedVisitors({
            projectId: p.id,
            events: data.events,
          });
        } catch (err) {
          console.error(`[leads] lookupPixelV4 failed for project ${p.id}:`, err);
          return [] as IdentifiedVisitorDTO[];
        }
      })
  );
  const identifiedVisitors = identifiedResults
    .flat()
    .sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt));

  // DB-cached calls (webhook ingest).  RLS scopes by project owner.
  const dbCallRows = (callsRes.data ?? []) as Array<{
    project_id: string;
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
  }>;
  const dbCalls: CallDTO[] = dbCallRows.map((r) => ({
    id: r.callrail_call_id,
    projectId: r.project_id,
    startTime: r.start_time ?? '',
    direction: r.direction === 'outbound' ? 'outbound' : 'inbound',
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
  }));

  // Live tail for each bound project so the dashboard reflects calls that
  // haven't yet been webhooked.  Uses the global CALLRAIL_API_KEY; silently
  // skipped when the env isn't configured.
  const boundProjects = projectRows.filter((p) => !!p.callrail_company_id);
  let liveCalls: CallDTO[] = [];
  if (boundProjects.length > 0 && isCallRailConfigured()) {
    try {
      const apiKey = getCallRailApiKey();
      const accountId = await getCallRailAccountId();
      const perProject = await Promise.all(
        boundProjects.map(async (p) => {
          try {
            const res = await listCalls({
              apiKey,
              accountId,
              companyId: p.callrail_company_id as string,
              dateRange: 'recent',
              perPage: 100,
            });
            return normalizeCallsFromApi(res.calls, p.id);
          } catch (err) {
            if (!(err instanceof CallRailAuthError)) {
              console.warn(`[leads] listCalls failed for project ${p.id}:`, err);
            }
            return [] as CallDTO[];
          }
        })
      );
      liveCalls = perProject.flat();
    } catch (err) {
      console.warn('[leads] CallRail live tail skipped:', err);
    }
  }

  // Merge: live wins on overlap (fresher recording_player + transcription).
  const callsById = new Map<string, CallDTO>();
  for (const c of dbCalls) callsById.set(c.id, c);
  for (const c of liveCalls) callsById.set(c.id, c);
  const calls = [...callsById.values()].sort((a, b) =>
    (b.startTime || '').localeCompare(a.startTime || '')
  );

  const loadError =
    leadsRes.error?.message || projectsRes.error?.message || callsRes.error?.message || '';

  return (
    <Suspense fallback={null}>
      <LeadsClient
        initialLeads={leads}
        initialIdentified={identifiedVisitors}
        initialCalls={calls}
        projects={projects}
        userEmail={user.email ?? ''}
        loadError={loadError}
      />
    </Suspense>
  );
}
