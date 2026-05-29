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

interface VercelErrorBody {
  code: string | undefined;
  message: string;
  /** Vercel sometimes includes the conflicting project's id in the 409 body. */
  conflictingProjectId: string | undefined;
}

async function parseError(res: Response): Promise<VercelErrorBody> {
  try {
    const data = await res.json();
    const code = typeof data?.error?.code === 'string' ? data.error.code : undefined;
    const msg = data?.error?.message || data?.message || data?.error;
    const projectId =
      typeof data?.error?.projectId === 'string' ? data.error.projectId :
      typeof data?.projectId === 'string' ? data.projectId :
      undefined;
    return {
      code,
      message: typeof msg === 'string' ? msg : `Vercel API ${res.status}`,
      conflictingProjectId: projectId,
    };
  } catch {
    return { code: undefined, message: `Vercel API ${res.status}`, conflictingProjectId: undefined };
  }
}

/**
 * Heuristic: does the 409 message describe a conflict with a DIFFERENT
 * Vercel project than the one we just asked Vercel to attach to? If so we
 * extract the conflicting project's name (best-effort — Vercel doesn't
 * guarantee this string format) so callers can decide whether to auto-release.
 *
 * Vercel's messages we've seen in the wild:
 *   "Domain foo.com is already in use by project sparkpage-bbbb2222"
 *   "Domain foo.com is already attached to this project"
 *   "Cannot add foo.com since it's already in use by one of your projects."
 *   "Project already contains domain foo.com"
 *
 * Return shape:
 *   null                              — no conflict signal (or idempotent
 *                                       same-project hit, e.g. "attached to
 *                                       this project")
 *   { otherProjectName: 'sparkpage-…' } — conflict with a parseable name
 *   { otherProjectName: null }         — conflict signal present but the
 *                                       wording was too vague to extract a
 *                                       project name (caller may need to
 *                                       discover the orphan via the API)
 */
const CONFLICT_STOP_WORDS = new Set([
  'this', 'one', 'another', 'your', 'the', 'our', 'a', 'an', 'some', 'project', 'projects',
]);

function detectCrossProjectConflict(
  message: string,
  ownProjectName: string,
): { otherProjectName: string | null } | null {
  const hasConflictSignal =
    /in use|already attached|already exists|already contains/i.test(message);

  const m = message.match(
    /(?:in use by|attached to|owned by)(?:\s+project)?\s+([a-z0-9_-]+)/i,
  );
  if (!m) {
    return hasConflictSignal ? { otherProjectName: null } : null;
  }
  const other = m[1];
  const lower = other.toLowerCase();
  // "attached to this project" → our own project, idempotent.
  if (lower === 'this' || lower === ownProjectName.toLowerCase()) return null;
  // Captured an English stop-word (e.g. "in use by one of your projects")
  // — definitely a cross-project conflict, but we can't name the project
  // from the message alone.
  if (CONFLICT_STOP_WORDS.has(lower) || lower.length < 3) {
    return { otherProjectName: null };
  }
  return { otherProjectName: other };
}

/**
 * When Vercel returns a vague 409 ("already in use by one of your projects")
 * we have to discover *which* project is holding the domain ourselves.
 * Pages through the team's project list and, for each `sparkpage-*` project
 * other than our own, asks Vercel whether that project has the domain
 * attached. Returns the first match's project name, or null if none of the
 * SparkPage projects in the first MAX_PAGES pages own it.
 *
 * Bounded at 3 pages × 100 = 300 projects to keep the failure path fast.
 */
