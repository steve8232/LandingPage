/**
 * Minimal typed wrapper around the DataForSEO Business Data API.
 *
 * Auth: a single pre-encoded `DATAFORSEO_BASIC_AUTH` env var (Option A —
 * the user already base64-encoded "login:password" before storing it).
 * `DATAFORSEO_API_BASE` defaults to https://api.dataforseo.com so prod and
 * sandbox can be switched without code changes. Server-only — never import
 * from a client component.
 *
 * Docs:
 *   https://docs.dataforseo.com/v3/business_data/google/my_business_info/task_post/
 *   https://docs.dataforseo.com/v3/appendix/status_codes/
 */

const DEFAULT_API_BASE = 'https://api.dataforseo.com';

// ── Location normalization ────────────────────────────────────────────────
//
// DataForSEO's `location_name` is a controlled vocabulary keyed off their
// locations dictionary; the matcher is whitespace-sensitive and requires
// the country segment. Users type things like "Chicago, Illinois" or
// "Chicago, IL"; both get rejected as `Invalid Field: 'location_name'`.
//
// This helper folds the common variants into the shape DataForSEO accepts
// ("Chicago,Illinois,United States"). Anything we can't confidently fix
// is left for the caller's fallback path (country-only retry) below.

/**
 * Normalize a user-typed location string into the shape DataForSEO expects.
 * Strips whitespace around commas, drops empty segments, and appends
 * `,United States` when the last segment isn't already a US identifier.
 * Returns "United States" when the input is empty or whitespace-only.
 */
export function normalizeLocationName(input: string | undefined | null): string {
  if (!input) return 'United States';
  const parts = input
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (parts.length === 0) return 'United States';
  const last = parts[parts.length - 1].toLowerCase().replace(/\./g, '');
  if (last === 'united states' || last === 'usa' || last === 'us') {
    parts[parts.length - 1] = 'United States';
  } else {
    parts.push('United States');
  }
  return parts.join(',');
}

/**
 * True when the DataForSEO error looks like a `location_name` rejection,
 * so the caller can retry with the country-only fallback. Matches both
 * the canonical 40501 "Invalid Field" code and any message that names
 * `location_name` explicitly (covers minor wording changes upstream).
 */
function isLocationNameRejection(err: DataForSEOError): boolean {
  if (err.code === 40501) return true;
  return /location[_\s]name/i.test(err.message);
}

// ── Errors ─────────────────────────────────────────────────────────────────

/**
 * Thrown when DataForSEO rejects our credentials (HTTP 401 or task-level
 * status_code 40100). The provisioning route distinguishes this from
 * transient errors so the UI can surface a config-level message instead
 * of telling the user to retry.
 */
export class DataForSEOAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataForSEOAuthError';
  }
}

