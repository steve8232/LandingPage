import { redirect } from 'next/navigation';
import { getCurrentRole } from '@/lib/auth/role';
import UrlWizardClient from './UrlWizardClient';

export const dynamic = 'force-dynamic';

/**
 * /dashboard/new/url — Lane D wizard entry.
 *
 * Admins paste an existing website URL. The client POSTs /api/url-onboard,
 * which scrapes the site with Firecrawl, extracts business facts via
 * OpenAI, picks the closest v1 template, runs the standard generate +
 * enhance pipeline, and inserts the project with creation_method='url'.
 *
 * Non-admins are bounced to /dashboard — same gate the other lanes use.
 */
export default async function UrlWizardPage() {
  const { userId, role } = await getCurrentRole();
  if (!userId) redirect('/login?next=/dashboard/new/url');
  if (role !== 'admin') redirect('/dashboard');

  return <UrlWizardClient />;
}
