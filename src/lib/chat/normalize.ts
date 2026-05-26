/**
 * Chat-wizard answers → V1ContentOverrides + research keyword.
 *
 * Lane C surfaces a short, form-style "describe my business" flow that
 * collects the smallest set of fields needed to render a defensible draft
 * (name, location, phone, services, service area, years, hours). This
 * module turns those answers into:
 *
 *   1. `chatAnswersToOverrides()` — a partial V1ContentOverrides whose
 *      `meta` is immediately useful (CallRail provision reads
 *      meta.businessName / meta.businessPhone; metaDescription doubles as
 *      the niche-aware copy seed). Section-level mapping is deferred to a
 *      future pass once we've seen the chat in production.
 *
 *   2. `chatAnswersToKeyword()` — the search string the background
 *      research lookup uses: `"<name> <city> <state>"`, location pulled
 *      apart from the combined display string when both are present.
 *
 * Kept dependency-free so this file is unit-testable without React or
 * Supabase imports.
 */

import type { V1ContentOverrides } from '../../../v1/composer/composeV1Template';

/** Preset keys for the chat wizard's "hours" question. */
export type ChatHoursPreset = 'standard' | 'twentyfour-seven' | 'weekends' | 'custom';

export interface ChatAnswers {
  templateId: string;
  businessName: string;
  /** Combined "City, State" the user typed — e.g. "Chicago, Illinois". */
  location: string;
  phone: string;
  /** Free-form list of services — comma- or newline-separated. */
  services: string;
  /** Free-form service area — e.g. "Within 30 miles of Chicago". */
  serviceArea: string;
  /** Optional. `null` when the user skipped. */
  yearsInBusiness: number | null;
  hoursPreset: ChatHoursPreset;
  /** Only honoured when hoursPreset === 'custom'. */
  customHours: string;
}

const HOURS_PRESET_LABELS: Record<ChatHoursPreset, string> = {
  'standard':         'Mon–Fri, 9 AM – 5 PM',
  'twentyfour-seven': 'Open 24/7',
  'weekends':         'Mon–Sat, 8 AM – 6 PM',
  'custom':           '',
};

/** Human-readable form of the hours preset (or the custom string). */
export function formatChatHours(answers: Pick<ChatAnswers, 'hoursPreset' | 'customHours'>): string {
  if (answers.hoursPreset === 'custom') return answers.customHours.trim();
  return HOURS_PRESET_LABELS[answers.hoursPreset] || '';
}

/** Split a combined "City, State" into trimmed parts. Empty fallbacks. */
export function splitLocation(location: string): { city: string; state: string } {
  const trimmed = location.trim();
  if (!trimmed) return { city: '', state: '' };
  const comma = trimmed.indexOf(',');
  if (comma === -1) return { city: trimmed, state: '' };
  return {
    city:  trimmed.slice(0, comma).trim(),
    state: trimmed.slice(comma + 1).trim(),
  };
}

/**
 * Builds the search keyword for the background research lookup. Matches
 * the shape POST /api/research expects ("<name> <city> <state>"), with a
 * graceful fallback when only the business name was supplied.
 */
export function chatAnswersToKeyword(answers: Pick<ChatAnswers, 'businessName' | 'location'>): string {
  const name = answers.businessName.trim();
  const loc = answers.location.trim();
  if (!name) return '';
  return loc ? `${name} ${loc}` : name;
}

/**
 * Synthesises a 1–2 sentence description from the chat answers. Used as
 * `meta.metaDescription` so the published page has real SEO copy from
 * the moment the project is created, before the editor pass runs.
 */
export function buildChatDescription(answers: ChatAnswers): string {
  const parts: string[] = [];
  const name = answers.businessName.trim();
  const services = answers.services.trim().replace(/\s+/g, ' ');
  const area = answers.serviceArea.trim();
  const years = answers.yearsInBusiness;

  if (name && services) {
    parts.push(`${name} provides ${services}${area ? ` to ${area}` : ''}.`);
  } else if (name) {
    parts.push(`${name}${area ? ` serves ${area}` : ''}.`);
  }

  if (years && years > 0) {
    parts.push(`${years}+ years of experience.`);
  }

  const hours = formatChatHours(answers);
  if (hours) parts.push(`Hours: ${hours}.`);

  return parts.join(' ').trim();
}

/**
 * Maps chat answers into the V1ContentOverrides slice that gets persisted
 * to projects.overrides on creation. Only fields with a confirmed
 * V1MetaOverrides home are written — the rest of the chat data (services,
 * serviceArea, hours, years) is condensed into metaDescription so it's
 * not lost, and the editor can pull it apart into section-level fields
 * once a future enhancement pass lands.
 */
export function chatAnswersToOverrides(answers: ChatAnswers): V1ContentOverrides {
  const meta: NonNullable<V1ContentOverrides['meta']> = {};
  const name = answers.businessName.trim();
  const phone = answers.phone.trim();
  const description = buildChatDescription(answers);

  if (name) meta.businessName = name;
  if (phone) meta.businessPhone = phone;
  if (description) meta.metaDescription = description;
  if (name) meta.pageTitle = name;

  return Object.keys(meta).length ? { meta } : {};
}
