import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { BuildStatus } from '@/lib/projects/types';
import BuildingClient from './BuildingClient';

export const dynamic = 'force-dynamic';

/**
 * /dashboard/projects/[id]/building — async-pipeline waiting room.
 *
 * Shown immediately after the URL-onboarding POST returns its project
 * shell. The Next.js `after()` continuation kicked off by that route
 * runs scrape -> extract -> generate -> enhance -> autoPick on the
 * service-role admin client; this page polls /api/projects/[id]/build-status
 * until the row flips to 'ready' (then redirects into the project) or
 * 'failed' (shows the captured error).
 *
 * Bookmarkable: on refresh after the build has settled, the server-side
 * status check short-circuits straight to the project dashboard.
 */
interface StatusRow {
  id: string;
  build_status: BuildStatus | null;
  build_stage: string | null;
  build_error: string | null;
}

export default async function BuildingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/dashboard/projects/${id}/building`);

  const { data: row } = await supabase
    .from('projects')
    .select('id, build_status, build_stage, build_error')
    .eq('id', id)
    .maybeSingle<StatusRow>();
  if (!row) redirect('/dashboard');

  // Already finished — bounce straight into the editor so the user never
  // sees the spinner on a refresh. The home page handles the project=<id>
  // query param by loading the project and dropping into PreviewDownload.
  if ((row.build_status ?? 'ready') === 'ready') {
    redirect(`/?project=${id}`);
  }

  return (
    <BuildingClient
      projectId={row.id}
      initialStatus={(row.build_status ?? 'building') as BuildStatus}
      initialStage={row.build_stage}
      initialError={row.build_error}
    />
  );
}
