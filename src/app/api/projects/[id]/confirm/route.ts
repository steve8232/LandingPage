import { NextResponse, after, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/role';
import { isV1Template } from '../../../../../../v1/specs';
import { runGeneratePhase } from '@/lib/firecrawl/runUrlOnboardPipeline';
import type { OnboardingState } from '@/lib/projects/types';
import type { ExtractedBusinessInfo } from '@/lib/firecrawl/extractBusinessInfo';

/**
 * GET  /api/projects/[id]/confirm
 *   Returns the persisted onboarding draft for the /confirm UI to pre-fill.
 *
 * POST /api/projects/[id]/confirm  { draft: ExtractedBusinessInfo, templateId?: string }
 *   Persists the user-edited draft, flips build_status back to 'building',
 *   and kicks off the heavy generate phase in a Next.js after() block.
 *
 * Admin-gated to match the rest of the onboarding lanes.
 */

export const maxDuration = 90;

interface ProjectRow {
  id: string;
  template_id: string;
  build_status: string | null;
  onboarding_state: OnboardingState | null;
}

const PROJECT_COLS = 'id, template_id, build_status, onboarding_state';

function sanitizeDraft(input: unknown): ExtractedBusinessInfo | null {
  if (!input || typeof input !== 'object') return null;
  const d = input as Record<string, unknown>;
  const str = (v: unknown): string => (typeof v === 'string' ? v.trim().slice(0, 800) : '');
  const num = (v: unknown): number => {
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(1, n));
  };
  const templateId = str(d.templateId);
  if (!isV1Template(templateId)) return null;
  return {
    templateId,
    templateConfidence: num(d.templateConfidence),
    brandName: str(d.brandName),
    productService: str(d.productService),
    offer: str(d.offer),
    pricing: str(d.pricing),
    cta: str(d.cta),
    uniqueValue: str(d.uniqueValue),
    customerLove: str(d.customerLove),
    streetAddress: str(d.streetAddress),
    city: str(d.city),
    state: str(d.state),
    zip: str(d.zip),
    fullAddress: str(d.fullAddress),
    phone: str(d.phone),
    email: str(d.email),
    hours: str(d.hours),
    serviceAreaText: str(d.serviceAreaText),
    yearsInBusiness: str(d.yearsInBusiness),
    licensedInsured: d.licensedInsured === true,
  };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('projects')
    .select(PROJECT_COLS)
    .eq('id', id)
    .maybeSingle<ProjectRow>();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!data.onboarding_state || !data.onboarding_state.draft) {
    return NextResponse.json({ error: 'No onboarding draft for this project' }, { status: 404 });
  }
  return NextResponse.json({
    templateId: data.template_id,
    buildStatus: data.build_status,
    state: data.onboarding_state,
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  const b = (body || {}) as { draft?: unknown };
  const draft = sanitizeDraft(b.draft);
  if (!draft) {
    return NextResponse.json({ error: 'A valid draft (with templateId) is required' }, { status: 400 });
  }

  // RLS-scoped read confirms ownership before we hand the row to the
  // admin client for the generate-phase update.
  const { data: existing } = await supabase
    .from('projects')
    .select(PROJECT_COLS)
    .eq('id', id)
    .maybeSingle<ProjectRow>();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!existing.onboarding_state) {
    return NextResponse.json({ error: 'No onboarding draft for this project' }, { status: 400 });
  }

  const admin = createAdminClient();
  const nextState: OnboardingState = { ...existing.onboarding_state, draft };
  const { error: updateErr } = await admin
    .from('projects')
    .update({
      template_id: draft.templateId,
      onboarding_state: nextState,
      build_status: 'building',
      build_stage: 'Drafting your new copy',
      build_error: null,
    })
    .eq('id', id);
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  after(async () => {
    const ad = createAdminClient();
    try {
      await runGeneratePhase(ad, { projectId: id, userId: user.id });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generate phase failed';
      console.error('[confirm] generate failed:', err);
      await ad
        .from('projects')
        .update({ build_status: 'failed', build_stage: null, build_error: message.slice(0, 1000) })
        .eq('id', id);
    }
  });

  return NextResponse.json({ ok: true });
}
