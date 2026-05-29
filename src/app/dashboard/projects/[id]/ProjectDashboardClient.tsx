'use client';

import { Suspense, use, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles, ArrowLeft, LogOut, Download, ExternalLink,
  FileText, Phone, Sparkle, Inbox, Loader2,
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
import type {
  CollaboratorDTO,
  CollaboratorOwnerDTO,
} from '@/lib/projects/collaborators';
import type { CreationMethod } from '@/lib/projects/types';
import ProjectTabs from './ProjectTabs';
import ShareAccessCard from './ShareAccessCard';
import { buildTimeline } from './timeline';
import TimelineRow from './TimelineRow';

export interface ProjectLite {
  id: string;
  title: string;
  slug: string;
  subdomain: string | null;
  customDomain: string | null;
  creationMethod?: CreationMethod;
}

interface Props {
  project: ProjectLite;
  leads: LeadDTO[];
  /** DB-cached calls (webhook ingest). Available synchronously on first paint. */
  initialCalls: CallDTO[];
  /** Streamed in via Suspense + `use()`; resolves to [] on vendor errors. */
  identifiedPromise: Promise<IdentifiedVisitorDTO[]>;
  /** Streamed CallRail live tail; merged with initialCalls (live wins on id). */
  liveCallsPromise: Promise<CallDTO[]>;
  userEmail: string;
  loadError: string;
  viewerRole: 'admin' | 'user';
  owner: CollaboratorOwnerDTO;
  collaborators: CollaboratorDTO[];
}

/** Merge DB-cached calls with the live CallRail tail; live wins on id overlap. */
function mergeCalls(initialCalls: CallDTO[], liveCalls: CallDTO[]): CallDTO[] {
  const byId = new Map<string, CallDTO>();
  for (const c of initialCalls) byId.set(c.id, c);
  for (const c of liveCalls) byId.set(c.id, c);
  return [...byId.values()].sort((a, b) =>
    (b.startTime || '').localeCompare(a.startTime || ''),
  );
}

/**
 * Tiny module-scope CSV download helper. Pulled out of the component closure
 * so it can be shared between the Suspense fallback (DB-only) and resolved
 * (enriched) activity blocks without prop drilling.
 */
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

export default function ProjectDashboardClient({
  project, leads, initialCalls, identifiedPromise, liveCallsPromise,
  userEmail, loadError, viewerRole, owner, collaborators,
}: Props) {
  const router = useRouter();
  // Timeline-row expansion state is lifted here so it survives the Suspense
  // fallback → resolved swap when the streamed data lands.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const projectTitleById = useMemo(
    () => ({ [project.id]: project.title }),
    [project.id, project.title],
  );

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
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
          <ProjectTabs projectId={project.id} active="dashboard" creationMethod={project.creationMethod} />
        </div>

        {/* Summary cards: form count is known synchronously; calls and
            visitors stream in via Suspense once the AudienceLab + CallRail
            promises resolve. Until then the call count reflects DB-cached
            rows only and the visitor count shows a skeleton. */}
        <Suspense
          fallback={
            <SummaryCards
              formCount={leads.length}
              callCount={initialCalls.length}
              visitorCount={null}
            />
          }
        >
          <SummaryCardsEnriched
            leads={leads}
            initialCalls={initialCalls}
            identifiedPromise={identifiedPromise}
            liveCallsPromise={liveCallsPromise}
          />
        </Suspense>

        <div className="mt-4">
          <ShareAccessCard
            projectId={project.id}
            viewerRole={viewerRole}
            initialOwner={owner}
            initialCollaborators={collaborators}
          />
        </div>

        {/* CSV exports + timeline. Fallback shows the DB-cached subset (form
            submissions + webhook-ingested calls) so the user has something
            useful instantly; the streamed third-party data merges in on
            resolve. */}
        <Suspense
          fallback={
            <ActivityBlock
              leads={leads}
              calls={initialCalls}
              identified={[]}
              loadError={loadError}
              projectTitleById={projectTitleById}
              expanded={expanded}
              setExpanded={setExpanded}
              loading
            />
          }
        >
          <ActivityEnriched
            leads={leads}
            initialCalls={initialCalls}
            identifiedPromise={identifiedPromise}
            liveCallsPromise={liveCallsPromise}
            loadError={loadError}
            projectTitleById={projectTitleById}
            expanded={expanded}
            setExpanded={setExpanded}
          />
        </Suspense>
      </main>
    </div>
  );
}

