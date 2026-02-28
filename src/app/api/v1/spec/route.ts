import { NextRequest, NextResponse } from 'next/server';

import { getV1Spec, isV1Template } from '../../../../../v1/specs/index';
import { resolveAsset } from '../../../../../v1/assets/resolveAsset';

export const runtime = 'nodejs';

// Inline local SVG placeholders so the editor can show thumbnails even though
// /v1/assets/* is not served as a static path in the Next app.
const svgDataUriCache = new Map<string, string>();

function inlineLocalSvgIfPossible(src: string): string {
  if (!src.startsWith('/v1/assets/')) return src;
  if (svgDataUriCache.has(src)) return svgDataUriCache.get(src)!;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs') as typeof import('fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path') as typeof import('path');
    const relativePath = src.replace(/^\//, ''); // "/v1/assets/..." -> "v1/assets/..."
    const filePath = path.resolve(process.cwd(), relativePath);
    const svg = fs.readFileSync(filePath, 'utf-8');
    const b64 = Buffer.from(svg, 'utf-8').toString('base64');
    const dataUri = `data:image/svg+xml;base64,${b64}`;
    svgDataUriCache.set(src, dataUri);
    return dataUri;
  } catch {
    return src;
  }
}

function getFallbackForAssetKey(key: string, assets: Record<string, string>): string | undefined {
  if (key.startsWith('fallback')) return undefined;
  const cap = key.length > 0 ? key[0].toUpperCase() + key.slice(1) : key;
  const candidates = [`fallback${cap}`, `fallback-${key}`];
  for (const c of candidates) {
    if (c in assets && typeof assets[c] === 'string') return assets[c];
  }
  return undefined;
}

export async function GET(request: NextRequest) {
  try {
    const templateId = request.nextUrl.searchParams.get('templateId') || '';
    if (!templateId) {
      return NextResponse.json({ error: 'templateId is required' }, { status: 400 });
    }
    if (!isV1Template(templateId)) {
      return NextResponse.json({ error: `Not a v1 template: ${templateId}` }, { status: 400 });
    }

    const spec = getV1Spec(templateId);
    if (!spec) {
      return NextResponse.json({ error: `No spec found for: ${templateId}` }, { status: 404 });
    }

    // Resolve the default asset map so the editor can show image thumbnails.
    // NOTE: this intentionally mirrors the v1 composer asset-resolution logic,
    // but does not compose full HTML.
    const resolvedAssets: Record<string, string> = {};
    for (const [key, value] of Object.entries(spec.assets || {})) {
      if (typeof value !== 'string') continue;

      if (value.startsWith('data:') || value.startsWith('http://') || value.startsWith('https://')) {
        resolvedAssets[key] = value;
      } else if (value.startsWith('demo-')) {
        const fallback = getFallbackForAssetKey(key, spec.assets);
        resolvedAssets[key] = resolveAsset(value, fallback).src;
      } else {
        resolvedAssets[key] = resolveAsset(value).src;
      }

      resolvedAssets[key] = inlineLocalSvgIfPossible(resolvedAssets[key]);
    }

    // Editor-only helper endpoint: returns default section props so the client can
    // display effective values (spec defaults + overrides) without parsing HTML.
    return NextResponse.json({
      templateId: spec.templateId,
      version: spec.version,
      category: spec.category,
      goal: spec.goal,
      theme: spec.theme,
      metadata: spec.metadata,
      sections: spec.sections,
      assets: spec.assets,
      resolvedAssets,
    });
  } catch (error) {
    console.error('[api/v1/spec] Error fetching spec:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch v1 spec' },
      { status: 500 }
    );
  }
}
