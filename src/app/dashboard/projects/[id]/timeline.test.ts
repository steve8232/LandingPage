/**
 * Tests for the per-project activity timeline merger. Run with:
 *
 *   npx tsx --test 'src/app/dashboard/projects/[id]/timeline.test.ts'
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { buildTimeline } from './timeline.ts';
import type { LeadDTO } from '@/lib/leads/types';
import type { IdentifiedVisitorDTO } from '@/lib/audiencelab/identified';
import type { CallDTO } from '@/lib/callrail/calls';

function lead(id: string, createdAt: string): LeadDTO {
  return {
    id,
    projectId: 'p1',
    payload: {},
    userAgent: null,
    referer: null,
    sessionId: null,
    createdAt,
  };
}

function visitor(id: string, lastSeenAt: string): IdentifiedVisitorDTO {
  return {
    id,
    projectId: 'p1',
    lastSeenAt,
    lastUrl: null,
    edid: null,
    sessionId: null,
    resolution: {} as IdentifiedVisitorDTO['resolution'],
  };
}

function call(id: string, startTime: string): CallDTO {
  return {
    id,
    projectId: 'p1',
    startTime,
    direction: 'inbound',
    answered: true,
    duration: 0,
    voicemail: false,
    customerName: null,
    customerPhone: null,
    customerCity: null,
    customerState: null,
    trackingPhone: null,
    source: null,
    campaign: null,
    landingPageUrl: null,
    recordingUrl: null,
    transcription: null,
    sessionId: null,
  };
}

test('buildTimeline: tags each source with its kind and prefixed id', () => {
  const items = buildTimeline({
    leads: [lead('L1', '2025-01-01T00:00:00Z')],
    identified: [visitor('V1', '2025-01-02T00:00:00Z')],
    calls: [call('C1', '2025-01-03T00:00:00Z')],
  });

  assert.equal(items.length, 3);

  const byKind = Object.fromEntries(items.map((i) => [i.kind, i]));
  assert.equal(byKind.form.id, 'form:L1');
  assert.equal(byKind.form.lead?.id, 'L1');
  assert.equal(byKind.visitor.id, 'visitor:V1');
  assert.equal(byKind.visitor.visitor?.id, 'V1');
  assert.equal(byKind.call.id, 'call:C1');
  assert.equal(byKind.call.call?.id, 'C1');
});

test('buildTimeline: sorts newest first across all three sources', () => {
  const items = buildTimeline({
    leads: [lead('L_old', '2025-01-01T00:00:00Z'), lead('L_new', '2025-01-05T00:00:00Z')],
    identified: [visitor('V_mid', '2025-01-03T00:00:00Z')],
    calls: [call('C_newest', '2025-01-06T00:00:00Z'), call('C_oldish', '2025-01-02T00:00:00Z')],
  });

  assert.deepEqual(
    items.map((i) => i.id),
    [
      'call:C_newest',
      'form:L_new',
      'visitor:V_mid',
      'call:C_oldish',
      'form:L_old',
    ],
  );
});

test('buildTimeline: items without a timestamp sink to the bottom', () => {
  const items = buildTimeline({
    leads: [lead('L_no_ts', ''), lead('L_dated', '2025-01-01T00:00:00Z')],
    identified: [visitor('V_no_ts', '')],
    calls: [call('C_dated', '2025-01-02T00:00:00Z')],
  });

  // The two dated items come first (newest → oldest), then the two undated
  // items in source-insertion order (leads, visitors, calls).
  assert.deepEqual(
    items.map((i) => i.id),
    ['call:C_dated', 'form:L_dated', 'form:L_no_ts', 'visitor:V_no_ts'],
  );
});

test('buildTimeline: empty input yields empty array', () => {
  const items = buildTimeline({ leads: [], identified: [], calls: [] });
  assert.deepEqual(items, []);
});

test('buildTimeline: id prefix avoids collisions between source ids', () => {
  // Same raw id "X1" across all three streams; the prefix keeps React keys
  // stable.
  const items = buildTimeline({
    leads: [lead('X1', '2025-01-03T00:00:00Z')],
    identified: [visitor('X1', '2025-01-02T00:00:00Z')],
    calls: [call('X1', '2025-01-01T00:00:00Z')],
  });

  const ids = items.map((i) => i.id);
  assert.equal(new Set(ids).size, 3);
  assert.ok(ids.includes('form:X1'));
  assert.ok(ids.includes('visitor:X1'));
  assert.ok(ids.includes('call:X1'));
});
