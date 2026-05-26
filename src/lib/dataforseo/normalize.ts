/**
 * DataForSEO Business-Info → SparkPage draft mapper (Lane B).
 *
 * Turns the raw postback envelope persisted in `dataforseo_research.raw_payload`
 * into:
 *   1. `ResearchDraft` — a flat, UI-friendly record the review screen renders
 *      editable fields against.
 *   2. `draftToOverrides()` — a partial `V1ContentOverrides` seed (just the
 *      uncontroversial `meta` fields for now: businessName, businessPhone,
 *      metaDescription). Section-level mappings stay out of scope until the
 *      reviewer flow is exercised against real payloads.
 *
 * Defensive throughout: every field on the DataForSEO response is optional
 * in practice (sandbox responses routinely omit reviews, photos, etc.), so
 * each accessor checks shape before reading.
 */

import type { V1ContentOverrides } from '../../../v1/composer/composeV1Template';

export interface ResearchDraft {
  businessName: string;
  phone: string;
  website: string;
  address: string;
  description: string;
  rating: number | null;
  reviewCount: number | null;
  hours: string[];
  photos: string[];
}

const EMPTY: ResearchDraft = {
  businessName: '',
  phone: '',
  website: '',
  address: '',
  description: '',
  rating: null,
  reviewCount: null,
  hours: [],
  photos: [],
};

/** Best-effort dotted-path read. Returns undefined when any hop is missing. */
function get(obj: unknown, path: readonly (string | number)[]): unknown {
  let cur: unknown = obj;
  for (const key of path) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string | number, unknown>)[key];
  }
  return cur;
}

function pickString(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}
function pickNumber(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/**
 * DataForSEO `business_data/google/my_business_info/task_get` returns an
 * envelope like:
 *   { tasks: [ { result: [ { items: [ { type:"my_business_info", ... } ] } ] } ] }
 *
 * We hunt for the first `items[]` entry of type `my_business_info`. Old
 * sandbox responses occasionally shape `result` as a single object instead
 * of an array, so we accept both.
 */
function firstBusinessItem(payload: unknown): Record<string, unknown> | null {
  const tasks = get(payload, ['tasks']);
  if (!Array.isArray(tasks)) return null;
  for (const task of tasks) {
    const result = get(task, ['result']);
    const items = Array.isArray(result) ? result[0] : result;
    const itemList = get(items, ['items']);
    if (!Array.isArray(itemList)) continue;
    const match = itemList.find(
      (e) => typeof e === 'object' && e !== null && pickString((e as Record<string, unknown>).type)
        ? (e as Record<string, unknown>).type === 'my_business_info' || (e as Record<string, unknown>).type === 'business_info'
        : false,
    );
    if (match && typeof match === 'object') return match as Record<string, unknown>;
    // Fallback: first entry, regardless of type — DataForSEO's serp endpoints
    // sometimes omit the `type` discriminator.
    const first = itemList[0];
    if (first && typeof first === 'object') return first as Record<string, unknown>;
  }
  return null;
}

export function normalizeResearchPayload(payload: unknown): ResearchDraft {
  const item = firstBusinessItem(payload);
  if (!item) return EMPTY;

  const hoursRaw = get(item, ['work_hours', 'timetable']);
  const hours: string[] = [];
  if (hoursRaw && typeof hoursRaw === 'object') {
    for (const [day, entries] of Object.entries(hoursRaw as Record<string, unknown>)) {
      if (!Array.isArray(entries) || entries.length === 0) continue;
      const slots = entries
        .map((e) => {
          const open = pickString(get(e, ['open', 'hour'])) || pickString(get(e, ['open']));
          const close = pickString(get(e, ['close', 'hour'])) || pickString(get(e, ['close']));
          return open && close ? `${open}–${close}` : open || close;
        })
        .filter(Boolean);
      if (slots.length) hours.push(`${day}: ${slots.join(', ')}`);
    }
  }

  const photoUrls: string[] = [];
  const photos = get(item, ['photos']);
  if (Array.isArray(photos)) {
    for (const p of photos) {
      const url = pickString(get(p, ['url'])) || pickString(get(p, ['image_url']));
      if (url) photoUrls.push(url);
    }
  }

  return {
    businessName: pickString(item.title) || pickString(item.name),
    phone: pickString(item.phone),
    website: pickString(item.url) || pickString(item.website) || pickString(item.domain),
    address: pickString(item.address),
    description: pickString(item.snippet) || pickString(item.description),
    rating: pickNumber(get(item, ['rating', 'value'])) ?? pickNumber(item.rating),
    reviewCount: pickNumber(get(item, ['rating', 'votes_count'])) ?? pickNumber(item.reviews_count),
    hours,
    photos: photoUrls,
  };
}

/**
 * Maps a (reviewer-edited) draft into the `V1ContentOverrides` slice the
 * editor will merge with the project's existing overrides. Keeps the
 * mapping intentionally minimal — just the safe `meta` fields. Anything
 * that requires picking a section index is left to a future pass.
 */
export function draftToOverrides(draft: ResearchDraft): V1ContentOverrides {
  const meta: NonNullable<V1ContentOverrides['meta']> = {};
  if (draft.businessName) meta.businessName = draft.businessName;
  if (draft.phone) meta.businessPhone = draft.phone;
  if (draft.description) meta.metaDescription = draft.description;
  return Object.keys(meta).length ? { meta } : {};
}
