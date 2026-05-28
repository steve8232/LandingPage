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
import type { TemplateSpec } from '../../../v1/specs/schema';

/** Preset keys for the chat wizard's "hours" question. */
export type ChatHoursPreset = 'standard' | 'twentyfour-seven' | 'weekends' | 'custom';

export interface ChatAnswers {
  templateId: string;
  businessName: string;
  /** Combined "City, State" the user typed — e.g. "Chicago, Illinois". */
  location: string;
  /**
   * Optional physical street address. Persisted on meta.businessAddress
   * (joined with location) so CallRail / research / billing have a real
   * mailing address. Visibility on the rendered page is gated by
   * `displayAddress`.
   */
  streetAddress: string;
  /**
   * When false, the address is stored on meta but omitted from the
   * rendered Footer. Defaults to true (i.e. show the address).
   */
  displayAddress: boolean;
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
 * Splits a free-form service-area string into chip-ready entries. Returns
 * `[]` when the input doesn't yield at least two clean items — single
 * blurbs like "Within 30 miles of Chicago" aren't worth rendering as a
 * one-chip section.
 */
export function parseAreaChips(text: string): string[] {
  if (!text || !text.trim()) return [];
  const parts = text
    .split(/[,\n;]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length >= 2 ? parts.slice(0, 16) : [];
}

/**
 * Builds the `sections` override slice that hides or populates the
 * ServiceAreas section based on the user's typed `serviceArea` answer.
 * Returns `undefined` when the spec doesn't include a ServiceAreas section
 * (so the caller can skip writing `sections` entirely).
 *
 * Behavior:
 *   - ≥ 2 chip-able items → `{ areas: chips }` so the section renders
 *     with real data from the first revision.
 *   - Otherwise → `{ _omit: true }` so the composer drops the section
 *     instead of leaking the spec's demo neighborhoods + literal
 *     "[Your Neighborhood]" / "[Your Zip]" placeholders.
 */
export function buildServiceAreasSectionsOverride(
  spec: TemplateSpec,
  serviceAreaText: string,
): (Record<string, unknown> | null)[] | undefined {
  const index = spec.sections.findIndex((s) => s.type === 'ServiceAreas');
  if (index < 0) return undefined;
  const chips = parseAreaChips(serviceAreaText);
  const sections: (Record<string, unknown> | null)[] = spec.sections.map(() => null);
  sections[index] = chips.length ? { areas: chips } : { _omit: true };
  return sections;
}

/**
 * Joins street + "City, State" into a single mailing-address string the
 * Footer can render verbatim. Returns `''` when both parts are empty.
 */
export function buildBusinessAddress(
  streetAddress: string,
  location: string,
): string {
  const street = streetAddress.trim();
  const loc = location.trim();
  if (street && loc) return `${street}, ${loc}`;
  return street || loc;
}

/**
 * Maps chat answers into the V1ContentOverrides slice that gets persisted
 * to projects.overrides on creation. Writes:
 *   - `meta` — businessName/businessPhone/metaDescription/pageTitle as
 *     before, plus the raw `serviceAreaText` so /regenerate can fall back
 *     to it when DataForSEO finds no service-area data. `businessAddress`
 *     is assembled from street + location, and `displayAddress` is only
 *     persisted when the user explicitly opted out (default `true` is
 *     left implicit so legacy reads keep working).
 *   - `sections` — a ServiceAreas slot that either renders the user's
 *     chips (if the typed answer is chip-able) or hides the section
 *     entirely (`_omit: true`) so the spec's demo neighborhoods never
 *     leak through. Skipped when `spec` is omitted (legacy callers /
 *     unit tests).
 */
export function chatAnswersToOverrides(
  answers: ChatAnswers,
  spec?: TemplateSpec,
): V1ContentOverrides {
  const meta: NonNullable<V1ContentOverrides['meta']> = {};
  const name = answers.businessName.trim();
  const phone = answers.phone.trim();
  const description = buildChatDescription(answers);
  const serviceAreaText = answers.serviceArea.trim();
  const businessAddress = buildBusinessAddress(answers.streetAddress, answers.location);
  const { city, state } = splitLocation(answers.location);

  if (name) meta.businessName = name;
  if (phone) meta.businessPhone = phone;
  if (description) meta.metaDescription = description;
  if (name) meta.pageTitle = name;
  if (serviceAreaText) meta.serviceAreaText = serviceAreaText;
  if (businessAddress) meta.businessAddress = businessAddress;
  if (city) meta.city = city;
  if (state) meta.state = state;
  if (answers.displayAddress === false) meta.displayAddress = false;

  const sections = spec
    ? buildServiceAreasSectionsOverride(spec, serviceAreaText)
    : undefined;

  const out: V1ContentOverrides = {};
  if (Object.keys(meta).length) out.meta = meta;
  if (sections) out.sections = sections;
  return out;
}
