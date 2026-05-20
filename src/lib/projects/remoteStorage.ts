import type { V1ContentOverrides } from '../../../v1/composer/composeV1Template';
import type { CallDTO } from '../callrail/calls';
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

export async function retryProjectSubdomain(projectId: string): Promise<ProjectDTO> {
  const res = await fetch(`/api/projects/${projectId}/subdomain/retry`, { method: 'POST' });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json() as { project: ProjectDTO };
  return data.project;
}

// ── BYO custom domain ───────────────────────────────────────────────────────

export interface CustomDomainStatusResponse {
  project: ProjectDTO;
  /** TXT challenge surfaced by Vercel when the domain needs verification. */
  verification: { txtName: string; txtValue: string } | null;
}

export async function setProjectCustomDomain(
  projectId: string,
  domain: string
): Promise<ProjectDTO> {
  const res = await fetch(`/api/projects/${projectId}/custom-domain`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json() as { project: ProjectDTO };
  return data.project;
}

export async function clearProjectCustomDomain(projectId: string): Promise<ProjectDTO> {
  const res = await fetch(`/api/projects/${projectId}/custom-domain`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json() as { project: ProjectDTO };
  return data.project;
}

export async function pollProjectCustomDomainStatus(
  projectId: string
): Promise<CustomDomainStatusResponse> {
  const res = await fetch(`/api/projects/${projectId}/custom-domain/status`, {
    method: 'GET',
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as CustomDomainStatusResponse;
}

// ── CallRail integration ───────────────────────────────────────────────────

/** Company option surfaced for binding (server-fetched via the global key). */
export interface CallrailCompanyOption {
  id: string;
  name: string;
  status: string | null;
}

export interface CallrailCompaniesResponse {
  /** False when CALLRAIL_API_KEY is unset on the server. */
  configured: boolean;
  companies: CallrailCompanyOption[];
  /** Surfaced when the env key fails authentication on this request. */
  error: string | null;
}

export async function listCallrailCompanies(): Promise<CallrailCompaniesResponse> {
  const res = await fetch('/api/integrations/callrail/companies', { method: 'GET', cache: 'no-store' });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as CallrailCompaniesResponse;
}

export async function setProjectCallrailBinding(
  projectId: string,
  companyId: string
): Promise<ProjectDTO> {
  const res = await fetch(`/api/projects/${projectId}/callrail`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ companyId }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json() as { project: ProjectDTO };
  return data.project;
}

export async function clearProjectCallrailBinding(projectId: string): Promise<ProjectDTO> {
  const res = await fetch(`/api/projects/${projectId}/callrail`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json() as { project: ProjectDTO };
  return data.project;
}

/** Number preference passed to the provisioning endpoint. */
export type CallrailNumberPreference =
  | { type: 'local'; areaCode: string }
  | { type: 'toll_free'; prefix?: '800' | '888' | '877' | '866' | '855' | '844' | '833' };

export interface ProvisionCallrailInput {
  preference: CallrailNumberPreference;
  /** Optional override; defaults server-side to overrides.meta.businessPhone. */
  destinationPhone?: string;
  /** Optional IANA time zone for company creation (server default applies). */
  timeZone?: string;
  /**
   * Tracker flavor. `'session'` provisions a Website Pool of `poolSize`
   * numbers (visitor-level attribution); `'source'` provisions a single
   * number tied to all traffic. Server defaults to `'session'`.
   */
  trackerType?: 'source' | 'session';
  /**
   * Required when `trackerType === 'session'`. CallRail enforces a minimum
   * of 4 and a maximum of 50 numbers per pool. Server defaults to 4.
   */
  poolSize?: number;
}

/**
 * Thrown when CallRail has no inventory for the requested area / toll-free
 * prefix. The UI uses the `code === 'no_inventory'` signal to keep the
 * provision panel open and offer alternatives without a generic error toast.
 */
export class ProvisionNoInventoryError extends Error {
  readonly code = 'no_inventory' as const;
  constructor(message: string) {
    super(message);
    this.name = 'ProvisionNoInventoryError';
  }
}

export async function provisionCallrailTracker(
  projectId: string,
  input: ProvisionCallrailInput
): Promise<ProjectDTO> {
  const res = await fetch(`/api/projects/${projectId}/callrail/provision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  // Consume the body exactly once: every non-2xx path needs the same parsed
  // payload to discriminate code='no_inventory' vs other 409s vs generic
  // errors. Reading res.json() a second time on the !res.ok branch (as the
  // prior version did) throws and surfaces a useless `Request failed (409)`
  // to the user, hiding the real CallRail message.
  const payload = await res.json().catch(() => null) as
    | { project?: ProjectDTO; error?: string; code?: string }
    | null;
  if (!res.ok) {
    const message = payload?.error || `Request failed (${res.status})`;
    if (res.status === 409 && payload?.code === 'no_inventory') {
      throw new ProvisionNoInventoryError(message);
    }
    throw new Error(message);
  }
  if (!payload?.project) throw new Error('Provisioning returned no project');
  return payload.project;
}

export interface ProjectCallsResponse {
  calls: CallDTO[];
  /** True when this page was served straight from `public.calls`. */
  cached: boolean;
}

export async function listProjectCalls(projectId: string): Promise<ProjectCallsResponse> {
  const res = await fetch(`/api/projects/${projectId}/calls`, { method: 'GET', cache: 'no-store' });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as ProjectCallsResponse;
}
