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

/**
 * Preflight reachability check. Spawning the heavy after() pipeline only
 * to find the URL is dead lands the user on the /building screen with a
 * `failed` status — fine, but a slow, frustrating way to discover a typo.
 * A 5s HEAD up front lets us return 400 immediately so the wizard's
 * inline error renders, and the user can edit the URL without losing the
 * form.
 *
 * Many sites legitimately reject HEAD (405) or block obvious bot UAs;
 * we treat anything that gets a status line at all (incl. 4xx) as
 * "reachable enough" — Firecrawl will deal with 404s. Only a network
 * error, abort, or 5xx response trips the gate.
 */
async function preflightUrl(
  url: string,
): Promise<{ ok: true } | { ok: false, reason: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'SparkPage-Preflight/1.0 (+https://sparkpage.us)',
        Accept: '*/*',
      },
    });
    if (res.status >= 500) {
      return { ok: false, reason: `Site returned ${res.status} — try again in a minute, or pick a different URL.` };
    }
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { ok: false, reason: "The site didn't respond within 5 seconds. Double-check the URL or try again later." };
    }
    return { ok: false, reason: "We couldn't reach that URL. Double-check the spelling and that the site is online." };
  } finally {
    clearTimeout(timeout);
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

  // Preflight before spending the after() budget on a dead URL.
  const preflight = await preflightUrl(url);
  if (!preflight.ok) {
    return NextResponse.json({ error: preflight.reason }, { status: 400 });
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
