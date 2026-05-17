'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sparkles, LogOut, Download, Inbox, ChevronDown, ChevronRight, ArrowLeft,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { LeadDTO } from '@/lib/leads/types';
import {
  buildLeadsCsv, csvFilenameForToday, payloadString, pickChoiceField,
} from '@/lib/leads/csv';

interface ProjectLite { id: string; title: string; slug: string }

interface LeadsClientProps {
  initialLeads: LeadDTO[];
  projects: ProjectLite[];
  userEmail: string;
  loadError: string;
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return 'just now';
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

export default function LeadsClient({
  initialLeads, projects, userEmail, loadError,
}: LeadsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectFilter = searchParams.get('project') || '';
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const projectTitleById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of projects) map[p.id] = p.title;
    return map;
  }, [projects]);

  const filteredLeads = useMemo(() => {
    if (!projectFilter) return initialLeads;
    return initialLeads.filter((l) => l.projectId === projectFilter);
  }, [initialLeads, projectFilter]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  function handleFilterChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set('project', next);
    else params.delete('project');
    const qs = params.toString();
    router.push(qs ? `/dashboard/leads?${qs}` : '/dashboard/leads');
  }

  function handleExportCsv() {
    const csv = buildLeadsCsv({ leads: filteredLeads, projectTitleById });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = csvFilenameForToday();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-900 hover:text-orange-600">
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

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Pages
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
            <span className="text-sm text-gray-500">
              {filteredLeads.length} {filteredLeads.length === 1 ? 'submission' : 'submissions'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={projectFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
              aria-label="Filter by project"
            >
              <option value="">All projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
            <button
              onClick={handleExportCsv}
              disabled={filteredLeads.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {loadError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {loadError}
          </div>
        )}

        <LeadsTable
          leads={filteredLeads}
          projectTitleById={projectTitleById}
          expanded={expanded}
          onToggle={(id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))}
        />
      </main>
    </div>
  );
}

interface LeadsTableProps {
  leads: LeadDTO[];
  projectTitleById: Record<string, string>;
  expanded: Record<string, boolean>;
  onToggle: (id: string) => void;
}

function LeadsTable({ leads, projectTitleById, expanded, onToggle }: LeadsTableProps) {
  if (leads.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-4">
          <Inbox className="w-6 h-6 text-orange-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">No leads yet</h2>
        <p className="text-sm text-gray-600">
          Submissions to your published landing pages will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-3 py-2 text-left font-medium w-8"></th>
              <th className="px-3 py-2 text-left font-medium">Submitted</th>
              <th className="px-3 py-2 text-left font-medium">Project</th>
              <th className="px-3 py-2 text-left font-medium">Name</th>
              <th className="px-3 py-2 text-left font-medium">Email</th>
              <th className="px-3 py-2 text-left font-medium">Phone</th>
              <th className="px-3 py-2 text-left font-medium">Choice</th>
              <th className="px-3 py-2 text-left font-medium">Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {leads.map((lead) => (
              <LeadRow
                key={lead.id}
                lead={lead}
                projectTitle={projectTitleById[lead.projectId] ?? '—'}
                expanded={!!expanded[lead.id]}
                onToggle={() => onToggle(lead.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface LeadRowProps {
  lead: LeadDTO;
  projectTitle: string;
  expanded: boolean;
  onToggle: () => void;
}

function LeadRow({ lead, projectTitle, expanded, onToggle }: LeadRowProps) {
  const name = payloadString(lead.payload, 'name');
  const email = payloadString(lead.payload, 'email');
  const phone = payloadString(lead.payload, 'phone');
  const message = payloadString(lead.payload, 'message');
  const choice = pickChoiceField(lead.payload);

  return (
    <>
      <tr
        onClick={onToggle}
        className="hover:bg-gray-50 cursor-pointer"
      >
        <td className="px-3 py-2 text-gray-400">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </td>
        <td className="px-3 py-2 text-gray-700 whitespace-nowrap" title={new Date(lead.createdAt).toLocaleString()}>
          {formatRelative(lead.createdAt)}
        </td>
        <td className="px-3 py-2 text-gray-900 font-medium">{projectTitle}</td>
        <td className="px-3 py-2 text-gray-800">{name || '—'}</td>
        <td className="px-3 py-2">
          {email ? (
            <a
              href={`mailto:${email}`}
              onClick={(e) => e.stopPropagation()}
              className="text-orange-600 hover:underline"
            >
              {email}
            </a>
          ) : '—'}
        </td>
        <td className="px-3 py-2">
          {phone ? (
            <a
              href={`tel:${phone}`}
              onClick={(e) => e.stopPropagation()}
              className="text-orange-600 hover:underline"
            >
              {phone}
            </a>
          ) : '—'}
        </td>
        <td className="px-3 py-2 text-gray-700" title={choice ? `${choice.key}: ${choice.value}` : ''}>
          {choice ? truncate(choice.value, 24) : '—'}
        </td>
        <td className="px-3 py-2 text-gray-600 max-w-xs">
          {message ? truncate(message, 60) : '—'}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50">
          <td colSpan={8} className="px-6 py-4">
            <LeadDetail lead={lead} />
          </td>
        </tr>
      )}
    </>
  );
}

function LeadDetail({ lead }: { lead: LeadDTO }) {
  const entries = Object.entries(lead.payload);
  return (
    <div className="grid md:grid-cols-2 gap-4 text-xs">
      <div>
        <h3 className="font-medium text-gray-700 mb-2">Submission</h3>
        {entries.length === 0 ? (
          <p className="text-gray-500">(empty payload)</p>
        ) : (
          <dl className="space-y-1">
            {entries.map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <dt className="font-mono text-gray-500 min-w-[6rem] shrink-0">{k}</dt>
                <dd className="text-gray-800 break-words">
                  {typeof v === 'string' ? v : JSON.stringify(v)}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      <div>
        <h3 className="font-medium text-gray-700 mb-2">Metadata</h3>
        <dl className="space-y-1">
          <div className="flex gap-2">
            <dt className="font-mono text-gray-500 min-w-[6rem] shrink-0">submitted</dt>
            <dd className="text-gray-800">{new Date(lead.createdAt).toLocaleString()}</dd>
          </div>
          {lead.userAgent && (
            <div className="flex gap-2">
              <dt className="font-mono text-gray-500 min-w-[6rem] shrink-0">user agent</dt>
              <dd className="text-gray-800 break-all">{lead.userAgent}</dd>
            </div>
          )}
          {lead.referer && (
            <div className="flex gap-2">
              <dt className="font-mono text-gray-500 min-w-[6rem] shrink-0">referer</dt>
              <dd className="text-gray-800 break-all">{lead.referer}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
