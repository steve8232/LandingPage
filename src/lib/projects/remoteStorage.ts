import type { V1ContentOverrides } from '../../../v1/composer/composeV1Template';
import type { ProjectDTO } from './types';

/**
 * Thin browser-side wrapper around /api/projects.
 * Server routes enforce auth + RLS — this module just shapes requests.
 */

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return (data && typeof data.error === 'string') ? data.error : `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

export async function listProjects(): Promise<ProjectDTO[]> {
  const res = await fetch('/api/projects', { method: 'GET', cache: 'no-store' });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json() as { projects?: ProjectDTO[] };
  return Array.isArray(data.projects) ? data.projects : [];
}

export async function createProject(input: {
  templateId: string;
  title?: string;
  overrides?: V1ContentOverrides;
}): Promise<ProjectDTO> {
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json() as { project: ProjectDTO };
  return data.project;
}

export async function getProject(id: string): Promise<ProjectDTO> {
  const res = await fetch(`/api/projects/${id}`, { method: 'GET', cache: 'no-store' });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json() as { project: ProjectDTO };
  return data.project;
}

export async function updateProject(id: string, patch: {
  title?: string;
  overrides?: V1ContentOverrides;
}): Promise<ProjectDTO> {
  const res = await fetch(`/api/projects/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json() as { project: ProjectDTO };
  return data.project;
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await parseError(res));
}

export interface SubdomainAvailability {
  available: boolean;
  value?: string;
  error?: string;
}

export async function checkSubdomainAvailability(
  projectId: string,
  candidate: string
): Promise<SubdomainAvailability> {
  const url = `/api/projects/${projectId}/subdomain?candidate=${encodeURIComponent(candidate)}`;
  const res = await fetch(url, { method: 'GET', cache: 'no-store' });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as SubdomainAvailability;
}

export async function setProjectSubdomain(
  projectId: string,
  subdomain: string
): Promise<ProjectDTO> {
  const res = await fetch(`/api/projects/${projectId}/subdomain`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subdomain }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json() as { project: ProjectDTO };
  return data.project;
}

export async function clearProjectSubdomain(projectId: string): Promise<ProjectDTO> {
  const res = await fetch(`/api/projects/${projectId}/subdomain`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json() as { project: ProjectDTO };
  return data.project;
}
