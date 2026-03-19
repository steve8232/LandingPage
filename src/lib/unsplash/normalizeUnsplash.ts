import type { UnsplashNormalizedImage } from './types';

// Minimal runtime guards/helpers (we avoid pulling in a schema lib).
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function asString(v: unknown): string | null {
  return typeof v === 'string' ? v : null;
}

function asNumber(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

export function normalizeUnsplashPhoto(photo: unknown): UnsplashNormalizedImage {
  if (!isRecord(photo)) throw new Error('Invalid Unsplash photo payload');

  const id = asString(photo.id);
  const width = asNumber(photo.width);
  const height = asNumber(photo.height);
  const description = asString(photo.description) ?? asString(photo.alt_description);
  const color = asString(photo.color);

  const urls = isRecord(photo.urls) ? photo.urls : null;
  const thumb = urls ? asString(urls.thumb) : null;
  const small = urls ? asString(urls.small) : null;
  const regular = urls ? asString(urls.regular) : null;

  const user = isRecord(photo.user) ? photo.user : null;
  const photographerName = user ? asString(user.name) : null;
  const userLinks = user && isRecord(user.links) ? user.links : null;
  const photographerProfileUrl = userLinks ? asString(userLinks.html) : null;

  const links = isRecord(photo.links) ? photo.links : null;
  const unsplashPageUrl = links ? asString(links.html) : null;
  const downloadLocation = links ? asString(links.download_location) : null;

  if (!id || !width || !height || !thumb || !small || !regular) {
    throw new Error('Unsplash photo missing required fields');
  }
  if (!photographerName || !photographerProfileUrl || !unsplashPageUrl || !downloadLocation) {
    throw new Error('Unsplash photo missing attribution/download fields');
  }

  return {
    id,
    description,
    width,
    height,
    color,
    urls: { thumb, small, regular },
    photographerName,
    photographerProfileUrl,
    unsplashPageUrl,
    downloadLocation,
  };
}
