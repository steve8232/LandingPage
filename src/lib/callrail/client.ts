/**
 * Minimal typed wrapper around the CallRail v3 REST API.
 *
 * Auth: a single global `CALLRAIL_API_KEY` env var that covers every Company
 * on the account — mirrors AUDIENCELAB_API_KEY. Callers obtain it via
 * `getCallRailApiKey()` in ./server-config and pass it through. This module
 * stays pure (no env reads) so it's trivial to unit-test. Server-only —
 * never import from a client component.
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

/**
 * Thrown when CallRail can't issue a tracker because there's no inventory in
 * the requested area (most commonly a 422 from POST /trackers.json with a
 * specific `tracking_number.local` or `area_code`). Lets the UI offer the
 * user a different area code or a toll-free fallback.
 */
export class CallRailNoInventoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CallRailNoInventoryError';
  }
}

/**
 * Thrown when the requested swap target is already in use by another tracker
 * on the same CallRail account (CallRail enforces global uniqueness). The
 * provisioning route catches this to adopt the existing tracker instead of
 * surfacing the raw error to the user.
 */
export class CallRailSwapTargetTakenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CallRailSwapTargetTakenError';
  }
}

function authHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Token token="${apiKey}"`,
    'Request-From': REQUEST_FROM,
    Accept: 'application/json',
  };
}

/**
 * Pull a human-readable message out of a CallRail error response. CallRail
 * uses several shapes for failures:
 *   { "error": "Tracking number area code …" }      // string
 *   { "message": "Validation failed" }              // string
 *   { "errors": ["Tracking number area code …"] }   // array of strings
 *   { "errors": [{ "field": "…", "message": "…" }] } // array of objects
 *   { "errors": "Tracking number area code …" }     // string (some endpoints)
 *   { "errors": { "tracking_number": ["…"] } }      // field -> messages map
 * We must NOT index a string with [0] (returns one character — that's the
 * "createTracker failed: T" bug). Walk the shape carefully.
 */
async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.error === 'string' && data.error.trim()) return data.error;
    if (typeof data?.message === 'string' && data.message.trim()) return data.message;
    const errs: unknown = data?.errors;
    if (typeof errs === 'string' && errs.trim()) return errs;
    if (Array.isArray(errs) && errs.length) {
      const first = errs[0];
      if (typeof first === 'string') return first;
      if (first && typeof first === 'object') {
        const obj = first as Record<string, unknown>;
        if (typeof obj.message === 'string') return obj.message;
        try { return JSON.stringify(first); } catch { /* fall through */ }
      }
    }
    if (errs && typeof errs === 'object') {
      // Field -> [message] map. Surface "field: first message" for the first
      // field with a populated value.
      for (const [field, value] of Object.entries(errs as Record<string, unknown>)) {
        if (Array.isArray(value) && typeof value[0] === 'string') return `${field}: ${value[0]}`;
        if (typeof value === 'string' && value.trim()) return `${field}: ${value}`;
      }
      try { return JSON.stringify(errs); } catch { /* fall through */ }
    }
    return `CallRail API ${res.status}`;
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

async function callrailPost(url: string, apiKey: string, body: unknown): Promise<Response> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...authHeaders(apiKey), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
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

/**
 * Full company shape including DNI fields. `script_url` is the swap.js URL
 * we inject into published pages — CallRail returns it protocol-relative
 * (`//cdn.callrail.com/...`); callers should prefix `https:` before use.
 */
export interface CallRailCompanyFull extends CallRailCompany {
  time_zone?: string | null;
  script_url?: string | null;
  swap_exclude_jquery?: boolean | null;
}

/**
 * POST /v3/a/{account_id}/companies.json — creates a Company. A Company is
 * just an organizational container and is **free** (the per-month cost is
 * billed per *tracker*, not per company). Time zone is required by CallRail.
 */
export async function createCompany(
  apiKey: string,
  accountId: string,
  input: { name: string; timeZone: string }
): Promise<CallRailCompanyFull> {
  const url = `${CALLRAIL_API}/v3/a/${encodeURIComponent(accountId)}/companies.json`;
  const res = await callrailPost(url, apiKey, {
    name: input.name,
    time_zone: input.timeZone,
  });
  if (!res.ok) {
    throw new Error(`createCompany failed: ${await parseError(res)}`);
  }
  return (await res.json()) as CallRailCompanyFull;
}

