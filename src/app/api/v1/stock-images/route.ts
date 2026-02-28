import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export type StockImageResult = {
  id: string;
  role: string;
  url: string;
  source_page_url: string;
  provider: string;
  license_summary: string;
  attribution_text: string;
  attribution_url: string;
  notes?: string;
};

let _cache: StockImageResult[] | null = null;

function loadAllStockImages(): StockImageResult[] {
  if (_cache) return _cache;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const dir = path.resolve(process.cwd(), 'v1/assets/manifests');
  const files = fs
    .readdirSync(dir)
    .filter((f: string) => f.endsWith('.demo.json'))
    .sort();

  const results: StockImageResult[] = [];
  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(dir, file), 'utf-8');
      const parsed = JSON.parse(raw) as Record<string, StockImageResult>;
      for (const entry of Object.values(parsed)) {
        if (!entry || typeof entry !== 'object') continue;
        if (typeof entry.url !== 'string' || typeof entry.id !== 'string') continue;
        results.push(entry);
      }
    } catch {
      // Ignore malformed manifest files to keep endpoint robust.
    }
  }

  _cache = results;
  return results;
}

export async function GET(request: NextRequest) {
  try {
    const q = (request.nextUrl.searchParams.get('q') || '').trim().toLowerCase();
    const role = (request.nextUrl.searchParams.get('role') || '').trim().toLowerCase();

    let results = loadAllStockImages();

    if (role) {
      results = results.filter((r) => (r.role || '').toLowerCase() === role);
    }

    if (q) {
      results = results.filter((r) => {
        const hay = [
          r.id,
          r.role,
          r.provider,
          r.license_summary,
          r.attribution_text,
          r.source_page_url,
          r.notes || '',
        ]
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
    }

    // Keep payloads reasonable.
    const limited = results.slice(0, 60);

    return NextResponse.json({ results: limited });
  } catch (error) {
    console.error('[api/v1/stock-images] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch stock images' },
      { status: 500 }
    );
  }
}
