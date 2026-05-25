/**
 * Tests for the heatmap aggregation helper. Run with:
 *
 *   npx tsx --test src/lib/heatmap/aggregate.test.ts
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { aggregateEvents, type HeatmapEventRow } from './aggregate.ts';

function clickAt(session: string, x: number, y: number): HeatmapEventRow {
  return { session_id: session, event_type: 'click', x_norm: x, y_norm: y, scroll_pct: null };
}

function scrollFor(session: string, pct: number): HeatmapEventRow {
  return { session_id: session, event_type: 'scroll', x_norm: null, y_norm: null, scroll_pct: pct };
}

test('aggregateEvents: collapses clicks in the same bin into a single entry', () => {
  // 64 bins/axis → bin width 1/64 = 0.015625. (0.500, 0.500), (0.510, 0.510),
  // (0.505, 0.515) all map to x_idx=32, y_idx=32 → same cell.
  const rows: HeatmapEventRow[] = [
    clickAt('s1', 0.5, 0.5),
    clickAt('s2', 0.51, 0.51),
    clickAt('s3', 0.505, 0.515),
  ];
  const agg = aggregateEvents(rows);
  assert.equal(agg.totals.click, 3);
  assert.equal(agg.bins.click.length, 1);
  const [, , count] = agg.bins.click[0];
  assert.equal(count, 3);
});

test('aggregateEvents: distinct bins stay separate', () => {
  const rows: HeatmapEventRow[] = [
    clickAt('s1', 0.1, 0.1),
    clickAt('s2', 0.9, 0.9),
  ];
  const agg = aggregateEvents(rows);
  assert.equal(agg.bins.click.length, 2);
  assert.equal(agg.totals.click, 2);
});

test('aggregateEvents: clamps coordinates outside [0,1] to the nearest edge bin', () => {
  const rows: HeatmapEventRow[] = [
    clickAt('s1', -0.05, 1.5),
    clickAt('s2', 1.2, -0.1),
  ];
  const agg = aggregateEvents(rows);
  // Both clamp to opposite corners — should be two separate bins.
  assert.equal(agg.bins.click.length, 2);
  for (const [x, y] of agg.bins.click) {
    assert.ok(x >= 0 && x <= 1, `x in [0,1] got ${x}`);
    assert.ok(y >= 0 && y <= 1, `y in [0,1] got ${y}`);
  }
});

test('aggregateEvents: distinguishes click vs rage_click vs dead_click streams', () => {
  const rows: HeatmapEventRow[] = [
    clickAt('s1', 0.5, 0.5),
    { session_id: 's1', event_type: 'rage_click', x_norm: 0.5, y_norm: 0.5, scroll_pct: null },
    { session_id: 's1', event_type: 'dead_click', x_norm: 0.5, y_norm: 0.5, scroll_pct: null },
  ];
  const agg = aggregateEvents(rows);
  assert.equal(agg.totals.click, 1);
  assert.equal(agg.totals.rage_click, 1);
  assert.equal(agg.totals.dead_click, 1);
  assert.equal(agg.bins.click.length, 1);
  assert.equal(agg.bins.rage_click.length, 1);
  assert.equal(agg.bins.dead_click.length, 1);
});

test('aggregateEvents: skips clicks with null coords', () => {
  const rows: HeatmapEventRow[] = [
    { session_id: 's1', event_type: 'click', x_norm: null, y_norm: null, scroll_pct: null },
    clickAt('s2', 0.3, 0.3),
  ];
  const agg = aggregateEvents(rows);
  assert.equal(agg.bins.click.length, 1);
});

test('aggregateEvents: scrollDepth is cumulative session-reach by decile', () => {
  // s1 reaches 25%, s2 reaches 60%, s3 reaches 100%.
  const rows: HeatmapEventRow[] = [
    scrollFor('s1', 10),
    scrollFor('s1', 25),
    scrollFor('s2', 60),
    scrollFor('s3', 100),
  ];
  const agg = aggregateEvents(rows);
  // Index 0 (0%): all 3 sessions
  assert.equal(agg.scrollDepth[0], 3);
  // Index 2 (20%): s1@25, s2@60, s3@100 → all 3 reached >= 20
  assert.equal(agg.scrollDepth[2], 3);
  // Index 3 (30%): s1 only reached 25 → s2 + s3 = 2
  assert.equal(agg.scrollDepth[3], 2);
  // Index 6 (60%): s2 + s3
  assert.equal(agg.scrollDepth[6], 2);
  // Index 7 (70%): only s3
  assert.equal(agg.scrollDepth[7], 1);
  // Index 10 (100%): only s3
  assert.equal(agg.scrollDepth[10], 1);
});

test('aggregateEvents: counts distinct sessions across all event types', () => {
  const rows: HeatmapEventRow[] = [
    clickAt('s1', 0.1, 0.1),
    clickAt('s1', 0.2, 0.2),
    clickAt('s2', 0.3, 0.3),
    scrollFor('s3', 50),
  ];
  const agg = aggregateEvents(rows);
  assert.equal(agg.totals.sessions, 3);
});

test('aggregateEvents: empty input yields zero totals and empty bins', () => {
  const agg = aggregateEvents([]);
  assert.equal(agg.totals.sessions, 0);
  assert.equal(agg.totals.click, 0);
  assert.equal(agg.bins.click.length, 0);
  assert.equal(agg.scrollDepth.length, 11);
  assert.ok(agg.scrollDepth.every((n) => n === 0));
});

test('aggregateEvents: binsPerAxis option changes grid resolution', () => {
  // With 8 bins/axis, 0.10 and 0.20 fall into different cells (idx 0 vs 1).
  // With 2 bins/axis, both fall into idx 0.
  const rows: HeatmapEventRow[] = [
    clickAt('s1', 0.10, 0.10),
    clickAt('s2', 0.20, 0.20),
  ];
  const fine = aggregateEvents(rows, { binsPerAxis: 8 });
  assert.equal(fine.bins.click.length, 2);
  const coarse = aggregateEvents(rows, { binsPerAxis: 2 });
  assert.equal(coarse.bins.click.length, 1);
});
