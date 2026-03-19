export type UnsplashOrientation = 'landscape' | 'portrait' | 'squarish';

export interface UnsplashNormalizedImage {
  id: string;
  description: string | null;
  width: number;
  height: number;
  color?: string | null;
  urls: {
    thumb: string;
    small: string;
    regular: string;
  };
  photographerName: string;
  photographerProfileUrl: string;
  unsplashPageUrl: string;
  /** Call this URL (server-side) to comply with Unsplash download tracking. */
  downloadLocation: string;
}

export interface UnsplashSearchResponse {
  images: UnsplashNormalizedImage[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}
