import Link from 'next/link';
import { Pencil, Activity, LayoutDashboard } from 'lucide-react';

/**
 * Sibling-nav tab strip for project-scoped dashboard views. Rendered below
 * the breadcrumb on every per-project page (Dashboard / Editor / Heatmap).
 *
 * Editor lives at `/?project=<id>` so it's wired with a regular Link rather
 * than a `/dashboard/projects/[id]/...` segment.
 */

export type ProjectTabKey = 'dashboard' | 'editor' | 'heatmap';

interface Props {
  projectId: string;
  active: ProjectTabKey;
}

interface TabSpec {
  key: ProjectTabKey;
  label: string;
  href: (id: string) => string;
  icon: typeof Pencil;
}

const TABS: TabSpec[] = [
  { key: 'dashboard', label: 'Dashboard', href: (id) => `/dashboard/projects/${id}`,         icon: LayoutDashboard },
  { key: 'editor',    label: 'Editor',    href: (id) => `/?project=${id}`,                    icon: Pencil          },
  { key: 'heatmap',   label: 'Heatmap',   href: (id) => `/dashboard/projects/${id}/heatmap`,  icon: Activity        },
];

export default function ProjectTabs({ projectId, active }: Props) {
  return (
    <nav
      role="tablist"
      aria-label="Project views"
      className="inline-flex rounded-lg border border-gray-200 overflow-hidden text-sm bg-white"
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={tab.href(projectId)}
            role="tab"
            aria-selected={isActive}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 border-r border-gray-200 last:border-r-0 ${
              isActive
                ? 'bg-orange-500 text-white'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
