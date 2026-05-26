/**
 * Mapbox Search Box API — typed client.
 *
 * Two endpoints, called as a pair to bill as one session:
 *   /suggest  — autocomplete keystroke → array of partial results
 *   /retrieve — selected suggestion → full feature with coordinates
 *
 * Token: NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN (`pk.*` public token, browser-safe by
 * design; restrict by URL allowlist in the Mapbox dashboard).
 *
 * Docs: https://docs.mapbox.com/api/search/search-box/
 */

const BASE = 'https://api.mapbox.com/search/searchbox/v1';

export interface MapboxSuggestion {
  mapboxId: string;
  name: string;
  fullAddress: string;
  placeFormatted: string;
  featureType: string;
}

export interface MapboxFeature {
  /** Street line, e.g. "1201 S Main St". */
  streetAddress: string;
  /** Full one-line address. */
  fullAddress: string;
  /** City / place name, e.g. "Ann Arbor". */
  city: string;
  /** State / region full name, e.g. "Michigan". */
  region: string;
  /** State code, e.g. "MI". */
  regionCode: string;
  postcode: string;
  longitude: number;
  latitude: number;
}

export class MapboxError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'MapboxError';
    this.status = status;
  }
}

/** Public token getter; returns null when unset so the UI can render a plain input. */
export function getMapboxToken(): string | null {
  const t = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  return typeof t === 'string' && t.length > 0 ? t : null;
}

/** UUIDv4 for the session_token billing parameter. */
export function newSessionToken(): string {
  // crypto.randomUUID is available in modern browsers and Node 18+.
  // Cast to satisfy the lib type when the platform lacks the method.
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  // RFC4122 v4 fallback.
  const r = () => Math.floor(Math.random() * 256);
  const bytes = Array.from({ length: 16 }, r);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * GET /suggest. Returns up to `limit` US address suggestions for `query`.
 * `sessionToken` must be the same UUID across consecutive /suggest calls and
 * the final /retrieve, then rotated for the next session.
 */
export async function getSuggestions(
  query: string,
  sessionToken: string,
  opts: { limit?: number; signal?: AbortSignal } = {},
): Promise<MapboxSuggestion[]> {
  const token = getMapboxToken();
  if (!token) throw new MapboxError('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN not set', 0);
  const q = query.trim();
  if (q.length === 0) return [];
  const params = new URLSearchParams({
    q,
    access_token: token,
    session_token: sessionToken,
    country: 'US',
    types: 'address',
    language: 'en',
    limit: String(opts.limit ?? 5),
  });
  const res = await fetch(`${BASE}/suggest?${params.toString()}`, { signal: opts.signal });
  if (!res.ok) throw new MapboxError(`Mapbox /suggest ${res.status}`, res.status);
  const body = (await res.json()) as { suggestions?: unknown };
  const raw = Array.isArray(body.suggestions) ? body.suggestions : [];
  return raw
    .map((s): MapboxSuggestion | null => {
      if (!s || typeof s !== 'object') return null;
      const o = s as Record<string, unknown>;
      const id = typeof o.mapbox_id === 'string' ? o.mapbox_id : '';
      if (!id) return null;
      return {
        mapboxId: id,
        name: typeof o.name === 'string' ? o.name : '',
        fullAddress: typeof o.full_address === 'string' ? o.full_address : '',
        placeFormatted: typeof o.place_formatted === 'string' ? o.place_formatted : '',
        featureType: typeof o.feature_type === 'string' ? o.feature_type : '',
      };
    })
    .filter((s): s is MapboxSuggestion => s !== null);
}

/**
 * GET /retrieve/{id}. Promotes a suggestion to a full feature with coordinates
 * and structured context. Closes the billing session opened by /suggest.
 */
export async function retrieveFeature(
  mapboxId: string,
  sessionToken: string,
  opts: { signal?: AbortSignal } = {},
): Promise<MapboxFeature | null> {
  const token = getMapboxToken();
  if (!token) throw new MapboxError('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN not set', 0);
  const params = new URLSearchParams({
    access_token: token,
    session_token: sessionToken,
    language: 'en',
  });
  const res = await fetch(`${BASE}/retrieve/${encodeURIComponent(mapboxId)}?${params.toString()}`, {
    signal: opts.signal,
  });
  if (!res.ok) throw new MapboxError(`Mapbox /retrieve ${res.status}`, res.status);
  const body = (await res.json()) as { features?: unknown };
  const features = Array.isArray(body.features) ? body.features : [];
  const f = features[0];
  if (!f || typeof f !== 'object') return null;
  const props = (f as { properties?: unknown }).properties;
  if (!props || typeof props !== 'object') return null;
  const p = props as Record<string, unknown>;
  const ctx = (p.context && typeof p.context === 'object' ? p.context : {}) as Record<string, unknown>;
  const place = (ctx.place && typeof ctx.place === 'object' ? ctx.place : {}) as Record<string, unknown>;
  const region = (ctx.region && typeof ctx.region === 'object' ? ctx.region : {}) as Record<string, unknown>;
  const postcode = (ctx.postcode && typeof ctx.postcode === 'object' ? ctx.postcode : {}) as Record<string, unknown>;
  const coords = (p.coordinates && typeof p.coordinates === 'object' ? p.coordinates : {}) as Record<string, unknown>;
  return {
    streetAddress: typeof p.address === 'string' ? p.address : (typeof p.name === 'string' ? p.name : ''),
    fullAddress: typeof p.full_address === 'string' ? p.full_address : '',
    city: typeof place.name === 'string' ? place.name : '',
    region: typeof region.name === 'string' ? region.name : '',
    regionCode: typeof region.region_code === 'string' ? region.region_code : '',
    postcode: typeof postcode.name === 'string' ? postcode.name : '',
    longitude: typeof coords.longitude === 'number' ? coords.longitude : 0,
    latitude: typeof coords.latitude === 'number' ? coords.latitude : 0,
  };
}

/**
 * Derives the canonical DataForSEO `location_name` from a Mapbox feature.
 * Mapbox's `place` + `region` names already match DataForSEO's vocabulary
 * for US locations, so we just join with commas (no spaces) and append the
 * country. Returns "United States" when city/region are missing.
 */
export function toDataForSeoLocation(feature: Pick<MapboxFeature, 'city' | 'region'>): string {
  const parts = [feature.city, feature.region].map((s) => s.trim()).filter((s) => s.length > 0);
  parts.push('United States');
  return parts.join(',');
}
