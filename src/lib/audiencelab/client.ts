/**
 * Minimal typed wrapper around the AudienceLab REST API.
 *
 * Auth: a single global `AUDIENCELAB_API_KEY` env var shared across all
 * SparkPage accounts (Angle A — Option 1). Server-only; never imported
 * from the client.
 *
 * Docs:
 *   https://audiencelab.mintlify.app/api-reference/pixel/create-pixel
 *   https://audiencelab.mintlify.app/api-reference/pixel/get-pixels
 *   https://audiencelab.mintlify.app/api-reference/pixel/pixel-lookup-v4
 */

const AUDIENCELAB_API = 'https://api.audiencelab.io';

/**
 * Thrown when AudienceLab returns a 5xx. Separated from generic `Error` so
 * dashboard logs make it obvious the failure is upstream and not a bug on
 * our side — the same call can be safely retried by the user.
 */
export class AudienceLabUpstreamError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(`AudienceLab upstream ${status}: ${message}`);
    this.name = 'AudienceLabUpstreamError';
    this.status = status;
  }
}

/**
 * Test seam: lets the test runner shorten backoff sleeps so the retry path
 * can be exercised without burning real wall time. Production code never
 * touches this.
 */
let sleepImpl: (ms: number) => Promise<void> = (ms) =>
  new Promise((r) => setTimeout(r, ms));
export function __setSleepForTests(fn: (ms: number) => Promise<void>): void {
  sleepImpl = fn;
}

export interface CreatePixelInput {
  /** Display name for the pixel inside AudienceLab. */
  websiteName: string;
  /** Canonical URL where the pixel will be installed (the published page). */
  websiteUrl: string;
  /** Optional webhook for pixel events. */
  webhookUrl?: string;
  /** Defaults to 'v4' (latest). */
  version?: 'v3' | 'v4';
}

export interface CreatePixelResponse {
  pixel_id: string;
  install_url: string;
}

function readApiKey(): string {
  const key = process.env.AUDIENCELAB_API_KEY;
  if (!key) {
    throw new Error('[audiencelab/client] Missing AUDIENCELAB_API_KEY env var');
  }
  return key;
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    const msg = data?.message || data?.error?.message || data?.error;
    return typeof msg === 'string' ? msg : `AudienceLab API ${res.status}`;
  } catch {
    return `AudienceLab API ${res.status}`;
  }
}

/**
 * Create a new pixel pointing at `websiteUrl`. Returns the pixel id and the
 * `install_url` — a JS file that gets injected into the published HTML.
 */
export async function createPixel(input: CreatePixelInput): Promise<CreatePixelResponse> {
  const apiKey = readApiKey();
  const body = {
    websiteName: input.websiteName,
    websiteUrl: input.websiteUrl,
    webhookUrl: input.webhookUrl,
    version: input.version ?? 'v4',
  };

  const res = await fetch(`${AUDIENCELAB_API}/pixels`, {
    method: 'POST',
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`createPixel failed: ${await parseError(res)}`);
  }
  const data = (await res.json()) as CreatePixelResponse;
  if (!data?.pixel_id || !data?.install_url) {
    throw new Error('createPixel: response missing pixel_id / install_url');
  }
  return data;
}

/**
 * Curated subset of the V4 resolution payload — all UPPER_CASE keys are
 * optional strings per the AudienceLab schema. Captured here so the rest of
 * the app can refer to a typed shape instead of `Record<string, unknown>`.
 */
export interface V4Resolution {
  FIRST_NAME?: string;
  LAST_NAME?: string;
  PERSONAL_ADDRESS?: string;
  PERSONAL_CITY?: string;
  PERSONAL_STATE?: string;
  PERSONAL_ZIP?: string;
  AGE_RANGE?: string;
  CHILDREN?: string;
  GENDER?: string;
  HOMEOWNER?: string;
  MARRIED?: string;
  NET_WORTH?: string;
  INCOME_RANGE?: string;
  ALL_LANDLINES?: string;
  ALL_MOBILES?: string;
  PERSONAL_EMAILS?: string;
  PERSONAL_VERIFIED_EMAILS?: string;
  COMPANY_NAME?: string;
  COMPANY_DOMAIN?: string;
  COMPANY_INDUSTRY?: string;
  BUSINESS_EMAIL?: string;
  JOB_TITLE?: string;
  SENIORITY_LEVEL?: string;
  INDIVIDUAL_LINKEDIN_URL?: string;
  [key: string]: string | undefined;
}

export interface V4Event {
  pixel_id: string;
  hem_sha256?: string;
  event_timestamp?: string;
  referrer_url?: string;
  full_url?: string;
  edid?: string;
  resolution?: V4Resolution;
}

export interface V4LookupResponse {
  total_records: number;
  page_size: number;
  page: number;
  total_pages: number;
  events: V4Event[];
}

export interface LookupPixelV4Input {
  pixelId: string;
  page?: number;
  pageSize?: number;
}

/**
 * GET with retry-on-5xx. AudienceLab's V4 endpoint occasionally returns a
 * transient `500 Internal server error` that clears within a couple of
 * seconds; we'd rather absorb the blip than show an empty dashboard. 4xx
 * responses are returned immediately so callers can surface vendor errors
 * (auth, not-found) without delay.
 *
 * Backoff: 500ms, then 1000ms — at most 3 total attempts, ~1.5s added
 * latency in the worst case.
 */
async function fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
  const maxAttempts = 3;
  let lastRes: Response | null = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await fetch(url, init);
    if (res.ok || res.status < 500) return res;
    lastRes = res;
    if (attempt < maxAttempts - 1) {
      await sleepImpl(500 * 2 ** attempt);
    }
  }
  return lastRes as Response;
}

/**
 * GET /pixels/{id}/v4 — paginated list of resolved pixel events with full
 * V4 resolution payload (name, email, address, demographics, employer, etc).
 * Returns at most `pageSize` events per call (max 1000, default 100).
 *
 * 5xx responses are retried with backoff; if all attempts fail, throws an
 * `AudienceLabUpstreamError` so callers can distinguish vendor outages from
 * client-side bugs in logs.
 */
export async function lookupPixelV4(
  input: LookupPixelV4Input
): Promise<V4LookupResponse> {
  const apiKey = readApiKey();
  const params = new URLSearchParams();
  if (input.page) params.set('page', String(input.page));
  if (input.pageSize) params.set('page_size', String(input.pageSize));
  const qs = params.toString();
  const url = `${AUDIENCELAB_API}/pixels/${encodeURIComponent(input.pixelId)}/v4${qs ? `?${qs}` : ''}`;

  const res = await fetchWithRetry(url, {
    method: 'GET',
    headers: {
      'X-Api-Key': apiKey,
      'Accept': 'application/json',
    },
    // V4 events refresh near-real-time on AudienceLab's side; let the
    // dashboard page-level cache control TTL here.
    cache: 'no-store',
  });

  if (!res.ok) {
    const msg = await parseError(res);
    if (res.status >= 500) {
      throw new AudienceLabUpstreamError(res.status, msg);
    }
    throw new Error(`lookupPixelV4 failed: ${msg}`);
  }
  const data = (await res.json()) as V4LookupResponse;
  return {
    total_records: data?.total_records ?? 0,
    page_size: data?.page_size ?? 0,
    page: data?.page ?? 1,
    total_pages: data?.total_pages ?? 0,
    events: Array.isArray(data?.events) ? data.events : [],
  };
}
