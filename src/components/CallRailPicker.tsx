'use client';

import { Phone, Loader2, ChevronDown, Check, X, Copy, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  clearProjectCallrailBinding,
  listCallrailCompanies,
  provisionCallrailTracker,
  ProvisionNoInventoryError,
  setProjectCallrailBinding,
  type CallrailCompaniesResponse,
  type CallrailCompanyOption,
  type CallrailNumberPreference,
} from '@/lib/projects/remoteStorage';
import type { ProjectDTO } from '@/lib/projects/types';

interface CallRailPickerProps {
  projectId: string;
  initialCompanyId: string | null;
  initialCompanyName: string | null;
  /** Persisted destination phone for this project (column on projects). */
  initialBusinessPhone?: string | null;
  initialTrackerId?: string | null;
  initialTrackingPhone?: string | null;
  /** Live businessPhone from overrides.meta (current editor state). */
  overridesBusinessPhone?: string | null;
  onChange?: (project: ProjectDTO) => void;
  /**
   * When true, render the panel body directly without the outer trigger
   * button / popover. The parent owns visibility (e.g. an enclosing menu).
   */
  embedded?: boolean;
}

function digits(input: string | null | undefined): string {
  return (input ?? '').replace(/\D/g, '');
}

/** Pretty-print a 10-digit US phone as (NPA) NXX-XXXX. */
function formatPhone(input: string | null | undefined): string {
  const d = digits(input);
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length === 11 && d.startsWith('1')) return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  return input ?? '';
}

/**
 * Toolbar control for the CallRail integration. Two states:
 *
 *  1. Unbound → company picker (companies come from the global
 *     CALLRAIL_API_KEY on the server).
 *  2. Bound → company pill; click reveals the webhook URL + signing key panel.
 *
 * Everything round-trips through the project DTO (companyId / companyName)
 * so callers can mirror state.
 */
