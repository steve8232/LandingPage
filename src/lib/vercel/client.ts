import type {
  VercelDeploymentCreateRequest,
  VercelDeploymentResponse,
} from './types';

/**
 * Minimal typed wrapper around the Vercel REST API. Reads VERCEL_TOKEN and
 * VERCEL_TEAM_ID from process.env — server-only; never imported from the
 * client (the token bypasses no Supabase-style scoping).
 *
 * Docs: https://vercel.com/docs/rest-api/reference/endpoints/deployments
 */

const VERCEL_API = 'https://api.vercel.com';

function readEnv(): { token: string; teamId: string | undefined } {
  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    throw new Error('[vercel/client] Missing VERCEL_TOKEN env var');
  }
  return { token, teamId: process.env.VERCEL_TEAM_ID || undefined };
}

function withTeam(url: string, teamId: string | undefined): string {
  if (!teamId) return url;
  return `${url}${url.includes('?') ? '&' : '?'}teamId=${encodeURIComponent(teamId)}`;
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    const msg = data?.error?.message || data?.message || data?.error;
    return typeof msg === 'string' ? msg : `Vercel API ${res.status}`;
  } catch {
    return `Vercel API ${res.status}`;
  }
}

/**
 * Build a Vercel-safe project name from a SparkPage project UUID.
 * Vercel constraints: lowercase, alphanumeric+hyphen, 1..100 chars.
 */
export function vercelProjectNameFor(projectId: string): string {
  const short = projectId.replace(/[^a-z0-9]/gi, '').slice(0, 8).toLowerCase();
  return `sparkpage-${short || 'page'}`;
}

export async function createDeployment(input: {
  projectName: string;
  indexHtml: string;
}): Promise<VercelDeploymentResponse> {
  const { token, teamId } = readEnv();

  const body: VercelDeploymentCreateRequest = {
    name: input.projectName,
    files: [{ file: 'index.html', data: input.indexHtml }],
    target: 'production',
    // Static deploy — no framework, no build step.
    projectSettings: {
      framework: null,
      buildCommand: null,
      outputDirectory: null,
      installCommand: null,
      devCommand: null,
    },
  };

  const res = await fetch(withTeam(`${VERCEL_API}/v13/deployments`, teamId), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`createDeployment failed: ${await parseError(res)}`);
  }
  return (await res.json()) as VercelDeploymentResponse;
}

export async function getDeployment(deploymentId: string): Promise<VercelDeploymentResponse> {
  const { token, teamId } = readEnv();
  const res = await fetch(
    withTeam(`${VERCEL_API}/v13/deployments/${encodeURIComponent(deploymentId)}`, teamId),
    {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store',
    },
  );
  if (!res.ok) {
    throw new Error(`getDeployment failed: ${await parseError(res)}`);
  }
  return (await res.json()) as VercelDeploymentResponse;
}

/** Normalize a Vercel `url` (no scheme) into a full https URL. */
export function toFullUrl(vercelUrl: string | undefined): string {
  if (!vercelUrl) return '';
  if (/^https?:\/\//i.test(vercelUrl)) return vercelUrl;
  return `https://${vercelUrl}`;
}
