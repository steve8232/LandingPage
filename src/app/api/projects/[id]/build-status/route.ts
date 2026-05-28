import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { BuildStatus } from '@/lib/projects/types';

/**
 * GET /api/projects/[id]/build-status
 *
 * Lightweight polling endpoint backing /dashboard/projects/[id]/building.
 * Returns just the columns the loading screen needs — full ProjectDTO
 * shape would force the existing dashboard read-paths to do extra
 * normalization for no reason here.
 *
 * Owner-scoped via RLS on the SELECT (same policy that gates the
 * project dashboard page); no admin gate needed because read access is
 * already constrained to the project's owner + collaborators.
 */
interface StatusRow {
  build_status: BuildStatus | null;
  build_stage: string | null;
  build_error: string | null;
  title: string;
  template_id: string;
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
    .select('build_status, build_stage, build_error, title, template_id')
    .eq('id', id)
    .maybeSingle<StatusRow>();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    status: (data.build_status ?? 'ready') as BuildStatus,
    stage: data.build_stage,
    error: data.build_error,
    title: data.title,
    templateId: data.template_id,
  });
}
