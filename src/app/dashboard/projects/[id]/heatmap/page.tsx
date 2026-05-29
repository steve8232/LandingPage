import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { CreationMethod } from '@/lib/projects/types';
import HeatmapClient, { type ProjectLite } from './HeatmapClient';

export const dynamic = 'force-dynamic';

/**
 * /dashboard/projects/[id]/heatmap — first-party heatmap viewer.
 *
 * Server-side concerns only:
 *   • auth + ownership check (RLS scopes the project SELECT)
 *   • initial project payload for the client UI
 *
 * The actual heatmap data + signed snapshot URL is fetched client-side from
 * /api/projects/[id]/heatmap so the device / range controls can re-query
 * without a full page reload.
 */

interface ProjectRow {
  id: string;
  title: string;
  subdomain: string | null;
  custom_domain: string | null;
  creation_method: CreationMethod;
}

export default async function HeatmapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // E2E test hatch: when explicitly enabled outside production, skip the
  // Supabase auth + table lookups and render with fixture data. The Playwright
  // smoke test relies on this so it can exercise the client UI without a
  // signed-in user. Guarded by NODE_ENV !== 'production' AND an explicit env
  // var so it cannot accidentally activate in deployed environments.
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.E2E_MOCK_AUTH === '1'
  ) {
    return (
      <HeatmapClient
        project={{
          id,
          title: 'E2E Mock Project',
          subdomain: 'e2e-mock',
          customDomain: null,
        }}
        userEmail="e2e@example.com"
      />
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/dashboard/projects/${id}/heatmap`);

  const { data: projectRaw } = await supabase
    .from('projects')
    .select('id, title, subdomain, custom_domain, creation_method')
    .eq('id', id)
    .maybeSingle<ProjectRow>();
  if (!projectRaw) redirect('/dashboard');

  const project: ProjectLite = {
    id: projectRaw.id,
    title: projectRaw.title,
    subdomain: projectRaw.subdomain,
    customDomain: projectRaw.custom_domain,
    creationMethod: projectRaw.creation_method,
  };

  return (
    <HeatmapClient
      project={project}
      userEmail={user.email ?? ''}
    />
  );
}
