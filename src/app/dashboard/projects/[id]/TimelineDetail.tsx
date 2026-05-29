'use client';

import Link from 'next/link';
import { Activity } from 'lucide-react';
import type { LeadDTO } from '@/lib/leads/types';
import type { IdentifiedVisitorDTO } from '@/lib/audiencelab/identified';
import { type CallDTO, formatDuration } from '@/lib/callrail/calls';
import type { TimelineItem } from './timeline';

/**
 * Expanded-row body for a TimelineItem. Renders the same three detail
 * surfaces the legacy /dashboard/leads page exposed, picked by item kind:
 *   • form    → full payload + metadata
 *   • call    → recording player, transcription, call meta
 *   • visitor → full V4 resolution map + event meta
 */
export default function TimelineDetail({ item }: { item: TimelineItem }) {
  if (item.kind === 'form' && item.lead) return <LeadDetail lead={item.lead} />;
  if (item.kind === 'call' && item.call) return <CallDetail call={item.call} />;
  if (item.kind === 'visitor' && item.visitor) return <VisitorDetail visitor={item.visitor} />;
  return null;
}

function LeadDetail({ lead }: { lead: LeadDTO }) {
  const entries = Object.entries(lead.payload);
  return (
    <div className="grid md:grid-cols-2 gap-4 text-xs">
      <div>
        <h3 className="font-medium text-gray-700 mb-2">Submission</h3>
        {entries.length === 0 ? (
          <p className="text-gray-500">(empty payload)</p>
        ) : (
          <dl className="space-y-1">
            {entries.map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <dt className="font-mono text-gray-500 min-w-[6rem] shrink-0">{k}</dt>
                <dd className="text-gray-800 break-words">
                  {typeof v === 'string' ? v : JSON.stringify(v)}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      <div>
        <h3 className="font-medium text-gray-700 mb-2">Metadata</h3>
        <dl className="space-y-1">
          <div className="flex gap-2">
            <dt className="font-mono text-gray-500 min-w-[6rem] shrink-0">submitted</dt>
            <dd className="text-gray-800">{new Date(lead.createdAt).toLocaleString()}</dd>
          </div>
          {lead.userAgent && (
            <div className="flex gap-2">
              <dt className="font-mono text-gray-500 min-w-[6rem] shrink-0">user agent</dt>
              <dd className="text-gray-800 break-all">{lead.userAgent}</dd>
            </div>
          )}
          {lead.referer && (
            <div className="flex gap-2">
              <dt className="font-mono text-gray-500 min-w-[6rem] shrink-0">referer</dt>
              <dd className="text-gray-800 break-all">{lead.referer}</dd>
            </div>
          )}
          {lead.sessionId && (
            <div className="flex gap-2 pt-1">
              <dt className="font-mono text-gray-500 min-w-[6rem] shrink-0">heatmap</dt>
              <dd>
                <Link
                  href={`/dashboard/projects/${lead.projectId}/heatmap?sessionId=${encodeURIComponent(lead.sessionId)}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
                >
                  <Activity className="w-3 h-3" />
                  View this visitor&apos;s heatmap
                </Link>
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}

function CallDetail({ call }: { call: CallDTO }) {
  return (
    <div className="grid md:grid-cols-2 gap-4 text-xs">
      <div className="space-y-3">
        <div>
          <h3 className="font-medium text-gray-700 mb-2">Recording</h3>
          {call.recordingUrl ? (
            <audio controls preload="none" src={call.recordingUrl} className="w-full">
              Your browser does not support inline audio.
            </audio>
          ) : (
            <p className="text-gray-500">(no recording available)</p>
          )}
        </div>
        {call.transcription && (
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Transcription</h3>
            <p className="text-gray-800 whitespace-pre-wrap">{call.transcription}</p>
          </div>
        )}
      </div>
      <div>
        <h3 className="font-medium text-gray-700 mb-2">Call</h3>
        <dl className="space-y-1">
          <Row k="started" v={call.startTime ? new Date(call.startTime).toLocaleString() : '—'} />
          <Row k="direction" v={call.direction} />
          <Row k="duration" v={`${formatDuration(call.duration)} (${call.duration}s)`} />
          {call.trackingPhone && <Row k="tracking #" v={call.trackingPhone} />}
          {call.campaign && <Row k="campaign" v={call.campaign} />}
          {call.landingPageUrl && <Row k="landing url" v={call.landingPageUrl} breakAll />}
          <Row k="call id" v={call.id} mono breakAll />
          {call.sessionId && (
            <div className="flex gap-2 pt-1">
              <dt className="font-mono text-gray-500 min-w-[7rem] shrink-0">heatmap</dt>
              <dd>
                <Link
                  href={`/dashboard/projects/${call.projectId}/heatmap?sessionId=${encodeURIComponent(call.sessionId)}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
                >
                  <Activity className="w-3 h-3" />
                  View this caller&apos;s heatmap
                </Link>
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}

function VisitorDetail({ visitor }: { visitor: IdentifiedVisitorDTO }) {
  const entries = Object.entries(visitor.resolution)
    .filter(([, v]) => typeof v === 'string' && v.trim() !== '');
  return (
    <div className="grid md:grid-cols-2 gap-4 text-xs">
      <div>
        <h3 className="font-medium text-gray-700 mb-2">Resolution</h3>
        {entries.length === 0 ? (
          <p className="text-gray-500">(no resolution fields)</p>
        ) : (
          <dl className="space-y-1">
            {entries.map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <dt className="font-mono text-gray-500 min-w-[10rem] shrink-0">{k}</dt>
                <dd className="text-gray-800 break-words">{v as string}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      <div>
        <h3 className="font-medium text-gray-700 mb-2">Event</h3>
        <dl className="space-y-1">
          <Row k="last seen" v={visitor.lastSeenAt ? new Date(visitor.lastSeenAt).toLocaleString() : '—'} />
          {visitor.lastUrl && <Row k="last url" v={visitor.lastUrl} breakAll />}
          {visitor.edid && <Row k="edid" v={visitor.edid} mono breakAll />}
          {visitor.sessionId && (
            <div className="flex gap-2 pt-1">
              <dt className="font-mono text-gray-500 min-w-[7rem] shrink-0">heatmap</dt>
              <dd>
                <Link
                  href={`/dashboard/projects/${visitor.projectId}/heatmap?sessionId=${encodeURIComponent(visitor.sessionId)}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
                >
                  <Activity className="w-3 h-3" />
                  View this visitor&apos;s heatmap
                </Link>
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}

function Row({ k, v, mono, breakAll }: { k: string; v: string; mono?: boolean; breakAll?: boolean }) {
  const ddCls = `${mono ? 'font-mono ' : ''}${breakAll ? 'break-all ' : ''}text-gray-800`;
  return (
    <div className="flex gap-2">
      <dt className="font-mono text-gray-500 min-w-[7rem] shrink-0">{k}</dt>
      <dd className={ddCls}>{v}</dd>
    </div>
  );
}
