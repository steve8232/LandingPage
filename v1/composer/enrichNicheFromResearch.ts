/**
 * v1 Niche-from-Research Enrichment
 *
 * Pre-pass that turns the structured fields lifted from a DataForSEO
 * `google_business_info` payload (category, structured address, place_topics,
 * description) into the four "soft" V1FormInput fields the marketing prompt
 * leans on hardest:
 *
 *   - productService — a clean niche label ("Roofing contractor") rather than
 *     the brand name DataForSEO sometimes leaves in `keyword`.
 *   - serviceAreas  — 8–12 real neighborhoods / suburbs / nearby towns,
 *     grounded in the listing's city + region. Used to populate the
 *     ServiceAreas section's chips.
 *   - uniqueValue   — a single sentence the marketing pass can use as a hook
 *     when `description` is thin or missing.
 *   - customerLove  — a paraphrased line distilling what reviewers praise,
 *     grounded in `place_topics` so reviews-task failures don't strand the
 *     testimonials with nothing to work from.
 *
 * Best-effort: any failure (no API key, network error, parse failure, hard
 * timeout) returns `null` and the caller proceeds with whatever fallback
 * grounding it already has.
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CHAT_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4o-mini';
// Single chat-completion round-trip with `response_format: json_object`.
// Smaller model + tight schema → p95 well under 8s; 12s is the same headroom
// budget researchCompetitors uses.
const DEFAULT_TIMEOUT_MS = 12_000;

export interface EnrichNicheInput {
  /** Google category label, e.g. "Roofing contractor". */
  category: string;
  /** Free-text Google description blurb, if present. */
  description: string;
  /** Brand name (excluded from the AI's invented competitor set). */
  brandName?: string;
  /** Structured location parts from `address_info`. */
  city: string;
  region: string;
  borough?: string;
  zip?: string;
  /** Sorted (count desc) review-derived themes from `place_topics`. */
  placeTopics?: Array<{ topic: string; count: number }>;
  /** Hard wall-clock timeout (ms). Defaults to 12s. */
  timeoutMs?: number;
}

export interface EnrichNicheResult {
  /** Clean niche label, e.g. "roofing contractor" — lowercased phrase form. */
  productService: string;
  /** 8–12 real local areas (neighborhoods, suburbs, ZIPs). */
  serviceAreas: string[];
  /** Single sentence distilling the business's unique value, ≤ 35 words. */
  uniqueValue: string;
  /** One-sentence paraphrase of common review praise, ≤ 30 words. */
  customerLove: string;
}

function buildPrompt(input: EnrichNicheInput): string {
  const locParts = [input.city, input.region].filter(Boolean).join(', ');
  const boroughLine = input.borough ? `Borough/neighborhood: ${input.borough}` : '';
  const zipLine = input.zip ? `ZIP code: ${input.zip}` : '';
  const brandLine = input.brandName ? `Brand name (do NOT use as a service area): ${input.brandName}` : '';
  const topics = (input.placeTopics || []).slice(0, 10);
  const topicsLine = topics.length
    ? `Themes from Google reviews (mention counts in parens): ${topics.map((t) => `${t.topic} (${t.count})`).join(', ')}`
    : 'No review themes available.';
  const desc = (input.description || '').trim().slice(0, 800);
  const descLine = desc ? `Business description: ${desc}` : 'No business description available.';
  const category = input.category || '(unspecified)';

  return `You are a local-SEO research assistant enriching a small-business landing page.

Business category: ${category}
Location: ${locParts || '(unspecified)'}
${boroughLine}
${zipLine}
${brandLine}
${descLine}
${topicsLine}

Produce a JSON object with these EXACT fields:
{
  "productService": "Short lowercased noun phrase for what this business sells, 2–5 words, no brand names (e.g. \\"roofing contractor\\", \\"mobile car detailing\\"). If the category is reasonable, paraphrase it; otherwise infer from the description.",
  "serviceAreas": ["8 to 12 REAL neighborhoods, suburbs, or nearby towns that a business located in the city/borough above would plausibly serve. Use actual local place names you know — never invent. Bias toward areas within ~15 miles. Do NOT include the brand name, do NOT include the state name, do NOT include generic words like 'downtown' alone."],
  "uniqueValue": "One sentence (max 35 words) describing what makes this business stand out, grounded in the description and category. No superlatives like 'best' or 'top'. Avoid first person.",
  "customerLove": "One sentence (max 30 words) paraphrasing what customers praise, grounded in the review themes if present. If no themes are available, base it on the category alone. Avoid quoting verbatim."
}

Strict rules:
- Return ONLY valid JSON. No markdown, no code fences, no commentary.
- If you genuinely cannot infer a field, return an empty string ("") or empty array ([]) — never invent.
- "serviceAreas" must be an array of strings; each entry max 30 characters.`;
}

function pickString(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function parseResult(text: string): EnrichNicheResult | null {
  const cleaned = text.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end < 0) return null;
  let parsed: unknown;
  try { parsed = JSON.parse(cleaned.slice(start, end + 1)); } catch { return null; }
  if (!parsed || typeof parsed !== 'object') return null;
  const r = parsed as Record<string, unknown>;
  const areasRaw = Array.isArray(r.serviceAreas) ? r.serviceAreas : [];
  const serviceAreas: string[] = [];
  for (const a of areasRaw) {
    const s = pickString(a);
    if (!s) continue;
    serviceAreas.push(s.length > 30 ? s.slice(0, 30) : s);
    if (serviceAreas.length >= 12) break;
  }
  return {
    productService: pickString(r.productService),
    serviceAreas,
    uniqueValue: pickString(r.uniqueValue),
    customerLove: pickString(r.customerLove),
  };
}

export async function enrichNicheFromResearch(
  input: EnrichNicheInput,
): Promise<EnrichNicheResult | null> {
  if (!OPENAI_API_KEY) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: 'You are a local-SEO research assistant. Always respond with valid JSON only.' },
          { role: 'user', content: buildPrompt(input) },
        ],
        max_tokens: 700,
        temperature: 0.4,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });
    const data = await res.json();
    if (data.error) {
      const msg = typeof data.error === 'string' ? data.error : data.error?.message;
      console.error('[enrichNiche] OpenAI error:', msg);
      return null;
    }
    const text = data.choices?.[0]?.message?.content || '';
    return parseResult(text);
  } catch (err) {
    if ((err as { name?: string })?.name === 'AbortError') {
      console.error('[enrichNiche] timed out after', input.timeoutMs ?? DEFAULT_TIMEOUT_MS, 'ms');
    } else {
      console.error('[enrichNiche] failed:', err);
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
