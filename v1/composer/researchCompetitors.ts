/**
 * v1 Competitor Research
 *
 * Uses the OpenAI Responses API with the built-in `web_search` tool to gather
 * a short summary of what the top local competitors are offering in the
 * niche+location the wizard captured. Output is fed into `generateV1Content`
 * as `V1FormInput.business.competitorContext` so the marketing prompt can
 * differentiate without naming competitors.
 *
 * Strict design constraints:
 *   - Best-effort: any failure returns `null`, callers must degrade gracefully.
 *   - Network-bound: a hard timeout protects the generation pipeline.
 *   - Output is a short markdown-bulleted brief, never raw URLs or quotes.
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const RESPONSES_ENDPOINT = 'https://api.openai.com/v1/responses';
const DEFAULT_MODEL = 'gpt-4o';
// 12s is enough headroom for a single Responses+web_search round-trip on the
// p95 path while leaving ~45s for the two downstream OpenAI passes within the
// route's 60s maxDuration budget. Callers can override per-request.
const DEFAULT_TIMEOUT_MS = 12_000;

export interface CompetitorResearchInput {
  /** What the business sells, e.g. "plumbing services". */
  niche: string;
  /** Geographic anchor — city or full address. Optional but strongly preferred. */
  location?: string;
  /** Optional brand name to *exclude* from the competitor set. */
  excludeBrand?: string;
  /**
   * Pre-known competitors to research instead of discovering blind. When
   * non-empty, the prompt swaps from "find 3 competitors" to "look up each of
   * these specific named businesses". Sourced from Google's
   * `people_also_search` on the primary listing.
   */
  knownCompetitors?: string[];
  /** Hard wall-clock timeout (ms). Defaults to 12s. */
  timeoutMs?: number;
}

interface CompetitorEntry {
  name: string;
  offer: string;
  primaryUsp: string;
  /** Optional service areas the competitor publicly lists on their site/listing. */
  serviceAreas?: string[];
}

export interface CompetitorResearchResult {
  /** 1–3 distilled competitor profiles, or empty if the model declined. */
  competitors: CompetitorEntry[];
  /** Compact bulleted brief suitable for inlining into the marketing prompt. */
  brief: string;
  /** Aggregated service areas observed across competitors (deduped). */
  serviceAreas: string[];
}

function buildPrompt(input: CompetitorResearchInput): string {
  const locationLine = input.location ? `Location: ${input.location}` : 'Location: (unspecified — assume a typical US metro)';
  const excludeLine = input.excludeBrand
    ? `Exclude the brand named "${input.excludeBrand}" from your competitor set.`
    : '';
  const known = (input.knownCompetitors || []).filter((s) => s && s.trim()).slice(0, 5);

  // Grounded mode: when Google's `people_also_search` gives us real local
  // competitor names, skip discovery and ask the model to look up each one
  // by name. Higher accuracy, fewer hallucinations.
  const targetLine = known.length
    ? `Use web search to look up each of these SPECIFIC named businesses (do not substitute or invent others):\n${known.map((n) => `  - ${n}`).join('\n')}`
    : 'Use web search to identify up to 3 distinct, currently-operating local competitors for this niche near the location above.';

  return `You are a market-research analyst helping a small-business landing page.

Niche: ${input.niche}
${locationLine}
${excludeLine}

${targetLine} For each, extract:
  - "name": company name as it appears publicly
  - "offer": one concrete promotion, package, or signature service they advertise (e.g. "$49 drain cleaning", "free in-home estimates")
  - "primaryUsp": one short clause describing what they emphasize (e.g. "24/7 emergency response", "family-owned since 1998")
  - "serviceAreas": up to 8 neighborhoods, suburbs, or nearby towns this competitor publicly lists as their coverage area. Use REAL place names you find on their site or Google listing — never invent. Empty array if not publicly listed.

Respond with VALID JSON ONLY in this exact shape (no markdown, no code fences):
{
  "competitors": [
    { "name": "...", "offer": "...", "primaryUsp": "...", "serviceAreas": ["..."] }
  ]
}

Rules:
  - Never invent details you cannot confirm via search. If a field is unknown, use an empty string (or empty array for serviceAreas).
  - If you cannot find any credible local competitors, return { "competitors": [] }.
  - Do not include URLs, addresses, or phone numbers in any field.
  - Keep "offer" and "primaryUsp" under 140 characters; each service-area entry under 30 characters.`;
}

