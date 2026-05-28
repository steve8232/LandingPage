import type { UnsplashOrientation, UnsplashNormalizedImage } from './types';
import { normalizeUnsplashPhoto } from './normalizeUnsplash';
import { getUnsplashAccessKey, UnsplashError, unsplashFetchJson } from './unsplashFetch';

export interface AutoPickAttribution {
  text: string;
  url: string;
  provider: 'unsplash';
  licenseSummary: 'Unsplash License';
}

export interface AutoPickedImage {
  src: string;
  photoId: string;
  downloadLocation: string;
  attribution: AutoPickAttribution;
}

export interface AutoPickResult {
  picks: Record<string, AutoPickedImage>;
  /** Slot keys we couldn't fill (Unsplash returned too few results). */
  unfilled: string[];
}

const AVATAR_DEFAULT_KEYWORD = 'professional headshot smiling';

function isAvatarSlot(key: string): boolean {
  return key.toLowerCase().includes('avatar');
}

/** Convert a spec niche slug (e.g. "junk-removal") into an Unsplash query. */
export function nicheToKeyword(niche: string | undefined | null): string {
  return (niche || '').replace(/-/g, ' ').trim();
}

function addUtm(u: string): string {
  try {
    const url = new URL(u);
    url.searchParams.set('utm_source', 'sparkpage');
    url.searchParams.set('utm_medium', 'referral');
    return url.toString();
  } catch {
    return u;
  }
}

async function searchUnsplash(
  query: string,
  perPage: number,
  orientation: UnsplashOrientation
): Promise<UnsplashNormalizedImage[]> {
  const url = new URL('https://api.unsplash.com/search/photos');
  url.searchParams.set('query', query);
  url.searchParams.set('page', '1');
  url.searchParams.set('per_page', String(Math.max(1, Math.min(30, perPage))));
  url.searchParams.set('content_filter', 'high');
  url.searchParams.set('orientation', orientation);

  const { json, response } = await unsplashFetchJson(url.toString(), {
    method: 'GET',
    headers: {
      'Accept-Version': 'v1',
      Authorization: `Client-ID ${getUnsplashAccessKey()}`,
    },
  });
  if (!response.ok) {
    throw new UnsplashError(`Unsplash search failed (${response.status}).`, 502);
  }
  if (!json || typeof json !== 'object') {
    throw new UnsplashError('Unexpected Unsplash response.', 502);
  }
  const results = (json as { results?: unknown[] }).results || [];
  return results
    .map((p) => {
      try {
        return normalizeUnsplashPhoto(p);
      } catch {
        return null;
      }
    })
    .filter((x): x is UnsplashNormalizedImage => Boolean(x));
}

function toPick(p: UnsplashNormalizedImage): AutoPickedImage {
  return {
    src: p.urls.regular,
    photoId: p.id,
    downloadLocation: p.downloadLocation,
    attribution: {
      text: `Photo by ${p.photographerName} on Unsplash`,
      url: addUtm(p.unsplashPageUrl),
      provider: 'unsplash',
      licenseSummary: 'Unsplash License',
    },
  };
}

/**
 * Pick the Nth most relevant Unsplash photo per slot in declared order:
 * landscape slots use the niche keyword, avatar slots (any key containing
 * "avatar") use a separate headshot keyword. Deterministic: photo[0] →
 * slotKeys[0], photo[1] → slotKeys[1], etc. Best-effort: an empty
 * `picks` map is returned on total failure rather than throwing.
 */
export async function autoPickForSlots(
  niche: string,
  slotKeys: string[],
  opts?: { avatarKeyword?: string }
): Promise<AutoPickResult> {
  const keyword = nicheToKeyword(niche);
  if (!keyword || slotKeys.length === 0) {
    return { picks: {}, unfilled: slotKeys.slice() };
  }
  const avatarKeyword = (opts?.avatarKeyword || AVATAR_DEFAULT_KEYWORD).trim();

  const landscapeSlots = slotKeys.filter((k) => !isAvatarSlot(k));
  const avatarSlots = slotKeys.filter(isAvatarSlot);

  const [landscapeRes, avatarRes] = await Promise.allSettled([
    landscapeSlots.length > 0
      ? searchUnsplash(keyword, landscapeSlots.length + 3, 'landscape')
      : Promise.resolve([] as UnsplashNormalizedImage[]),
    avatarSlots.length > 0
      ? searchUnsplash(avatarKeyword, avatarSlots.length + 3, 'squarish')
      : Promise.resolve([] as UnsplashNormalizedImage[]),
  ]);

  const picks: Record<string, AutoPickedImage> = {};
  const unfilled: string[] = [];

  const landscapePhotos = landscapeRes.status === 'fulfilled' ? landscapeRes.value : [];
  for (let i = 0; i < landscapeSlots.length; i++) {
    const photo = landscapePhotos[i];
    if (photo) picks[landscapeSlots[i]] = toPick(photo);
    else unfilled.push(landscapeSlots[i]);
  }

  const avatarPhotos = avatarRes.status === 'fulfilled' ? avatarRes.value : [];
  for (let i = 0; i < avatarSlots.length; i++) {
    const photo = avatarPhotos[i];
    if (photo) picks[avatarSlots[i]] = toPick(photo);
    else unfilled.push(avatarSlots[i]);
  }

  return { picks, unfilled };
}

/**
 * Fire-and-forget download tracking — Unsplash API guideline requires hitting
 * the photo's `downloadLocation` whenever the asset is actually used.
 */
export async function trackAutoPickDownloads(picks: Record<string, AutoPickedImage>): Promise<void> {
  const entries = Object.values(picks);
  if (entries.length === 0) return;
  await Promise.allSettled(
    entries.map((p) =>
      unsplashFetchJson(p.downloadLocation, {
        method: 'GET',
        headers: {
          'Accept-Version': 'v1',
          Authorization: `Client-ID ${getUnsplashAccessKey()}`,
        },
      })
    )
  );
}
