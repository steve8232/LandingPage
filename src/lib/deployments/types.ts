import type { DeploymentStatus } from '../vercel/types';

/**
 * Row shape for `public.deployments` (supabase/migrations/0001_init.sql).
 * Writes go through the service-role admin client; reads are RLS-scoped to
 * project owners.
 */
export interface DeploymentRow {
  id: string;
  project_id: string;
  revision_id: string | null;
  vercel_deployment_id: string | null;
  url: string | null;
  status: DeploymentStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeploymentDTO {
  id: string;
  projectId: string;
  vercelDeploymentId: string | null;
  url: string | null;
  status: DeploymentStatus;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export function rowToDTO(row: DeploymentRow): DeploymentDTO {
  return {
    id: row.id,
    projectId: row.project_id,
    vercelDeploymentId: row.vercel_deployment_id,
    url: row.url,
    status: row.status,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function isTerminalStatus(status: DeploymentStatus): boolean {
  return status === 'ready' || status === 'error' || status === 'canceled';
}
