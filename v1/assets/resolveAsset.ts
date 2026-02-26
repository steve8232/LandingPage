/**
 * resolveAsset — Demo asset resolver for v1 templates
 *
 * If `assetId` starts with "demo-", look it up in the matching manifest
 * and return the remote URL + attribution.  Otherwise return a local path.
 *
 * The resolver loads manifests lazily and caches them for the lifetime of
 * the process (fine for build scripts and server-side rendering).
 *
 * Usage:
 *   import { resolveAsset } from '../assets/resolveAsset';
 *   const { src, attribution } = resolveAsset('demo-saas-modern-light-hero-01');
 *   // src → "https://images.pexels.com/photos/546819/…"
 *   // attribution → { text: 'Photo by …', url: '…' }
 *
 *   const result = resolveAsset('/v1/assets/placeholders/logo.svg');
 *   // result.src → "/v1/assets/placeholders/logo.svg" (passthrough)
 */

import fs from 'fs';
import path from 'path';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface DemoAssetEntry {
  id: string;
  role: string;
  url: string;
  source_page_url: string;
  provider: string;
  license_summary: string;
  attribution_text: string;
  attribution_url: string;
  notes: string;
}

export type DemoManifest = Record<string, DemoAssetEntry>;

export interface ResolvedAsset {
  src: string;
  attribution?: { text: string; url: string };
}

// ── Manifest cache ─────────────────────────────────────────────────────────────

const manifestCache: Record<string, DemoManifest> = {};

/**
 * Dynamically resolve manifest file name from the asset ID prefix.
 *
 * ID format: "demo-{styleId}-{role}-{seq}"
 * e.g. "demo-saas-modern-light-hero-01" → styleId = "saas-modern-light"
 *
 * The resolver strips "demo-" prefix, then strips the last two segments
 * (role + seq) to derive the styleId, then maps to "{styleId}.demo.json".
 */
function manifestFileForId(assetId: string): string | null {
  // "demo-saas-modern-light-hero-01" → ["demo","saas","modern","light","hero","01"]
  const parts = assetId.split('-');
  if (parts.length < 4 || parts[0] !== 'demo') return null;
  // Remove "demo" prefix and last 2 segments (role + seq)
  const styleId = parts.slice(1, -2).join('-');
  return `${styleId}.demo.json`;
}

function getManifest(manifestFile: string): DemoManifest | null {
  if (manifestCache[manifestFile]) return manifestCache[manifestFile];

  try {
    const filePath = path.resolve(
      process.cwd(),
      'v1/assets/manifests',
      manifestFile
    );
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as DemoManifest;
    manifestCache[manifestFile] = parsed;
    return parsed;
  } catch {
    console.warn(`[resolveAsset] Could not load manifest: ${manifestFile}`);
    return null;
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Resolve an asset ID to a URL + optional attribution.
 *
 * - Demo IDs (starting with "demo-") → remote URL + attribution from manifest
 * - Everything else → returned as-is (assumed to be a local path or URL)
 * - If a demo ID is not found, returns `fallback` (or a generic placeholder).
 */
export function resolveAsset(
  assetId: string,
  fallback?: string
): ResolvedAsset {
  if (!assetId.startsWith('demo-')) {
    return { src: assetId };
  }

  const manifestFile = manifestFileForId(assetId);
  if (!manifestFile) {
    return { src: fallback || `/v1/assets/placeholders/${assetId}.svg` };
  }

  const manifest = getManifest(manifestFile);
  if (manifest && manifest[assetId]) {
    const entry = manifest[assetId];
    return {
      src: entry.url,
      attribution: {
        text: entry.attribution_text,
        url: entry.source_page_url,
      },
    };
  }

  return { src: fallback || `/v1/assets/placeholders/${assetId}.svg` };
}

/**
 * Return full attribution entries for all demo assets used.
 * Useful for rendering credit footers.
 */
export function getDemoAttributions(assetIds: string[]): DemoAssetEntry[] {
  const results: DemoAssetEntry[] = [];

  for (const id of assetIds) {
    if (!id.startsWith('demo-')) continue;
    const manifestFile = manifestFileForId(id);
    if (!manifestFile) continue;
    const manifest = getManifest(manifestFile);
    if (manifest && manifest[id]) {
      results.push(manifest[id]);
    }
  }

  return results;
}

