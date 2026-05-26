'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, Check, Loader2, RotateCw, Search, Sparkles,
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
}

const POLL_INTERVAL_MS = 5000;

export default function ResearchReviewClient({ project }: { project: ProjectLite; userEmail: string }) {
  const router = useRouter();
  const [data, setData] = useState<ResearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ResearchDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const pollHandle = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchOnce = useCallback(async () => {
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
    }
  }, [project.id]);

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
          onRefresh={fetchOnce}
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
}

function ReviewBody({
  loading, loadError, data, draft, setDraft,
  saving, applying, actionErr, actionMsg,
  onSave, onApply, onRefresh,
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
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600"
        >
          <RotateCw className="w-4 h-4" />
          Try again
        </button>
      </div>
    );
  }
  if (!data) return null;

  if (data.status === 'pending') {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Searching for your business…</h2>
        <p className="text-sm text-gray-600 max-w-md mx-auto">
          DataForSEO is fetching your Google Business Profile. This usually takes 1–3 minutes.
          We&apos;ll auto-refresh when results are ready.
        </p>
        <p className="mt-4 text-xs text-gray-400">
          Searching <span className="font-mono">{data.keyword}</span>
          {data.locationName ? <> in <span className="font-mono">{data.locationName}</span></> : null}
        </p>
      </div>
    );
  }

  if (data.status === 'error') {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Research failed</h2>
        <p className="text-sm text-red-700 mb-4">{data.errorMessage || 'DataForSEO returned an error.'}</p>
        <p className="text-xs text-gray-500">
          You can still build this page manually from the editor.
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