// ── Trackers ───────────────────────────────────────────────────────────────

/**
 * Preference describing what kind of tracking number we want issued. Maps
 * onto CallRail's tracker request body:
 *   - `area_code` → `tracking_number: { type: 'local', local: { area_code } }`
 *   - `toll_free` → `tracking_number: { type: 'toll_free', toll_free: { prefix } }`
 *
 * The provisioning route walks these in order so the editor can attempt the
 * destination phone's area code first, then surface alternatives if CallRail
 * has no inventory in that area.
 */
export type CallRailNumberPreference =
  | { type: 'local'; areaCode: string }
  | { type: 'toll_free'; prefix?: '800' | '888' | '877' | '866' | '855' | '844' | '833' };

export interface CreateTrackerInput {
  companyId: string;
  /** Display name shown in the CallRail UI. */
  name: string;
  /** Where calls to the tracking number are forwarded (E.164 digits). */
  destinationNumber: string;
  /** Desired tracking-number characteristics. */
  preference: CallRailNumberPreference;
  /**
   * Page numbers swap.js will replace with the tracking number on visits
   * routed through a tracked source. Defaults to `[destinationNumber]` when
   * omitted, which is exactly the wizard-captured business phone.
   */
  swapTargets?: string[];
}

/** Subset of the tracker response we use. CallRail returns many more fields. */
export interface CallRailTracker {
  id: string;
  name: string;
  type: string;
  status: string;
  /**
   * Nested company object as returned by the API. There is no top-level
   * `company_id` response field \u2014 only `company.{id,name}`. `company_id`
   * exists as a request-only filter on the list endpoint.
   */
  company?: { id: string; name: string } | null;
  destination_number: string | null;
  tracking_numbers: string[];
  [key: string]: unknown;
}

/** Coerce a phone-ish string into E.164 (+1NPANXXXXXX) for CallRail's API. */
function toE164US(raw: string): string {
  const d = raw.replace(/\D/g, '');
  const ten = d.length === 11 && d.startsWith('1') ? d.slice(1) : d.slice(-10);
  return `+1${ten}`;
}

/**
 * POST /v3/a/{account_id}/trackers.json — provisions a new tracker. **This
 * step is paid** — CallRail bills the account a recurring monthly fee per
 * tracker. The caller (UI) must surface that cost to the user before
 * triggering this endpoint.
 *
 * Body shape follows CallRail v3 (see "Creating a Source Tracker" in the
 * API docs): destination_number lives inside a basic call_flow, source is
 * required (we use catch-all "all"), tracking_number is the flat
 * {area_code} / {toll_free} shape, and swap_targets is an array of strings.
 *
 * Throws CallRailNoInventoryError on 422 so the UI can offer a different
 * area code or a toll-free fallback without a generic error.
 */
export async function createTracker(
  apiKey: string,
  accountId: string,
  input: CreateTrackerInput
): Promise<CallRailTracker> {
  const url = `${CALLRAIL_API}/v3/a/${encodeURIComponent(accountId)}/trackers.json`;
  const tracking_number: Record<string, string | boolean> = input.preference.type === 'local'
    ? { area_code: input.preference.areaCode }
    : { toll_free: true, area_code: input.preference.prefix ?? '888' };
  const swap_targets = input.swapTargets ?? [input.destinationNumber];
  const destinationE164 = toE164US(input.destinationNumber);
  const body = {
    company_id: input.companyId,
    name: input.name,
    type: 'source',
    call_flow: {
      type: 'basic',
      recording_enabled: true,
      destination_number: destinationE164,
      greeting_text: null,
      greeting_recording_url: null,
    },
    tracking_number,
    source: { type: 'all' },
    swap_targets,
  };
  const res = await callrailPost(url, apiKey, body);
  if (!res.ok) {
    const msg = await parseError(res);
    const lower = msg.toLowerCase();
    // CallRail sometimes stacks multiple validation errors in one response,
    // so check both signals on every 4xx.
    if (lower.includes('swap target') && lower.includes('taken')) {
      throw new CallRailSwapTargetTakenError(msg);
    }
    if (
      res.status === 422 ||
      lower.includes('unable to obtain number') ||
      lower.includes('no phone numbers available') ||
      lower.includes('no number available') ||
      lower.includes('no inventory')
    ) {
      throw new CallRailNoInventoryError(msg);
    }
    throw new Error(`createTracker failed: ${msg}`);
  }
  return (await res.json()) as CallRailTracker;
}

