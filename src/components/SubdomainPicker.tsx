'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Globe, Loader2, RefreshCw } from 'lucide-react';
import {
  PAGES_PARENT_DOMAIN,
  validateSubdomain,
} from '@/lib/projects/subdomain';
import {
  checkSubdomainAvailability,
  retryProjectSubdomain,
  setProjectSubdomain,
} from '@/lib/projects/remoteStorage';
import type { ProjectDTO, SubdomainStatus } from '@/lib/projects/types';

interface SubdomainPickerProps {
  projectId: string;
  /** Current subdomain on the project (null until claimed). */
  initialSubdomain: string | null;
  initialStatus: SubdomainStatus | null;
  /** Persisted error message from the last attach/alias attempt, if any. */
  initialError?: string | null;
  /** Suggestion used to pre-fill the input the first time the user opens it. */
  suggestion?: string;
  onChange?: (project: ProjectDTO) => void;
  /** Notified whenever the draft differs from the saved value (or back). */
  onDraftPendingChange?: (pending: boolean) => void;
}

/**
 * Imperative API used by the parent to coordinate "Claim & Publish":
 *   - `hasPendingDraft()` returns true when the input holds an uncommitted change.
 *   - `commitPendingDraft()` saves it and resolves with the updated project (or
 *     throws on failure, so the parent can short-circuit the publish flow).
 */
export interface SubdomainPickerHandle {
  hasPendingDraft(): boolean;
  commitPendingDraft(): Promise<ProjectDTO | null>;
}

type CheckState =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'ok'; value: string }
  | { kind: 'bad'; error: string };

/** Idle-timeout for the edit form (Q-default: 60s). */
const EDIT_AUTO_DISMISS_MS = 60_000;

