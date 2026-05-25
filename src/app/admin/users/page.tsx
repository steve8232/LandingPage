import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentRole } from '@/lib/auth/role';
import UsersClient, { type AdminUserRowDTO } from './UsersClient';

export const dynamic = 'force-dynamic';

interface ProfileRow {
  user_id: string;
  email: string | null;
  role: 'admin' | 'user';
  created_at: string;
}

export default async function AdminUsersPage() {
  // Layout already gated; getCurrentRole is just for the "me" highlight.
  const [{ userId: meId }, admin] = await Promise.all([
    getCurrentRole(),
    Promise.resolve(createAdminClient()),
  ]);

  const [profilesRes, projectsRes, collabRes] = await Promise.all([
    admin
      .from('profiles')
      .select('user_id, email, role, created_at')
      .order('created_at', { ascending: false }),
    admin.from('projects').select('user_id'),
    admin.from('project_collaborators').select('user_id'),
  ]);

  const profiles = (profilesRes.data ?? []) as ProfileRow[];
  const ownedCount = new Map<string, number>();
  for (const r of (projectsRes.data ?? []) as Array<{ user_id: string }>) {
    ownedCount.set(r.user_id, (ownedCount.get(r.user_id) ?? 0) + 1);
  }
  const collabCount = new Map<string, number>();
  for (const r of (collabRes.data ?? []) as Array<{ user_id: string }>) {
    collabCount.set(r.user_id, (collabCount.get(r.user_id) ?? 0) + 1);
  }

  const totalAdmins = profiles.filter((p) => p.role === 'admin').length;
  const users: AdminUserRowDTO[] = profiles.map((p) => ({
    userId: p.user_id,
    email: p.email,
    role: p.role,
    createdAt: p.created_at,
    ownedCount: ownedCount.get(p.user_id) ?? 0,
    collabCount: collabCount.get(p.user_id) ?? 0,
  }));

  return (
    <UsersClient
      initialUsers={users}
      currentUserId={meId ?? ''}
      totalAdmins={totalAdmins}
    />
  );
}
