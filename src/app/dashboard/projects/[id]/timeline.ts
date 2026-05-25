/**
 * Pure helpers for the per-project activity timeline. Merges form leads,
 * identified visitors, and calls into a single chronologically-sorted stream
 * of `TimelineItem`s consumed by ProjectDashboardClient.
 */

import type { LeadDTO } from '@/lib/leads/types';
import type { IdentifiedVisitorDTO } from '@/lib/audiencelab/identified';
import type { CallDTO } from '@/lib/callrail/calls';

export type TimelineKind = 'form' | 'call' | 'visitor';

export interface TimelineItem {
  /** Unique-per-source id, prefixed by kind to avoid collisions across types. */
  id: string;
  kind: TimelineKind;
  /** ISO timestamp used for sorting and display. '' if missing. */
  at: string;
  /** Underlying DTO — exactly one of these is populated per item. */
  lead?: LeadDTO;
  visitor?: IdentifiedVisitorDTO;
  call?: CallDTO;
}

export interface BuildTimelineInput {
  leads: LeadDTO[];
  identified: IdentifiedVisitorDTO[];
  calls: CallDTO[];
}

/**
 * Build the merged timeline. Items without timestamps sink to the bottom so
 * they don't pollute the "most recent" area. The kind prefix on `id` keeps
 * React keys stable across stream-type collisions (a lead id and a call id
 * could otherwise theoretically match).
 */
export function buildTimeline({ leads, identified, calls }: BuildTimelineInput): TimelineItem[] {
  const items: TimelineItem[] = [];

  for (const l of leads) {
    items.push({ id: `form:${l.id}`, kind: 'form', at: l.createdAt || '', lead: l });
  }
  for (const v of identified) {
    items.push({ id: `visitor:${v.id}`, kind: 'visitor', at: v.lastSeenAt || '', visitor: v });
  }
  for (const c of calls) {
    items.push({ id: `call:${c.id}`, kind: 'call', at: c.startTime || '', call: c });
  }

  // Sort: newer first. Items without a timestamp ('' sorts before any ISO
  // string with localeCompare descending) are pushed to the bottom by
  // treating empty-at as -Infinity.
  return items.sort((a, b) => {
    if (!a.at && !b.at) return 0;
    if (!a.at) return 1;
    if (!b.at) return -1;
    return b.at.localeCompare(a.at);
  });
}

/** Format an ISO timestamp as "12m ago" / "3h ago" / "2025-01-04". */
export function formatRelative(iso: string): string {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '—';
  const ms = Date.now() - t;
  if (ms < 60_000) return 'just now';
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
