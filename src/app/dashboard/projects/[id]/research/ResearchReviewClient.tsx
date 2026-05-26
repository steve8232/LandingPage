'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, Camera, Check, Clock, Loader2, MapPin,
  Plug, RotateCw, Search, Sparkles, Star,
} from 'lucide-react';
import ProjectTabs from '../ProjectTabs';

export interface ProjectLite {
  id: string;
  title: string;
  slug: string;
  subdomain: string | null;
  customDomain: string | null;
  creationMethod: 'manual' | 'research' | 'chat';
}

interface ResearchDraft {
  businessName: string;
  phone: string;
  website: string;
  address: string;
  description: string;
  rating: number | null;
  reviewCount: number | null;
  hours: string[];
  photos: string[];
}

interface ResearchResponse {
  researchId: string;
  status: 'pending' | 'ready' | 'error';
  keyword: string;
  locationName: string | null;
  draft: ResearchDraft;
  errorMessage: string | null;
  createdAt: string;
}

const POLL_INTERVAL_MS = 5000;

export default function ResearchReviewClient({ project }: { project: ProjectLite; userEmail: string }) {
  const router = useRouter();
  const [data, setData] = useState<ResearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [pullMsg, setPullMsg] = useState<string | null>(null);
  const [pullErr, setPullErr] = useState<string | null>(null);
  const [requeuing, setRequeuing] = useState(false);
  const [requeueErr, setRequeueErr] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ResearchDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const pollHandle = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchOnce = useCallback(async (opts?: { manual?: boolean }) => {
    if (opts?.manual) setRefreshing(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/research`, { credentials: 'include' });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      const json = (await res.json()) as ResearchResponse;
      setData(json);
      setDraft((prev) => prev ?? json.draft);
      setLoadError(null);
      return json;
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Load failed');
      return null;
    } finally {
      setLoading(false);
      if (opts?.manual) setRefreshing(false);
    }
  }, [project.id]);

  const handleManualRefresh = useCallback(() => {
    void fetchOnce({ manual: true });
  }, [fetchOnce]);

  const handlePullNow = useCallback(async () => {
    setPulling(true);
    setPullErr(null);
    setPullMsg(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/research/poll`, {
        method: 'POST',
        credentials: 'include',
      });
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        status?: 'pending' | 'ready' | 'error';
        missing?: boolean;
      };
      if (!res.ok) throw new Error(j.error || `Pull failed (${res.status})`);
      if (j.status === 'pending') {
        setPullMsg('DataForSEO says the task is still running. Try again in 30s.');
      } else if (j.missing) {
        setPullMsg('DataForSEO no longer has this task. Re-queue to start a new one.');
      } else if (j.status === 'error') {
        setPullMsg('DataForSEO reported an error for this task.');
      }
      await fetchOnce();
    } catch (err) {
      setPullErr(err instanceof Error ? err.message : 'Pull failed');
    } finally {
      setPulling(false);
    }
  }, [project.id, fetchOnce]);

  const handleRequeue = useCallback(async () => {
    setRequeuing(true);
    setRequeueErr(null);
    setPullErr(null);
    setPullMsg(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/research/requeue`, {
        method: 'POST',
        credentials: 'include',
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error || `Re-queue failed (${res.status})`);
      await fetchOnce();
    } catch (err) {
      setRequeueErr(err instanceof Error ? err.message : 'Re-queue failed');
    } finally {
      setRequeuing(false);
    }
  }, [project.id, fetchOnce]);

  // Initial fetch + polling while pending.
  useEffect(() => {
    let cancelled = false;
    async function tick() {
      const json = await fetchOnce();
      if (cancelled) return;
      if (json?.status === 'pending') {
        pollHandle.current = setTimeout(tick, POLL_INTERVAL_MS);
      }
    }
    tick();
    return () => {
      cancelled = true;
      if (pollHandle.current) clearTimeout(pollHandle.current);
    };
  }, [fetchOnce]);

  async function handleSave() {
    if (!draft) return;
    setSaving(true); setActionErr(null); setActionMsg(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/research`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reviewedOverrides: draft }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error || `Save failed (${res.status})`);
      setActionMsg('Saved.');
    } catch (err) {
      setActionErr(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleApply() {
    if (!draft) return;
    setApplying(true); setActionErr(null); setActionMsg(null);
    try {
      // Persist edits first so the apply route reads the latest draft.
      const putRes = await fetch(`/api/projects/${project.id}/research`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reviewedOverrides: draft }),
      });
      if (!putRes.ok) {
        const j = (await putRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || `Save failed (${putRes.status})`);
      }
      const res = await fetch(`/api/projects/${project.id}/research/apply`, {
        method: 'POST',
        credentials: 'include',
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error || `Apply failed (${res.status})`);
      setActionMsg('Applied to project. Open the editor to fine-tune.');
      router.refresh();
    } catch (err) {
      setActionErr(err instanceof Error ? err.message : 'Apply failed');
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </Link>
          <div className="inline-flex items-center gap-1.5 text-sm text-gray-500">
            <Sparkles className="w-4 h-4 text-orange-500" />
            {project.title}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <div className="mb-4">
          <ProjectTabs projectId={project.id} active="research" creationMethod={project.creationMethod} />
        </div>

        <ReviewBody
          loading={loading}
          loadError={loadError}
          data={data}
          draft={draft}
          setDraft={setDraft}
          saving={saving}
          applying={applying}
          actionErr={actionErr}
          actionMsg={actionMsg}
          onSave={handleSave}
          onApply={handleApply}
          onRefresh={handleManualRefresh}
          refreshing={refreshing}
          onPullNow={handlePullNow}
          pulling={pulling}
          pullMsg={pullMsg}
          pullErr={pullErr}
          onRequeue={handleRequeue}
          requeuing={requeuing}
          requeueErr={requeueErr}
        />
      </main>
    </div>
  );
}

