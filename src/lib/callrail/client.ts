/**
 * Minimal typed wrapper around the CallRail v3 REST API.
 *
 * Auth: per-user API key (CallRail keys are scoped to individual users).
 * Stored in public.user_integrations and only ever read via the service-role
 * admin client. This module is server-only — never import from a client
 * component.
 *
 * Docs:
 *   https://apidocs.callrail.com/
 */

const CALLRAIL_API = 'https://api.callrail.com';

/**
 * Sent in the Request-From header per CallRail's "Identifying your
 * integration" guidance. Lowercased, underscore-separated.
 */
const REQUEST_FROM = 'sparkpage';

/** Thrown when a CallRail entity is missing (e.g. company deleted). */
export class CallRailNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CallRailNotFoundError';
  }
}

/** Thrown when the API key is rejected (401 / 403). */
export class CallRailAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CallRailAuthError';
  }
}

function authHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Token token="${apiKey}"`,
    'Request-From': REQUEST_FROM,
    Accept: 'application/json',
  };
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    const msg = data?.error || data?.message || data?.errors?.[0];
    return typeof msg === 'string' ? msg : `CallRail API ${res.status}`;
  } catch {
    return `CallRail API ${res.status}`;
  }
}

async function callrailFetch(url: string, apiKey: string): Promise<Response> {
  const res = await fetch(url, {
    method: 'GET',
    headers: authHeaders(apiKey),
    cache: 'no-store',
  });
  if (res.status === 401 || res.status === 403) {
    throw new CallRailAuthError(`CallRail rejected the API key (${res.status})`);
  }
  if (res.status === 404) {
    throw new CallRailNotFoundError(await parseError(res));
  }
  return res;
}

// ── Accounts ───────────────────────────────────────────────────────────────

export interface CallRailAccount {
  id: string;
  name: string;
}

/**
 * GET /v3/a.json — list accounts the API key can see. The key is per-user so
 * this is virtually always a single-element array; we return the first id and
 * use it everywhere else. A key with no accounts is treated as invalid.
 */
export async function listAccounts(apiKey: string): Promise<CallRailAccount[]> {
  const res = await callrailFetch(`${CALLRAIL_API}/v3/a.json`, apiKey);
  if (!res.ok) {
    throw new Error(`listAccounts failed: ${await parseError(res)}`);
  }
  const data = (await res.json()) as { accounts?: CallRailAccount[] };
  return Array.isArray(data?.accounts) ? data.accounts : [];
}

/** Convenience: resolve the primary account id for a key, or throw. */
export async function resolvePrimaryAccountId(apiKey: string): Promise<string> {
  const accounts = await listAccounts(apiKey);
  const first = accounts[0];
  if (!first?.id) {
    throw new CallRailAuthError('CallRail returned no accounts for this API key.');
  }
  return first.id;
}

// ── Companies ──────────────────────────────────────────────────────────────

export interface CallRailCompany {
  id: string;
  name: string;
  status: string;
  created_at: string;
  disabled_at: string | null;
}

/** GET /v3/a/{account_id}/companies.json — paged, but Phase 1 only surfaces
 *  the first page (companies per CallRail account are typically a handful). */
export async function listCompanies(
  apiKey: string,
  accountId: string
): Promise<CallRailCompany[]> {
  const url = `${CALLRAIL_API}/v3/a/${encodeURIComponent(accountId)}/companies.json?per_page=250`;
  const res = await callrailFetch(url, apiKey);
  if (!res.ok) {
    throw new Error(`listCompanies failed: ${await parseError(res)}`);
  }
  const data = (await res.json()) as { companies?: CallRailCompany[] };
  return Array.isArray(data?.companies) ? data.companies : [];
}

// ── Calls ──────────────────────────────────────────────────────────────────

/**
 * Subset of CallRail's call payload we render. Matches the documented Listing
 * All Calls response (with field selection extras requested below). Extra
 * fields are tolerated — see the index signature.
 */
export interface CallRailCall {
  id: string;
  start_time?: string | null;
  direction?: string | null;
  answered?: boolean | null;
  duration?: number | string | null;
  customer_name?: string | null;
  customer_phone_number?: string | null;
  customer_city?: string | null;
  customer_state?: string | null;
  tracking_phone_number?: string | null;
  source_name?: string | null;
  campaign?: string | null;
  landing_page_url?: string | null;
  recording?: string | null;
  recording_player?: string | null;
  transcription?: string | null;
  company_id?: string | null;
  tracker_id?: string | null;
  [key: string]: unknown;
}


export interface ListCallsInput {
  apiKey: string;
  accountId: string;
  companyId: string;
  /** Standard date filter; default 'last_30_days' so we stay well inside the
   *  25-month retention window. */
  dateRange?: 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'last_month' | 'this_year' | 'last_year' | 'all_time' | 'recent';
  perPage?: number;
}

export interface ListCallsResponse {
  calls: CallRailCall[];
  hasNextPage: boolean;
}

/**
 * GET /v3/a/{account_id}/calls.json — uses relative pagination per CallRail's
 * recommendation for the calls endpoint. We surface only the first page here;
 * the dashboard's read path stitches this together with webhook-cached rows
 * from public.calls for everything older than the current window.
 *
 * `fields` adds recording + transcription + company/tracker context so the UI
 * can render the player and source pill without an extra round trip.
 */
export async function listCalls(input: ListCallsInput): Promise<ListCallsResponse> {
  const { apiKey, accountId, companyId, dateRange = 'last_30_days', perPage = 100 } = input;
  const params = new URLSearchParams({
    company_id: companyId,
    date_range: dateRange,
    relative_pagination: 'true',
    per_page: String(Math.min(Math.max(perPage, 1), 250)),
    fields: [
      'company_id', 'company_name', 'tracker_id',
      'source_name', 'campaign', 'landing_page_url',
      'recording_player', 'transcription',
    ].join(','),
  });
  const url = `${CALLRAIL_API}/v3/a/${encodeURIComponent(accountId)}/calls.json?${params.toString()}`;
  const res = await callrailFetch(url, apiKey);
  if (!res.ok) {
    throw new Error(`listCalls failed: ${await parseError(res)}`);
  }
  const data = (await res.json()) as { calls?: CallRailCall[]; has_next_page?: boolean };
  return {
    calls: Array.isArray(data?.calls) ? data.calls : [],
    hasNextPage: Boolean(data?.has_next_page),
  };
}
