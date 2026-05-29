import { Sparkles, ArrowLeft } from 'lucide-react';

/**
 * Route-level Suspense fallback for /dashboard/projects/[id]. Renders
 * instantly when the user clicks "Open dashboard" so the click never feels
 * frozen while the server-side fetches in page.tsx (Supabase project meta +
 * leads + calls, plus the AudienceLab pixel and CallRail live-tail HTTP
 * round-trips) resolve. Layout mirrors ProjectDashboardClient's header /
 * breadcrumb / tabs / summary-cards / timeline so the skeleton transitions
 * smoothly into the real content.
 */
export default function ProjectDashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-900">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">SparkPage</span>
          </div>
          <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-6">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="inline-flex items-center gap-1 text-sm text-gray-600">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </span>
          <span className="text-gray-300">/</span>
          <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
        </div>

        <div className="mb-4">
          <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden bg-white">
            <div className="h-7 w-24 bg-orange-500 animate-pulse" />
            <div className="h-7 w-20 bg-gray-50 border-l border-gray-200 animate-pulse" />
            <div className="h-7 w-24 bg-gray-50 border-l border-gray-200 animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
            >
              <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
              <div className="h-7 w-12 bg-gray-200 rounded animate-pulse mt-2" />
            </div>
          ))}
        </div>

        <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
          <div className="mt-3 space-y-2">
            <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>

        <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="px-4 py-3 flex items-start gap-3">
              <div className="w-4 h-4 bg-gray-100 rounded animate-pulse mt-0.5" />
              <div className="h-5 w-16 bg-gray-100 rounded-full animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-40 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-64 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="h-3 w-14 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