interface BodyProps {
  loading: boolean;
  loadError: string | null;
  data: ResearchResponse | null;
  draft: ResearchDraft | null;
  setDraft: (d: ResearchDraft) => void;
  saving: boolean;
  applying: boolean;
  actionErr: string | null;
  actionMsg: string | null;
  onSave: () => void;
  onApply: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  onPullNow: () => void;
  pulling: boolean;
  pullMsg: string | null;
  pullErr: string | null;
  onRequeue: () => void;
  requeuing: boolean;
  requeueErr: string | null;
}

function ReviewBody({
  loading, loadError, data, draft, setDraft,
  saving, applying, actionErr, actionMsg,
  onSave, onApply, onRefresh, refreshing,
  onPullNow, pulling, pullMsg, pullErr,
  onRequeue, requeuing, requeueErr,
}: BodyProps) {
  if (loading && !data) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-10 text-center text-sm text-gray-600">
        <Loader2 className="w-5 h-5 animate-spin text-orange-500 mx-auto mb-2" />
        Loading research…
      </div>
    );
  }
  if (loadError && !data) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
        <p className="text-sm text-red-700 mb-4">{loadError}</p>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 disabled:opacity-60"
        >
          {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />}
          Try again
        </button>
      </div>
    );
  }
  if (!data) return null;

  if (data.status === 'pending') {
    return (
      <PendingState
        keyword={data.keyword}
        locationName={data.locationName}
        createdAt={data.createdAt}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onPullNow={onPullNow}
        pulling={pulling}
        pullMsg={pullMsg}
        pullErr={pullErr}
        onRequeue={onRequeue}
        requeuing={requeuing}
        requeueErr={requeueErr}
      />
    );
  }

  if (data.status === 'error') {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Research failed</h2>
        <p className="text-sm text-red-700 mb-4">{data.errorMessage || 'The research lookup returned an error.'}</p>
        <div className="flex items-center justify-center gap-2 mb-3">
          <button
            type="button"
            onClick={onRequeue}
            disabled={requeuing}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 disabled:opacity-60 shadow-md shadow-orange-200"
          >
            {requeuing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />}
            Re-queue research
          </button>
        </div>
        {requeueErr && <p className="text-xs text-red-700 mb-2">{requeueErr}</p>}
        <p className="text-xs text-gray-500">
          You can also build this page manually from the editor.
        </p>
      </div>
    );
  }

  if (!draft) return null;

  return (
    <DraftForm
      draft={draft}
      setDraft={setDraft}
      saving={saving}
      applying={applying}
      actionErr={actionErr}
      actionMsg={actionMsg}
      onSave={onSave}
      onApply={onApply}
    />
  );
}

