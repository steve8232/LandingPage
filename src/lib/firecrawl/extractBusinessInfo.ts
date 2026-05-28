/**
 * OpenAI-driven business-info extractor for the URL onboarding lane.
 *
 * Takes the markdown + metadata Firecrawl returns for a scraped site,
 * asks `gpt-4o` to (a) pull structured business facts and (b) pick the
 * closest v1 template id from the registry. The picker is "closest"
 * rather than "exact" because the registry covers 18 local-service
 * niches; anything outside that set falls back to a sensible default.
 *
 * Server-only — never import from a Client Component.
 */

import { v1Templates, type V1TemplateEntry } from '@/lib/v1Templates';
import type { FirecrawlMetadata } from './client';

export interface ExtractedBusinessInfo {
  /** Best-fit v1 template id from the registry (always set; falls back to v1-plumber). */
  templateId: string;
  /** Confidence (0–1) the model reports for the template pick. */
  templateConfidence: number;
  brandName: string;
  /** Short description of the product/service this business offers. */
  productService: string;
  /** Headline offer / hook (free quote, same-day service, etc.). */
  offer: string;
  /** Pricing snippet if mentioned on the site. */
  pricing: string;
  /** Primary call-to-action label. */
  cta: string;
  /** Unique value proposition. */
  uniqueValue: string;
  /** What customers love / praise about this business. */
  customerLove: string;
  /** Mailing street address (street line only). */
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  /** Full address as displayed on the site (street, city, state, zip). */
  fullAddress: string;
  /** US phone (any format the site uses). */
  phone: string;
  email: string;
  /** Hours blurb as written on the site, e.g. "Mon–Fri 8a–6p". */
  hours: string;
  /** Service-area blurb (comma- or pipe-separated cities/neighborhoods). */
  serviceAreaText: string;
  /** Years in business if mentioned (raw string from the page). */
  yearsInBusiness: string;
  /** True when the model saw "licensed", "insured", or "bonded" on the page. */
  licensedInsured: boolean;
}

const DEFAULT_TEMPLATE_ID = 'v1-plumber';

function buildTemplateMenu(): string {
  return v1Templates
    .map((t: V1TemplateEntry) => `- ${t.id}: ${t.name} — ${t.description}`)
    .join('\n');
}

function clampStr(s: unknown, max = 800): string {
  if (typeof s !== 'string') return '';
  const t = s.trim();
  return t.length > max ? t.slice(0, max) : t;
}

function clampBool(v: unknown): boolean {
  return v === true;
}

function clampNum01(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function pickTemplateId(raw: unknown): string {
  if (typeof raw !== 'string') return DEFAULT_TEMPLATE_ID;
  const trimmed = raw.trim();
  return v1Templates.some((t) => t.id === trimmed) ? trimmed : DEFAULT_TEMPLATE_ID;
}

/**
 * Trim a long markdown blob to roughly the first ~12k characters so the
 * extraction prompt stays well under the gpt-4o context budget. The
 * marketing-relevant copy on a typical service site is almost always in
 * the first few thousand chars; the cut-off is intentionally generous so
 * we don't lose footer addresses or service lists.
 */
function trimMarkdown(md: string, max = 12_000): string {
  if (md.length <= max) return md;
  return `${md.slice(0, max)}\n\n[truncated]`;
}

export interface ExtractInput {
  url: string;
  markdown: string;
  metadata: FirecrawlMetadata;
}

export async function extractBusinessInfo(input: ExtractInput): Promise<ExtractedBusinessInfo> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  const md = trimMarkdown(input.markdown || '');
  const metaTitle = input.metadata.title || input.metadata.ogTitle || '';
  const metaDesc = input.metadata.description || input.metadata.ogDescription || '';

  const system = [
    'You extract structured marketing data from a small business website.',
    'You also pick the closest matching landing-page template from a fixed registry.',
    'Always respond with valid JSON only — no prose, no Markdown fences.',
    'Never invent contact info, addresses, phone numbers, or years in business —',
    'leave a field empty if you cannot find it verbatim on the page.',
  ].join(' ');

  const user = `Pick the closest match from this template registry (always return one of these ids):
${buildTemplateMenu()}

SITE URL: ${input.url}
PAGE TITLE: ${metaTitle}
META DESCRIPTION: ${metaDesc}

PAGE CONTENT (markdown):
${md}

Respond with a JSON object using these keys (omit/blank if unknown):
{
  "templateId": "<one of the registry ids above>",
  "templateConfidence": 0.0,
  "brandName": "",
  "productService": "<one short sentence describing what the business does>",
  "offer": "<their headline offer or hook>",
  "pricing": "<free quote / flat rate / etc., blank if not stated>",
  "cta": "<primary call-to-action button label, e.g. 'Get a free quote'>",
  "uniqueValue": "<what makes them different in one sentence>",
  "customerLove": "<what reviewers / customers praise, one sentence>",
  "streetAddress": "<street line only>",
  "city": "",
  "state": "<two-letter US state code if visible>",
  "zip": "",
  "fullAddress": "<street, city, state zip — exactly as written on the site>",
  "phone": "<digits only or as written>",
  "email": "",
  "hours": "<e.g. 'Mon–Fri 8a–6p'>",
  "serviceAreaText": "<comma-separated list of cities/neighborhoods served>",
  "yearsInBusiness": "<numeric string only, e.g. '15'>",
  "licensedInsured": false
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: 1200,
      response_format: { type: 'json_object' },
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`OpenAI extract failed (HTTP ${response.status}): ${text.slice(0, 240)}`);
  }
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error('OpenAI extract response had no content');
  }
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content) as Record<string, unknown>;
  } catch {
    throw new Error('OpenAI extract response was not valid JSON');
  }

  return {
    templateId: pickTemplateId(parsed.templateId),
    templateConfidence: clampNum01(parsed.templateConfidence),
    brandName: clampStr(parsed.brandName, 160),
    productService: clampStr(parsed.productService, 240),
    offer: clampStr(parsed.offer, 240),
    pricing: clampStr(parsed.pricing, 160),
    cta: clampStr(parsed.cta, 80),
    uniqueValue: clampStr(parsed.uniqueValue, 240),
    customerLove: clampStr(parsed.customerLove, 240),
    streetAddress: clampStr(parsed.streetAddress, 160),
    city: clampStr(parsed.city, 80),
    state: clampStr(parsed.state, 40),
    zip: clampStr(parsed.zip, 20),
    fullAddress: clampStr(parsed.fullAddress, 240),
    phone: clampStr(parsed.phone, 40),
    email: clampStr(parsed.email, 160),
    hours: clampStr(parsed.hours, 160),
    serviceAreaText: clampStr(parsed.serviceAreaText, 400),
    yearsInBusiness: clampStr(parsed.yearsInBusiness, 8),
    licensedInsured: clampBool(parsed.licensedInsured),
  };
}
