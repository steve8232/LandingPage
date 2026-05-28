import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentRole } from '@/lib/auth/role';
import type { CreationMethod } from '@/lib/projects/types';
import ResearchReviewClient, { type ProjectLite } from './ResearchReviewClient';

export const dynamic = 'force-dynamic';

/**
 * /dashboard/projects/[id]/research — review screen for Lane B drafts.
 *
 * Server-side concerns:
 *   • auth + project ownership check (RLS scopes the project SELECT)
 *   • admin gate for the page (only admins can apply research → overrides)
 *
 * The research row itself is loaded client-side via GET /api/projects/[id]/research
 * so the postback poll can re-query without a full page reload.
 */
export default async function ResearchReviewPage({
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
  if (!user) redirect(`/login?next=/dashboard/projects/${id}/research`);
  if (role !== 'admin') redirect(`/dashboard/projects/${id}`);

  const { data: project } = await supabase
    .from('projects')
    .select('id, title, slug, subdomain, custom_domain, creation_method')
    .eq('id', id)
    .maybeSingle<{
      id: string;
      title: string;
      slug: string;
      subdomain: string | null;
      custom_domain: string | null;
      creation_method: CreationMethod;
    }>();
  if (!project) redirect('/dashboard');

  const lite: ProjectLite = {
    id: project.id,
    title: project.title,
    slug: project.slug,
    subdomain: project.subdomain,
    customDomain: project.custom_domain,
    creationMethod: project.creation_method,
  };

  return <ResearchReviewClient project={lite} userEmail={user.email ?? ''} />;
}
