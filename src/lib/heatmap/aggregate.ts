/**
 * Pure aggregation helpers for the heatmap read API. Takes the raw rows
 * pulled from `public.heatmap_events` and produces the compact wire shape
 * the dashboard renders.
 *
 * Kept free of Supabase/Next imports so the binning + histogram logic can
 * be exercised by unit tests without any DB or HTTP plumbing.
 */

export type HeatmapEventType = 'click' | 'rage_click' | 'dead_click' | 'scroll';

export interface HeatmapEventRow {
  session_id: string;
  event_type: HeatmapEventType;
  x_norm: number | null;
  y_norm: number | null;
  scroll_pct: number | null;
}

/** [x, y, count] where x,y are bin-centre normalised coords (0..1). */
export type HeatmapBin = [number, number, number];

export interface HeatmapAggregate {
  totals: {
    sessions: number;
    click: number;
    rage_click: number;
    dead_click: number;
    scroll: number;
  };
  bins: {
    click: HeatmapBin[];
    rage_click: HeatmapBin[];
    dead_click: HeatmapBin[];
  };
  /**
   * Cumulative session-reach by 10% scroll bucket, length 11 (indices 0..10
   * for 0%..100%). `scrollDepth[i]` = number of distinct sessions whose
   * max-reached scroll depth was >= i*10%.
   */
  scrollDepth: number[];
}

export interface AggregateOptions {
  /**
   * Bin grid resolution per axis. The 0..1 coordinate space is split into
   * `binsPerAxis * binsPerAxis` cells; events that fall in the same cell
   * collapse to one HeatmapBin entry with `count` summed. Default 64 → a
   * 64x64 grid, which renders cleanly at the snapshot widths we capture.
   */
  binsPerAxis?: number;
}

const DEFAULT_BINS_PER_AXIS = 64;

/**
 * Snap a normalised coordinate (0..1) onto a binsPerAxis grid and return
 * the bin centre coordinate. Clamps out-of-range values into [0,1] so
 * floating-point fuzz at the edges doesn't escape the grid.
 */
function binCentre(v: number, binsPerAxis: number): number {
  const clamped = v < 0 ? 0 : v > 1 ? 1 : v;
  const idx = Math.min(binsPerAxis - 1, Math.floor(clamped * binsPerAxis));
  return (idx + 0.5) / binsPerAxis;
}

export function aggregateEvents(
  rows: HeatmapEventRow[],
  opts: AggregateOptions = {}
): HeatmapAggregate {
  const binsPerAxis = opts.binsPerAxis ?? DEFAULT_BINS_PER_AXIS;

  const clickBins = new Map<string, number>();
  const rageBins = new Map<string, number>();
  const deadBins = new Map<string, number>();

  let clickCount = 0;
  let rageCount = 0;
  let deadCount = 0;
  let scrollCount = 0;

  // Track the deepest scroll reached per session so the depth histogram
  // counts sessions, not raw scroll events.
  const sessionMaxScroll = new Map<string, number>();
  const sessions = new Set<string>();

  for (const r of rows) {
    sessions.add(r.session_id);

    if (r.event_type === 'scroll') {
      scrollCount++;
      const pct = r.scroll_pct ?? 0;
      const prev = sessionMaxScroll.get(r.session_id) ?? 0;
      if (pct > prev) sessionMaxScroll.set(r.session_id, pct);
      continue;
    }

    if (r.x_norm == null || r.y_norm == null) continue;
    const cx = binCentre(r.x_norm, binsPerAxis);
    const cy = binCentre(r.y_norm, binsPerAxis);
    const key = `${cx}:${cy}`;

    if (r.event_type === 'click') {
      clickCount++;
      clickBins.set(key, (clickBins.get(key) ?? 0) + 1);
    } else if (r.event_type === 'rage_click') {
      rageCount++;
      rageBins.set(key, (rageBins.get(key) ?? 0) + 1);
    } else if (r.event_type === 'dead_click') {
      deadCount++;
      deadBins.set(key, (deadBins.get(key) ?? 0) + 1);
    }
  }

  // Cumulative depth histogram: a session that reached 60% counts in
  // buckets [0,10,20,30,40,50,60] and not in [70,80,90,100].
  const scrollDepth = new Array(11).fill(0) as number[];
  for (const maxPct of sessionMaxScroll.values()) {
    const top = Math.min(10, Math.floor(maxPct / 10));
    for (let i = 0; i <= top; i++) scrollDepth[i]++;
  }

  return {
    totals: {
      sessions: sessions.size,
      click: clickCount,
      rage_click: rageCount,
      dead_click: deadCount,
      scroll: scrollCount,
    },
    bins: {
      click: mapToBins(clickBins),
      rage_click: mapToBins(rageBins),
      dead_click: mapToBins(deadBins),
    },
    scrollDepth,
  };
}

function mapToBins(m: Map<string, number>): HeatmapBin[] {
  const out: HeatmapBin[] = [];
  for (const [key, count] of m) {
    const [xs, ys] = key.split(':');
    out.push([Number(xs), Number(ys), count]);
  }
  return out;
}
