import type { DeploymentDTO } from './types';

/**
 * Thin browser-side wrapper around the deployments API. Server routes enforce
 * auth + RLS; this module just shapes requests and shares response parsing.
 */

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return (data && typeof data.error === 'string') ? data.error : `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

export async function createDeploymentForProject(projectId: string): Promise<DeploymentDTO> {
  const res = await fetch(`/api/projects/${projectId}/deploy`, { method: 'POST' });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json() as { deployment: DeploymentDTO };
  return data.deployment;
}

export async function getDeployment(deploymentId: string): Promise<DeploymentDTO> {
  const res = await fetch(`/api/deployments/${deploymentId}`, { method: 'GET', cache: 'no-store' });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json() as { deployment: DeploymentDTO };
  return data.deployment;
}

export async function listProjectDeployments(projectId: string): Promise<DeploymentDTO[]> {
  const res = await fetch(`/api/projects/${projectId}/deploy`, { method: 'GET', cache: 'no-store' });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json() as { deployments?: DeploymentDTO[] };
  return Array.isArray(data.deployments) ? data.deployments : [];
}
