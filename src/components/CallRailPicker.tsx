'use client';

import { Phone, Loader2, ChevronDown, Check, X, Copy } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  clearProjectCallrailBinding,
  listCallrailCompanies,
  setProjectCallrailBinding,
  type CallrailCompaniesResponse,
  type CallrailCompanyOption,
} from '@/lib/projects/remoteStorage';
import type { ProjectDTO } from '@/lib/projects/types';

interface CallRailPickerProps {
  projectId: string;
  initialCompanyId: string | null;
  initialCompanyName: string | null;
  onChange?: (project: ProjectDTO) => void;
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
  onChange,
}: CallRailPickerProps) {
  const [companyId, setCompanyId] = useState<string | null>(initialCompanyId);
  const [companyName, setCompanyName] = useState<string | null>(initialCompanyName);
  const [companiesState, setCompaniesState] = useState<CallrailCompaniesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [signingDraft, setSigningDraft] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);

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
  // user actually clicks. Bound projects can skip this entirely.
  useEffect(() => {
    if (!open || companiesState !== null || companyId) return;
    refreshCompanies();
  }, [open, companiesState, companyId, refreshCompanies]);

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
    if (!window.confirm('Remove the CallRail binding from this page?')) return;
    setLoading(true);
    try {
      const project = await clearProjectCallrailBinding(projectId);
      setCompanyId(null);
      setCompanyName(null);
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
          ) : !bound ? (
            <div>
              <div className="font-medium text-gray-800 mb-2">Pick a CallRail company</div>
              {companiesState?.error ? (
                <p className="text-xs text-red-600 mb-2">{companiesState.error}</p>
              ) : null}
              {companiesState && companiesState.companies.length === 0 ? (
                <p className="text-xs text-gray-500">
                  No companies on this CallRail account.
                </p>
              ) : (
                <ul className="max-h-56 overflow-auto -mx-1">
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

              <div className="mt-2">
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
        </div>
      )}
    </div>
  );
}