async function findOrphanSparkpageProject(
  domain: string,
  ownProjectName: string,
): Promise<string | null> {
  const { token, teamId } = readEnv();
  const headers = { 'Authorization': `Bearer ${token}` };
  const MAX_PAGES = 3;

  let until: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const params = new URLSearchParams({ limit: '100' });
    if (until) params.set('until', until);
    const listUrl = withTeam(`${VERCEL_API}/v9/projects?${params.toString()}`, teamId);
    const listRes = await fetch(listUrl, { method: 'GET', headers });
    if (!listRes.ok) return null;
    const listData = (await listRes.json()) as {
      projects?: Array<{ name?: string }>;
      pagination?: { next?: string | number | null };
    };

    const candidates = (listData.projects ?? [])
      .map((p) => p.name)
      .filter((n): n is string =>
        typeof n === 'string' && n.startsWith('sparkpage-') && n !== ownProjectName,
      );

    const owners = await Promise.all(
      candidates.map(async (name) => {
        const url = withTeam(
          `${VERCEL_API}/v9/projects/${encodeURIComponent(name)}/domains/${encodeURIComponent(domain)}`,
          teamId,
        );
        const r = await fetch(url, { method: 'GET', headers });
        return r.ok ? name : null;
      }),
    );
    const found = owners.find((n): n is string => n !== null);
    if (found) return found;

    const next = listData.pagination?.next;
    if (next === null || next === undefined) return null;
    until = String(next);
  }
  return null;
}

export type DomainClaimScope = 'same_team' | 'other_account' | 'unknown';

/**
 * Thrown by addProjectDomain when the domain is attached to a different
 * Vercel project (same-team) or verified by a different Vercel account.
 * Callers map this to a 409 with a machine-readable `code` so the picker UI
 * can render an actionable error panel instead of a raw Vercel string.
 */
export class DomainClaimedError extends Error {
  constructor(
    public readonly domain: string,
    public readonly scope: DomainClaimScope,
    /** Conflicting project name when we could extract it (same-team only). */
    public readonly conflictingProjectName: string | null,
    /** Raw Vercel error code, for telemetry / future branching. */
    public readonly vercelCode: string | undefined,
    message: string,
  ) {
    super(message);
    this.name = 'DomainClaimedError';
  }

  /** Stable string code persisted to `projects.custom_domain_error_code`. */
  get errorCode(): string {
    return this.scope === 'other_account'
      ? 'domain_claimed_other_account'
      : this.scope === 'same_team'
        ? 'domain_claimed_same_team'
        : 'domain_claimed_unknown';
  }
}

export interface AddProjectDomainOptions {
  /**
   * When true and the conflicting project is in our same Vercel team AND its
   * name starts with `sparkpage-`, treat it as an abandoned SparkPage and
   * detach the domain from it before retrying once. The conflicting project
   * is most often a deleted-but-not-fully-cleaned-up SparkPage from the
   * same user; releasing it lets reattaching Just Work.
   */
  releaseOrphan?: boolean;
}

/**
 * Attach `domain` to the Vercel project `projectName`. Idempotent: if the
 * domain is already attached to this same project, resolves successfully.
 *
 * Error taxonomy:
 *   - 404 / `not_found`            → ProjectNotProvisionedError (soft)
 *   - 409 conflict with OUR own project → resolves (idempotent)
 *   - 409 conflict with another project in our team, sparkpage-* prefix,
 *     `releaseOrphan: true`        → detach + retry once
 *   - 409 conflict with another project, otherwise → DomainClaimedError(same_team)
 *   - 403 / `forbidden` / `not_authorized` → DomainClaimedError(other_account)
 *   - other non-2xx                → generic Error
 */
export async function addProjectDomain(
  projectName: string,
  domain: string,
  opts: AddProjectDomainOptions = {},
): Promise<void> {
  const res = await postAttach(projectName, domain);
  if (res.ok) return;

  const parsed = await parseError(res);
  const handled = await classifyAttachError(projectName, domain, res.status, parsed, opts);
  if (handled === 'soft') return;
  if (handled === 'retry') {
    const retry = await postAttach(projectName, domain);
    if (retry.ok) return;
    const retryParsed = await parseError(retry);
    // Second failure is terminal — do not loop.
    throw classifyTerminalError(projectName, domain, retry.status, retryParsed);
  }
  throw handled;
}

