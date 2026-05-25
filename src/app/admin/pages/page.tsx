import { createAdminClient } from '@/lib/supabase/admin';
import { PROJECT_COLS, rowToDTO, type ProjectRow } from '@/lib/projects/types';
import {
  rowToDTO as deploymentRowToDTO,
  type DeploymentDTO,
  type DeploymentRow,
} from '@/lib/deployments/types';
import PagesClient, { type AdminPageRowDTO, type OwnerOptionDTO } from './PagesClient';

export const dynamic = 'force-dynamic';

export default async function AdminPagesPage() {
  const admin = createAdminClient();

  const [projectsRes, profilesRes, collabsRes, depsRes] = await Promise.all([
    admin
      .from('projects')
      .select(PROJECT_COLS)
      .order('updated_at', { ascending: false }),
    admin
      .from('profiles')
      .select('user_id, email, role')
      .order('email', { ascending: true }),
    admin
      .from('project_collaborators')
      .select('project_id'),
    admin
      .from('deployments')
      .select('id, project_id, revision_id, vercel_deployment_id, url, status, error_message, created_at, updated_at')
      .order('created_at', { ascending: false }),
  ]);

  const projectRows = (projectsRes.data ?? []) as ProjectRow[];
  const profiles = (profilesRes.data ?? []) as Array<{
    user_id: string;
    email: string | null;
    role: 'admin' | 'user';
  }>;
  const emailById = new Map(profiles.map((p) => [p.user_id, p.email]));

  const collabCount = new Map<string, number>();
  for (const c of (collabsRes.data ?? []) as Array<{ project_id: string }>) {
    collabCount.set(c.project_id, (collabCount.get(c.project_id) ?? 0) + 1);
  }

  const latestDeploys = new Map<string, DeploymentDTO>();
  for (const raw of (depsRes.data ?? []) as DeploymentRow[]) {
    if (!latestDeploys.has(raw.project_id)) {
      latestDeploys.set(raw.project_id, deploymentRowToDTO(raw));
    }
  }

  const pages: AdminPageRowDTO[] = projectRows.map((r) => {
    const dto = rowToDTO(r);
    return {
      project: dto,
      ownerId: r.user_id,
      ownerEmail: emailById.get(r.user_id) ?? null,
      collaboratorCount: collabCount.get(r.id) ?? 0,
      latestDeployment: latestDeploys.get(r.id) ?? null,
    };
  });

  const owners: OwnerOptionDTO[] = profiles.map((p) => ({
    userId: p.user_id,
    email: p.email,
    role: p.role,
  }));

  return <PagesClient initialPages={pages} owners={owners} />;
}
