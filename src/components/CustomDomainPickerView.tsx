'use client';

import { useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Globe2,
  Loader2,
  RefreshCw,
  X,
} from 'lucide-react';
import { dnsInstructionFor } from '@/lib/projects/customDomain';
import type { CustomDomainStatus } from '@/lib/projects/types';

interface ViewProps {
  domain: string | null;
  apex: boolean;
  status: CustomDomainStatus | null;
  errorMsg: string | null;
  editing: boolean;
  draft: string;
  draftError: string;
  saving: boolean;
  checking: boolean;
  txt: { name: string; value: string } | null;
  onDraftChange: (v: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onRemove: () => void;
  onRecheck: () => void;
}

/**
 * Presentation-only piece of CustomDomainPicker. Owns no state beyond the
 * tiny copy-to-clipboard feedback; everything else flows from the parent.
 */
export default function CustomDomainPickerView(p: ViewProps) {
  if (!p.domain && !p.editing) {
    return (
      <button
        type="button"
        onClick={p.onStartEdit}
        className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-orange-700 border border-dashed border-gray-300 hover:border-orange-300 rounded-md px-2 py-1"
        title="Use your own domain (e.g. www.acme.com)"
      >
        <Globe2 className="w-3.5 h-3.5" />
        Use custom domain
      </button>
    );
  }

  if (p.editing) {
    return (
      <div className="inline-flex flex-col gap-1 border border-gray-200 rounded-md bg-white px-2 py-1.5 shadow-sm">
        <div className="inline-flex items-center gap-1 text-xs">
          <input
            autoFocus
            value={p.draft}
            onChange={(e) => p.onDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') p.onSave();
              if (e.key === 'Escape') p.onCancelEdit();
            }}
            placeholder="www.acme.com"
            className="px-2 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 w-56"
          />
        </div>
        <div className="inline-flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={p.onSave}
            disabled={p.saving || !p.draft.trim()}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-orange-500 text-white text-[11px] font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {p.saving && <Loader2 className="w-3 h-3 animate-spin" />}
            {p.domain ? 'Replace' : 'Add domain'}
          </button>
          <button
            type="button"
            onClick={p.onCancelEdit}
            disabled={p.saving}
            className="px-2 py-1 rounded-md text-[11px] text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
        {p.draftError && (
          <span className="text-[11px] text-red-600 max-w-[360px]">{p.draftError}</span>
        )}
      </div>
    );
  }

  // Claimed state — show domain + status pill + actions.
  const domain = p.domain as string;
  return (
    <div className="inline-flex flex-col gap-1 max-w-[560px]">
      <div className="inline-flex items-center gap-1.5 text-xs">
        <Globe2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
        <a
          href={`https://${domain}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-orange-700 hover:text-orange-800 truncate max-w-[260px] inline-flex items-center gap-1"
          title={domain}
        >
          {domain}
          <ExternalLink className="w-3 h-3" />
        </a>
        <CustomDomainStatusBadge status={p.status} />
        <button
          type="button"
          onClick={p.onStartEdit}
          className="text-[11px] text-gray-500 hover:text-orange-700 underline-offset-2 hover:underline"
        >
          Change
        </button>
        <button
          type="button"
          onClick={p.onRemove}
          disabled={p.saving}
          className="text-[11px] text-gray-400 hover:text-red-600"
          title="Remove this custom domain"
        >
          <X className="w-3 h-3" />
        </button>
        {(p.status === 'pending_dns' || p.status === 'pending_verification' || p.status === 'error') && (
          <button
            type="button"
            onClick={p.onRecheck}
            disabled={p.checking}
            className="inline-flex items-center gap-1 text-[11px] text-orange-700 hover:text-orange-800 disabled:text-gray-400"
            title="Re-check ownership + DNS"
          >
            {p.checking ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Recheck
          </button>
        )}
      </div>
      <DomainInstructions
        status={p.status}
        domain={domain}
        apex={p.apex}
        txt={p.txt}
        errorMsg={p.errorMsg}
      />
    </div>
  );
}

function CustomDomainStatusBadge({ status }: { status: CustomDomainStatus | null }) {
  if (!status || status === 'ready') return null;
  const map: Record<Exclude<CustomDomainStatus, 'ready'>, { label: string; cls: string; title: string }> = {
    pending_verification: {
      label: 'Verify ownership',
      cls: 'bg-amber-50 text-amber-700 border-amber-200',
      title: 'Vercel needs the TXT record below to confirm you own this domain.',
    },
    pending_dns: {
      label: 'DNS pending',
      cls: 'bg-amber-50 text-amber-700 border-amber-200',
      title: 'Point your DNS to Vercel using the record below.',
    },
    error: {
      label: 'Error',
      cls: 'bg-red-50 text-red-700 border-red-200',
      title: 'Last attach attempt failed — see message + Recheck.',
    },
  };
  const m = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] font-medium ${m.cls}`}
      title={m.title}
    >
      {m.label}
    </span>
  );
}

function CopyValue({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1200); }
        catch { /* clipboard blocked */ }
      }}
      className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-orange-700"
      title="Copy"
    >
      {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

interface InstrProps {
  status: CustomDomainStatus | null;
  domain: string;
  apex: boolean;
  txt: { name: string; value: string } | null;
  errorMsg: string | null;
}

function DomainInstructions({ status, domain, apex, txt, errorMsg }: InstrProps) {
  if (status === 'ready' || status === null) return null;

  if (status === 'error' && errorMsg) {
    return (
      <span className="text-[11px] text-red-600 max-w-[460px] break-words">{errorMsg}</span>
    );
  }

  if (status === 'pending_verification') {
    const name = txt?.name ?? `_vercel`;
    const value = txt?.value ?? '(open Recheck once Vercel responds)';
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50/50 p-2 text-[11px] text-gray-700 space-y-1">
        <p className="font-medium text-amber-800">Add this TXT record at your DNS host, then hit Recheck:</p>
        <div className="grid grid-cols-[auto_1fr_auto] gap-x-2 gap-y-0.5 items-center font-mono">
          <span className="text-gray-500">Type</span><span>TXT</span><span />
          <span className="text-gray-500">Name</span><span className="break-all">{name}</span><CopyValue text={name} />
          <span className="text-gray-500">Value</span><span className="break-all">{value}</span><CopyValue text={value} />
        </div>
      </div>
    );
  }

  // pending_dns
  const hint = dnsInstructionFor(domain, apex);
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50/50 p-2 text-[11px] text-gray-700 space-y-1">
      <p className="font-medium text-amber-800">
        Point your DNS to Vercel, then hit Recheck:
      </p>
      <div className="grid grid-cols-[auto_1fr_auto] gap-x-2 gap-y-0.5 items-center font-mono">
        <span className="text-gray-500">Type</span><span>{hint.recordType}</span><span />
        <span className="text-gray-500">Host</span><span className="break-all">{hint.host}</span><CopyValue text={hint.host} />
        <span className="text-gray-500">Value</span><span className="break-all">{hint.value}</span><CopyValue text={hint.value} />
      </div>
      <p className="text-gray-500">
        TTL: leave default. HTTPS issues automatically within ~1 min after DNS resolves.
      </p>
    </div>
  );
}
