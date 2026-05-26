import { redirect } from 'next/navigation';
import { getCurrentRole } from '@/lib/auth/role';
import ResearchWizardClient from './ResearchWizardClient';

export const dynamic = 'force-dynamic';

/**
 * /dashboard/new/research — Lane B wizard entry.
 *
 * Admins pick a template + enter a business name + location. The submit
 * handler in the client component POSTs /api/research, which queues a
 * DataForSEO Google Business Profile lookup and creates the project with
 * creation_method='research'. The user is then redirected into the project
 * dashboard while the postback fills in the research row.
 *
 * Non-admins are bounced to /dashboard — the marketing gate on '/' covers
 * the manual flow's redirect, and we mirror that here.
 */
export default async function ResearchWizardPage() {
  const { userId, role } = await getCurrentRole();
  if (!userId) redirect('/login?next=/dashboard/new/research');
  if (role !== 'admin') redirect('/dashboard');

  return <ResearchWizardClient />;
}
