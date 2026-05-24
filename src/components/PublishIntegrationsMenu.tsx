'use client';

import { forwardRef, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ChevronDown,
  Globe,
  Globe2,
  Phone,
  Flame,
  Target,
  Rocket,
  Loader2,
  BarChart3,
} from 'lucide-react';
import SubdomainPicker, { type SubdomainPickerHandle } from './SubdomainPicker';
import CustomDomainPicker from './CustomDomainPicker';
import CallRailPicker from './CallRailPicker';
import type { CustomDomainStatus, ProjectDTO, SubdomainStatus } from '@/lib/projects/types';
import { PAGES_PARENT_DOMAIN } from '@/lib/projects/subdomain';

type DotTone = 'ok' | 'pending' | 'error' | 'off';

export interface PublishIntegrationsMenuProps {
  projectId: string;

  // Subdomain
  subdomain: string | null;
  subdomainStatus: SubdomainStatus | null;
  subdomainError: string | null;
  subdomainSuggestion: string;
  onSubdomainChange: (project: ProjectDTO) => void;
  onSubdomainDraftPendingChange: (pending: boolean) => void;
  subdomainDraftPending: boolean;

  // Custom domain
  customDomain: string | null;
  customDomainStatus: CustomDomainStatus | null;
  customDomainError: string | null;
  customDomainErrorCode: string | null;
  customDomainApex: boolean;
  onCustomDomainChange: (project: ProjectDTO) => void;

  // CallRail
  callrailCompanyId: string | null;
  callrailCompanyName: string | null;
  callrailTrackerId: string | null;
  callrailTrackingPhone: string | null;
  businessPhone: string | null;
  overridesBusinessPhone: string | null;
  onCallrailChange: (project: ProjectDTO) => void;
  onBusinessPhoneChange: (phone: string) => void;

  // Microsoft Clarity (heatmaps + session replay)
  clarityProjectId: string;
  onClarityProjectIdChange: (id: string) => void;

  // Google Tag (gtag.js — Google Ads / GA4 / Floodlight)
  googleTagId: string;
  onGoogleTagIdChange: (id: string) => void;

  // AudienceLab (display-only — provisioned server-side at publish)
  audiencelabPixelId: string | null;
  audiencelabInstallUrl: string | null;

  // Publish
  publishStatus: 'idle' | 'publishing' | 'polling' | 'ready' | 'error';
  publishError: string;
  canPublish: boolean;
  onPublish: () => void;
}

/**
 * Single dropdown that consolidates the integration + publish controls
 * (URL, custom domain, CallRail, Clarity, AudienceLab + Publish).
 * Forwards the SubdomainPicker handle so callers can still drive
 * Claim-&-Publish from the parent.
 */