/** Generic DataForSEO error — wraps both HTTP and task-level failures. */
export class DataForSEOError extends Error {
  /** DataForSEO `status_code` (e.g. 40000, 50000). */
  readonly code: number | null;
  /** HTTP status from the response, when available. */
  readonly httpStatus: number | null;
  constructor(message: string, code: number | null, httpStatus: number | null) {
    super(message);
    this.name = 'DataForSEOError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

// ── Config ─────────────────────────────────────────────────────────────────

interface DataForSEOConfig {
  basicAuth: string;
  apiBase: string;
}

function readApiConfig(): DataForSEOConfig {
  const basicAuth = process.env.DATAFORSEO_BASIC_AUTH;
  if (!basicAuth) {
    throw new Error('[dataforseo/client] Missing DATAFORSEO_BASIC_AUTH env var');
  }
  const apiBase = process.env.DATAFORSEO_API_BASE || DEFAULT_API_BASE;
  return { basicAuth, apiBase: apiBase.replace(/\/+$/, '') };
}

// ── Shared helpers ─────────────────────────────────────────────────────────

interface TaskEnvelopeTask<T = unknown> {
  id?: string;
  status_code?: number;
  status_message?: string;
  cost?: number;
  result?: T | null;
}

interface TaskEnvelope<T = unknown> {
  status_code?: number;
  status_message?: string;
  tasks?: TaskEnvelopeTask<T>[];
}

function buildHeaders(basicAuth: string): Record<string, string> {
  return {
    Authorization: `Basic ${basicAuth}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

/** Inspect both the HTTP and task-level status codes; throw if either fails. */
function ensureOk<T>(envelope: TaskEnvelope<T>, httpStatus: number): TaskEnvelopeTask<T> {
  // Top-level auth failure (DataForSEO returns 40100 with HTTP 401 here).
  if (httpStatus === 401 || envelope.status_code === 40100) {
    throw new DataForSEOAuthError(
      envelope.status_message || `DataForSEO rejected the credentials (${httpStatus})`,
    );
  }
  if (!Array.isArray(envelope.tasks) || envelope.tasks.length === 0) {
    throw new DataForSEOError(
      envelope.status_message || 'DataForSEO returned no tasks',
      envelope.status_code ?? null,
      httpStatus,
    );
  }
  const task = envelope.tasks[0];
  // 20000 OK · 20100 Task Created · 20200 Task In Queue are all "ok" for POSTs.
  const taskCode = task.status_code ?? 0;
  if (taskCode >= 40000) {
    if (taskCode === 40100) {
      throw new DataForSEOAuthError(task.status_message || 'DataForSEO auth failure');
    }
    throw new DataForSEOError(
      task.status_message || `DataForSEO task failed (${taskCode})`,
      taskCode,
      httpStatus,
    );
  }
  return task;
}

// ── My Business Info — task POST (async w/ postback) ───────────────────────

export interface PostMyBusinessInfoTaskInput {
  /** Free-form keyword — typically the business name or "<niche> in <city>". */
  keyword: string;
  /** Defaults to "United States" so callers can omit it for nationwide queries. */
  locationName?: string;
  /** Defaults to "en". */
  languageCode?: string;
  /**
   * Absolute URL DataForSEO POSTs the result to once the task finishes.
   * Must include `$id` as a placeholder if the route reads the task id from
   * the path (we currently read it from the JSON body, so a static URL works).
   */
  postbackUrl: string;
  /** "advanced" returns the full payload; "regular" trims it. Defaults to "advanced". */
  postbackDataType?: 'advanced' | 'regular';
  /**
   * Caller-controlled correlation tag (≤255 chars). DataForSEO echoes this
   * back in the postback body so we can map the result to a research row.
   */
  tag?: string;
}

export interface PostMyBusinessInfoTaskResult {
  taskId: string;
  /** Per-task cost in USD as reported by DataForSEO (0 in sandbox). */
  cost: number;
}


/**
 * POST /v3/business_data/google/my_business_info/task_post — queue a Google
 * Business Profile lookup. The task runs async on DataForSEO's side; the
 * postback URL receives the result when ready (typically 30–120s).
 *
 * Returns the DataForSEO-issued task id, which the caller should persist on
 * the corresponding `dataforseo_research` row so the webhook can find it.
 */
export async function postMyBusinessInfoTask(
  input: PostMyBusinessInfoTaskInput,
): Promise<PostMyBusinessInfoTaskResult> {
  const { basicAuth, apiBase } = readApiConfig();
  const url = `${apiBase}/v3/business_data/google/my_business_info/task_post`;
  const normalizedLocation = normalizeLocationName(input.locationName);

  async function attempt(locationName: string, keyword: string): Promise<PostMyBusinessInfoTaskResult> {
    const body = [
      {
        keyword,
        location_name: locationName,
        language_code: input.languageCode || 'en',
        postback_url: input.postbackUrl,
        postback_data: input.postbackDataType || 'advanced',
        ...(input.tag ? { tag: input.tag } : {}),
      },
    ];
    const res = await fetch(url, {
      method: 'POST',
      headers: buildHeaders(basicAuth),
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    let envelope: TaskEnvelope<unknown>;
    try {
      envelope = (await res.json()) as TaskEnvelope<unknown>;
    } catch {
      throw new DataForSEOError(
        `DataForSEO returned a non-JSON response (${res.status})`,
        null,
        res.status,
      );
    }

    // Catch HTTP-level failures that didn't surface as an auth error above.
    if (!res.ok && res.status !== 401) {
      throw new DataForSEOError(
        envelope.status_message || `DataForSEO HTTP ${res.status}`,
        envelope.status_code ?? null,
        res.status,
      );
    }

    const task = ensureOk(envelope, res.status);
    if (!task.id) {
      throw new DataForSEOError(
        'DataForSEO accepted the task but returned no id',
        task.status_code ?? null,
        res.status,
      );
    }
    return {
      taskId: task.id,
      cost: typeof task.cost === 'number' ? task.cost : 0,
    };
  }

  try {
    return await attempt(normalizedLocation, input.keyword);
  } catch (err) {
    // One-shot fallback when DataForSEO rejects the location string. We
    // drop the city/state into the keyword so the query still benefits
    // from the geographic signal even though location_name is country-only.
    if (
      err instanceof DataForSEOError &&
      isLocationNameRejection(err) &&
      normalizedLocation !== 'United States'
    ) {
      const raw = (input.locationName || '').trim();
      const fallbackKeyword = raw ? `${input.keyword} ${raw}` : input.keyword;
      return await attempt('United States', fallbackKeyword);
    }
    throw err;
  }
}

// ── My Business Info — task GET (recover from a missed postback) ───────────

export interface GetMyBusinessInfoTaskResult {
  /** Full envelope as returned by DataForSEO — shape matches the postback body. */
  envelope: TaskEnvelope<unknown>;
  /** True while DataForSEO still has the task queued/in-progress (status 40602). */
  pending: boolean;
  /**
   * True when DataForSEO replied that this task id is unknown (HTTP 404 or
   * envelope/task-level status_code 40400 "Not Found."). Lets the caller
   * distinguish "task never existed / was purged" from generic failures so
   * the UI can offer a re-queue path instead of an infinite retry.
   */
  missing: boolean;
}

/**
 * GET /v3/business_data/google/my_business_info/task_get/advanced/{id} — fetch
 * the result of an async task synchronously. Used as a recovery path when the
 * postback to /api/webhooks/dataforseo/[token] never arrived or didn't match
 * a research row (token rotated, deployment-protection 401, network drop).
 *
 * Returns the full envelope verbatim so callers can persist it as
 * `dataforseo_research.raw_payload` and feed it through `parsePostback` /
 * `normalizeResearchPayload` — the postback path and the polling path share
 * one downstream pipeline.
 *
 * `pending: true` is returned (instead of throwing) when DataForSEO replies
 * with the task-not-yet-ready code (40602). All other 4xxxx/5xxxx codes throw
 * as a DataForSEOError so the UI can surface them.
 */
export async function getMyBusinessInfoTask(
  taskId: string,
): Promise<GetMyBusinessInfoTaskResult> {
  const { basicAuth, apiBase } = readApiConfig();
  const url = `${apiBase}/v3/business_data/google/my_business_info/task_get/advanced/${encodeURIComponent(taskId)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: buildHeaders(basicAuth),
    cache: 'no-store',
  });

  let envelope: TaskEnvelope<unknown>;
  try {
    envelope = (await res.json()) as TaskEnvelope<unknown>;
  } catch {
    throw new DataForSEOError(
      `DataForSEO returned a non-JSON response (${res.status})`,
      null,
      res.status,
    );
  }

  if (res.status === 401 || envelope.status_code === 40100) {
    throw new DataForSEOAuthError(
      envelope.status_message || `DataForSEO rejected the credentials (${res.status})`,
    );
  }

  // 40602 "Task In Queue / In Progress" — surface as pending, not error.
  const task = Array.isArray(envelope.tasks) ? envelope.tasks[0] : undefined;
  const taskCode = task?.status_code ?? envelope.status_code ?? 0;
  if (taskCode === 40602) {
    return { envelope, pending: true, missing: false };
  }

  // 40400 "Not Found." / HTTP 404 — task id is unknown to DataForSEO. Either
  // expired (results aren't kept indefinitely) or never accepted on their
  // side. Surface as `missing` so the caller can offer a re-queue.
  if (res.status === 404 || taskCode === 40400 || envelope.status_code === 40400) {
    return { envelope, pending: false, missing: true };
  }

  if (!res.ok) {
    throw new DataForSEOError(
      envelope.status_message || `DataForSEO HTTP ${res.status}`,
      envelope.status_code ?? null,
      res.status,
    );
  }
  return { envelope, pending: false, missing: false };
}
