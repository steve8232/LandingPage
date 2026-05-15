import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { rowToDTO, type ProjectRow } from '@/lib/projects/types';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/dashboard');
  }

  const { data, error } = await supabase
    .from('projects')
    .select('id, user_id, template_id, title, slug, overrides, created_at, updated_at')
    .order('updated_at', { ascending: false });

  const projects = error ? [] : ((data ?? []) as ProjectRow[]).map(rowToDTO);

  return (
    <DashboardClient
      initialProjects={projects}
      userEmail={user.email ?? ''}
      loadError={error?.message ?? ''}
    />
  );
}
