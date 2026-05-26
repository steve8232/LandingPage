import { redirect } from 'next/navigation';
import { getCurrentRole } from '@/lib/auth/role';
import ChatWizardClient from './ChatWizardClient';

/**
 * /dashboard/new/chat — Lane C "describe my business" wizard entry.
 *
 * A short form-style chat that asks for the smallest set of fields needed
 * to render a usable v1 draft: niche, business name, location, phone,
 * services, service area, years in business, hours. On submit the chat
 * answers are baked into the project's overrides and a research lookup is
 * queued in the background — surfaced later on the Research tab.
 *
 * Admin-only, mirroring /dashboard/new/research. Non-admins land back on
 * the dashboard.
 */
export default async function ChatWizardPage() {
  const { userId, role } = await getCurrentRole();
  if (!userId) redirect('/login?next=/dashboard/new/chat');
  if (role !== 'admin') redirect('/dashboard');

  return <ChatWizardClient />;
}
