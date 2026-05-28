/**
 * v1 Neighborhood Expansion
 *
 * Turns a free-form service-area seed ("Within 30 miles of Chicago",
 * "We mostly cover the north side", or a partial chip list) plus the
 * structured city/state/zip captured by the wizard into 10–15 real local
 * neighborhood / suburb / nearby-town chips that the ServiceAreas section
 * can render. Designed to be called once per project creation and again
 * (best-effort) from the regenerate route when DataForSEO / enrichment
 * both come back empty.
 *
 * Uses the OpenAI Responses API with the built-in `web_search` tool —
 * same pattern as `researchCompetitors.ts` — so the chips are grounded in
 * real place names rather than hallucinated. Best-effort: any failure
 * returns `null` and callers must keep the spec's placeholder chips
 * stripped (the composer's [Your X] filter handles that).
 */
import { parseAreaChips } from '../../src/lib/chat/normalize';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const RESPONSES_ENDPOINT = 'https://api.openai.com/v1/responses';
const DEFAULT_MODEL = 'gpt-4o';
const DEFAULT_TIMEOUT_MS = 12_000;
const MIN_CHIPS = 10;
const MAX_CHIPS = 15;
const MAX_CHIP_LEN = 30;

export interface ExpandNeighborhoodsInput {
  /** What the business sells, e.g. "plumbing services". Used as a hint. */
  niche?: string;
  /** Anchor city — required. The expansion is centered here. */
  city: string;
  /** Two-letter or full state name. Strongly preferred. */
  state?: string;
  /** ZIP / postal code. Optional, helps disambiguate same-named cities. */
  zip?: string;
  /**
   * Free-form service-area text the user typed in the wizard. Used as a
   * grounding hint; if it parses into chips already those are preferred
   * over inventing new ones.
   */
  serviceAreaText?: string;
  /** Brand name to exclude from the expansion set. */
  excludeBrand?: string;
  /** Hard wall-clock timeout (ms). Defaults to 12s. */
  timeoutMs?: number;
}

/** Sentinel patterns the composer must never render. */
const PLACEHOLDER_RE = /^\s*(\[.*\]|\(.*\)|your\s+\w+|sample\s+\w+|placeholder)\s*$/i;

function buildPrompt(input: ExpandNeighborhoodsInput): string {
  const locParts = [input.city, input.state].filter(Boolean).join(', ');
  const zipLine = input.zip ? `ZIP code: ${input.zip}` : '';
  const nicheLine = input.niche ? `Business niche: ${input.niche}` : '';
  const brandLine = input.excludeBrand
    ? `Brand name (do NOT use as a service area): ${input.excludeBrand}`
    : '';
  const seedChips = parseAreaChips(input.serviceAreaText || '');
  const seedLine = seedChips.length
    ? `User already named these specific areas (keep them and add more): ${seedChips.join(', ')}`
    : input.serviceAreaText
    ? `User described their coverage as: "${input.serviceAreaText.trim()}"`
    : 'User did not specify their coverage area.';

  return `You are a local-SEO research assistant grounding a small-business landing page in real place names.

Anchor city: ${locParts || '(unspecified)'}
${zipLine}
${nicheLine}
${brandLine}
${seedLine}

Use web search to identify ${MIN_CHIPS}–${MAX_CHIPS} REAL neighborhoods, suburbs, districts, or nearby towns that a business located in the anchor city would plausibly serve. Bias toward places within ~15 miles. Use actual place names you can verify via search — never invent.

Respond with VALID JSON ONLY in this exact shape (no markdown, no code fences):
{
  "areas": ["Name 1", "Name 2", "..."]
}

Strict rules:
- Each entry is a single place name, max ${MAX_CHIP_LEN} characters, no state suffix, no ZIP code.
- Do NOT include the brand name. Do NOT include generic words like "downtown" alone.
- Do NOT include bracketed placeholders like "[Your Neighborhood]" or "Your Area".
- If you cannot find at least ${MIN_CHIPS} verifiable areas, return { "areas": [] }.`;
}

interface ResponsesEnvelope {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
  error?: { message?: string } | string;
}

function extractText(env: ResponsesEnvelope): string {
  if (env.output_text) return env.output_text;
  const out = env.output || [];
  for (const item of out) {
    for (const c of item.content || []) {
      if (typeof c.text === 'string' && c.text.trim()) return c.text;
    }
  }
  return '';
}

function parseAreasJSON(text: string): string[] {
  const cleaned = text.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end < 0) return [];
  let parsed: unknown;
  try { parsed = JSON.parse(cleaned.slice(start, end + 1)); } catch { return []; }
  if (!parsed || typeof parsed !== 'object') return [];
  const arr = (parsed as { areas?: unknown }).areas;
  if (!Array.isArray(arr)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const a of arr) {
    if (typeof a !== 'string') continue;
    const s = a.trim();
    if (!s || PLACEHOLDER_RE.test(s)) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s.length > MAX_CHIP_LEN ? s.slice(0, MAX_CHIP_LEN) : s);
    if (out.length >= MAX_CHIPS) break;
  }
  return out;
}

/**
 * Runs the OpenAI Responses + web_search pass. Returns `null` on any
 * failure (missing key, network error, timeout, model decline, fewer than
 * MIN_CHIPS verifiable areas). Callers should treat a null return as "no
 * grounded chips available" and either keep the user's seed text or hide
 * the section.
 */
export async function expandNeighborhoods(
  input: ExpandNeighborhoodsInput,
): Promise<string[] | null> {
  if (!OPENAI_API_KEY) return null;
  if (!input.city?.trim()) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(RESPONSES_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        input: buildPrompt(input),
        tools: [{ type: 'web_search' }],
      }),
      signal: controller.signal,
    });
    const env = (await res.json()) as ResponsesEnvelope;
    if (env.error) {
      const msg = typeof env.error === 'string' ? env.error : env.error.message;
      console.error('[expandNeighborhoods] OpenAI error:', msg);
      return null;
    }
    const text = extractText(env);
    if (!text) return null;
    const areas = parseAreasJSON(text);
    return areas.length >= MIN_CHIPS ? areas : null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[expandNeighborhoods] request failed:', msg);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/** Exported for unit tests. */
export const __internal = { buildPrompt, parseAreasJSON, PLACEHOLDER_RE };
