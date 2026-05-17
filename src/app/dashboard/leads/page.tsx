import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { leadRowToDTO, type LeadRow } from '@/lib/leads/types';
import LeadsClient from './LeadsClient';

export const dynamic = 'force-dynamic';

/**
 * /dashboard/leads — owner-scoped lead viewer.
 *
 * RLS (leads_owner_select) restricts the SELECT to projects this user owns,
 * so the anon-keyed createClient() is sufficient. We co-fetch the project
 * title map so the table can label each row without a join.
 */
export default async function LeadsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/dashboard/leads');
  }

  const [leadsRes, projectsRes] = await Promise.all([
    supabase
      .from('leads')
      .select('id, project_id, payload, user_agent, referer, ip, created_at')
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('projects')
      .select('id, title, slug')
      .order('updated_at', { ascending: false }),
  ]);

  const leads = ((leadsRes.data ?? []) as LeadRow[]).map(leadRowToDTO);
  const projects = (projectsRes.data ?? []) as Array<{ id: string; title: string; slug: string }>;

  const loadError =
    leadsRes.error?.message || projectsRes.error?.message || '';

  return (
    <Suspense fallback={null}>
      <LeadsClient
        initialLeads={leads}
        projects={projects}
        userEmail={user.email ?? ''}
        loadError={loadError}
      />
    </Suspense>
  );
}
