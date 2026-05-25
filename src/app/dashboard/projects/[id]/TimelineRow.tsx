'use client';

import {
  ChevronDown, ChevronRight,
  FileText, Users,
  PhoneIncoming, PhoneOutgoing, PhoneMissed, Voicemail,
} from 'lucide-react';
import {
  payloadString, pickChoiceField,
} from '@/lib/leads/csv';
import {
  identifiedDisplayName, identifiedLocation,
  identifiedPrimaryEmail, identifiedPrimaryPhone,
} from '@/lib/audiencelab/identified';
import {
  callOutcomeLabel, formatCallLocation, formatDuration,
} from '@/lib/callrail/calls';
import { formatRelative, truncate, type TimelineItem } from './timeline';
import TimelineDetail from './TimelineDetail';

interface Props {
  item: TimelineItem;
  expanded: boolean;
  onToggle: () => void;
}

/**
 * Single row in the unified activity timeline. Renders the kind pill,
 * relative timestamp, identity (name + email/phone), and a one-line summary
 * specific to the stream (subject for forms, outcome+duration for calls,
 * company+location for visitors). Click to expand the full detail block.
 */
export default function TimelineRow({ item, expanded, onToggle }: Props) {
  const summary = renderSummary(item);
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 text-left"
      >
        <span className="mt-0.5 text-gray-400 shrink-0">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </span>
        <KindPillForItem item={item} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-medium text-gray-900 truncate">{summary.title}</span>
            {summary.secondary && (
              <span className="text-xs text-gray-500 truncate">{summary.secondary}</span>
            )}
          </div>
          {summary.subtitle && (
            <div className="text-xs text-gray-600 mt-0.5 truncate">{summary.subtitle}</div>
          )}
        </div>
        <span
          className="text-xs text-gray-500 whitespace-nowrap shrink-0"
          title={item.at ? new Date(item.at).toLocaleString() : ''}
        >
          {formatRelative(item.at)}
        </span>
      </button>
      {expanded && (
        <div className="bg-gray-50 border-t border-gray-100 px-4 py-4">
          <TimelineDetail item={item} />
        </div>
      )}
    </li>
  );
}

interface Summary { title: string; secondary?: string; subtitle?: string }

function renderSummary(item: TimelineItem): Summary {
  if (item.kind === 'form' && item.lead) {
    const name = payloadString(item.lead.payload, 'name');
    const email = payloadString(item.lead.payload, 'email');
    const phone = payloadString(item.lead.payload, 'phone');
    const choice = pickChoiceField(item.lead.payload);
    const message = payloadString(item.lead.payload, 'message');
    return {
      title: name || email || phone || 'Form submission',
      secondary: [email, phone].filter(Boolean).join(' · '),
      subtitle: choice
        ? `${choice.key}: ${truncate(choice.value, 60)}`
        : message ? truncate(message, 80) : undefined,
    };
  }
  if (item.kind === 'call' && item.call) {
    const c = item.call;
    const outcome = callOutcomeLabel(c);
    const location = formatCallLocation(c);
    const parts = [
      `${outcome}`,
      formatDuration(c.duration),
      location || null,
      c.source ? truncate(c.source, 30) : null,
    ].filter(Boolean) as string[];
    return {
      title: c.customerName || c.customerPhone || 'Unknown caller',
      secondary: c.customerPhone || undefined,
      subtitle: parts.join(' · '),
    };
  }
  if (item.kind === 'visitor' && item.visitor) {
    const v = item.visitor;
    const name = identifiedDisplayName(v);
    const email = identifiedPrimaryEmail(v);
    const phone = identifiedPrimaryPhone(v);
    const location = identifiedLocation(v);
    const company = v.resolution.COMPANY_NAME?.trim() || '';
    const parts = [company, location].filter(Boolean) as string[];
    return {
      title: name !== '—' ? name : (email || phone || 'Anonymous visitor'),
      secondary: [email, phone].filter(Boolean).join(' · '),
      subtitle: parts.length ? parts.join(' · ') : undefined,
    };
  }
  return { title: 'Activity' };
}

function KindPillForItem({ item }: { item: TimelineItem }) {
  if (item.kind === 'call' && item.call) {
    const outcome = callOutcomeLabel(item.call);
    const Icon =
      outcome === 'Voicemail' ? Voicemail
      : outcome === 'Missed' ? PhoneMissed
      : item.call.direction === 'outbound' ? PhoneOutgoing
      : PhoneIncoming;
    return <Pill icon={<Icon className="w-3 h-3" />} label="Call" cls="bg-emerald-50 text-emerald-700 border-emerald-200" />;
  }
  if (item.kind === 'form') {
    return <Pill icon={<FileText className="w-3 h-3" />} label="Form" cls="bg-blue-50 text-blue-700 border-blue-200" />;
  }
  return <Pill icon={<Users className="w-3 h-3" />} label="Visitor" cls="bg-purple-50 text-purple-700 border-purple-200" />;
}

function Pill({ icon, label, cls }: { icon: React.ReactNode; label: string; cls: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[11px] font-medium shrink-0 ${cls}`}>
      {icon}
      {label}
    </span>
  );
}
