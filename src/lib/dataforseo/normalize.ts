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

export interface PlaceTopic {
  topic: string;
  count: number;
}

export interface RelatedBusiness {
  name: string;
  rating: number | null;
  reviewCount: number | null;
}

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
  /** Primary Google category label, e.g. "Roofing contractor". */
  category: string;
  /** Google category slug ids, e.g. ["roofing_contractor"]. */
  categoryIds: string[];
  /** Structured location parts pulled from `address_info`. Often more reliable
   *  than the flat `address` string when feeding downstream copy. */
  addressCity: string;
  addressRegion: string;
  addressBorough: string;
  addressZip: string;
  /** Review-derived themes from `place_topics`, sorted by mention count desc. */
  placeTopics: PlaceTopic[];
  /** "People also search" entries — Google-curated local competitors. */
  relatedBusinesses: RelatedBusiness[];
  /** Reviewer-supplied service-area names (neighborhoods, ZIPs, towns).
   *  Empty by default; populated by the operator on the review screen and/or
   *  by the niche-enrichment pre-pass before regenerate fires. */
  serviceAreas: string[];
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
  category: '',
  categoryIds: [],
  addressCity: '',
  addressRegion: '',
  addressBorough: '',
  addressZip: '',
  placeTopics: [],
  relatedBusinesses: [],
  serviceAreas: [],
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
 * Time slots in DataForSEO postbacks arrive in two shapes:
 *   - Real `google_business_info` rows:   { hour: 9, minute: 0 } → "09:00"
 *   - Legacy/sandbox `my_business_info`:  "08:00"                → "08:00"
 * Returns "" for anything else.
 */
