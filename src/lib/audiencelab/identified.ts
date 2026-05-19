/**
 * Normalizes raw AudienceLab V4 events into a UI-friendly
 * `IdentifiedVisitorDTO` shared by the leads dashboard server fetch and the
 * client renderer.
 *
 * One V4 event ≈ one page view with resolution metadata attached; we de-dupe
 * by `edid` (External Device ID) so the dashboard surfaces one card per
 * resolved person, keeping the most recent event's resolution payload.
 */

import type { V4Event, V4Resolution } from './client';

export interface IdentifiedVisitorDTO {
  /** Stable id derived from edid / hem_sha256 (per project), used as React key. */
  id: string;
  projectId: string;
  /** Most recent event timestamp seen for this visitor. */
  lastSeenAt: string;
  /** Page on the published site that most recently fired the pixel. */
  lastUrl: string | null;
  edid: string | null;
  resolution: V4Resolution;
}

export interface NormalizeIdentifiedInput {
  projectId: string;
  events: V4Event[];
}

/**
 * Collapse a V4 events list down to one row per resolved person.
 *
 * Strategy:
 *   - Skip events without any resolution payload (those are still anonymous).
 *   - Key by `edid` first, falling back to `hem_sha256`, then `pixel_id|index`.
 *   - When multiple events share a key, keep the latest by `event_timestamp`.
 */
export function normalizeIdentifiedVisitors(
  input: NormalizeIdentifiedInput
): IdentifiedVisitorDTO[] {
  const byKey = new Map<string, IdentifiedVisitorDTO>();

  input.events.forEach((evt, idx) => {
    const resolution = evt.resolution || {};
    if (!hasAnyResolution(resolution)) return;

    const key = evt.edid || evt.hem_sha256 || `${evt.pixel_id}-${idx}`;
    const ts = evt.event_timestamp || '';
    const existing = byKey.get(key);
    if (existing && existing.lastSeenAt >= ts) return;

    byKey.set(key, {
      id: `${input.projectId}:${key}`,
      projectId: input.projectId,
      lastSeenAt: ts,
      lastUrl: evt.full_url || evt.referrer_url || null,
      edid: evt.edid ?? null,
      resolution,
    });
  });

  return Array.from(byKey.values()).sort((a, b) =>
    b.lastSeenAt.localeCompare(a.lastSeenAt)
  );
}

/** True when at least one resolution field carries an actual value. */
function hasAnyResolution(r: V4Resolution): boolean {
  for (const v of Object.values(r)) {
    if (typeof v === 'string' && v.trim() !== '') return true;
  }
  return false;
}

/** Best-effort full name from V4 resolution data. */
export function identifiedDisplayName(v: IdentifiedVisitorDTO): string {
  const f = v.resolution.FIRST_NAME?.trim() || '';
  const l = v.resolution.LAST_NAME?.trim() || '';
  const combined = `${f} ${l}`.trim();
  return combined || '—';
}

/** Pick a primary email from the (sometimes comma-joined) V4 email fields. */
export function identifiedPrimaryEmail(v: IdentifiedVisitorDTO): string {
  const raw =
    v.resolution.PERSONAL_VERIFIED_EMAILS ||
    v.resolution.PERSONAL_EMAILS ||
    v.resolution.BUSINESS_EMAIL ||
    '';
  return raw.split(',')[0]?.trim() || '';
}

/** Pick a primary phone from the (sometimes comma-joined) V4 phone fields. */
export function identifiedPrimaryPhone(v: IdentifiedVisitorDTO): string {
  const raw = v.resolution.ALL_MOBILES || v.resolution.ALL_LANDLINES || '';
  return raw.split(',')[0]?.trim() || '';
}

/** Compact "City, ST" location string, or '' when neither is set. */
export function identifiedLocation(v: IdentifiedVisitorDTO): string {
  const city = v.resolution.PERSONAL_CITY?.trim() || '';
  const state = v.resolution.PERSONAL_STATE?.trim() || '';
  if (city && state) return `${city}, ${state}`;
  return city || state;
}

export interface BuildIdentifiedCsvInput {
  visitors: IdentifiedVisitorDTO[];
  projectTitleById: Record<string, string>;
}

const CSV_FIELDS: Array<keyof V4Resolution> = [
  'FIRST_NAME', 'LAST_NAME', 'PERSONAL_EMAILS', 'PERSONAL_VERIFIED_EMAILS',
  'ALL_MOBILES', 'ALL_LANDLINES',
  'PERSONAL_ADDRESS', 'PERSONAL_CITY', 'PERSONAL_STATE', 'PERSONAL_ZIP',
  'AGE_RANGE', 'GENDER', 'HOMEOWNER', 'MARRIED', 'CHILDREN',
  'NET_WORTH', 'INCOME_RANGE',
  'JOB_TITLE', 'SENIORITY_LEVEL', 'COMPANY_NAME', 'COMPANY_DOMAIN',
  'COMPANY_INDUSTRY', 'BUSINESS_EMAIL', 'INDIVIDUAL_LINKEDIN_URL',
];

function quote(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = typeof v === 'string' ? v : JSON.stringify(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function buildIdentifiedCsv(
  { visitors, projectTitleById }: BuildIdentifiedCsvInput
): string {
  const header = ['last_seen_at', 'project_title', 'last_url', ...CSV_FIELDS];
  const rows: string[] = [header.join(',')];
  for (const v of visitors) {
    const row = [
      v.lastSeenAt,
      projectTitleById[v.projectId] ?? '',
      v.lastUrl ?? '',
      ...CSV_FIELDS.map((k) => v.resolution[k] ?? ''),
    ];
    rows.push(row.map(quote).join(','));
  }
  return rows.join('\r\n') + '\r\n';
}