const PublishIntegrationsMenu = forwardRef<SubdomainPickerHandle, PublishIntegrationsMenuProps>(
  function PublishIntegrationsMenu(props, ref) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      if (!open) return;
      const onDown = (e: MouseEvent) => {
        if (!rootRef.current) return;
        if (!rootRef.current.contains(e.target as Node)) setOpen(false);
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setOpen(false);
      };
      document.addEventListener('mousedown', onDown);
      document.addEventListener('keydown', onKey);
      return () => {
        document.removeEventListener('mousedown', onDown);
        document.removeEventListener('keydown', onKey);
      };
    }, [open]);

    const subTone = computeSubdomainTone(props.subdomain, props.subdomainStatus);
    const cdTone = computeCustomDomainTone(props.customDomain, props.customDomainStatus);
    const callrailTone: DotTone = props.callrailTrackerId
      ? 'ok'
      : props.callrailCompanyId
        ? 'pending'
        : 'off';
    const clarityTone: DotTone = props.clarityProjectId.trim() ? 'ok' : 'off';
    const googleTagTone: DotTone = props.googleTagId.trim() ? 'ok' : 'off';
    const audiencelabTone: DotTone = props.audiencelabInstallUrl ? 'ok' : 'off';

    const publishing =
      props.publishStatus === 'publishing' || props.publishStatus === 'polling';
    const claimAndPublish = props.subdomainDraftPending && !publishing;
    const publishLabel = props.publishStatus === 'publishing'
      ? (claimAndPublish ? 'Claiming…' : 'Publishing…')
      : props.publishStatus === 'polling'
        ? 'Building…'
        : claimAndPublish
          ? 'Claim & Publish'
          : 'Publish';

    return (
      <div className="relative" ref={rootRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium flex items-center gap-2"
          title="Open publish & integrations menu"
        >
          <Rocket className="w-4 h-4" />
          Publish &amp; Integrations
          <span className="flex items-center gap-1 ml-1" aria-hidden>
            <TriggerDot tone={subTone} />
            <TriggerDot tone={cdTone} />
            <TriggerDot tone={callrailTone} />
            <TriggerDot tone={clarityTone} />
            <TriggerDot tone={googleTagTone} />
            <TriggerDot tone={audiencelabTone} />
          </span>
          <ChevronDown className="w-3.5 h-3.5 opacity-80" />
        </button>

        {open && (
          <div className="absolute right-0 mt-1.5 z-40 w-[400px] max-h-[80vh] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl">
            <div className="p-3 space-y-3 text-sm">
              <Section
                icon={<Globe className="w-3.5 h-3.5" />}
                title="URL"
                tone={subTone}
                statusLabel={subdomainStatusLabel(subTone, props.subdomainStatus)}
              >
                <SubdomainPicker
                  ref={ref}
                  projectId={props.projectId}
                  initialSubdomain={props.subdomain}
                  initialStatus={props.subdomainStatus}
                  initialError={props.subdomainError}
                  suggestion={props.subdomainSuggestion}
                  onChange={props.onSubdomainChange}
                  onDraftPendingChange={props.onSubdomainDraftPendingChange}
                />
              </Section>

              <Section
                icon={<Globe2 className="w-3.5 h-3.5" />}
                title="Custom Domain"
                tone={cdTone}
                statusLabel={customDomainStatusLabel(cdTone, props.customDomainStatus)}
              >
                <CustomDomainPicker
                  projectId={props.projectId}
                  initialDomain={props.customDomain}
                  initialStatus={props.customDomainStatus}
                  initialError={props.customDomainError}
                  initialErrorCode={props.customDomainErrorCode}
                  initialApex={props.customDomainApex}
                  onChange={props.onCustomDomainChange}
                />
              </Section>

              <Section
                icon={<Phone className="w-3.5 h-3.5" />}
                title="CallRail"
                tone={callrailTone}
                statusLabel={callrailTone === 'ok' ? 'Active' : callrailTone === 'pending' ? 'Bound' : 'Not set'}
              >
                <label className="block text-[11px] font-medium text-gray-600 mb-1">
                  Business phone <span className="text-gray-400 font-normal">— calls forward here</span>
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  value={formatBusinessPhoneInput(props.overridesBusinessPhone ?? props.businessPhone ?? '')}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
                    props.onBusinessPhoneChange(raw);
                  }}
                  placeholder="(555) 123-4567"
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-xs font-mono mb-1"
                />
                <p className="text-[11px] text-gray-500 mb-2">
                  Shown on the page; CallRail&apos;s swap script replaces it with the tracking number for visitors.
                  {props.callrailTrackerId ? ' Unbind & re-provision to change the forwarding number on the existing tracker.' : ''}
                </p>
                <CallRailPicker
                  embedded
                  projectId={props.projectId}
                  initialCompanyId={props.callrailCompanyId}
                  initialCompanyName={props.callrailCompanyName}
                  initialBusinessPhone={props.businessPhone}
                  initialTrackerId={props.callrailTrackerId}
                  initialTrackingPhone={props.callrailTrackingPhone}
                  overridesBusinessPhone={props.overridesBusinessPhone}
                  onChange={props.onCallrailChange}
                />
              </Section>

              <Section
                icon={<Flame className="w-3.5 h-3.5" />}
                title="Microsoft Clarity"
                tone={clarityTone}
                statusLabel={clarityTone === 'ok' ? 'Installed' : 'Not set'}
              >
                <label className="block text-[11px] font-medium text-gray-600 mb-1">
                  Project ID
                </label>
                <input
                  type="text"
                  value={props.clarityProjectId}
                  onChange={(e) => props.onClarityProjectIdChange(e.target.value.trim())}
                  placeholder="abc123xyz0"
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-xs font-mono"
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Find this in Clarity → Settings → Setup. Heatmaps &amp; session replays at clarity.microsoft.com. Leave blank to disable.
                </p>
              </Section>

              <Section
                icon={<BarChart3 className="w-3.5 h-3.5" />}
                title="Google Tag"
                tone={googleTagTone}
                statusLabel={googleTagTone === 'ok' ? 'Installed' : 'Not set'}
              >
                <label className="block text-[11px] font-medium text-gray-600 mb-1">
                  Tag ID
                </label>
                <input
                  type="text"
                  value={props.googleTagId}
                  onChange={(e) => props.onGoogleTagIdChange(e.target.value.trim())}
                  placeholder="AW-1234567890"
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-xs font-mono"
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Google Ads (AW-…), GA4 (G-…), or Floodlight (DC-…). Loads gtag.js on the published page.
                </p>
              </Section>

              <Section
                icon={<Target className="w-3.5 h-3.5" />}
                title="AudienceLab Pixel"
                tone={audiencelabTone}
                statusLabel={audiencelabTone === 'ok' ? 'Tracking' : 'Auto'}
              >
                {props.audiencelabPixelId ? (
                  <div className="text-xs text-gray-600 break-all">
                    Pixel ID: <span className="font-mono">{props.audiencelabPixelId}</span>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">
                    A pixel will be provisioned automatically on your next publish.
                  </div>
                )}
              </Section>

              <div className="pt-2 border-t border-gray-100">
                <button
                  onClick={() => { props.onPublish(); setOpen(false); }}
                  disabled={!props.canPublish || publishing}
                  className="w-full px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  title={
                    props.subdomain
                      ? `Publish to ${props.subdomain}.${PAGES_PARENT_DOMAIN}`
                      : 'Publish this page'
                  }
                >
                  {publishing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Rocket className="w-4 h-4" />
                  )}
                  {publishLabel}
                </button>
                {props.publishStatus === 'error' && (
                  <div
                    className="mt-2 text-xs text-red-600 break-words"
                    title={props.publishError || 'Publish failed'}
                  >
                    {props.publishError || 'Publish failed'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

PublishIntegrationsMenu.displayName = 'PublishIntegrationsMenu';
export default PublishIntegrationsMenu;

function TriggerDot({ tone }: { tone: DotTone }) {
  const cls =
    tone === 'ok' ? 'bg-emerald-300'
      : tone === 'pending' ? 'bg-amber-300'
        : tone === 'error' ? 'bg-red-400'
          : 'bg-white/40';
  return <span className={`w-1.5 h-1.5 rounded-full ${cls}`} />;
}

function Section({
  icon,
  title,
  tone,
  statusLabel,
  children,
}: {
  icon: ReactNode;
  title: string;
  tone: DotTone;
  statusLabel: string;
  children: ReactNode;
}) {
  const labelCls =
    tone === 'ok' ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
      : tone === 'pending' ? 'text-amber-700 bg-amber-50 border-amber-200'
        : tone === 'error' ? 'text-red-700 bg-red-50 border-red-200'
          : 'text-gray-500 bg-gray-50 border-gray-200';
  const dotCls =
    tone === 'ok' ? 'bg-emerald-500'
      : tone === 'pending' ? 'bg-amber-500'
        : tone === 'error' ? 'bg-red-500'
          : 'bg-gray-400';
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/40 p-2.5">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-gray-600">{icon}</span>
        <span className="text-xs font-semibold text-gray-800">{title}</span>
        <span
          className={`ml-auto inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${labelCls}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${dotCls}`} aria-hidden />
          {statusLabel}
        </span>
      </div>
      <div>{children}</div>
    </div>
  );
}

function computeSubdomainTone(sub: string | null, status: SubdomainStatus | null): DotTone {
  if (!sub) return 'off';
  if (status === 'ready') return 'ok';
  if (status === 'error') return 'error';
  return 'pending';
}

function computeCustomDomainTone(
  domain: string | null,
  status: CustomDomainStatus | null,
): DotTone {
  if (!domain) return 'off';
  if (status === 'ready') return 'ok';
  if (status === 'error') return 'error';
  return 'pending';
}

function subdomainStatusLabel(tone: DotTone, status: SubdomainStatus | null): string {
  if (tone === 'off') return 'Not set';
  if (tone === 'ok') return 'Live';
  if (tone === 'error') return 'Error';
  if (status === 'pending') return 'Setting up…';
  return 'Pending';
}

function formatBusinessPhoneInput(input: string): string {
  const d = input.replace(/\D/g, '').slice(0, 10);
  if (d.length === 0) return '';
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

function customDomainStatusLabel(tone: DotTone, status: CustomDomainStatus | null): string {
  if (tone === 'off') return 'Not set';
  if (tone === 'ok') return 'Live';
  if (tone === 'error') return 'Error';
  if (status === 'pending_dns') return 'DNS pending';
  if (status === 'pending_verification') return 'Verifying';
  return 'Pending';
}
