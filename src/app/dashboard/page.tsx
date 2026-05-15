import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { rowToDTO, type ProjectRow } from '@/lib/projects/types';
import {
  rowToDTO as deploymentRowToDTO,
  type DeploymentDTO,
  type DeploymentRow,
} from '@/lib/deployments/types';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/dashboard');
  }

  const { data, error } = await supabase
    .from('projects')
    .select('id, user_id, template_id, title, slug, overrides, created_at, updated_at')
    .order('updated_at', { ascending: false });

  const projects = error ? [] : ((data ?? []) as ProjectRow[]).map(rowToDTO);

  // Latest deployment per project. RLS scopes deployments SELECT to the owner
  // chain, so a single ordered query is enough — we pick the first row for
  // each project id.
  const latestDeployments: Record<string, DeploymentDTO> = {};
  if (projects.length > 0) {
    const { data: depRows } = await supabase
      .from('deployments')
      .select('id, project_id, revision_id, vercel_deployment_id, url, status, error_message, created_at, updated_at')
      .order('created_at', { ascending: false });
    for (const raw of (depRows ?? []) as DeploymentRow[]) {
      if (!latestDeployments[raw.project_id]) {
        latestDeployments[raw.project_id] = deploymentRowToDTO(raw);
      }
    }
  }

  return (
    <DashboardClient
      initialProjects={projects}
      initialLatestDeployments={latestDeployments}
      userEmail={user.email ?? ''}
      loadError={error?.message ?? ''}
    />
  );
}
