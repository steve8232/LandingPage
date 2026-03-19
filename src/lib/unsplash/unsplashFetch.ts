const DEFAULT_TIMEOUT_MS = 10_000;

export class UnsplashError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'UnsplashError';
    this.status = status;
  }
}

export function getUnsplashAccessKey(): string {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) {
    throw new UnsplashError(
      'Unsplash is not configured. Set UNSPLASH_ACCESS_KEY in .env.local.',
      500
    );
  }
  return key;
}

export async function unsplashFetchJson(
  url: string,
  init?: RequestInit & { timeoutMs?: number }
): Promise<{ json: unknown; response: Response }> {
  const timeoutMs = init?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });

    let json: unknown = null;
    try {
      json = await response.json();
    } catch {
      // Non-JSON response — keep json as null.
    }
    return { json, response };
  } catch (err) {
    // AbortError in Node/undici is typically a DOMException-like error.
    const message = err instanceof Error ? err.message : String(err);
    if (message.toLowerCase().includes('aborted')) {
      throw new UnsplashError('Request to Unsplash timed out. Please try again.', 504);
    }
    throw new UnsplashError('Failed to reach Unsplash. Please try again.', 502);
  } finally {
    clearTimeout(timeout);
  }
}
