import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  PROJECT_COLS,
  rowToDTO,
  type ProjectRow,
} from '@/lib/projects/types';
import { getV1Spec, isV1Template } from '../../../../../../v1/specs/index';
import type {
  V1ContentOverrides,
  V1ImageAttribution,
  V1MetaOverrides,
} from '../../../../../../v1/composer/composeV1Template';
import {
  autoPickForSlots,
  trackAutoPickDownloads,
} from '@/lib/unsplash/autoPickForSlots';
import { UnsplashError } from '@/lib/unsplash/unsplashFetch';

export const runtime = 'nodejs';

/**
 * POST /api/projects/[id]/auto-images
 *   Owner-gated (via RLS read of the row). Picks the top-N most relevant
 *   Unsplash photos for the project's niche and writes them into
 *   overrides.assets + overrides.meta.imageAttributions. Fires Unsplash
 *   download tracking for each photo selected.
 *
 *   Body (all optional):
 *     - force: boolean — when true, re-picks every slot. Default false: only
 *       fills slots still pointing at a `demo-*` value (i.e. untouched).
 */

interface AutoImagesBody {
  force?: boolean;
}

function isDemoPlaceholder(v: string | undefined): boolean {
  return typeof v === 'string' && v.startsWith('demo-');
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: AutoImagesBody = {};
  try {
    body = (await request.json()) as AutoImagesBody;
  } catch {
    // Empty body is fine — falls back to defaults.
  }
  const force = body.force === true;

  // RLS gates this read; non-owners get `null` here and we return 404.
  const { data: projectRow } = await supabase
    .from('projects')
    .select(PROJECT_COLS)
    .eq('id', id)
    .maybeSingle();
  if (!projectRow) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const project = projectRow as ProjectRow;

  if (!isV1Template(project.template_id)) {
    return NextResponse.json({ error: 'Project is not a v1 template' }, { status: 400 });
  }
  const spec = getV1Spec(project.template_id);
  if (!spec) {
    return NextResponse.json({ error: 'Template spec not found' }, { status: 404 });
  }
  const niche = (spec.niche || '').trim();
  if (!niche) {
    return NextResponse.json({ error: 'Template has no niche to search on' }, { status: 400 });
  }

  // Candidate slot keys: spec.assets entries whose default value is a
  // `demo-*` placeholder. This cleanly excludes fallback*, logo, avatar.
  const overrides: V1ContentOverrides = (project.overrides || {}) as V1ContentOverrides;
  const currentAssets = overrides.assets || {};
  const candidateKeys = Object.entries(spec.assets || {})
    .filter(([, v]) => isDemoPlaceholder(v))
    .map(([k]) => k);

  // Skip slots the user has already replaced with a non-demo override
  // (unless `force` is set).
  const slotKeys = force
    ? candidateKeys
    : candidateKeys.filter((k) => {
        const override = currentAssets[k];
        return !override || isDemoPlaceholder(override);
      });

  if (slotKeys.length === 0) {
    return NextResponse.json({ project: rowToDTO(project), picks: {}, unfilled: [] });
  }

  let result;
  try {
    result = await autoPickForSlots(niche, slotKeys);
  } catch (err) {
    if (err instanceof UnsplashError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }

  // Best-effort: track downloads for picked photos. Don't block on failures.
  await trackAutoPickDownloads(result.picks);

  // Merge into overrides.
  const nextAssets: Record<string, string> = { ...currentAssets };
  const meta: V1MetaOverrides = { ...((overrides.meta || {}) as V1MetaOverrides) };
  const imageAttributions: Record<string, V1ImageAttribution> = {
    ...((meta.imageAttributions || {}) as Record<string, V1ImageAttribution>),
  };
  for (const [key, pick] of Object.entries(result.picks)) {
    nextAssets[key] = pick.src;
    imageAttributions[key] = pick.attribution;
  }
  meta.imageAttributions = imageAttributions;
  const nextOverrides: V1ContentOverrides = {
    ...overrides,
    assets: nextAssets,
    meta,
  };

  const admin = createAdminClient();
  const { data: updated, error: updateErr } = await admin
    .from('projects')
    .update({ overrides: nextOverrides })
    .eq('id', id)
    .select(PROJECT_COLS)
    .single();
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  return NextResponse.json({
    project: rowToDTO(updated as ProjectRow),
    picks: result.picks,
    unfilled: result.unfilled,
  });
}
