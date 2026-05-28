/**
 * Minimal typed wrapper around the Firecrawl v2 Scrape endpoint.
 *
 * Auth: `FIRECRAWL_API_KEY` env var (server-only). `FIRECRAWL_API_BASE`
 * defaults to https://api.firecrawl.dev so the prod endpoint can be
 * swapped without code changes. Never import from a client component.
 *
 * Docs:
 *   https://docs.firecrawl.dev/api-reference/v2-endpoint/scrape
 */

const DEFAULT_API_BASE = 'https://api.firecrawl.dev';

/** Thrown when Firecrawl rejects credentials (HTTP 401/403). */
export class FirecrawlAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FirecrawlAuthError';
  }
}

/** Generic Firecrawl error — wraps both HTTP and payload-level failures. */
export class FirecrawlError extends Error {
  readonly status: number | null;
  constructor(message: string, status: number | null) {
    super(message);
    this.name = 'FirecrawlError';
    this.status = status;
  }
}

export interface FirecrawlMetadata {
  title?: string;
  description?: string;
  language?: string;
  sourceURL?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  favicon?: string;
  statusCode?: number;
}

export interface FirecrawlScrapeResult {
  /** Markdown rendering of the rendered page (post-JS). */
  markdown: string;
  /** Public URL of a full-page PNG screenshot — Firecrawl-hosted. */
  screenshotUrl: string | null;
  metadata: FirecrawlMetadata;
}

interface FirecrawlScrapeOptions {
  /** Per-request timeout in milliseconds. Defaults to 60s. */
  timeoutMs?: number;
}

/**
 * Scrape a URL with Firecrawl v2 — returns markdown + a full-page screenshot
 * URL + page metadata. Errors are normalized to FirecrawlAuthError /
 * FirecrawlError so callers can branch cleanly.
 */
export async function scrapeUrl(
  url: string,
  options: FirecrawlScrapeOptions = {},
): Promise<FirecrawlScrapeResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new FirecrawlError('FIRECRAWL_API_KEY is not set', null);
  }
  const apiBase = (process.env.FIRECRAWL_API_BASE || DEFAULT_API_BASE).replace(/\/+$/, '');
  const endpoint = `${apiBase}/v2/scrape`;

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 60_000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url,
        // markdown for OpenAI extraction; full-page screenshot for the hero.
        formats: ['markdown', { type: 'screenshot', fullPage: true }],
        onlyMainContent: true,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new FirecrawlError(`Firecrawl request timed out after ${timeoutMs}ms`, null);
    }
    throw new FirecrawlError(
      `Firecrawl request failed: ${err instanceof Error ? err.message : String(err)}`,
      null,
    );
  }
  clearTimeout(timer);

  if (response.status === 401 || response.status === 403) {
    throw new FirecrawlAuthError(`Firecrawl auth rejected (HTTP ${response.status})`);
  }
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new FirecrawlError(
      `Firecrawl HTTP ${response.status}${text ? `: ${text.slice(0, 240)}` : ''}`,
      response.status,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new FirecrawlError('Firecrawl response was not valid JSON', response.status);
  }

  const p = (payload || {}) as Record<string, unknown>;
  if (p.success === false) {
    const err = typeof p.error === 'string' ? p.error : 'Firecrawl reported failure';
    throw new FirecrawlError(err, response.status);
  }
  const data = (p.data && typeof p.data === 'object') ? (p.data as Record<string, unknown>) : {};
  const markdown = typeof data.markdown === 'string' ? data.markdown : '';
  const screenshot = typeof data.screenshot === 'string' && data.screenshot.startsWith('http')
    ? data.screenshot
    : null;
  const meta = (data.metadata && typeof data.metadata === 'object')
    ? (data.metadata as Record<string, unknown>)
    : {};
  const metadata: FirecrawlMetadata = {
    title: typeof meta.title === 'string' ? meta.title : undefined,
    description: typeof meta.description === 'string' ? meta.description : undefined,
    language: typeof meta.language === 'string' ? meta.language : undefined,
    sourceURL: typeof meta.sourceURL === 'string' ? meta.sourceURL : undefined,
    ogTitle: typeof meta.ogTitle === 'string' ? meta.ogTitle : undefined,
    ogDescription: typeof meta.ogDescription === 'string' ? meta.ogDescription : undefined,
    ogImage: typeof meta.ogImage === 'string' ? meta.ogImage : undefined,
    favicon: typeof meta.favicon === 'string' ? meta.favicon : undefined,
    statusCode: typeof meta.statusCode === 'number' ? meta.statusCode : undefined,
  };

  return { markdown, screenshotUrl: screenshot, metadata };
}