export default function CallRailPicker({
  projectId,
  initialCompanyId,
  initialCompanyName,
  initialBusinessPhone,
  initialTrackerId,
  initialTrackingPhone,
  overridesBusinessPhone,
  onChange,
  embedded = false,
}: CallRailPickerProps) {
  const [companyId, setCompanyId] = useState<string | null>(initialCompanyId);
  const [companyName, setCompanyName] = useState<string | null>(initialCompanyName);
  const [trackerId, setTrackerId] = useState<string | null>(initialTrackerId ?? null);
  const [trackingPhone, setTrackingPhone] = useState<string | null>(initialTrackingPhone ?? null);
  const [companiesState, setCompaniesState] = useState<CallrailCompaniesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [signingDraft, setSigningDraft] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  // Provisioning sub-flow state.
  const [provisionMode, setProvisionMode] = useState(false);
  const [provisionError, setProvisionError] = useState('');
  const [noInventory, setNoInventory] = useState(false);
  const [areaCodeDraft, setAreaCodeDraft] = useState('');
  // Tracker flavor + pool size for session (Website Pool) provisions.
  // Default to 'session' / 4 to match the server defaults and CallRail's
  // documented pool floor; the UI exposes both to keep cheaper single-number
  // (source) provisioning available.
  const [trackerKind, setTrackerKind] = useState<'source' | 'session'>('session');
  const [poolSizeDraft, setPoolSizeDraft] = useState<number>(4);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Mirror server-side state when the parent rehydrates (e.g. after save).
  useEffect(() => { setTrackerId(initialTrackerId ?? null); }, [initialTrackerId]);
  useEffect(() => { setTrackingPhone(initialTrackingPhone ?? null); }, [initialTrackingPhone]);

  // Destination phone — persisted column wins, falls back to live overrides.
  const destPhone = useMemo(() => {
    const persisted = digits(initialBusinessPhone);
    if (persisted.length >= 10) return persisted;
    return digits(overridesBusinessPhone);
  }, [initialBusinessPhone, overridesBusinessPhone]);

  // Default area code = first 3 digits of destination phone. Empty when the
  // wizard didn't capture a phone yet (provision UI will require user input).
  const defaultAreaCode = destPhone.length >= 10 ? destPhone.slice(0, 3) : '';

  // Webhook URL derived from the current origin so it works in dev + prod.
  const webhookUrl = typeof window === 'undefined'
    ? ''
    : `${window.location.origin}/api/webhooks/callrail/${projectId}`;

  const refreshCompanies = useCallback(async () => {
    try {
      const s = await listCallrailCompanies();
      setCompaniesState(s);
    } catch (err) {
      console.warn('[CallRailPicker] companies fetch failed:', err);
      setCompaniesState({ configured: true, companies: [], error: err instanceof Error ? err.message : 'Failed to load companies' });
    }
  }, []);

  // Fetch companies on first open — keeps the toolbar lightweight until the
  // user actually clicks. Bound projects can skip this entirely. In embedded
  // mode the parent owns visibility, so the load gate switches accordingly.
  useEffect(() => {
    if (!(open || embedded)) return;
    if (companiesState !== null || companyId) return;
    refreshCompanies();
  }, [open, embedded, companiesState, companyId, refreshCompanies]);

  // Click-outside to close.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!popoverRef.current) return;
      if (!popoverRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const handlePickCompany = useCallback(async (company: CallrailCompanyOption) => {
    setErrorMsg('');
    setLoading(true);
    try {
      const project = await setProjectCallrailBinding(projectId, company.id);
      setCompanyId(project.callrailCompanyId);
      setCompanyName(project.callrailCompanyName);
      onChange?.(project);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to bind company');
    } finally {
      setLoading(false);
    }
  }, [projectId, onChange]);

  // Single entry point for provisioning. Accepts any preference (the calling
  // button decides whether it's the area-code attempt, a user-chosen area, or
  // a toll-free fallback). On no-inventory, surfaces the retry options.
  const runProvision = useCallback(async (preference: CallrailNumberPreference) => {
    setProvisionError('');
    setNoInventory(false);
    setLoading(true);
    try {
      // Session pools require a minimum of 4 numbers; clamp here so the
      // server's defensive clamp is never exercised on a valid path.
      const clampedPool = Math.max(4, Math.min(50, Math.trunc(poolSizeDraft) || 4));
      // Forward the live destination phone explicitly so an unsaved edit in
      // the menu reaches the server — the route's overrides.meta fallback
      // only sees what's persisted in the DB.
      const project = await provisionCallrailTracker(projectId, {
        preference,
        trackerType: trackerKind,
        poolSize: trackerKind === 'session' ? clampedPool : undefined,
        destinationPhone: destPhone || undefined,
      });
      setCompanyId(project.callrailCompanyId);
      setCompanyName(project.callrailCompanyName);
      setTrackerId(project.callrailTrackerId);
      setTrackingPhone(project.callrailTrackingPhone);
      setProvisionMode(false);
      setAreaCodeDraft('');
      onChange?.(project);
    } catch (err) {
      if (err instanceof ProvisionNoInventoryError) {
        setNoInventory(true);
        setProvisionError(err.message);
      } else {
        setProvisionError(err instanceof Error ? err.message : 'Provisioning failed');
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, onChange, trackerKind, poolSizeDraft, destPhone]);

  const handleProvisionAreaMatch = useCallback(() => {
    if (!defaultAreaCode) {
      setProvisionError('Add a phone number in the wizard before provisioning a tracking line.');
      return;
    }
    runProvision({ type: 'local', areaCode: defaultAreaCode });
  }, [defaultAreaCode, runProvision]);

  const handleProvisionCustomAreaCode = useCallback(() => {
    const ac = digits(areaCodeDraft).slice(0, 3);
    if (ac.length !== 3) {
      setProvisionError('Enter a 3-digit area code.');
      return;
    }
    runProvision({ type: 'local', areaCode: ac });
  }, [areaCodeDraft, runProvision]);

  const handleProvisionTollFree = useCallback(() => {
    runProvision({ type: 'toll_free', prefix: '888' });
  }, [runProvision]);

  const handleSaveSigningKey = useCallback(async () => {
    if (!companyId) return;
    setErrorMsg('');
    setLoading(true);
    try {
      const project = await setProjectCallrailBinding(projectId, companyId);
      // Two-step: PUT with companyId only re-affirms binding. Now patch the key.
      const res = await fetch(`/api/projects/${projectId}/callrail`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, signingKey: signingDraft.trim() || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error((data as { error?: string } | null)?.error || 'Failed to save signing key');
      }
      const data = await res.json() as { project: ProjectDTO };
      setSigningDraft('');
      onChange?.(data.project ?? project);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save signing key');
    } finally {
      setLoading(false);
    }
  }, [companyId, projectId, signingDraft, onChange]);

  const handleUnbind = useCallback(async () => {
    if (!window.confirm('Remove the CallRail binding from this page? The tracker stays active on your CallRail account and will continue billing until you delete it there.')) return;
    setLoading(true);
    try {
      const project = await clearProjectCallrailBinding(projectId);
      setCompanyId(null);
      setCompanyName(null);
      setTrackerId(null);
      setTrackingPhone(null);
      setProvisionMode(false);
      onChange?.(project);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to unbind');
    } finally {
      setLoading(false);
    }
  }, [projectId, onChange]);

  const handleCopyWebhook = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch { /* no-op */ }
  }, [webhookUrl]);

  const bound = !!companyId;
  const pillClasses = bound
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100';

  const panelContent = (
    <>
          {!bound && companiesState === null ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…
            </div>
          ) : !bound && companiesState && !companiesState.configured ? (
            <div>
              <div className="font-medium text-gray-800 mb-1">CallRail not configured</div>
              <p className="text-xs text-gray-500">
                Set <code className="font-mono">CALLRAIL_API_KEY</code> on the server to enable call tracking.
              </p>
            </div>
          ) : !bound && provisionMode ? (
            renderProvisionPanel({
              destPhone,
              defaultAreaCode,
              loading,
              noInventory,
              provisionError,
              areaCodeDraft,
              setAreaCodeDraft,
              trackerKind,
              setTrackerKind,
              poolSizeDraft,
              setPoolSizeDraft,
              handleProvisionAreaMatch,
              handleProvisionCustomAreaCode,
              handleProvisionTollFree,
              onCancel: () => { setProvisionMode(false); setProvisionError(''); setNoInventory(false); },
            })
          ) : !bound ? (
            <div>
              <div className="font-medium text-gray-800 mb-1">Set up call tracking</div>
              <p className="text-[11px] text-gray-500 mb-2">
                Auto-provision a tracking number, or bind to an existing CallRail company.
              </p>

              <button
                type="button"
                onClick={() => { setProvisionMode(true); setProvisionError(''); setNoInventory(false); }}
                disabled={loading}
                className="w-full text-xs px-2 py-1.5 mb-2 rounded-md bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" /> Auto-provision tracking number
              </button>

              <div className="text-[11px] uppercase tracking-wide text-gray-400 mt-2 mb-1">Or pick existing</div>
              {companiesState?.error ? (
                <p className="text-xs text-red-600 mb-2">{companiesState.error}</p>
              ) : null}
              {companiesState && companiesState.companies.length === 0 ? (
                <p className="text-xs text-gray-500">
                  No companies on this CallRail account yet.
                </p>
              ) : (
                <ul className="max-h-40 overflow-auto -mx-1">
                  {companiesState?.companies.map((c) => (
                    <li key={c.id}>
                      <button
                        onClick={() => handlePickCompany(c)}
                        disabled={loading}
                        className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-gray-50 flex items-center justify-between disabled:opacity-50"
                      >
                        <span className="truncate" title={c.name}>{c.name}</span>
                        {c.status && c.status !== 'active' && (
                          <span className="text-[10px] text-gray-400 uppercase">{c.status}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : provisionMode ? (
            renderProvisionPanel({
              destPhone,
              defaultAreaCode,
              loading,
              noInventory,
              provisionError,
              areaCodeDraft,
              setAreaCodeDraft,
              trackerKind,
              setTrackerKind,
              poolSizeDraft,
              setPoolSizeDraft,
              handleProvisionAreaMatch,
              handleProvisionCustomAreaCode,
              handleProvisionTollFree,
              onCancel: () => { setProvisionMode(false); setProvisionError(''); setNoInventory(false); },
            })
          ) : (
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <div className="font-medium text-gray-800 truncate" title={companyName ?? ''}>
                    {companyName ?? 'Bound company'}
                  </div>
                  <div className="text-xs text-gray-500">Calls sync from this CallRail company.</div>
                </div>
                <button
                  onClick={handleUnbind}
                  className="text-xs text-gray-400 hover:text-red-600"
                  title="Unbind from this page"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {trackingPhone ? (
                <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-2">
                  <div className="text-[11px] uppercase tracking-wide text-emerald-700 mb-0.5">Tracking number</div>
                  <div className="font-mono text-sm text-emerald-900">{formatPhone(trackingPhone)}</div>
                  {destPhone ? (
                    <div className="text-[11px] text-emerald-800/70 mt-0.5">
                      Forwards to {formatPhone(destPhone)} · swap.js replaces this number on published pages
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-2">
                  <div className="text-[11px] uppercase tracking-wide text-amber-700 mb-0.5">No tracking number yet</div>
                  <p className="text-[11px] text-amber-900/80 mb-1.5">
                    Provision a number so visits get attributed to their source.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setProvisionMode(true); setProvisionError(''); setNoInventory(false); }}
                    disabled={loading}
                    className="w-full text-xs px-2 py-1.5 rounded-md bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Provision tracking number
                  </button>
                </div>
              )}
              {trackerId ? (
                <div className="mt-1 text-[10px] text-gray-400 font-mono truncate" title={trackerId}>
                  tracker: {trackerId}
                </div>
              ) : null}

              <div className="mt-3">
                <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">Webhook URL</div>
                <div className="flex items-center gap-1">
                  <input
                    readOnly
                    value={webhookUrl}
                    className="flex-1 text-xs px-2 py-1.5 rounded-md border border-gray-200 bg-gray-50 font-mono"
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <button
                    onClick={handleCopyWebhook}
                    className="text-xs px-2 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50 inline-flex items-center gap-1"
                    title="Copy URL"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  In CallRail → Integrations → Webhooks → paste this URL for post-call events.
                </p>
              </div>

              <div className="mt-3">
                <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">Signing key</div>
                <input
                  type="password"
                  value={signingDraft}
                  onChange={(e) => setSigningDraft(e.target.value)}
                  placeholder="Paste the webhook signing token"
                  className="w-full text-xs px-2 py-1.5 rounded-md border border-gray-300 font-mono"
                  autoComplete="off"
                />
                <div className="flex items-center justify-end mt-1.5">
                  <button
                    onClick={handleSaveSigningKey}
                    disabled={loading}
                    className="text-xs px-2 py-1 rounded-md bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
                  >
                    {loading ? 'Saving…' : 'Save key'}
                  </button>
                </div>
              </div>
            </div>
          )}

      {errorMsg && (
        <div className="mt-2 text-xs text-red-600">{errorMsg}</div>
      )}
    </>
  );

  if (embedded) {
    return <div className="text-sm text-gray-700">{panelContent}</div>;
  }

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`text-xs px-2 py-1 rounded-md inline-flex items-center gap-1.5 border ${pillClasses}`}
        title={bound ? `CallRail: ${companyName ?? companyId}` : 'Pick a CallRail company'}
      >
        <Phone className="w-3.5 h-3.5" aria-hidden />
        <span className="max-w-[140px] truncate">
          {bound ? (companyName ?? 'CallRail bound') : 'CallRail'}
        </span>
        <ChevronDown className="w-3 h-3 opacity-60" aria-hidden />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 z-30 w-[320px] rounded-lg border border-gray-200 bg-white shadow-lg p-3 text-sm text-gray-700">
          {panelContent}
        </div>
      )}
    </div>
  );
}

interface ProvisionPanelProps {
  destPhone: string;
  defaultAreaCode: string;
  loading: boolean;
  noInventory: boolean;
  provisionError: string;
  areaCodeDraft: string;
  setAreaCodeDraft: (v: string) => void;
  trackerKind: 'source' | 'session';
  setTrackerKind: (v: 'source' | 'session') => void;
  poolSizeDraft: number;
  setPoolSizeDraft: (v: number) => void;
  handleProvisionAreaMatch: () => void;
  handleProvisionCustomAreaCode: () => void;
  handleProvisionTollFree: () => void;
  onCancel: () => void;
}

function renderProvisionPanel(p: ProvisionPanelProps) {
  const {
    destPhone, defaultAreaCode, loading, noInventory, provisionError,
    areaCodeDraft, setAreaCodeDraft,
    trackerKind, setTrackerKind, poolSizeDraft, setPoolSizeDraft,
    handleProvisionAreaMatch, handleProvisionCustomAreaCode, handleProvisionTollFree,
    onCancel,
  } = p;
  const hasPhone = destPhone.length >= 10;
  const isSession = trackerKind === 'session';
  // CallRail bounds: pools must contain 4–50 numbers. Mirror the server's
  // clamp so the button label always reflects what will actually be sent.
  const clampedPool = Math.max(4, Math.min(50, Math.trunc(poolSizeDraft) || 4));
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium text-gray-800">Provision tracking number</div>
        <button onClick={onCancel} className="text-xs text-gray-400 hover:text-gray-700" title="Cancel">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mb-2 rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5">
        <div className="text-[11px] uppercase tracking-wide text-gray-500">Forwards calls to</div>
        <div className="font-mono text-xs text-gray-800">
          {hasPhone ? formatPhone(destPhone) : '— add a phone in the wizard'}
        </div>
      </div>

      <div className="mb-2">
        <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">Tracker type</div>
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => setTrackerKind('session')}
            disabled={loading}
            className={`text-[11px] px-2 py-1.5 rounded-md border ${isSession ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'} disabled:opacity-50`}
            title="Visitor-level attribution; serves one number from a pool to each visitor"
          >
            Website pool
          </button>
          <button
            type="button"
            onClick={() => setTrackerKind('source')}
            disabled={loading}
            className={`text-[11px] px-2 py-1.5 rounded-md border ${!isSession ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'} disabled:opacity-50`}
            title="Single tracking number for all traffic (cheapest)"
          >
            Single number
          </button>
        </div>
        {isSession && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <label className="text-[11px] text-gray-600">Pool size</label>
            <input
              type="number"
              min={4}
              max={50}
              value={poolSizeDraft}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                setPoolSizeDraft(Number.isFinite(n) ? n : 4);
              }}
              disabled={loading}
              className="w-16 text-xs px-2 py-1 rounded-md border border-gray-300 font-mono text-center"
            />
            <span className="text-[10px] text-gray-500">CallRail min 4, max 50</span>
          </div>
        )}
      </div>

      <p className="text-[11px] text-gray-600 mb-2">
        {isSession
          ? <>CallRail bills <strong>per number</strong>; a pool of {clampedPool} multiplies the per-tracker monthly fee by {clampedPool}. swap.js rotates numbers per visitor.</>
          : <>CallRail bills a recurring monthly fee per tracker. swap.js will replace this number on the published page with the new tracking number.</>}
      </p>

      {!noInventory ? (
        <button
          type="button"
          onClick={handleProvisionAreaMatch}
          disabled={loading || !hasPhone}
          className="w-full text-xs px-2 py-1.5 rounded-md bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
        >
          {loading
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Provisioning…</>
            : <>Use area code {defaultAreaCode || '???'}</>}
        </button>
      ) : (
        <>
          <div className="text-[11px] text-amber-700 mb-1.5">
            No numbers available in {defaultAreaCode || 'that area'}. Try another area code or a toll-free number.
          </div>
          <div className="flex items-center gap-1 mb-2">
            <input
              value={areaCodeDraft}
              onChange={(e) => setAreaCodeDraft(e.target.value.replace(/\D/g, '').slice(0, 3))}
              placeholder="NPA"
              inputMode="numeric"
              maxLength={3}
              className="w-16 text-xs px-2 py-1.5 rounded-md border border-gray-300 font-mono text-center"
            />
            <button
              type="button"
              onClick={handleProvisionCustomAreaCode}
              disabled={loading || areaCodeDraft.length !== 3}
              className="flex-1 text-xs px-2 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
            >
              Try this area code
            </button>
          </div>
          <button
            type="button"
            onClick={handleProvisionTollFree}
            disabled={loading}
            className="w-full text-xs px-2 py-1.5 rounded-md bg-gray-800 text-white hover:bg-black disabled:opacity-50"
          >
            {loading ? 'Provisioning…' : 'Use a toll-free 888 number'}
          </button>
        </>
      )}

      {provisionError && (
        <div className="mt-2 text-xs text-red-600">{provisionError}</div>
      )}
    </div>
  );
}
