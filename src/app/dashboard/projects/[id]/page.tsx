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
import ProjectDashboardClient, {
  type ProjectLite,
} from './ProjectDashboardClient';

export const dynamic = 'force-dynamic';

/**
 * /dashboard/projects/[id] — per-project unified activity dashboard.
 *
 * Co-renders three streams scoped to a single project:
 *   1. `leads`             — form submissions (Supabase, RLS-scoped).
 *   2. `identifiedVisitors` — AudienceLab V4 pixel resolutions.
 *   3. `calls`              — DB-cached webhook rows merged with a live
 *                             CallRail tail (recent dateRange).
 *
 * The merged streams are presented as a single chronological timeline in
 * `ProjectDashboardClient`. Each stream's fetch errors are swallowed so a
 * single bad source doesn't blank out the whole page.
 */
interface ProjectMetaRow {
  id: string;
  title: string;
  slug: string;
  subdomain: string | null;
  custom_domain: string | null;
  audiencelab_pixel_id: string | null;
  callrail_company_id: string | null;
  callrail_company_name: string | null;
}

export default async function ProjectDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/dashboard/projects/${id}`);

  const { data: projectRow } = await supabase
    .from('projects')
    .select(
      'id, title, slug, subdomain, custom_domain, audiencelab_pixel_id, callrail_company_id, callrail_company_name'
    )
    .eq('id', id)
    .maybeSingle<ProjectMetaRow>();
  if (!projectRow) redirect('/dashboard');

  const [leadsRes, callsRes] = await Promise.all([
    supabase
      .from('leads')
      .select('id, project_id, payload, user_agent, referer, ip, created_at')
      .eq('project_id', id)
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('calls')
      .select(
        'project_id, callrail_call_id, start_time, direction, answered, duration, customer_name, customer_phone, customer_city, customer_state, tracking_phone, source, campaign, landing_page_url, recording_url, transcription'
      )
      .eq('project_id', id)
      .order('start_time', { ascending: false, nullsFirst: false })
      .limit(500),
  ]);

  const leads = ((leadsRes.data ?? []) as LeadRow[]).map(leadRowToDTO);

  // Identified visitors — only fetched when the project has a pixel id and the
  // AudienceLab env is wired. Errors are logged and swallowed.
  let identifiedVisitors: IdentifiedVisitorDTO[] = [];
  if (projectRow.audiencelab_pixel_id && process.env.AUDIENCELAB_API_KEY) {
    try {
      const data = await lookupPixelV4({
        pixelId: projectRow.audiencelab_pixel_id,
        pageSize: 500,
      });
      identifiedVisitors = normalizeIdentifiedVisitors({
        projectId: projectRow.id,
        events: data.events,
      });
    } catch (err) {
      console.error(`[project-dashboard] lookupPixelV4 failed for ${projectRow.id}:`, err);
    }
  }

  // DB-cached calls (webhook ingest) → CallDTOs.
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

  // Live tail when the project is bound and CallRail env is configured.
  let liveCalls: CallDTO[] = [];
  if (projectRow.callrail_company_id && isCallRailConfigured()) {
    try {
      const apiKey = getCallRailApiKey();
      const accountId = await getCallRailAccountId();
      const res = await listCalls({
        apiKey,
        accountId,
        companyId: projectRow.callrail_company_id,
        dateRange: 'recent',
        perPage: 100,
      });
      liveCalls = normalizeCallsFromApi(res.calls, projectRow.id);
    } catch (err) {
      if (!(err instanceof CallRailAuthError)) {
        console.warn(`[project-dashboard] listCalls failed for ${projectRow.id}:`, err);
      }
    }
  }

  // Merge: live wins on overlap (fresher recording_player + transcription).
  const callsById = new Map<string, CallDTO>();
  for (const c of dbCalls) callsById.set(c.id, c);
  for (const c of liveCalls) callsById.set(c.id, c);
  const calls = [...callsById.values()].sort((a, b) =>
    (b.startTime || '').localeCompare(a.startTime || '')
  );

  const project: ProjectLite = {
    id: projectRow.id,
    title: projectRow.title,
    slug: projectRow.slug,
    subdomain: projectRow.subdomain,
    customDomain: projectRow.custom_domain,
  };

  const loadError = leadsRes.error?.message || callsRes.error?.message || '';

  return (
    <ProjectDashboardClient
      project={project}
      leads={leads}
      identified={identifiedVisitors}
      calls={calls}
      userEmail={user.email ?? ''}
      loadError={loadError}
    />
  );
}
