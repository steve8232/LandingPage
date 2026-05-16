/**
 * Vercel domain + alias helpers (Phase 4). Server-only.
 *
 * Two endpoints we consume:
 *   POST /v10/projects/{name}/domains       — attach a custom domain
 *   POST /v2/deployments/{id}/aliases       — point alias at deployment
 *   DELETE /v9/projects/{name}/domains/{d}  — detach a custom domain
 *
 * Docs: https://vercel.com/docs/rest-api
 */

const VERCEL_API = 'https://api.vercel.com';

function readEnv(): { token: string; teamId: string | undefined } {
  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    throw new Error('[vercel/domains] Missing VERCEL_TOKEN env var');
  }
  return { token, teamId: process.env.VERCEL_TEAM_ID || undefined };
}

function withTeam(url: string, teamId: string | undefined): string {
  if (!teamId) return url;
  return `${url}${url.includes('?') ? '&' : '?'}teamId=${encodeURIComponent(teamId)}`;
}

async function parseError(res: Response): Promise<{ code: string | undefined; message: string }> {
  try {
    const data = await res.json();
    const code = typeof data?.error?.code === 'string' ? data.error.code : undefined;
    const msg = data?.error?.message || data?.message || data?.error;
    return {
      code,
      message: typeof msg === 'string' ? msg : `Vercel API ${res.status}`,
    };
  } catch {
    return { code: undefined, message: `Vercel API ${res.status}` };
  }
}

/**
 * Attach `domain` to the Vercel project `projectName`. Idempotent: if the
 * domain is already attached to this same project, resolves successfully.
 * Throws on any other error (e.g. domain owned by another project).
 */
export async function addProjectDomain(projectName: string, domain: string): Promise<void> {
  const { token, teamId } = readEnv();
  const url = withTeam(
    `${VERCEL_API}/v10/projects/${encodeURIComponent(projectName)}/domains`,
    teamId
  );
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: domain }),
  });
  if (res.ok) return;

  const { code, message } = await parseError(res);
  // "domain_already_in_use" with status 409 = already attached to THIS project
  // (Vercel returns the same code if it's on another project — we let those
  // propagate so the user sees a clear conflict).
  if (res.status === 409 && /already.*project|already attached/i.test(message)) {
    return;
  }
  throw new Error(`addProjectDomain failed (${code ?? res.status}): ${message}`);
}

/**
 * Detach `domain` from `projectName`. Best-effort: 404 is treated as success
 * so we can call this freely on subdomain change / project delete.
 */
export async function removeProjectDomain(projectName: string, domain: string): Promise<void> {
  const { token, teamId } = readEnv();
  const url = withTeam(
    `${VERCEL_API}/v9/projects/${encodeURIComponent(projectName)}/domains/${encodeURIComponent(domain)}`,
    teamId
  );
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (res.ok || res.status === 404) return;
  const { code, message } = await parseError(res);
  throw new Error(`removeProjectDomain failed (${code ?? res.status}): ${message}`);
}

/**
 * Point `alias` at `deploymentId`. Vercel automatically moves the alias off
 * any previous deployment, which is exactly the "republish updates the URL
 * in place" semantics we want.
 */
export async function assignAlias(deploymentId: string, alias: string): Promise<void> {
  const { token, teamId } = readEnv();
  const url = withTeam(
    `${VERCEL_API}/v2/deployments/${encodeURIComponent(deploymentId)}/aliases`,
    teamId
  );
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ alias }),
  });
  if (res.ok) return;
  // 409 = alias already assigned to this same deployment.
  if (res.status === 409) return;
  const { code, message } = await parseError(res);
  throw new Error(`assignAlias failed (${code ?? res.status}): ${message}`);
}