async function postAttach(projectName: string, domain: string): Promise<Response> {
  const { token, teamId } = readEnv();
  const url = withTeam(
    `${VERCEL_API}/v10/projects/${encodeURIComponent(projectName)}/domains`,
    teamId,
  );
  return fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: domain }),
  });
}

/**
 * Classify a non-2xx response from postAttach. Returns either:
 *   - 'retry' when the caller should re-attempt postAttach (after a side
 *     effect like releasing an orphan)
 *   - a thrown-shaped Error otherwise (ProjectNotProvisioned / DomainClaimed /
 *     generic) which the caller throws
 */
async function classifyAttachError(
  projectName: string,
  domain: string,
  status: number,
  parsed: VercelErrorBody,
  opts: AddProjectDomainOptions,
): Promise<'retry' | 'soft' | Error> {
  const { code, message } = parsed;

  // 404 / not_found = the Vercel project hasn't been provisioned yet. Projects
  // are created lazily by the first createDeployment call, so callers that may
  // run pre-publish (subdomain claim, retry) should treat this as soft: the
  // deploy route re-attaches on first publish.
  if (status === 404 || /not_found/i.test(code ?? '')) {
    return new ProjectNotProvisionedError(projectName);
  }

  // 403 / forbidden = the domain is verified by another Vercel account
  // (different team entirely). Only resolvable via TXT-proof ownership
  // challenge or by the user removing the domain from that account first.
  if (status === 403 || /forbidden|not_authorized/i.test(code ?? '')) {
    return new DomainClaimedError(
      domain, 'other_account', null, code,
      message || 'Domain is verified by another Vercel account.',
    );
  }

  // 409 = some flavor of "domain already in use". Could be:
  //   (a) already attached to THIS project       → idempotent success
  //   (b) attached to another project in our team → orphan-release or claim
  //   (c) Vercel returned 409 for an unrelated reason (rare)
  if (status === 409) {
    const conflict = detectCrossProjectConflict(message, projectName);
    if (!conflict) {
      // Same-project idempotent hit. Treat as success — Vercel just told us
      // the domain is already where we want it.
      return 'soft';
    }
    let otherName = conflict.otherProjectName;
    // Vague wording ("one of your projects") + caller opted in to
    // self-healing: actively discover which sparkpage-* project is holding
    // the domain so we can detach it.
    if (opts.releaseOrphan && otherName === null) {
      otherName = await findOrphanSparkpageProject(domain, projectName);
    }
    if (opts.releaseOrphan && otherName && /^sparkpage-/.test(otherName)) {
      try {
        await removeProjectDomain(otherName, domain);
        return 'retry';
      } catch (err) {
        const detachMsg = err instanceof Error ? err.message : 'detach failed';
        return new DomainClaimedError(
          domain, 'same_team', otherName, code,
          `Domain is in use by another SparkPage project and auto-release failed: ${detachMsg}`,
        );
      }
    }
    return new DomainClaimedError(
      domain, 'same_team', otherName, code,
      message || `Domain is already in use by another project${otherName ? ` (${otherName})` : ''}.`,
    );
  }

  return new Error(`addProjectDomain failed (${code ?? status}): ${message}`);
}

function classifyTerminalError(
  projectName: string,
  domain: string,
  status: number,
  parsed: VercelErrorBody,
): Error {
  // Reuse the classifier minus the retry branch. Anything that would have
  // returned 'retry' on the first attempt should not happen here, but if it
  // does we collapse to a same_team DomainClaimedError so the row gets a
  // useful error_code.
  const { code, message } = parsed;
  if (status === 404 || /not_found/i.test(code ?? '')) {
    return new ProjectNotProvisionedError(projectName);
  }
  if (status === 403 || /forbidden|not_authorized/i.test(code ?? '')) {
    return new DomainClaimedError(
      domain, 'other_account', null, code,
      message || 'Domain is verified by another Vercel account.',
    );
  }
  if (status === 409) {
    return new DomainClaimedError(
      domain, 'same_team', null, code,
      message || 'Domain is already in use by another project.',
    );
  }
  return new Error(`addProjectDomain failed (${code ?? status}): ${message}`);
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
