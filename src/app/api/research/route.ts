import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isV1Template } from '../../../../v1/specs';
import {
  makeSlug,
  rowToDTO,
  PROJECT_COLS,
  type ProjectRow,
} from '@/lib/projects/types';
import { requireAdmin } from '@/lib/auth/role';
import {
  DataForSEOAuthError,
  DataForSEOError,
  postMyBusinessInfoTask,
} from '@/lib/dataforseo/client';
import {
  buildPostbackUrl,
  getWebhookToken,
  queueSupplementalResearchTasks,
} from '@/lib/dataforseo/research';

/**
 * POST /api/research — admin-only Lane B project creation.
 *
 * Steps (ordered so a DataForSEO failure never leaves an orphan project):
 *   1. Validate templateId + keyword.
 *   2. Queue postMyBusinessInfoTask() with a path-token postback URL.
 *      If that fails, abort before any DB write.
 *   3. Insert projects row (creation_method='research') + initial revision.
 *   4. Insert dataforseo_research row with the returned task_id (status='pending').
 *      Uses the service-role admin client because the table has no INSERT
 *      RLS policy (mirrors leads / calls — see migration 0017).
 *
 * The webhook /api/webhooks/dataforseo/[token] later flips the row to 'ready'
 * with the raw payload; the review screen reads from there.
 */

interface RequestBody {
  templateId?: string;
  /** Project title (also default keyword when `keyword` is omitted). */
  title?: string;
  /** Free-form search keyword for DataForSEO — e.g. "Business Name City State". */
  keyword?: string;
  /** Defaults to "United States" if omitted. */
  locationName?: string;
  /** ISO-639-1 language code, defaults to 'en'. */
  languageCode?: string;
  /** Mapbox-confirmed street line (optional). */
  streetAddress?: string;
  /** Mapbox `context.place.name` (optional). */
  city?: string;
  /** Mapbox `context.region.name` (optional). */
  region?: string;
  /** Raw 10-digit US phone, normalized client-side (optional). */
  phone?: string;
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

  const templateId = typeof body.templateId === 'string' ? body.templateId : '';
  const titleInput = typeof body.title === 'string' ? body.title.trim() : '';
  const keywordInput = typeof body.keyword === 'string' ? body.keyword.trim() : '';
  const locationName = typeof body.locationName === 'string' ? body.locationName.trim() : '';
  const languageCode = typeof body.languageCode === 'string' ? body.languageCode.trim() : '';
  const streetAddress = typeof body.streetAddress === 'string' ? body.streetAddress.trim() : '';
  const city = typeof body.city === 'string' ? body.city.trim() : '';
  const region = typeof body.region === 'string' ? body.region.trim() : '';
  // Phone arrives raw 10-digit from the wizard; defensively re-strip in case
  // a future caller posts a formatted string.
  const phone = typeof body.phone === 'string' ? body.phone.replace(/\D/g, '').slice(0, 10) : '';

  if (!templateId || !isV1Template(templateId)) {
    return NextResponse.json({ error: 'Unknown templateId' }, { status: 400 });
  }
  const keyword = keywordInput || titleInput;
  if (!keyword) {
    return NextResponse.json({ error: 'keyword or title is required' }, { status: 400 });
  }

  // Resolve the webhook config up-front so misconfigured deployments fail
  // before we spend a DataForSEO credit.
  let postbackUrl: string;
  try {
    const token = getWebhookToken();
    postbackUrl = buildPostbackUrl(request.nextUrl.origin, token);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook misconfigured';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // 1) Queue the DataForSEO task. No DB writes yet — abort cleanly on failure.
  let taskId: string;
  try {
    const out = await postMyBusinessInfoTask({
      keyword,
      locationName: locationName || undefined,
      languageCode: languageCode || undefined,
      postbackUrl,
    });
    taskId = out.taskId;
  } catch (err) {
    if (err instanceof DataForSEOAuthError) {
      return NextResponse.json({ error: 'Research lookup auth failed' }, { status: 502 });
    }
    if (err instanceof DataForSEOError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 502 },
      );
    }
    const message = err instanceof Error ? err.message : 'Research lookup failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // 2) Insert the project. RLS-respecting client — the caller is an admin per
  // requireAdmin(), so projects_admin_insert allows the row.
  const title = titleInput || keyword;
  const slug = makeSlug(title);
  // Pre-seed overrides with anything the user typed in the wizard so the
  // page reflects their values from the first revision. DataForSEO's
  // postback later layers on top (without clobbering, see normalize.ts).
  const meta: Record<string, string> = {};
  if (titleInput) meta.businessName = titleInput;
  if (phone) meta.businessPhone = phone;
  const addressLine = [streetAddress, [city, region].filter(Boolean).join(', ')]
    .filter(Boolean)
    .join(', ');
  if (addressLine) meta.businessAddress = addressLine;
  const overrides = Object.keys(meta).length ? { meta } : {};
  const { data: project, error: projectErr } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      template_id: templateId,
      title,
      slug,
      overrides,
      business_phone: phone || null,
      creation_method: 'research',
    })
    .select(PROJECT_COLS)
    .single();
  if (projectErr || !project) {
    return NextResponse.json(
      { error: projectErr?.message || 'Project insert failed' },
      { status: 500 },
    );
  }

  // Best-effort initial revision so history is non-empty from day one.
  await supabase.from('project_revisions').insert({
    project_id: project.id,
    overrides,
    created_by: user.id,
  });

  // 3) Insert the primary research row via service-role (no INSERT policy on
  //    the table). Reviews + Q&A rows are queued best-effort after this.
  const admin = createAdminClient();
  const { data: research, error: researchErr } = await admin
    .from('dataforseo_research')
    .insert({
      project_id: project.id,
      task_id: taskId,
      task_kind: 'my_business_info',
      status: 'pending',
      keyword,
      location_name: locationName || null,
      language_code: languageCode || 'en',
    })
    .select('id')
    .single();
  if (researchErr) {
    console.error('[api/research.POST] research insert failed:', researchErr);
    return NextResponse.json(
      { error: researchErr.message, project: rowToDTO(project as ProjectRow) },
      { status: 500 },
    );
  }

  // 4) Best-effort: queue Reviews + Q&A. Failures are non-fatal — the page
  //    can still ship without supplementals; missing kinds just degrade the
  //    AI prompt grounding for that listing.
  await queueSupplementalResearchTasks(admin, {
    projectId: project.id,
    keyword,
    locationName: locationName || null,
    languageCode: languageCode || 'en',
    postbackUrl,
  });

  return NextResponse.json(
    {
      project: rowToDTO(project as ProjectRow),
      researchId: research?.id ?? null,
      taskId,
    },
    { status: 201 },
  );
}
