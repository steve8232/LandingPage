import { NextRequest, NextResponse } from 'next/server';
import type { UnsplashOrientation, UnsplashSearchResponse } from '@/lib/unsplash/types';
import { normalizeUnsplashPhoto } from '@/lib/unsplash/normalizeUnsplash';
import { getUnsplashAccessKey, UnsplashError, unsplashFetchJson } from '@/lib/unsplash/unsplashFetch';

export const runtime = 'nodejs';

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function isOrientation(v: string | null): v is UnsplashOrientation {
  return v === 'landscape' || v === 'portrait' || v === 'squarish';
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function addUtm(url: string): string {
  try {
    const u = new URL(url);
    // Safe default; can be overridden on the server.
    const source = process.env.UNSPLASH_UTM_SOURCE || 'landing-page-designer';
    if (!u.searchParams.has('utm_source')) u.searchParams.set('utm_source', source);
    if (!u.searchParams.has('utm_medium')) u.searchParams.set('utm_medium', 'referral');
    return u.toString();
  } catch {
    return url;
  }
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const q = (params.get('q') || '').trim();
    if (!q) {
      return NextResponse.json({ error: 'Search query (q) is required.' }, { status: 400 });
    }
    if (q.length < 2) {
      return NextResponse.json({ error: 'Search query must be at least 2 characters.' }, { status: 400 });
    }

    const page = parsePositiveInt(params.get('page'), 1);
    const perPage = clamp(parsePositiveInt(params.get('perPage'), 12), 1, 30);

    const orientationParam = params.get('orientation');
    if (orientationParam && !isOrientation(orientationParam)) {
      return NextResponse.json(
        { error: 'Invalid orientation. Use landscape, portrait, or squarish.' },
        { status: 400 }
      );
    }

    const url = new URL('https://api.unsplash.com/search/photos');
    url.searchParams.set('query', q);
    url.searchParams.set('page', String(page));
    url.searchParams.set('per_page', String(perPage));
    url.searchParams.set('content_filter', 'high');
    if (orientationParam) url.searchParams.set('orientation', orientationParam);

    const { json, response } = await unsplashFetchJson(url.toString(), {
      method: 'GET',
      headers: {
        'Accept-Version': 'v1',
        'Authorization': `Client-ID ${getUnsplashAccessKey()}`,
      },
    });

    if (!response.ok) {
      // Unsplash may return 403 or 429 for rate limiting depending on context.
      const remaining = response.headers.get('x-ratelimit-remaining');
      if (response.status === 429 || (response.status === 403 && remaining === '0')) {
        return NextResponse.json(
          { error: 'Image search is temporarily rate-limited. Please try again shortly.' },
          { status: 429 }
        );
      }

      const generic =
        response.status === 401 || response.status === 403
          ? 'Unsplash authentication failed. Check server configuration.'
          : 'Unsplash request failed. Please try again.';

      return NextResponse.json({ error: generic }, { status: 502 });
    }

    if (!isRecord(json)) {
      throw new UnsplashError('Unexpected Unsplash response.', 502);
    }

    const results = Array.isArray(json.results) ? json.results : [];
    const total = typeof json.total === 'number' ? json.total : 0;
    const totalPages = typeof json.total_pages === 'number' ? json.total_pages : 0;

    const images = results
      .map((p) => {
        try {
          const normalized = normalizeUnsplashPhoto(p);
          return {
            ...normalized,
            photographerProfileUrl: addUtm(normalized.photographerProfileUrl),
            unsplashPageUrl: addUtm(normalized.unsplashPageUrl),
          };
        } catch {
          return null;
        }
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));

    const body: UnsplashSearchResponse = {
      images,
      page,
      perPage,
      total,
      totalPages,
    };

    return NextResponse.json(body, { status: 200 });
  } catch (err) {
    if (err instanceof UnsplashError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('Unsplash search error:', err);
    return NextResponse.json({ error: 'Failed to search images. Please try again.' }, { status: 500 });
  }
}