interface FormProps {
  draft: ResearchDraft;
  setDraft: (d: ResearchDraft) => void;
  saving: boolean;
  applying: boolean;
  actionErr: string | null;
  actionMsg: string | null;
  onSave: () => void;
  onApply: () => void;
}

function DraftForm({
  draft, setDraft, saving, applying, actionErr, actionMsg, onSave, onApply,
}: FormProps) {
  function field<K extends keyof ResearchDraft>(key: K, value: ResearchDraft[K]) {
    setDraft({ ...draft, [key]: value });
  }
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Review the research</h1>
        <p className="text-sm text-gray-600">
          We pulled this from your Google Business Profile. Edit anything that needs fixing, then
          apply it to the page.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5 mb-6">
        <TextField label="Business name" value={draft.businessName} onChange={(v) => field('businessName', v)} />
        <TextField label="Phone" value={draft.phone} onChange={(v) => field('phone', v)} />
        <TextField label="Website" value={draft.website} onChange={(v) => field('website', v)} />
        <TextField label="Address" value={draft.address} onChange={(v) => field('address', v)} />
        <TextField
          label="Description"
          value={draft.description}
          onChange={(v) => field('description', v)}
          multiline
        />
        {(draft.rating != null || draft.reviewCount != null) && (
          <p className="text-xs text-gray-500">
            Rating: <span className="font-medium text-gray-900">{draft.rating ?? '—'}</span>
            {' · '}
            Reviews: <span className="font-medium text-gray-900">{draft.reviewCount ?? '—'}</span>
          </p>
        )}
        {draft.hours.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Hours</p>
            <ul className="text-sm text-gray-700 list-disc list-inside space-y-0.5">
              {draft.hours.map((h) => <li key={h}>{h}</li>)}
            </ul>
          </div>
        )}
      </div>

      {actionErr && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {actionErr}
        </div>
      )}
      {actionMsg && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm flex items-center gap-1.5">
          <Check className="w-4 h-4" />
          {actionMsg}
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={saving || applying}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-gray-700 font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Save edits
        </button>
        <button
          type="button"
          onClick={onApply}
          disabled={saving || applying}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 shadow-md shadow-orange-200"
        >
          {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          Apply to page
        </button>
      </div>
    </>
  );
}

function TextField({
  label, value, onChange, multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-900 mb-1">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
        />
      )}
    </label>
  );
}


// ── Pending state ────────────────────────────────────────────────────────
//
// Replaces the bare spinner with three composable affordances that make the
// 1–3 minute DataForSEO wait feel intentional rather than hung:
//
//   1. Search-bar echo of the keyword the wizard sent, with a blinking caret.
//   2. Phase narrative pegged to elapsed time. Doesn't claim more than we
//      know — DataForSEO exposes no real progress signal — but it maps the
//      operator's wait onto the actual six things the task is doing.
//   3. Skeleton preview of the form that's about to render, so the transition
//      from pending → ready is a fill rather than a swap.
//
// `createdAt` (row.created_at) anchors the elapsed timer, so a page refresh
// mid-task keeps the narrative aligned with reality.

interface PendingStateProps {
  keyword: string;
  locationName: string | null;
  createdAt: string;
  onRefresh: () => void;
  refreshing: boolean;
  onPullNow: () => void;
  pulling: boolean;
  pullMsg: string | null;
  pullErr: string | null;
  onRequeue: () => void;
  requeuing: boolean;
  requeueErr: string | null;
}

