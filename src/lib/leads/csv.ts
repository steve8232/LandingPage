/**
 * CSV builder for the leads dashboard export. Pure client-safe utilities;
 * no IO. Quoting follows RFC 4180: fields containing commas, quotes, or
 * newlines are double-quoted with embedded quotes doubled.
 */

import type { LeadDTO } from './types';

const STANDARD_KEYS = new Set(['name', 'email', 'phone', 'message']);

/** RFC 4180 quoting for a single field. */
function quoteField(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Pick the first payload entry whose key isn't in the standard identity set.
 * For local-service templates this surfaces the niche select field (e.g.
 * `projectType`, `issueType`, `treatmentType`).
 */
export function pickChoiceField(
  payload: Record<string, unknown>
): { key: string; value: string } | null {
  for (const key of Object.keys(payload)) {
    if (STANDARD_KEYS.has(key)) continue;
    const raw = payload[key];
    if (raw === null || raw === undefined || raw === '') continue;
    const value = typeof raw === 'string' ? raw : JSON.stringify(raw);
    return { key, value };
  }
  return null;
}

/** Look up a standard payload field as a trimmed string, or '' if absent. */
export function payloadString(
  payload: Record<string, unknown>,
  key: string
): string {
  const raw = payload[key];
  if (raw === null || raw === undefined) return '';
  return typeof raw === 'string' ? raw : JSON.stringify(raw);
}

export interface BuildLeadsCsvInput {
  leads: LeadDTO[];
  projectTitleById: Record<string, string>;
}

/**
 * Build a CSV string from the provided leads + project title map. Columns
 * mirror the dashboard preview plus full metadata for downstream tools.
 */
export function buildLeadsCsv({ leads, projectTitleById }: BuildLeadsCsvInput): string {
  const header = [
    'submitted_at_iso',
    'project_title',
    'name',
    'email',
    'phone',
    'message',
    'choice_key',
    'choice_value',
    'user_agent',
    'referer',
  ];

  const rows: string[] = [header.join(',')];
  for (const lead of leads) {
    const choice = pickChoiceField(lead.payload);
    const row = [
      lead.createdAt,
      projectTitleById[lead.projectId] ?? '',
      payloadString(lead.payload, 'name'),
      payloadString(lead.payload, 'email'),
      payloadString(lead.payload, 'phone'),
      payloadString(lead.payload, 'message'),
      choice?.key ?? '',
      choice?.value ?? '',
      lead.userAgent ?? '',
      lead.referer ?? '',
    ];
    rows.push(row.map(quoteField).join(','));
  }
  return rows.join('\r\n') + '\r\n';
}

/** Today's date in YYYY-MM-DD (local), used for download filenames. */
export function csvFilenameForToday(prefix = 'sparkpage-leads'): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${prefix}-${yyyy}-${mm}-${dd}.csv`;
}
