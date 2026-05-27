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
import { postMyBusinessInfoTask } from '@/lib/dataforseo/client';
import {
  buildPostbackUrl,
  getWebhookToken,
  queueSupplementalResearchTasks,
} from '@/lib/dataforseo/research';
import {
  chatAnswersToKeyword,
  chatAnswersToOverrides,
  type ChatAnswers,
  type ChatHoursPreset,
} from '@/lib/chat/normalize';

/**
 * POST /api/chat — Lane C "describe my business" submission.
 *
 * Creates a project (`creation_method='chat'`) seeded with the chat answers
 * baked straight into `overrides.meta`. Once the project exists, we make a
 * best-effort attempt to queue a research lookup in the background using
 * the user's name + location; on success a dataforseo_research row is
 * persisted so the Research tab on the project surfaces the postback
 * once it lands. Research failure never blocks project creation —
 * the chat answers alone are enough to render a usable page.
 *
 * Admin-only; mirrors /api/research for the auth + DB-write order.
 */

interface RequestBody {
  templateId?: string;
  businessName?: string;
  location?: string;
  phone?: string;
  services?: string;
  serviceArea?: string;
  yearsInBusiness?: number | null;
  hoursPreset?: ChatHoursPreset;
  customHours?: string;
}

const VALID_HOURS_PRESETS: ChatHoursPreset[] = ['standard', 'twentyfour-seven', 'weekends', 'custom'];

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

  const templateId   = typeof body.templateId === 'string' ? body.templateId : '';
  const businessName = typeof body.businessName === 'string' ? body.businessName.trim() : '';
  const location     = typeof body.location === 'string' ? body.location.trim() : '';
  const phone        = typeof body.phone === 'string' ? body.phone.trim() : '';
  const services     = typeof body.services === 'string' ? body.services.trim() : '';
  const serviceArea  = typeof body.serviceArea === 'string' ? body.serviceArea.trim() : '';
  const customHours  = typeof body.customHours === 'string' ? body.customHours.trim() : '';
  const yearsRaw     = body.yearsInBusiness;
  const yearsInBusiness =
    typeof yearsRaw === 'number' && Number.isFinite(yearsRaw) && yearsRaw > 0
      ? Math.floor(yearsRaw)
      : null;
  const hoursPreset: ChatHoursPreset =
    VALID_HOURS_PRESETS.includes(body.hoursPreset as ChatHoursPreset)
      ? (body.hoursPreset as ChatHoursPreset)
      : 'standard';

  if (!templateId || !isV1Template(templateId)) {
    return NextResponse.json({ error: 'Unknown templateId' }, { status: 400 });
  }
  if (!businessName) {
    return NextResponse.json({ error: 'businessName is required' }, { status: 400 });
  }
  if (!location) {
    return NextResponse.json({ error: 'location is required' }, { status: 400 });
  }

  const answers: ChatAnswers = {
    templateId, businessName, location, phone, services, serviceArea,
    yearsInBusiness, hoursPreset, customHours,
  };
  const overrides = chatAnswersToOverrides(answers);
  const slug = makeSlug(businessName);

  // 1) Create the project. RLS-respecting client; admin gate above grants
  //    projects_admin_insert.
  const { data: project, error: projectErr } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      template_id: templateId,
      title: businessName,
      slug,
      overrides,
      business_phone: phone || null,
      creation_method: 'chat',
    })
    .select(PROJECT_COLS)
    .single();
  if (projectErr || !project) {
    return NextResponse.json(
      { error: projectErr?.message || 'Project insert failed' },
      { status: 500 },
    );
  }

  await supabase.from('project_revisions').insert({
    project_id: (project as ProjectRow).id,
    overrides,
    created_by: user.id,
  });

  // 2) Best-effort background research. Any failure is swallowed — the chat
  //    answers are sufficient on their own; research, when it lands, will
  //    show up on the Research tab as a merge candidate.
  const keyword = chatAnswersToKeyword(answers);
  let researchId: string | null = null;
  let taskId: string | null = null;
  if (keyword) {
    try {
      const token = getWebhookToken();
      const postbackUrl = buildPostbackUrl(request.nextUrl.origin, token);
      const out = await postMyBusinessInfoTask({ keyword, locationName: location, postbackUrl });
      taskId = out.taskId;
      const admin = createAdminClient();
      const { data: research, error: researchErr } = await admin
        .from('dataforseo_research')
        .insert({
          project_id: (project as ProjectRow).id,
          task_id: taskId,
          task_kind: 'my_business_info',
          status: 'pending',
          keyword,
          location_name: location,
          language_code: 'en',
        })
        .select('id')
        .single();
      if (researchErr) {
        console.error('[api/chat.POST] research insert failed (non-fatal):', researchErr);
      } else {
        researchId = research?.id ?? null;
      }
      // Supplemental Reviews + Q&A — best-effort, non-fatal.
      await queueSupplementalResearchTasks(admin, {
        projectId: (project as ProjectRow).id,
        keyword,
        locationName: location || null,
        languageCode: 'en',
        postbackUrl,
      });
    } catch (err) {
      console.error('[api/chat.POST] research queue failed (non-fatal):', err);
    }
  }

  return NextResponse.json(
    { project: rowToDTO(project as ProjectRow), researchId, taskId },
    { status: 201 },
  );
}
