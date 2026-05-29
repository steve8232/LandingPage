/**
 * Normalizes raw CallRail call payloads — from both the v3 REST API
 * (`listCalls`) and the post-call webhook — into a single `CallDTO` shape
 * the leads dashboard renders. Pure functions, no IO; safe to import from
 * either client or server modules.
 *
 * The webhook + API payloads overlap heavily but use slightly different keys
 * (e.g. `recording` vs `recording_player`, `id` always a string in v3 but
 * sometimes a number in webhooks). We coalesce both shapes here.
 */

import type { CallRailCall } from './client';

export interface CallDTO {
  /** CallRail call id, e.g. "CAL8154…". Stable across webhook re-fires. */
  id: string;
  projectId: string;
  startTime: string; // ISO; '' if missing
  direction: 'inbound' | 'outbound';
  answered: boolean;
  duration: number; // seconds
  voicemail: boolean;
  customerName: string | null;
  customerPhone: string | null;
  customerCity: string | null;
  customerState: string | null;
  trackingPhone: string | null;
  source: string | null;
  campaign: string | null;
  landingPageUrl: string | null;
  recordingUrl: string | null;
  transcription: string | null;
  /** First-party heatmap session id, parsed from landing_page_url's
   *  `?spk_sid=<uuid>` (stamped by /h.js). Null when the visitor placed the
   *  call before /h.js ran, or when the URL was stripped of query params. */
  sessionId: string | null;
}

/** Normalize the duration field which CallRail sometimes returns as a string. */
function toSeconds(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) return Math.max(0, Math.round(raw));
  if (typeof raw === 'string') {
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  }
  return 0;
}

function toIso(raw: unknown): string {
  if (typeof raw !== 'string' || !raw) return '';
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
}

function strOrNull(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const t = raw.trim();
  return t === '' ? null : t;
}

const SESSION_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Extract `spk_sid` from a CallRail landing_page_url. Returns null when the
 *  URL is missing, unparseable, the param is absent, or the value isn't a
 *  uuid — same validation posture as /api/leads's session_id extraction. */
export function parseSparkSessionId(landingPageUrl: string | null): string | null {
  if (!landingPageUrl) return null;
  try {
    const u = new URL(landingPageUrl);
    const v = u.searchParams.get('spk_sid');
    return v && SESSION_ID_RE.test(v) ? v : null;
  } catch {
    return null;
  }
}

/** Shared core used by both the API and webhook normalizers. */
function shape(call: CallRailCall, projectId: string): CallDTO {
  // Webhooks tag voicemail via `voicemail` + `call_type`. v3 list response
  // doesn't include voicemail without field selection, so fall back to false.
  const voicemail =
    (call as { voicemail?: boolean }).voicemail === true ||
    (call as { call_type?: string }).call_type === 'voicemail';
  const direction = call.direction === 'outbound' ? 'outbound' : 'inbound';
  const landingPageUrl = strOrNull(call.landing_page_url);
  return {
    id: String(call.id ?? ''),
    projectId,
    startTime: toIso(call.start_time),
    direction,
    answered: call.answered === true,
    duration: toSeconds(call.duration),
    voicemail,
    customerName: strOrNull(call.customer_name),
    customerPhone: strOrNull(call.customer_phone_number),
    customerCity: strOrNull(call.customer_city),
    customerState: strOrNull(call.customer_state),
    trackingPhone: strOrNull(call.tracking_phone_number),
    source: strOrNull(call.source_name) ?? strOrNull((call as { formatted_tracking_source?: string }).formatted_tracking_source),
    campaign: strOrNull(call.campaign),
    landingPageUrl,
    // recording_player is the embeddable HTML5 URL; recording is the JSON
    // resolver endpoint. Prefer the embeddable one for the <audio> element.
    recordingUrl: strOrNull(call.recording_player) ?? strOrNull(call.recording),
    transcription: strOrNull(call.transcription),
    sessionId: parseSparkSessionId(landingPageUrl),
  };
}

export function normalizeCallsFromApi(
  calls: CallRailCall[],
  projectId: string
): CallDTO[] {
  return calls
    .map((c) => shape(c, projectId))
    .filter((c) => c.id !== '');
}

/**
 * Normalize a single post-call webhook body. The webhook shape is the call
 * object directly (no wrapper), with `id` as either a string CAL… id or a
 * legacy numeric id.
 */
export function normalizeCallFromWebhook(
  body: Record<string, unknown>,
  projectId: string
): CallDTO | null {
  if (!body || typeof body !== 'object') return null;
  const dto = shape(body as CallRailCall, projectId);
  return dto.id === '' ? null : dto;
}

// ── Display helpers ────────────────────────────────────────────────────────

/** "02:14" / "0:42" / "—" */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** "Atlanta, GA" / "GA" / "" */
export function formatCallLocation(call: CallDTO): string {
  const c = call.customerCity?.trim() || '';
  const s = call.customerState?.trim() || '';
  if (c && s) return `${c}, ${s}`;
  return c || s;
}

/** "Voicemail" / "Missed" / "Answered" */
export function callOutcomeLabel(call: CallDTO): 'Answered' | 'Voicemail' | 'Missed' {
  if (call.voicemail) return 'Voicemail';
  return call.answered ? 'Answered' : 'Missed';
}

// ── CSV export ─────────────────────────────────────────────────────────────

export interface BuildCallsCsvInput {
  calls: CallDTO[];
  projectTitleById: Record<string, string>;
}

function quote(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = typeof v === 'string' ? v : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const CSV_HEADER = [
  'start_time',
  'project_title',
  'direction',
  'outcome',
  'duration_seconds',
  'customer_name',
  'customer_phone',
  'customer_city',
  'customer_state',
  'tracking_phone',
  'source',
  'campaign',
  'landing_page_url',
  'recording_url',
  'callrail_call_id',
];

export function buildCallsCsv({ calls, projectTitleById }: BuildCallsCsvInput): string {
  const rows: string[] = [CSV_HEADER.join(',')];
  for (const c of calls) {
    const row = [
      c.startTime,
      projectTitleById[c.projectId] ?? '',
      c.direction,
      callOutcomeLabel(c),
      String(c.duration),
      c.customerName ?? '',
      c.customerPhone ?? '',
      c.customerCity ?? '',
      c.customerState ?? '',
      c.trackingPhone ?? '',
      c.source ?? '',
      c.campaign ?? '',
      c.landingPageUrl ?? '',
      c.recordingUrl ?? '',
      c.id,
    ];
    rows.push(row.map(quote).join(','));
  }
  return rows.join('\r\n') + '\r\n';
}

