import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentRole } from '@/lib/auth/role';
import type { BuildStatus, OnboardingState } from '@/lib/projects/types';
import ConfirmClient from './ConfirmClient';

export const dynamic = 'force-dynamic';

/**
 * /dashboard/projects/[id]/confirm — review-and-edit gate that sits
 * between the URL/Describe extract phase and the heavy generate phase.
 *
 * Server responsibilities:
 *   • auth + admin gate (mirrors the rest of the onboarding lanes)
 *   • read the persisted onboarding_state so the form is pre-filled
 *     on first paint (no flash of empty inputs)
 *   • short-circuit redirects for rows that haven't reached the gate
 *     yet, settled past it, or were never gated to begin with
 */
interface Row {
  id: string;
  title: string;
  template_id: string;
  build_status: BuildStatus | null;
  onboarding_state: OnboardingState | null;
}

export default async function ConfirmPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const [{ data: { user } }, { role }] = await Promise.all([
    supabase.auth.getUser(),
    getCurrentRole(),
  ]);
  if (!user) redirect(`/login?next=/dashboard/projects/${id}/confirm`);
  if (role !== 'admin') redirect(`/dashboard/projects/${id}`);

  const { data: row } = await supabase
    .from('projects')
    .select('id, title, template_id, build_status, onboarding_state')
    .eq('id', id)
    .maybeSingle<Row>();
  if (!row) redirect('/dashboard');

  const status = (row.build_status ?? 'ready') as BuildStatus;
  // Still scraping/extracting — send back to the waiting room.
  if (status === 'building') {
    redirect(`/dashboard/projects/${id}/building`);
  }
  // Extract already failed — let the recovery UI on /building handle it.
  if (status === 'failed') {
    redirect(`/dashboard/projects/${id}/building`);
  }
  // Already past the gate — drop into the editor.
  if (status === 'ready') {
    redirect(`/?project=${id}`);
  }
  if (!row.onboarding_state || !row.onboarding_state.draft) {
    // Status says awaiting_confirm but no draft persisted — defensive.
    redirect(`/dashboard/projects/${id}/building`);
  }

  return (
    <ConfirmClient
      projectId={row.id}
      projectTitle={row.title}
      templateId={row.template_id}
      state={row.onboarding_state}
    />
  );
}