// ── Listing & lookup ───────────────────────────────────────────────────────

/**
 * Fields we explicitly request from the trackers index. The default response
 * omits `swap_targets`, which we need to detect adoption candidates, so we
 * pass `fields=` via the CallRail field-selection convention. `company` is
 * a nested {id,name} object; CallRail rejects `company_id` here because the
 * latter is only valid as a request filter, not a response field.
 */
const TRACKER_FIELDS = ['swap_targets', 'company'].join(',');

/**
 * GET /v3/a/{account_id}/trackers.json — paginated list. We fetch up to 250
 * per page (CallRail's max) and stop after a few pages for safety; accounts
 * with thousands of trackers would need follow-up paging but that's well
 * outside our current target. Pass `companyId` to filter to a single company.
 */
export async function listTrackers(
  apiKey: string,
  accountId: string,
  options: { companyId?: string; status?: 'active' | 'disabled'; maxPages?: number } = {}
): Promise<CallRailTracker[]> {
  const { companyId, status = 'active', maxPages = 4 } = options;
  const out: CallRailTracker[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const params = new URLSearchParams({
      per_page: '250',
      page: String(page),
      fields: TRACKER_FIELDS,
      status,
    });
    if (companyId) params.set('company_id', companyId);
    const url = `${CALLRAIL_API}/v3/a/${encodeURIComponent(accountId)}/trackers.json?${params.toString()}`;
    const res = await callrailFetch(url, apiKey);
    if (!res.ok) {
      throw new Error(`listTrackers failed: ${await parseError(res)}`);
    }
    const data = (await res.json()) as { trackers?: CallRailTracker[]; total_pages?: number };
    const batch = Array.isArray(data?.trackers) ? data.trackers : [];
    out.push(...batch);
    if (batch.length < 250) break;
    if (typeof data.total_pages === 'number' && page >= data.total_pages) break;
  }
  return out;
}

/** GET /v3/a/{account_id}/trackers/{id}.json — single tracker lookup. */
export async function getTracker(
  apiKey: string,
  accountId: string,
  trackerId: string
): Promise<CallRailTracker | null> {
  const params = new URLSearchParams({ fields: TRACKER_FIELDS });
  const url = `${CALLRAIL_API}/v3/a/${encodeURIComponent(accountId)}/trackers/${encodeURIComponent(trackerId)}.json?${params.toString()}`;
  try {
    const res = await callrailFetch(url, apiKey);
    if (!res.ok) {
      throw new Error(`getTracker failed: ${await parseError(res)}`);
    }
    return (await res.json()) as CallRailTracker;
  } catch (err) {
    if (err instanceof CallRailNotFoundError) return null;
    throw err;
  }
}

/**
 * Find a tracker on the account whose destination or swap_targets already
 * cover the wizard phone. Matches across all common phone formats — the
 * provisioning route walks the same set when registering swap targets.
 */
export function findAdoptableTracker(
  trackers: CallRailTracker[],
  destinationDigits: string
): CallRailTracker | null {
  const target = destinationDigits.replace(/\D/g, '').slice(-10);
  if (target.length < 10) return null;
  for (const t of trackers) {
    const destDigits = (typeof t.destination_number === 'string' ? t.destination_number : '')
      .replace(/\D/g, '')
      .slice(-10);
    if (destDigits === target) return t;
    const swaps = Array.isArray((t as { swap_targets?: unknown }).swap_targets)
      ? ((t as { swap_targets?: unknown[] }).swap_targets as unknown[])
      : [];
    for (const s of swaps) {
      const sd = (typeof s === 'string' ? s : '').replace(/\D/g, '').slice(-10);
      if (sd === target) return t;
    }
  }
  return null;
}

/**
 * Normalize the protocol-relative `script_url` CallRail returns on the
 * company create response into an absolute `https://…` URL safe to inject
 * into published `<head>`s. Returns null if the input is unusable.
 */
export function normalizeCallRailScriptUrl(scriptUrl: string | null | undefined): string | null {
  if (!scriptUrl) return null;
  const trimmed = scriptUrl.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return null;
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