function PendingState({
  keyword, locationName, createdAt,
  onRefresh, refreshing,
  onPullNow, pulling, pullMsg, pullErr,
  onRequeue, requeuing, requeueErr,
}: PendingStateProps) {
  const startMs = useMemo(() => new Date(createdAt).getTime(), [createdAt]);
  const [elapsedMs, setElapsedMs] = useState(() => Math.max(0, Date.now() - startMs));
  useEffect(() => {
    const id = setInterval(() => setElapsedMs(Math.max(0, Date.now() - startMs)), 1000);
    return () => clearInterval(id);
  }, [startMs]);

  const phase = phaseAt(elapsedMs);
  const PhaseIcon = phase.Icon;
  const longRunning = elapsedMs > 4 * 60_000;

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
        <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg mb-5 font-mono text-sm text-gray-800">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="truncate">{keyword}</span>
          {locationName && (
            <span className="text-gray-500 truncate">· {locationName}</span>
          )}
          <span aria-hidden className="ml-auto inline-block w-[2px] h-4 bg-orange-500 animate-pulse" />
        </div>

        <div className="flex items-center gap-2.5 mb-1.5">
          <PhaseIcon className="w-5 h-5 text-orange-500 animate-pulse shrink-0" />
          <p className="text-base font-semibold text-gray-900">{phase.text}</p>
        </div>
        <p className="text-xs text-gray-500">
          Elapsed {formatElapsed(elapsedMs)} · typically 1–3 min
        </p>

        {longRunning && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <div className="flex items-center justify-between gap-3 mb-2">
              <span>Taking longer than usual — the postback from DataForSEO may have been lost.</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={onRefresh}
                disabled={refreshing || pulling}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-amber-300 rounded-md text-amber-900 hover:bg-amber-100 text-xs font-medium shrink-0 disabled:opacity-60"
              >
                {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCw className="w-3.5 h-3.5" />}
                Refresh
              </button>
              <button
                onClick={onPullNow}
                disabled={refreshing || pulling || requeuing}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-600 text-white rounded-md hover:bg-amber-700 text-xs font-medium shrink-0 disabled:opacity-60"
              >
                {pulling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                Pull from DataForSEO now
              </button>
              <button
                onClick={onRequeue}
                disabled={refreshing || pulling || requeuing}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-amber-300 rounded-md text-amber-900 hover:bg-amber-100 text-xs font-medium shrink-0 disabled:opacity-60"
              >
                {requeuing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCw className="w-3.5 h-3.5" />}
                Re-queue research
              </button>
            </div>
            {pullErr && (
              <p className="mt-2 text-xs text-red-700">{pullErr}</p>
            )}
            {pullMsg && !pullErr && (
              <p className="mt-2 text-xs text-amber-900">{pullMsg}</p>
            )}
            {requeueErr && (
              <p className="mt-2 text-xs text-red-700">{requeueErr}</p>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <p className="text-xs uppercase tracking-wide text-gray-400 mb-4">
          Preview · fills in when results arrive
        </p>
        <div className="space-y-5">
          <SkeletonField label="Business name" />
          <SkeletonField label="Phone" />
          <SkeletonField label="Website" />
          <SkeletonField label="Address" />
          <SkeletonField label="Description" multiline />
        </div>
      </div>
    </>
  );
}

function SkeletonField({ label, multiline }: { label: string; multiline?: boolean }) {
  return (
    <div>
      <div className="block text-sm font-medium text-gray-900 mb-1">{label}</div>
      <div
        className={`w-full ${multiline ? 'h-20' : 'h-10'} bg-gray-100 rounded-lg animate-pulse`}
      />
    </div>
  );
}

interface Phase {
  Icon: typeof Plug;
  text: string;
}

// Six stages mapped onto the realistic 0–3.5 min window of a Business-Info
// task. After 3.5 min we stay on the "finalising" line — the timer + the
// long-running banner below take over the "is this stuck?" question.
function phaseAt(ms: number): Phase {
  if (ms < 15_000)  return { Icon: Plug,     text: 'Connecting to the research provider…' };
  if (ms < 45_000)  return { Icon: MapPin,   text: 'Locating your Google Business Profile…' };
  if (ms < 90_000)  return { Icon: Star,     text: 'Reading reviews and ratings…' };
  if (ms < 150_000) return { Icon: Clock,    text: 'Pulling hours, phone, and address…' };
  if (ms < 210_000) return { Icon: Camera,   text: 'Collecting profile photos…' };
  return                   { Icon: Sparkles, text: 'Almost there — finalising results…' };
}

function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
