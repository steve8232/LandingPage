import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { leadRowToDTO, type LeadRow } from '@/lib/leads/types';
import { lookupPixelV4 } from '@/lib/audiencelab/client';
import {
  normalizeIdentifiedVisitors,
  type IdentifiedVisitorDTO,
} from '@/lib/audiencelab/identified';
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

  const [leadsRes, projectsRes] = await Promise.all([
    supabase
      .from('leads')
      .select('id, project_id, payload, user_agent, referer, ip, created_at')
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('projects')
      .select('id, title, slug, audiencelab_pixel_id')
      .order('updated_at', { ascending: false }),
  ]);

  const leads = ((leadsRes.data ?? []) as LeadRow[]).map(leadRowToDTO);
  const projectRows = (projectsRes.data ?? []) as Array<{
    id: string; title: string; slug: string; audiencelab_pixel_id: string | null;
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

  const loadError =
    leadsRes.error?.message || projectsRes.error?.message || '';

  return (
    <Suspense fallback={null}>
      <LeadsClient
        initialLeads={leads}
        initialIdentified={identifiedVisitors}
        projects={projects}
        userEmail={user.email ?? ''}
        loadError={loadError}
      />
    </Suspense>
  );
}