interface ResponsesEnvelope {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
  error?: { message?: string } | string;
}

/** Walks the Responses API envelope to find the assistant's final text. */
function extractText(env: ResponsesEnvelope): string | null {
  if (typeof env.output_text === 'string' && env.output_text.trim()) return env.output_text;
  const parts: string[] = [];
  for (const item of env.output || []) {
    if (item?.type !== 'message') continue;
    for (const c of item.content || []) {
      if ((c?.type === 'output_text' || c?.type === 'text') && typeof c.text === 'string') {
        parts.push(c.text);
      }
    }
  }
  const joined = parts.join('').trim();
  return joined || null;
}

function parseCompetitorsJSON(text: string): CompetitorEntry[] {
  // The model is instructed to return raw JSON, but be defensive: strip any
  // stray code fences and locate the first {...} block.
  const cleaned = text.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end < 0) return [];
  let parsed: unknown;
  try { parsed = JSON.parse(cleaned.slice(start, end + 1)); } catch { return []; }
  if (!parsed || typeof parsed !== 'object') return [];
  const arr = (parsed as { competitors?: unknown }).competitors;
  if (!Array.isArray(arr)) return [];
  const out: CompetitorEntry[] = [];
  // Allow up to 5 entries when callers pass a `knownCompetitors` seed list of
  // that size; cap stays at 5 either way to keep the brief short.
  for (const raw of arr.slice(0, 5)) {
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as Record<string, unknown>;
    const name = typeof r.name === 'string' ? r.name.trim() : '';
    const offer = typeof r.offer === 'string' ? r.offer.trim() : '';
    const primaryUsp = typeof r.primaryUsp === 'string' ? r.primaryUsp.trim() : '';
    if (!name) continue;
    const areas: string[] = [];
    const rawAreas = Array.isArray(r.serviceAreas) ? r.serviceAreas : [];
    for (const a of rawAreas) {
      const s = typeof a === 'string' ? a.trim() : '';
      if (!s) continue;
      areas.push(s.length > 30 ? s.slice(0, 30) : s);
      if (areas.length >= 8) break;
    }
    out.push({ name, offer, primaryUsp, ...(areas.length && { serviceAreas: areas }) });
  }
  return out;
}

function competitorsToBrief(competitors: CompetitorEntry[]): string {
  if (!competitors.length) return '';
  const lines = ['Competitor landscape (do NOT name these brands in copy — use this only to differentiate):'];
  for (const c of competitors) {
    const offerPart = c.offer ? ` — offers: ${c.offer}` : '';
    const uspPart = c.primaryUsp ? ` — angle: ${c.primaryUsp}` : '';
    lines.push(`- ${c.name}${offerPart}${uspPart}`);
  }
  return lines.join('\n');
}

/** Deduped, case-insensitive aggregate of competitor service areas. */
function aggregateServiceAreas(competitors: CompetitorEntry[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of competitors) {
    for (const a of c.serviceAreas || []) {
      const key = a.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(a);
      if (out.length >= 12) return out;
    }
  }
  return out;
}

/**
 * Runs the OpenAI Responses + web_search pass. Returns `null` on any failure
 * (missing key, network error, timeout, model decline). Callers should treat
 * a null return as "no competitor context available" and proceed.
 */
export async function researchCompetitors(
  input: CompetitorResearchInput,
): Promise<CompetitorResearchResult | null> {
  if (!OPENAI_API_KEY) return null;
  if (!input.niche?.trim()) return null;

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
      console.error('[researchCompetitors] OpenAI error:', msg);
      return null;
    }
    const text = extractText(env);
    if (!text) return null;
    const competitors = parseCompetitorsJSON(text);
    return {
      competitors,
      brief: competitorsToBrief(competitors),
      serviceAreas: aggregateServiceAreas(competitors),
    };
  } catch (err) {
    if ((err as { name?: string })?.name === 'AbortError') {
      console.error('[researchCompetitors] timed out after', input.timeoutMs ?? DEFAULT_TIMEOUT_MS, 'ms');
    } else {
      console.error('[researchCompetitors] failed:', err);
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
