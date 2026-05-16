'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Globe, Loader2, Pencil, X } from 'lucide-react';
import {
  PAGES_PARENT_DOMAIN,
  validateSubdomain,
} from '@/lib/projects/subdomain';
import {
  checkSubdomainAvailability,
  setProjectSubdomain,
} from '@/lib/projects/remoteStorage';
import type { ProjectDTO, SubdomainStatus } from '@/lib/projects/types';

interface SubdomainPickerProps {
  projectId: string;
  /** Current subdomain on the project (null until claimed). */
  initialSubdomain: string | null;
  initialStatus: SubdomainStatus | null;
  /** Suggestion used to pre-fill the input the first time the user opens it. */
  suggestion?: string;
  onChange?: (project: ProjectDTO) => void;
}

type CheckState =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'ok'; value: string }
  | { kind: 'bad'; error: string };

export default function SubdomainPicker({
  projectId,
  initialSubdomain,
  initialStatus,
  suggestion,
  onChange,
}: SubdomainPickerProps) {
  const [subdomain, setSubdomain] = useState<string | null>(initialSubdomain);
  const [status, setStatus] = useState<SubdomainStatus | null>(initialStatus);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialSubdomain ?? suggestion ?? '');
  const [check, setCheck] = useState<CheckState>({ kind: 'idle' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const checkTimerRef = useRef<number | null>(null);

  // Debounced availability check.
  useEffect(() => {
    if (!editing) return;
    if (checkTimerRef.current !== null) {
      window.clearTimeout(checkTimerRef.current);
    }
    const validation = validateSubdomain(draft);
    if (!validation.ok) {
      setCheck({ kind: 'bad', error: validation.error });
      return;
    }
    if (validation.value === subdomain) {
      setCheck({ kind: 'ok', value: validation.value });
      return;
    }
    setCheck({ kind: 'checking' });
    checkTimerRef.current = window.setTimeout(async () => {
      try {
        const res = await checkSubdomainAvailability(projectId, validation.value);
        if (res.available && res.value) {
          setCheck({ kind: 'ok', value: res.value });
        } else {
          setCheck({ kind: 'bad', error: res.error || 'Unavailable.' });
        }
      } catch (err) {
        setCheck({ kind: 'bad', error: err instanceof Error ? err.message : 'Check failed' });
      }
    }, 400);
    return () => {
      if (checkTimerRef.current !== null) window.clearTimeout(checkTimerRef.current);
    };
  }, [draft, editing, projectId, subdomain]);

  const startEdit = useCallback(() => {
    setDraft(subdomain ?? suggestion ?? '');
    setSaveError('');
    setEditing(true);
  }, [subdomain, suggestion]);

  const cancelEdit = useCallback(() => {
    setEditing(false);
    setSaveError('');
    setCheck({ kind: 'idle' });
  }, []);

  const save = useCallback(async () => {
    if (check.kind !== 'ok') return;
    setSaving(true);
    setSaveError('');
    try {
      const project = await setProjectSubdomain(projectId, check.value);
      setSubdomain(project.subdomain);
      setStatus(project.subdomainStatus);
      setEditing(false);
      onChange?.(project);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [check, onChange, projectId]);

  if (!editing) {
    if (!subdomain) {
      return (
        <button
          type="button"
          onClick={startEdit}
          className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-orange-700 border border-dashed border-gray-300 hover:border-orange-300 rounded-md px-2 py-1"
          title={`Claim a stable URL on ${PAGES_PARENT_DOMAIN}`}
        >
          <Globe className="w-3.5 h-3.5" />
          Choose a stable URL
        </button>
      );
    }
    return (
      <div className="inline-flex items-center gap-1.5 text-xs">
        <Globe className="w-3.5 h-3.5 text-orange-600" />
        <a
          href={`https://${subdomain}.${PAGES_PARENT_DOMAIN}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-orange-700 hover:text-orange-800 truncate max-w-[260px]"
          title={`${subdomain}.${PAGES_PARENT_DOMAIN}`}
        >
          {subdomain}.{PAGES_PARENT_DOMAIN}
        </a>
        <StatusBadge status={status} />
        <button
          type="button"
          onClick={startEdit}
          className="p-1 text-gray-500 hover:text-gray-800 rounded"
          title="Change"
        >
          <Pencil className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <div className="inline-flex items-center gap-1 text-xs">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') cancelEdit();
          }}
          placeholder="my-page"
          className="px-2 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 w-32"
        />
        <span className="text-gray-500 select-none">.{PAGES_PARENT_DOMAIN}</span>
        <button
          type="button"
          onClick={save}
          disabled={check.kind !== 'ok' || saving}
          className="p-1 text-emerald-700 hover:text-emerald-900 disabled:text-gray-300"
          title="Save"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
        </button>
        <button
          type="button"
          onClick={cancelEdit}
          disabled={saving}
          className="p-1 text-gray-500 hover:text-gray-800"
          title="Cancel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <CheckRow check={check} saveError={saveError} />
    </div>
  );
}

function StatusBadge({ status }: { status: SubdomainStatus | null }) {
  if (!status || status === 'ready') return null;
  if (status === 'pending') {
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
        Pending DNS
      </span>
    );
  }
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded-full border bg-red-50 text-red-700 border-red-200">
      Alias error
    </span>
  );
}

function CheckRow({ check, saveError }: { check: CheckState; saveError: string }) {
  if (saveError) return <span className="text-[11px] text-red-600">{saveError}</span>;
  if (check.kind === 'checking') return <span className="text-[11px] text-gray-500">Checking…</span>;
  if (check.kind === 'ok') return <span className="text-[11px] text-emerald-700">Available</span>;
  if (check.kind === 'bad') return <span className="text-[11px] text-red-600">{check.error}</span>;
  return null;
}