function pickTime(v: unknown): string {
  if (typeof v === 'string') return v.trim();
  if (v && typeof v === 'object') {
    const h = (v as Record<string, unknown>).hour;
    const m = (v as Record<string, unknown>).minute;
    if (typeof h === 'number') {
      const hh = String(h).padStart(2, '0');
      const mm = typeof m === 'number' ? String(m).padStart(2, '0') : '00';
      return `${hh}:${mm}`;
    }
  }
  return '';
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
        ? (e as Record<string, unknown>).type === 'my_business_info'
          || (e as Record<string, unknown>).type === 'business_info'
          || (e as Record<string, unknown>).type === 'google_business_info'
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

  // DataForSEO's `google_business_info` endpoint nests hours under
  // `work_time.work_hours.timetable`. The legacy `my_business_info` shape
  // (used by the docs example + sandbox fixtures) puts them at the top
  // level. Try the nested path first, fall back to the legacy one.
  const hoursRaw = get(item, ['work_time', 'work_hours', 'timetable'])
    ?? get(item, ['work_hours', 'timetable']);
  const hours: string[] = [];
  if (hoursRaw && typeof hoursRaw === 'object') {
    for (const [day, entries] of Object.entries(hoursRaw as Record<string, unknown>)) {
      if (!Array.isArray(entries) || entries.length === 0) continue;
      const slots = entries
        .map((e) => {
          const open = pickTime(get(e, ['open']));
          const close = pickTime(get(e, ['close']));
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

  // category_ids arrives as ["roofing_contractor"]; coerce defensively.
  const categoryIds: string[] = [];
  const rawCategoryIds = get(item, ['category_ids']);
  if (Array.isArray(rawCategoryIds)) {
    for (const c of rawCategoryIds) {
      const s = pickString(c);
      if (s) categoryIds.push(s);
    }
  }

  // place_topics is `{ "leak repair": 2, "quick response": 7, ... }` — flatten
  // to a sorted array so consumers can take the top N by mention count.
  const placeTopics: PlaceTopic[] = [];
  const rawTopics = get(item, ['place_topics']);
  if (rawTopics && typeof rawTopics === 'object') {
    for (const [topic, count] of Object.entries(rawTopics as Record<string, unknown>)) {
      const n = pickNumber(count);
      const t = pickString(topic);
      if (!t || n == null) continue;
      placeTopics.push({ topic: t, count: n });
    }
    placeTopics.sort((a, b) => b.count - a.count);
  }

  // people_also_search → Google-curated nearby competitors. Each entry has the
  // same rating shape as the primary item (`rating: { value, votes_count }`).
  const relatedBusinesses: RelatedBusiness[] = [];
  const rawRelated = get(item, ['people_also_search']);
  if (Array.isArray(rawRelated)) {
    for (const r of rawRelated) {
      const name = pickString(get(r, ['title'])) || pickString(get(r, ['name']));
      if (!name) continue;
      relatedBusinesses.push({
        name,
        rating: pickNumber(get(r, ['rating', 'value'])),
        reviewCount: pickNumber(get(r, ['rating', 'votes_count'])),
      });
    }
  }

  return {
    businessName: pickString(item.title) || pickString(item.name),
    phone: pickString(item.phone),
    website: pickString(item.url) || pickString(item.website) || pickString(item.domain),
    address: pickString(item.address),
    // Prefer `description` over `snippet`: real `google_business_info` rows
    // populate `snippet` with the address (duplicates `address`), so reading
    // it first would clobber the actual descriptive blurb.
    description: pickString(item.description) || pickString(item.snippet),
    rating: pickNumber(get(item, ['rating', 'value'])) ?? pickNumber(item.rating),
    reviewCount: pickNumber(get(item, ['rating', 'votes_count'])) ?? pickNumber(item.reviews_count),
    hours,
    photos: photoUrls,
    category: pickString(item.category),
    categoryIds,
    addressCity: pickString(get(item, ['address_info', 'city'])),
    addressRegion: pickString(get(item, ['address_info', 'region'])),
    addressBorough: pickString(get(item, ['address_info', 'borough'])),
    addressZip: pickString(get(item, ['address_info', 'zip'])),
    placeTopics,
    relatedBusinesses,
    serviceAreas: [],
  };
}

// ── Reviews payload → quote excerpts ───────────────────────────────────────

export interface ReviewQuote {
  /** Verbatim review text, trimmed and length-capped. */
  text: string;
  /** Reviewer's display name as Google shows it. */
  name: string;
  /** 1–5 star rating, or null when DataForSEO omits it. */
  rating: number | null;
  /** Reviewer's relative time string, e.g. "2 months ago". */
  timeAgo: string | null;
}

/**
 * DataForSEO `business_data/google/reviews/task_get` envelope shape:
 *   { tasks: [ { result: [ { items: [ { type:"google_reviews_search", text, rating: {value}, profile_name, timestamp, ... } ] } ] } ] }
 *
 * We collect non-empty review texts, cap each excerpt at 280 chars, and skip
 * items missing the `text` field (DataForSEO occasionally returns rating-only
 * entries).
 */
export function normalizeReviewsPayload(payload: unknown): ReviewQuote[] {
  const out: ReviewQuote[] = [];
  const tasks = get(payload, ['tasks']);
  if (!Array.isArray(tasks)) return out;
  for (const task of tasks) {
    const result = get(task, ['result']);
    const items = Array.isArray(result) ? result[0] : result;
    const itemList = get(items, ['items']);
    if (!Array.isArray(itemList)) continue;
    for (const it of itemList) {
      if (!it || typeof it !== 'object') continue;
      const text = pickString((it as Record<string, unknown>).review_text)
        || pickString((it as Record<string, unknown>).text)
        || pickString((it as Record<string, unknown>).snippet);
      if (!text) continue;
      const capped = text.length > 280 ? `${text.slice(0, 277)}…` : text;
      out.push({
        text: capped,
        name: pickString((it as Record<string, unknown>).profile_name)
          || pickString((it as Record<string, unknown>).reviewer_name)
          || pickString((it as Record<string, unknown>).name),
        rating: pickNumber(get(it, ['rating', 'value'])) ?? pickNumber((it as Record<string, unknown>).rating),
        timeAgo: pickString((it as Record<string, unknown>).time_descriptor)
          || pickString((it as Record<string, unknown>).timestamp)
          || null,
      });
    }
  }
  return out;
}

// ── Questions & Answers payload → Q/A pairs ────────────────────────────────

export interface QuestionAnswer {
  question: string;
  answer: string;
}

/**
 * DataForSEO `business_data/google/questions_and_answers/task_get` envelope:
 *   { tasks: [ { result: [ { items: [ { type:"questions_and_answers_element",
 *       question_text, top_answer:{ text }, answers:[ { text } ] } ] } ] } ] }
 *
 * We pair each question with its top answer (or the first available answer).
 * Skips items with no answer — an unanswered Google question carries no
 * generation value.
 */
export function normalizeQuestionsPayload(payload: unknown): QuestionAnswer[] {
  const out: QuestionAnswer[] = [];
  const tasks = get(payload, ['tasks']);
  if (!Array.isArray(tasks)) return out;
  for (const task of tasks) {
    const result = get(task, ['result']);
    const items = Array.isArray(result) ? result[0] : result;
    const itemList = get(items, ['items']);
    if (!Array.isArray(itemList)) continue;
    for (const it of itemList) {
      if (!it || typeof it !== 'object') continue;
      const question = pickString((it as Record<string, unknown>).question_text)
        || pickString((it as Record<string, unknown>).question);
      if (!question) continue;
      let answer = pickString(get(it, ['top_answer', 'text']));
      if (!answer) {
        const answers = (it as Record<string, unknown>).answers;
        if (Array.isArray(answers) && answers.length) {
          answer = pickString(get(answers[0], ['text'])) || pickString(get(answers[0], ['answer_text']));
        }
      }
      if (!answer) continue;
      out.push({
        question: question.length > 200 ? `${question.slice(0, 197)}…` : question,
        answer: answer.length > 400 ? `${answer.slice(0, 397)}…` : answer,
      });
    }
  }
  return out;
}

/**
 * Maps a (reviewer-edited) draft into the `V1ContentOverrides` slice the
 * editor will merge with the project's existing overrides. Keeps the
 * mapping intentionally minimal — just the safe `meta` fields. Anything
 * that requires picking a section index is left to a future pass.
 *
 * When `existing` is passed (the project's current overrides.meta), any
 * field the user already supplied at wizard time wins over the DataForSEO
 * postback — research enriches, it doesn't overwrite user intent.
 */
export function draftToOverrides(
  draft: ResearchDraft,
  existing?: V1ContentOverrides['meta'],
): V1ContentOverrides {
  const meta: NonNullable<V1ContentOverrides['meta']> = {};
  if (draft.businessName && !existing?.businessName) meta.businessName = draft.businessName;
  if (draft.phone && !existing?.businessPhone) meta.businessPhone = draft.phone;
  if (draft.address && !existing?.businessAddress) meta.businessAddress = draft.address;
  if (draft.description && !existing?.metaDescription) meta.metaDescription = draft.description;
  return Object.keys(meta).length ? { meta } : {};
}
