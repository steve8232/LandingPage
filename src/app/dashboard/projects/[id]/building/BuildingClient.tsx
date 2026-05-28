'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import GeneratingScreen from '@/components/GeneratingScreen';
import type { BuildStatus } from '@/lib/projects/types';

/**
 * Polled at this cadence while build_status='building'. Each tick is a
 * cheap (~one row) read; polling stops as soon as the status settles
 * into 'ready' or 'failed'.
 */
const POLL_INTERVAL_MS = 2000;

/**
 * Ordered list of stage labels the runUrlOnboardPipeline helper writes
 * to projects.build_stage. Passed to GeneratingScreen so the dot
 * checklist ticks through correctly. Keep in sync with STAGE in
 * runUrlOnboardPipeline.ts.
 */
const STAGES = [
  'Scanning your site',
  'Reading the page',
  'Drafting your new copy',
  'Polishing tone and headlines',
  'Finding nearby neighborhoods',
  'Sourcing photos',
  'Almost done',
] as const;

interface BuildingClientProps {
  projectId: string;
  initialStatus: BuildStatus;
  initialStage: string | null;
  initialError: string | null;
}

interface StatusResponse {
  status: BuildStatus;
  stage: string | null;
  error: string | null;
  title: string;
  templateId: string;
}

export default function BuildingClient({
  projectId,
  initialStatus,
  initialStage,
  initialError,
}: BuildingClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState<BuildStatus>(initialStatus);
  const [stage, setStage] = useState<string | null>(initialStage);
  const [errorMsg, setErrorMsg] = useState<string | null>(initialError);
  const pollHandle = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchOnce = useCallback(async (): Promise<StatusResponse | null> => {
    try {
      const res = await fetch(`/api/projects/${projectId}/build-status`, {
        credentials: 'include',
      });
      if (!res.ok) return null;
      return (await res.json()) as StatusResponse;
    } catch {
      return null;
    }
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      const json = await fetchOnce();
      if (cancelled) return;
      if (json) {
        setStatus(json.status);
        setStage(json.stage);
        setErrorMsg(json.error);
        if (json.status === 'ready') {
          router.replace(`/?project=${projectId}`);
          return;
        }
        if (json.status === 'failed') {
          return;
        }
      }
      pollHandle.current = setTimeout(tick, POLL_INTERVAL_MS);
    }
    if (status === 'building') {
      tick();
    } else if (status === 'ready') {
      router.replace(`/?project=${projectId}`);
    }
    return () => {
      cancelled = true;
      if (pollHandle.current) clearTimeout(pollHandle.current);
    };
  }, [fetchOnce, projectId, router, status]);

  if (status === 'failed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Couldn&apos;t build your page
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Something went wrong while scanning the site you submitted.
          </p>
          {errorMsg && (
            <div className="text-left text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-6 break-words">
              {errorMsg}
            </div>
          )}
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to dashboard
            </Link>
            <Link
              href="/dashboard/new/url"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 shadow-md shadow-orange-200"
            >
              Try another URL
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <GeneratingScreen stage={stage || STAGES[0]} stages={STAGES} />;
}
