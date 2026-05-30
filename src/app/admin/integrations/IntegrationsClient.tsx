'use client';

import { useState } from 'react';
import { Plug, RefreshCw, Trash2, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import type {
  CleanupCandidate,
  CleanupOutcome,
} from '@/lib/audiencelab/cleanup';

export interface AudienceLabCleanupSnapshot {
  scanned: number;
  candidates: CleanupCandidate[];
  error: string | null;
}

interface ApplyResponse {
  requested: number;
  processed: number;
  deleted: number;
  notFound: number;
  failed: number;
  nulled: number;
  outcomes: CleanupOutcome[];
}

const CLEANUP_ENDPOINT = '/api/admin/maintenance/audiencelab-cleanup';

function describeReason(c: CleanupCandidate): string {
  if (c.reason === 'no_ready_custom_domain') return 'no ready custom domain';
  return `stored ${JSON.stringify(c.currentWebsiteUrl)} != expected ${JSON.stringify(c.expectedUrl)}`;
}

export default function IntegrationsClient({
  initialAudienceLab,
}: {
  initialAudienceLab: AudienceLabCleanupSnapshot;
}) {
  const [snap, setSnap] = useState<AudienceLabCleanupSnapshot>(initialAudienceLab);
  const [busy, setBusy] = useState<'scan' | 'apply' | null>(null);
  const [error, setError] = useState<string>(initialAudienceLab.error ?? '');
  const [info, setInfo] = useState<string>('');
  const [lastApply, setLastApply] = useState<ApplyResponse | null>(null);

  async function rescan() {
    setBusy('scan'); setError(''); setInfo('');
    try {
      const res = await fetch(CLEANUP_ENDPOINT, { cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Scan failed (${res.status})`);
      setSnap({ scanned: json.scanned, candidates: json.candidates, error: null });
      setLastApply(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
    } finally { setBusy(null); }
  }

  async function applyAll() {
    if (snap.candidates.length === 0) return;
    const n = snap.candidates.length;
    if (!confirm(`Delete ${n} legacy AudienceLab pixel${n === 1 ? '' : 's'}? This cannot be undone — the next publish on each project will provision a fresh pixel if it has a ready custom domain.`)) return;
    setBusy('apply'); setError(''); setInfo('');
    try {
      const res = await fetch(CLEANUP_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ pixelIds: snap.candidates.map((c) => c.pixelId) }),
      });
      const json = (await res.json().catch(() => ({}))) as ApplyResponse & { error?: string };
      if (!res.ok) throw new Error(json?.error || `Cleanup failed (${res.status})`);
      setLastApply(json);
      setInfo(`Done. deleted=${json.deleted} notFound=${json.notFound} failed=${json.failed} nulled=${json.nulled}`);
      // Re-fetch so the table reflects what's left (usually empty, or the failures).
      await rescan();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cleanup failed');
    } finally { setBusy(null); }
  }

  const outcomeById = new Map((lastApply?.outcomes ?? []).map((o) => [o.pixelId, o] as const));

  return (
    <div className="space-y-6">
      {(error || info) && (
        <div
          className={`p-3 rounded-lg text-sm border ${
            error
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}
        >
          {error || info}
        </div>
      )}

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <Plug className="w-4 h-4 text-orange-600" />
            <h2 className="font-semibold text-gray-900">AudienceLab pixel cleanup</h2>
          </div>
          <button
            onClick={rescan}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {busy === 'scan'
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <RefreshCw className="w-3.5 h-3.5" />}
            Re-scan
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Scrubs legacy <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">*.pages.sparkpage.us</code> pixels
          left behind by deploys before the custom-domain gate. Safe to re-run.
          A project flagged here will provision a fresh pixel on its next publish
          if (and only if) it has a ready custom domain.
        </p>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>
            Scanned <strong className="text-gray-900">{snap.scanned}</strong> project{snap.scanned === 1 ? '' : 's'} with a pixel.{' '}
            <strong className="text-gray-900">{snap.candidates.length}</strong> candidate{snap.candidates.length === 1 ? '' : 's'} for cleanup.
          </span>
          <button
            onClick={applyAll}
            disabled={busy !== null || snap.candidates.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy === 'apply'
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Trash2 className="w-3.5 h-3.5" />}
            Delete all ({snap.candidates.length})
          </button>
        </div>

        <CandidateTable candidates={snap.candidates} outcomeById={outcomeById} />
      </section>
    </div>
  );
}

function CandidateTable({
  candidates,
  outcomeById,
}: {
  candidates: CleanupCandidate[];
  outcomeById: Map<string, CleanupOutcome>;
}) {
  if (candidates.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg">
        Nothing to clean up — AudienceLab dashboard already matches the DB.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-100">
          <tr>
            <th className="px-2 py-2 font-medium">Page</th>
            <th className="px-2 py-2 font-medium">Pixel</th>
            <th className="px-2 py-2 font-medium">Reason</th>
            <th className="px-2 py-2 font-medium">Result</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((c) => (
            <CandidateRow key={c.pixelId} c={c} outcome={outcomeById.get(c.pixelId)} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CandidateRow({ c, outcome }: { c: CleanupCandidate; outcome?: CleanupOutcome }) {
  return (
    <tr className="border-b border-gray-50 last:border-0 align-top">
      <td className="px-2 py-2">
        <div className="font-medium text-gray-900">{c.projectTitle ?? '(untitled)'}</div>
        <div className="text-xs text-gray-500 font-mono">{c.projectId.slice(0, 8)}…</div>
      </td>
      <td className="px-2 py-2 font-mono text-xs text-gray-700 whitespace-nowrap">{c.pixelId}</td>
      <td className="px-2 py-2 text-xs text-gray-600 max-w-md break-words">{describeReason(c)}</td>
      <td className="px-2 py-2">{outcome ? <OutcomePill outcome={outcome} /> : <span className="text-xs text-gray-400">—</span>}</td>
    </tr>
  );
}

function OutcomePill({ outcome }: { outcome: CleanupOutcome }) {
  const map = {
    deleted:    { label: 'deleted',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle2 },
    notFound:   { label: 'gone',     cls: 'bg-gray-50 text-gray-700 border-gray-200',          Icon: CheckCircle2 },
    failed:     { label: 'failed',   cls: 'bg-red-50 text-red-700 border-red-200',             Icon: AlertTriangle },
    db_failed:  { label: 'db error', cls: 'bg-amber-50 text-amber-700 border-amber-200',       Icon: AlertTriangle },
  } as const;
  const m = map[outcome.outcome];
  return (
    <span
      title={outcome.message ?? ''}
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium border rounded-full ${m.cls}`}
    >
      <m.Icon className="w-3 h-3" />
      {m.label}
    </span>
  );
}
