'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowLeft, Loader2, AlertCircle, Camera } from 'lucide-react';
import simpleheat from 'simpleheat';
import ProjectTabs from '../ProjectTabs';
import type { CreationMethod } from '@/lib/projects/types';

export interface ProjectLite {
  id: string;
  title: string;
  subdomain: string | null;
  customDomain: string | null;
  creationMethod?: CreationMethod;
}

export interface DeploymentLite {
  id: string;
  url: string | null;
  status: string;
  createdAt: string;
}

interface HeatmapResponse {
  device: 'desktop' | 'mobile';
  range: { from: string; to: string };
  deployment: { id: string; url: string | null; createdAt: string } | null;
  snapshot:
    | { url: string | null; widthPx: number; heightPx: number | null; status: 'pending' | 'ready' | 'error' }
    | null;
  totals: { sessions: number; click: number; rage_click: number; dead_click: number; scroll: number };
  bins: {
    click: Array<[number, number, number]>;
    rage_click: Array<[number, number, number]>;
    dead_click: Array<[number, number, number]>;
  };
  scrollDepth: number[];
  truncated: boolean;
}

type Device = 'desktop' | 'mobile';
type RangeKey = '7d' | '30d' | '90d';

const RANGE_DAYS: Record<RangeKey, number> = { '7d': 7, '30d': 30, '90d': 90 };

interface Props {
  project: ProjectLite;
  deployments: DeploymentLite[];
  userEmail: string;
}

export default function HeatmapClient({ project, deployments, userEmail }: Props) {
  const [device, setDevice] = useState<Device>('desktop');
  const [deploymentId, setDeploymentId] = useState<string>(''); // '' = latest with snapshot
  const [range, setRange] = useState<RangeKey>('30d');
  const [data, setData] = useState<HeatmapResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch on dep change. The lint rule against synchronous setState in effects
  // is overly strict for the canonical "load data when filters change" pattern;
  // disabling locally with an explanation rather than introducing a wrapper
  // state machine just to silence it.
  useEffect(() => {
    let cancelled = false;
    /* eslint-disable react-hooks/set-state-in-effect */
    setLoading(true);
    setError('');
    /* eslint-enable react-hooks/set-state-in-effect */
    const params = new URLSearchParams({ device });
    if (deploymentId) params.set('deploymentId', deploymentId);
    const days = RANGE_DAYS[range];
    const from = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
    params.set('from', from);
    fetch(`/api/projects/${project.id}/heatmap?${params.toString()}`, { credentials: 'include' })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `HTTP ${r.status}`);
        return (await r.json()) as HeatmapResponse;
      })
      .then((json) => { if (!cancelled) setData(json); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Load failed'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [project.id, device, deploymentId, range]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-900 hover:text-orange-600">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">SparkPage</span>
          </Link>
          <span className="text-sm text-gray-500 hidden sm:inline">{userEmail}</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-6">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-lg md:text-xl font-bold text-gray-900 truncate">
            {project.title}
          </h1>
        </div>

        <div className="mb-4">
          <ProjectTabs projectId={project.id} active="heatmap" creationMethod={project.creationMethod} />
        </div>

        <Controls
          device={device}
          onDeviceChange={setDevice}
          deployments={deployments}
          deploymentId={deploymentId}
          onDeploymentChange={setDeploymentId}
          range={range}
          onRangeChange={setRange}
        />

        <StatsStrip totals={data?.totals} truncated={data?.truncated} />

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr,260px] gap-4">
          <HeatmapViewer data={data} loading={loading} />
          <ScrollDepthChart scrollDepth={data?.scrollDepth ?? []} />
        </div>
      </main>
    </div>
  );
}

