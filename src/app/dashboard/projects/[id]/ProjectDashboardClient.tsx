'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles, ArrowLeft, LogOut, Download, ExternalLink,
  FileText, Phone, Users, Inbox,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { LeadDTO } from '@/lib/leads/types';
import {
  buildLeadsCsv, csvFilenameForToday,
} from '@/lib/leads/csv';
import {
  buildIdentifiedCsv,
  type IdentifiedVisitorDTO,
} from '@/lib/audiencelab/identified';
import { buildCallsCsv, type CallDTO } from '@/lib/callrail/calls';
import ProjectTabs from './ProjectTabs';
import { buildTimeline } from './timeline';
import TimelineRow from './TimelineRow';

export interface ProjectLite {
  id: string;
  title: string;
  slug: string;
  subdomain: string | null;
  customDomain: string | null;
}

interface Props {
  project: ProjectLite;
  leads: LeadDTO[];
  identified: IdentifiedVisitorDTO[];
  calls: CallDTO[];
  userEmail: string;
  loadError: string;
}

export default function ProjectDashboardClient({
  project, leads, identified, calls, userEmail, loadError,
}: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const projectTitleById = useMemo(
    () => ({ [project.id]: project.title }),
    [project.id, project.title],
  );

  const items = useMemo(
    () => buildTimeline({ leads, identified, calls }),
    [leads, identified, calls],
  );

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  function downloadCsv(csv: string, prefix: string) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = csvFilenameForToday(prefix);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const liveUrl = project.customDomain
    ? `https://${project.customDomain}`
    : project.subdomain
      ? `https://${project.subdomain}.pages.sparkpage.us`
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-900 hover:text-orange-600">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">SparkPage</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-500 hidden sm:inline">{userEmail}</span>
            <button
              onClick={handleSignOut}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-1.5"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-6">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-lg md:text-xl font-bold text-gray-900 truncate">
            {project.title}
          </h1>
          {liveUrl && (
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-orange-700 hover:text-orange-800 inline-flex items-center gap-1"
              title={liveUrl}
            >
              <ExternalLink className="w-3 h-3" />
              {liveUrl.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>

        <div className="mb-4">
          <ProjectTabs projectId={project.id} active="dashboard" />
        </div>

        <SummaryCards
          formCount={leads.length}
          callCount={calls.length}
          visitorCount={identified.length}
        />

        <div className="mt-4 flex items-center justify-end gap-2">
          <ExportButton
            label="Form CSV"
            disabled={leads.length === 0}
            onClick={() =>
              downloadCsv(buildLeadsCsv({ leads, projectTitleById }), 'sparkpage-leads')
            }
          />
          <ExportButton
            label="Calls CSV"
            disabled={calls.length === 0}
            onClick={() =>
              downloadCsv(buildCallsCsv({ calls, projectTitleById }), 'sparkpage-calls')
            }
          />
          <ExportButton
            label="Visitors CSV"
            disabled={identified.length === 0}
            onClick={() =>
              downloadCsv(
                buildIdentifiedCsv({ visitors: identified, projectTitleById }),
                'sparkpage-identified',
              )
            }
          />
        </div>

        {loadError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {loadError}
          </div>
        )}

        <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {items.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="divide-y divide-gray-100">
              {items.map((item) => (
                <TimelineRow
                  key={item.id}
                  item={item}
                  expanded={!!expanded[item.id]}
                  onToggle={() =>
                    setExpanded((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                  }
                />
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="p-10 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-4">
        <Inbox className="w-6 h-6 text-orange-600" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">No activity yet</h2>
      <p className="text-sm text-gray-600">
        Form submissions, calls, and identified visitors will appear here once
        traffic starts arriving on the published page.
      </p>
    </div>
  );
}

interface SummaryCardsProps {
  formCount: number;
  callCount: number;
  visitorCount: number;
}

function SummaryCards({ formCount, callCount, visitorCount }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <SummaryCard
        icon={<FileText className="w-4 h-4 text-blue-600" />}
        tint="bg-blue-50 border-blue-100"
        label="Form fills"
        count={formCount}
      />
      <SummaryCard
        icon={<Phone className="w-4 h-4 text-emerald-600" />}
        tint="bg-emerald-50 border-emerald-100"
        label="Calls"
        count={callCount}
      />
      <SummaryCard
        icon={<Users className="w-4 h-4 text-purple-600" />}
        tint="bg-purple-50 border-purple-100"
        label="Identified visitors"
        count={visitorCount}
      />
    </div>
  );
}

interface SummaryCardProps {
  icon: React.ReactNode;
  tint: string;
  label: string;
  count: number;
}

function SummaryCard({ icon, tint, label, count }: SummaryCardProps) {
  return (
    <div className={`rounded-xl border p-4 ${tint}`}>
      <div className="flex items-center gap-2 text-xs text-gray-600">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-bold text-gray-900 mt-1">{count}</div>
    </div>
  );
}

interface ExportButtonProps {
  label: string;
  disabled: boolean;
  onClick: () => void;
}

function ExportButton({ label, disabled, onClick }: ExportButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <Download className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}
