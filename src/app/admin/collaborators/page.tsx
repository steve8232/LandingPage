import { createAdminClient } from '@/lib/supabase/admin';
import CollaboratorsClient, {
  type AdminCollabRowDTO,
} from './CollaboratorsClient';

export const dynamic = 'force-dynamic';

export default async function AdminCollaboratorsPage() {
  const admin = createAdminClient();

  const [collabsRes, projectsRes, profilesRes] = await Promise.all([
    admin
      .from('project_collaborators')
      .select('project_id, user_id, role, added_by, added_at')
      .order('added_at', { ascending: false }),
    admin.from('projects').select('id, title, slug'),
    admin.from('profiles').select('user_id, email'),
  ]);

  const collabs = (collabsRes.data ?? []) as Array<{
    project_id: string;
    user_id: string;
    role: 'viewer' | 'editor';
    added_by: string | null;
    added_at: string;
  }>;
  const projectById = new Map(
    ((projectsRes.data ?? []) as Array<{ id: string; title: string; slug: string }>).map(
      (p) => [p.id, p]
    )
  );
  const emailById = new Map(
    ((profilesRes.data ?? []) as Array<{ user_id: string; email: string | null }>).map(
      (p) => [p.user_id, p.email]
    )
  );

  const rows: AdminCollabRowDTO[] = collabs.map((c) => {
    const proj = projectById.get(c.project_id);
    return {
      projectId: c.project_id,
      projectTitle: proj?.title ?? '(deleted page)',
      userId: c.user_id,
      userEmail: emailById.get(c.user_id) ?? null,
      role: c.role,
      addedBy: c.added_by,
      addedByEmail: c.added_by ? emailById.get(c.added_by) ?? null : null,
      addedAt: c.added_at,
    };
  });

  return <CollaboratorsClient initialRows={rows} />;
}