function Controls(props: {
  device: Device;
  onDeviceChange: (d: Device) => void;
  deployments: DeploymentLite[];
  deploymentId: string;
  onDeploymentChange: (id: string) => void;
  range: RangeKey;
  onRangeChange: (r: RangeKey) => void;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-wrap items-center gap-3">
      <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden text-sm">
        {(['desktop', 'mobile'] as const).map((d) => (
          <button
            key={d}
            onClick={() => props.onDeviceChange(d)}
            className={`px-3 py-1.5 ${
              props.device === d
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {d === 'desktop' ? 'Desktop' : 'Mobile'}
          </button>
        ))}
      </div>

      <label className="text-sm text-gray-600 inline-flex items-center gap-2">
        <span>Deployment</span>
        <select
          value={props.deploymentId}
          onChange={(e) => props.onDeploymentChange(e.target.value)}
          className="border border-gray-200 rounded-lg px-2 py-1 text-sm bg-white"
        >
          <option value="">Latest with snapshot</option>
          {props.deployments.map((d) => (
            <option key={d.id} value={d.id}>
              {new Date(d.createdAt).toLocaleString()} · {d.status}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm text-gray-600 inline-flex items-center gap-2">
        <span>Range</span>
        <select
          value={props.range}
          onChange={(e) => props.onRangeChange(e.target.value as RangeKey)}
          className="border border-gray-200 rounded-lg px-2 py-1 text-sm bg-white"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </label>
    </div>
  );
}

function StatsStrip({
  totals,
  truncated,
}: {
  totals: HeatmapResponse['totals'] | undefined;
  truncated: boolean | undefined;
}) {
  const items: Array<[string, number]> = [
    ['Sessions', totals?.sessions ?? 0],
    ['Clicks', totals?.click ?? 0],
    ['Rage clicks', totals?.rage_click ?? 0],
    ['Dead clicks', totals?.dead_click ?? 0],
    ['Scroll samples', totals?.scroll ?? 0],
  ];
  return (
    <div className="mt-3 bg-white border border-gray-200 rounded-xl p-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
      {items.map(([label, value]) => (
        <div key={label} className="inline-flex items-baseline gap-1.5">
          <span className="text-gray-500">{label}</span>
          <span className="font-semibold text-gray-900 tabular-nums">{value.toLocaleString()}</span>
        </div>
      ))}
      {truncated && (
        <span className="ml-auto text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
          truncated — showing most recent 50k events
        </span>
      )}
    </div>
  );
}

function HeatmapViewer({
  data,
  loading,
}: {
  data: HeatmapResponse | null;
  loading: boolean;
}) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imgReady, setImgReady] = useState(false);

  // Merge click + rage + dead bins. All overlaid: each bin's count contributes
  // 1:1 to the intensity field. Rage / dead are visually rarer so they tend to
  // pop on hover regardless without explicit weighting.
  const points = useMemo(() => {
    if (!data) return [] as Array<[number, number, number]>;
    return [...data.bins.click, ...data.bins.rage_click, ...data.bins.dead_click];
  }, [data]);

  useEffect(() => {
    if (!imgReady || !data?.snapshot?.widthPx || !data.snapshot.heightPx) return;
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    // Match canvas pixel buffer to snapshot natural dimensions for crisp render.
    const w = data.snapshot.widthPx;
    const h = data.snapshot.heightPx;
    canvas.width = w;
    canvas.height = h;
    const heat = simpleheat(canvas);
    // Radius scales with snapshot width so desktop dots aren't tiny and mobile
    // dots don't blob. Floor at 8px so sparse heatmaps remain visible.
    const radius = Math.max(8, Math.round(w / 50));
    heat.radius(radius, radius * 0.75);
    const pixelPoints = points.map(([x, y, c]) => [x * w, y * h, c] as [number, number, number]);
    heat.data(pixelPoints);
    // Cap max so a single hot bin doesn't black out the rest.
    const maxCount = pixelPoints.reduce((m, p) => (p[2] > m ? p[2] : m), 1);
    heat.max(Math.max(3, Math.ceil(maxCount * 0.5)));
    heat.draw(0.05);
  }, [imgReady, data, points]);

  if (loading && !data) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 flex items-center justify-center text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading heatmap…
      </div>
    );
  }
  if (!data) return null;
  const snap = data.snapshot;
  if (!snap || snap.status !== 'ready' || !snap.url) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500">
        <Camera className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm">
          {snap?.status === 'pending' && 'Snapshot capture in progress — try again in a moment.'}
          {snap?.status === 'error' && 'Snapshot capture failed for this deployment.'}
          {!snap && 'No snapshot available yet. Publish the page to capture one.'}
        </p>
      </div>
    );
  }
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-2 overflow-auto">
      <div className="relative inline-block">
        {/* Plain <img>: snapshot URL is a short-lived signed Supabase Storage
            link; next/image's optimizer would cache and rewrite it, breaking
            the signature and adding no real benefit for an in-dashboard view. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={snap.url}
          alt="Page snapshot"
          onLoad={() => setImgReady(true)}
          className="block max-w-full h-auto"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
      </div>
    </div>
  );
}

function ScrollDepthChart({ scrollDepth }: { scrollDepth: number[] }) {
  const max = scrollDepth.reduce((m, n) => (n > m ? n : m), 0);
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <h2 className="text-sm font-semibold text-gray-900 mb-3">Scroll depth</h2>
      {max === 0 ? (
        <p className="text-xs text-gray-500">No scroll data yet.</p>
      ) : (
        <div className="space-y-1.5">
          {scrollDepth.map((count, i) => {
            const pct = max > 0 ? Math.round((count / max) * 100) : 0;
            return (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-9 text-right text-gray-500 tabular-nums">{i * 10}%</span>
                <div className="flex-1 h-3 bg-gray-100 rounded">
                  <div
                    className="h-3 bg-orange-500 rounded"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-10 text-right text-gray-700 tabular-nums">
                  {count.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
