import { redirect } from 'next/navigation';
import { getCurrentRole } from '@/lib/auth/role';
import AdminShell from './AdminShell';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, email, role } = await getCurrentRole();
  if (!userId) redirect('/login?next=/admin/users');
  if (role !== 'admin') redirect('/dashboard');

  return <AdminShell userEmail={email ?? ''}>{children}</AdminShell>;
}
