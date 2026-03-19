import { NextRequest, NextResponse } from 'next/server';
import { getUnsplashAccessKey, UnsplashError, unsplashFetchJson } from '@/lib/unsplash/unsplashFetch';

export const runtime = 'nodejs';

function isValidUnsplashApiUrl(maybeUrl: string): boolean {
  try {
    const u = new URL(maybeUrl);
    return u.protocol === 'https:' && u.hostname === 'api.unsplash.com';
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { photoId?: string; downloadLocation?: string };
    const photoId = typeof body.photoId === 'string' ? body.photoId.trim() : '';
    const downloadLocation = typeof body.downloadLocation === 'string' ? body.downloadLocation.trim() : '';

    if (!photoId && !downloadLocation) {
      return NextResponse.json({ error: 'photoId or downloadLocation is required.' }, { status: 400 });
    }

    let url: string;
    if (downloadLocation) {
      if (!isValidUnsplashApiUrl(downloadLocation)) {
        return NextResponse.json({ error: 'Invalid downloadLocation.' }, { status: 400 });
      }
      url = downloadLocation;
    } else {
      url = `https://api.unsplash.com/photos/${encodeURIComponent(photoId)}/download`;
    }

    const { response } = await unsplashFetchJson(url, {
      method: 'GET',
      headers: {
        'Accept-Version': 'v1',
        'Authorization': `Client-ID ${getUnsplashAccessKey()}`,
      },
    });

    if (!response.ok) {
      const remaining = response.headers.get('x-ratelimit-remaining');
      if (response.status === 429 || (response.status === 403 && remaining === '0')) {
        return NextResponse.json(
          { error: 'Download tracking is temporarily rate-limited. Please try again shortly.' },
          { status: 429 }
        );
      }
      return NextResponse.json({ error: 'Failed to track image download.' }, { status: 502 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    if (err instanceof UnsplashError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('Unsplash track-download error:', err);
    return NextResponse.json({ error: 'Failed to track image download.' }, { status: 500 });
  }
}
