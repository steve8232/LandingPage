import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * /dashboard/leads — retired in favour of per-project dashboards at
 * /dashboard/projects/[id]. Existing bookmarks are redirected to the
 * projects list so users can drill into a specific project from there.
 */
export default function LeadsPage() {
  redirect('/dashboard');
}
