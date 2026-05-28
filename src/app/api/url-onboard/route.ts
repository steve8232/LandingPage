import { NextResponse, after, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/role';
import {
  makeSlug,
  rowToDTO,
  PROJECT_COLS,
  type ProjectRow,
} from '@/lib/projects/types';
import type { V1ContentOverrides } from '../../../../v1/composer/composeV1Template';
import { runUrlOnboardPipeline } from '@/lib/firecrawl/runUrlOnboardPipeline';

/**
 * POST /api/url-onboard — Lane D "already have a site" submission.
 *
 * Two-phase. The POST returns within ~1s with a project shell
 * (`build_status='building'`) so the wizard can transition to the
 * /dashboard/projects/[id]/building page immediately. The heavy lifting
 * — Firecrawl scrape, OpenAI extract, generate, enhance, neighborhood
 * expansion, Unsplash auto-pick — runs in a Next.js `after()`
 * continuation against the service-role admin client. The /building
 * page polls /api/projects/[id]/build-status until the pipeline flips
 * the row to 'ready' (or 'failed' with `build_error` set).
 *
 * Admin-only. `maxDuration` is generous because the after() work shares
 * the function's wall-clock budget with the synchronous response.
 */
export const maxDuration = 90;

/**
 * Placeholder template_id used while the URL pipeline is still picking a
 * real template. The /building page sits in front of the project so the
 * user never actually sees a plumber page; the pipeline rewrites this
 * column once extraction completes.
 */
const PLACEHOLDER_TEMPLATE_ID = 'v1-plumber';

interface RequestBody {
  url?: string;
}

/**
 * Normalize a user-typed URL. Adds an https:// scheme when missing and
 * rejects anything that doesn't parse cleanly into http(s).
 */
function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.toString();
  } catch {
    return null;
  }
}

/**
 * Initial title shown on the dashboard list while the pipeline runs.
 * The runUrlOnboardPipeline helper rewrites this to the real brand name
 * once the OpenAI extraction step picks one up.
 */
function initialTitle(url: string): string {
  try {
    return `Building ${new URL(url).hostname}…`;
  } catch {
    return 'Building new SparkPage…';
  }
}

export async function POST(request: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const url = normalizeUrl(typeof body.url === 'string' ? body.url : '');
  if (!url) {
    return NextResponse.json({ error: 'A valid URL is required' }, { status: 400 });
  }

  // Insert the project shell. The placeholder template_id is rewritten
  // once extraction picks the real one; meta.sourceUrl is the only piece
  // of state the /building page needs to confirm what's being built.
  const title = initialTitle(url);
  const slug = makeSlug(title);
  const initialOverrides: V1ContentOverrides = { meta: { sourceUrl: url } };
  const { data: project, error: projectErr } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      template_id: PLACEHOLDER_TEMPLATE_ID,
      title,
      slug,
      overrides: initialOverrides,
      creation_method: 'url',
      build_status: 'building',
      build_stage: 'Queued',
    })
    .select(PROJECT_COLS)
    .single();
  if (projectErr || !project) {
    return NextResponse.json(
      { error: projectErr?.message || 'Project insert failed' },
      { status: 500 },
    );
  }

  const projectRow = project as ProjectRow;

  // Kick off the heavy work after the response is sent. The continuation
  // shares the function's wall-clock budget (maxDuration above) but
  // doesn't keep the client waiting.
  after(async () => {
    const admin = createAdminClient();
    await runUrlOnboardPipeline(admin, {
      projectId: projectRow.id,
      userId: user.id,
      url,
    });
  });

  return NextResponse.json(
    { project: rowToDTO(projectRow) },
    { status: 201 },
  );
}
