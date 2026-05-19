/**
 * Vercel domain + alias helpers (Phase 4). Server-only.
 *
 * Endpoints we consume:
 *   POST   /v10/projects/{name}/domains              — attach a custom domain
 *   POST   /v2/deployments/{id}/aliases              — point alias at deployment
 *   DELETE /v9/projects/{name}/domains/{d}           — detach a custom domain
 *   GET    /v9/projects/{name}/domains/{d}/config    — DNS misconfig probe
 *   GET    /v9/projects/{name}/domains/{d}           — verification challenge
 *   POST   /v9/projects/{name}/domains/{d}/verify    — re-check TXT challenge
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
  // 404 / not_found = the Vercel project hasn't been provisioned yet. Projects
  // are created lazily by the first createDeployment call, so callers that may
  // run pre-publish (subdomain claim, retry) should treat this as soft: the
  // deploy route re-attaches on first publish.
  if (res.status === 404 || /not_found/i.test(code ?? '')) {
    throw new ProjectNotProvisionedError(projectName);
  }
  throw new Error(`addProjectDomain failed (${code ?? res.status}): ${message}`);
}

/**
 * Thrown by domain helpers when the underlying Vercel project does not exist
 * yet (i.e. nothing has been deployed for this SparkPage project). Callers
 * that may run before the first publish should catch this and leave the
 * subdomain row in `pending` state — the deploy route will re-attempt the
 * attach when the Vercel project is created on first deploy.
 */
export class ProjectNotProvisionedError extends Error {
  constructor(public readonly projectName: string) {
    super(`Vercel project not provisioned: ${projectName}`);
    this.name = 'ProjectNotProvisionedError';
  }
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

/**
 * Result of GET /v9/projects/{name}/domains/{domain}/config. `misconfigured`
 * is the single source of truth Vercel exposes — `true` means the user's DNS
 * isn't (yet) pointing at us. The expected records are surfaced so the UI can
 * show "add CNAME to cname.vercel-dns.com" without us hard-coding them in
 * multiple places.
 */
export interface DomainConfig {
  misconfigured: boolean;
  aRecord: string | null;
  cname: string | null;
}

export async function getDomainConfig(
  projectName: string,
  domain: string
): Promise<DomainConfig> {
  const { token, teamId } = readEnv();
  const url = withTeam(
    `${VERCEL_API}/v9/projects/${encodeURIComponent(projectName)}/domains/${encodeURIComponent(domain)}/config`,
    teamId
  );
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (res.status === 404) {
    throw new ProjectNotProvisionedError(projectName);
  }
  if (!res.ok) {
    const { code, message } = await parseError(res);
    throw new Error(`getDomainConfig failed (${code ?? res.status}): ${message}`);
  }
  const data = await res.json() as {
    misconfigured?: boolean;
    aValues?: string[];
    cnames?: string[];
  };
  return {
    misconfigured: data.misconfigured === true,
    aRecord: data.aValues?.[0] ?? null,
    cname: data.cnames?.[0] ?? null,
  };
}

/**
 * Result of GET /v9/projects/{name}/domains/{domain}. When `verification` is
 * non-empty Vercel needs the user to publish a TXT record to prove ownership
 * (typically because the domain is already attached to another team). When
 * `verified` is true the attach is complete; DNS may still be misconfigured.
 */
export interface DomainVerification {
  verified: boolean;
  txtName: string | null;
  txtValue: string | null;
}

export async function getDomainVerification(
  projectName: string,
  domain: string
): Promise<DomainVerification> {
  const { token, teamId } = readEnv();
  const url = withTeam(
    `${VERCEL_API}/v9/projects/${encodeURIComponent(projectName)}/domains/${encodeURIComponent(domain)}`,
    teamId
  );
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (res.status === 404) {
    throw new ProjectNotProvisionedError(projectName);
  }
  if (!res.ok) {
    const { code, message } = await parseError(res);
    throw new Error(`getDomainVerification failed (${code ?? res.status}): ${message}`);
  }
  const data = await res.json() as {
    verified?: boolean;
    verification?: Array<{ type?: string; domain?: string; value?: string }>;
  };
  const challenge = (data.verification || []).find((v) => v?.type === 'TXT');
  return {
    verified: data.verified === true,
    txtName: typeof challenge?.domain === 'string' ? challenge.domain : null,
    txtValue: typeof challenge?.value === 'string' ? challenge.value : null,
  };
}

/**
 * Re-runs Vercel's TXT challenge check. Returns true if the domain is now
 * verified. Throws on any non-404 error; treats 404 as ProjectNotProvisioned.
 */
export async function verifyProjectDomain(
  projectName: string,
  domain: string
): Promise<boolean> {
  const { token, teamId } = readEnv();
  const url = withTeam(
    `${VERCEL_API}/v9/projects/${encodeURIComponent(projectName)}/domains/${encodeURIComponent(domain)}/verify`,
    teamId
  );
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (res.status === 404) {
    throw new ProjectNotProvisionedError(projectName);
  }
  if (!res.ok) {
    const { code, message } = await parseError(res);
    throw new Error(`verifyProjectDomain failed (${code ?? res.status}): ${message}`);
  }
  const data = await res.json() as { verified?: boolean };
  return data.verified === true;
}