/* ---------- Streamed sub-components (suspend on the promises) ---------- */

interface SummaryCardsEnrichedProps {
  leads: LeadDTO[];
  initialCalls: CallDTO[];
  identifiedPromise: Promise<IdentifiedVisitorDTO[]>;
  liveCallsPromise: Promise<CallDTO[]>;
}

function SummaryCardsEnriched({
  leads, initialCalls, identifiedPromise, liveCallsPromise,
}: SummaryCardsEnrichedProps) {
  const identified = use(identifiedPromise);
  const liveCalls = use(liveCallsPromise);
  const calls = useMemo(
    () => mergeCalls(initialCalls, liveCalls),
    [initialCalls, liveCalls],
  );
  return (
    <SummaryCards
      formCount={leads.length}
      callCount={calls.length}
      visitorCount={identified.length}
    />
  );
}

interface ActivityEnrichedProps {
  leads: LeadDTO[];
  initialCalls: CallDTO[];
  identifiedPromise: Promise<IdentifiedVisitorDTO[]>;
  liveCallsPromise: Promise<CallDTO[]>;
  loadError: string;
  projectTitleById: Record<string, string>;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

function ActivityEnriched({
  leads, initialCalls, identifiedPromise, liveCallsPromise,
  loadError, projectTitleById, expanded, setExpanded,
}: ActivityEnrichedProps) {
  const identified = use(identifiedPromise);
  const liveCalls = use(liveCallsPromise);
  const calls = useMemo(
    () => mergeCalls(initialCalls, liveCalls),
    [initialCalls, liveCalls],
  );
  return (
    <ActivityBlock
      leads={leads}
      calls={calls}
      identified={identified}
      loadError={loadError}
      projectTitleById={projectTitleById}
      expanded={expanded}
      setExpanded={setExpanded}
    />
  );
}

interface ActivityBlockProps {
  leads: LeadDTO[];
  calls: CallDTO[];
  identified: IdentifiedVisitorDTO[];
  loadError: string;
  projectTitleById: Record<string, string>;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  /** When true, surfaces a small "refreshing live data…" hint over the CSV row. */
  loading?: boolean;
}

function ActivityBlock({
  leads, calls, identified, loadError, projectTitleById,
  expanded, setExpanded, loading,
}: ActivityBlockProps) {
  const items = useMemo(
    () => buildTimeline({ leads, identified, calls }),
    [leads, identified, calls],
  );
  return (
    <>
      <div className="mt-4 flex items-center justify-end gap-2">
        {loading && (
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 mr-auto">
            <Loader2 className="w-3 h-3 animate-spin" />
            Refreshing live data…
          </span>
        )}
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
          label="SparkLeads CSV"
          disabled={identified.length === 0}
          onClick={() =>
            downloadCsv(
              buildIdentifiedCsv({ visitors: identified, projectTitleById }),
              'sparkpage-sparkleads',
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
    </>
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
        Form submissions, calls, and SparkLeads will appear here once
        traffic starts arriving on the published page.
      </p>
    </div>
  );
}

interface SummaryCardsProps {
  formCount: number;
  /** null renders a pulsing dash while the value streams in. */
  callCount: number | null;
  /** null renders a pulsing dash while the value streams in. */
  visitorCount: number | null;
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
        icon={<Sparkle className="w-4 h-4 text-purple-600" />}
        tint="bg-purple-50 border-purple-100"
        label="SparkLeads"
        count={visitorCount}
      />
    </div>
  );
}

interface SummaryCardProps {
  icon: React.ReactNode;
  tint: string;
  label: string;
  count: number | null;
}

function SummaryCard({ icon, tint, label, count }: SummaryCardProps) {
  return (
    <div className={`rounded-xl border p-4 ${tint}`}>
      <div className="flex items-center gap-2 text-xs text-gray-600">
        {icon}
        {label}
      </div>
      {count === null ? (
        <div className="h-7 w-10 bg-gray-200/70 rounded animate-pulse mt-1" />
      ) : (
        <div className="text-2xl font-bold text-gray-900 mt-1">{count}</div>
      )}
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