const SubdomainPicker = forwardRef<SubdomainPickerHandle, SubdomainPickerProps>(function SubdomainPicker(
  {
    projectId,
    initialSubdomain,
    initialStatus,
    initialError,
    suggestion,
    onChange,
    onDraftPendingChange,
  },
  ref
) {
  const [subdomain, setSubdomain] = useState<string | null>(initialSubdomain);
  const [status, setStatus] = useState<SubdomainStatus | null>(initialStatus);
  const [errorMsg, setErrorMsg] = useState<string | null>(initialError ?? null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialSubdomain ?? suggestion ?? '');
  const [check, setCheck] = useState<CheckState>({ kind: 'idle' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [retrying, setRetrying] = useState(false);
  const checkTimerRef = useRef<number | null>(null);
  const idleTimerRef = useRef<number | null>(null);

  // Re-sync if the parent reloads the project from the server (e.g. after a
  // publish-poll tick clears subdomain_error via self-heal).
  useEffect(() => {
    setSubdomain(initialSubdomain);
    setStatus(initialStatus);
    setErrorMsg(initialError ?? null);
  }, [initialSubdomain, initialStatus, initialError]);

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

  // Idle timeout: collapse the edit form after EDIT_AUTO_DISMISS_MS without
  // changes. Reset on every keystroke. Skipped while saving so we never
  // close mid-request.
  useEffect(() => {
    if (!editing || saving) return;
    if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(() => {
      setEditing(false);
      setCheck({ kind: 'idle' });
    }, EDIT_AUTO_DISMISS_MS);
    return () => {
      if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current);
    };
  }, [editing, saving, draft]);

  /**
   * True when the user has typed a valid candidate that differs from the
   * saved subdomain. Surfaced to the parent so the Publish button can flip
   * its label to "Claim & Publish" and auto-commit before publishing.
   */
  const trimmedDraft = draft.trim().toLowerCase();
  const draftPending =
    editing &&
    check.kind === 'ok' &&
    check.value !== (subdomain ?? '');

  useEffect(() => {
    onDraftPendingChange?.(draftPending);
  }, [draftPending, onDraftPendingChange]);

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

  const save = useCallback(async (): Promise<ProjectDTO | null> => {
    if (check.kind !== 'ok') return null;
    setSaving(true);
    setSaveError('');
    try {
      const project = await setProjectSubdomain(projectId, check.value);
      setSubdomain(project.subdomain);
      setStatus(project.subdomainStatus);
      setErrorMsg(project.subdomainError);
      setEditing(false);
      onChange?.(project);
      return project;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Save failed';
      setSaveError(message);
      throw err instanceof Error ? err : new Error(message);
    } finally {
      setSaving(false);
    }
  }, [check, onChange, projectId]);

  const retry = useCallback(async () => {
    if (retrying) return;
    setRetrying(true);
    setSaveError('');
    try {
      const project = await retryProjectSubdomain(projectId);
      setSubdomain(project.subdomain);
      setStatus(project.subdomainStatus);
      setErrorMsg(project.subdomainError);
      onChange?.(project);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Retry failed');
    } finally {
      setRetrying(false);
    }
  }, [onChange, projectId, retrying]);

  useImperativeHandle(
    ref,
    () => ({
      hasPendingDraft: () => draftPending,
      commitPendingDraft: async () => {
        if (!draftPending) return null;
        return save();
      },
    }),
    [draftPending, save]
  );

  // ───────────────────────────── render ─────────────────────────────────

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
      <div className="inline-flex flex-col gap-0.5">
        <div className="inline-flex items-center gap-1.5 text-xs">
          <Globe className="w-3.5 h-3.5 text-orange-600 shrink-0" />
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
            className="text-[11px] text-gray-500 hover:text-orange-700 underline-offset-2 hover:underline"
            title="Change this URL"
          >
            Change
          </button>
          {status === 'error' && (
            <button
              type="button"
              onClick={retry}
              disabled={retrying}
              className="inline-flex items-center gap-1 text-[11px] text-orange-700 hover:text-orange-800 disabled:text-gray-400"
              title="Re-run the domain attach + alias check"
            >
              {retrying ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Retry
            </button>
          )}
        </div>
        {status === 'error' && errorMsg && (
          <span
            className="text-[11px] text-red-600 max-w-[420px] truncate"
            title={errorMsg}
          >
            {errorMsg}
          </span>
        )}
        {saveError && <span className="text-[11px] text-red-600">{saveError}</span>}
      </div>
    );
  }

  const validDraft = check.kind === 'ok';
  const draftMatchesSaved = trimmedDraft === (subdomain ?? '');
  const primaryLabel = subdomain
    ? draftMatchesSaved
      ? 'Save changes'
      : 'Save changes'
    : 'Claim URL';

  return (
    <div className="inline-flex flex-col gap-1 border border-gray-200 rounded-md bg-white px-2 py-1.5 shadow-sm">
      <div className="inline-flex items-center gap-1 text-xs">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void save();
            if (e.key === 'Escape') cancelEdit();
          }}
          placeholder="my-page"
          className="px-2 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 w-36"
        />
        <span className="text-gray-500 select-none">.{PAGES_PARENT_DOMAIN}</span>
      </div>
      <div className="inline-flex items-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => void save()}
          disabled={!validDraft || saving || draftMatchesSaved}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-orange-500 text-white text-[11px] font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          title={
            !validDraft
              ? 'Fix the URL field first'
              : draftMatchesSaved
                ? 'No changes to save'
                : subdomain
                  ? `Save as ${trimmedDraft}.${PAGES_PARENT_DOMAIN}`
                  : `Claim ${trimmedDraft}.${PAGES_PARENT_DOMAIN}`
          }
        >
          {saving && <Loader2 className="w-3 h-3 animate-spin" />}
          {saving ? 'Saving…' : primaryLabel}
        </button>
        <button
          type="button"
          onClick={cancelEdit}
          disabled={saving}
          className="text-[11px] text-gray-500 hover:text-gray-800 disabled:text-gray-300"
        >
          Cancel
        </button>
        {!draftMatchesSaved && validDraft && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
            Not saved
          </span>
        )}
        <CheckRow check={check} saveError={saveError} draftMatchesSaved={draftMatchesSaved} />
      </div>
    </div>
  );
});

SubdomainPicker.displayName = 'SubdomainPicker';
export default SubdomainPicker;

function StatusBadge({ status }: { status: SubdomainStatus | null }) {
  if (!status || status === 'ready') return null;
  if (status === 'pending') {
    return (
      <span
        className="text-[10px] px-1.5 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200"
        title="Setting up — will be live after the next Publish."
      >
        Setting up…
      </span>
    );
  }
  return (
    <span
      className="text-[10px] px-1.5 py-0.5 rounded-full border bg-red-50 text-red-700 border-red-200"
      title="The URL is not reachable right now. Click Retry to re-run the setup."
    >
      Couldn&rsquo;t reach this URL
    </span>
  );
}

function CheckRow({
  check,
  saveError,
  draftMatchesSaved,
}: {
  check: CheckState;
  saveError: string;
  draftMatchesSaved: boolean;
}) {
  if (saveError) return <span className="text-[11px] text-red-600">{saveError}</span>;
  if (check.kind === 'checking') return <span className="text-[11px] text-gray-500">Checking…</span>;
  if (check.kind === 'ok' && !draftMatchesSaved) {
    return <span className="text-[11px] text-emerald-700">Available</span>;
  }
  if (check.kind === 'bad') return <span className="text-[11px] text-red-600">{check.error}</span>;
  return null;
}
