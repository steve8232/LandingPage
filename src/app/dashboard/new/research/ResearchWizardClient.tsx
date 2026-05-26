'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Search,
  Sparkles,
} from 'lucide-react';
import {
  v1Templates,
  v1CategoryLabels,
  type V1DisplayCategory,
  type V1TemplateEntry,
} from '@/lib/v1Templates';

/**
 * Two-step research-method wizard.
 *
 *   1. Pick template — category-filtered card grid.
 *   2. Enter business name + location → POST /api/research.
 *
 * On success the user is redirected into the project dashboard. The
 * DataForSEO task runs async; the postback to /api/webhooks/dataforseo/[token]
 * flips the dataforseo_research row to 'ready' when results arrive.
 */
type Step = 'pick-template' | 'enter-business';

interface ResearchResponse {
  project?: { id: string };
  error?: string;
}

export default function ResearchWizardClient() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('pick-template');
  const [activeCategory, setActiveCategory] = useState<V1DisplayCategory | 'all'>('all');
  const [selected, setSelected] = useState<V1TemplateEntry | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories: (V1DisplayCategory | 'all')[] = ['all', 'home', 'outdoor', 'wellness', 'auto'];
  const filtered = activeCategory === 'all'
    ? v1Templates
    : v1Templates.filter((t) => t.category === activeCategory);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selected.id,
          title: businessName.trim(),
          keyword: location.trim()
            ? `${businessName.trim()} ${location.trim()}`
            : businessName.trim(),
          locationName: location.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as ResearchResponse;
      if (!res.ok || !data.project?.id) {
        setError(data.error || `Request failed (${res.status})`);
        setSubmitting(false);
        return;
      }
      router.push(`/dashboard/projects/${data.project.id}/research`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </Link>
          <div className="inline-flex items-center gap-1.5 text-sm text-gray-500">
            <Sparkles className="w-4 h-4 text-orange-500" />
            Look up my business
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        {step === 'pick-template' ? (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Pick a template</h1>
              <p className="text-sm text-gray-600">
                We&apos;ll fetch your Google Business Profile and use it to draft the copy. Choose
                the layout closest to your niche — you can fine-tune everything in the editor afterwards.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    activeCategory === cat
                      ? 'bg-orange-500 text-white'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {cat === 'all' ? 'All templates' : v1CategoryLabels[cat as V1DisplayCategory]}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {filtered.map((t) => {
                const isSelected = selected?.id === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelected(t)}
                    className={`text-left bg-white rounded-xl border-2 p-4 transition-all hover:shadow-md ${
                      isSelected ? 'border-orange-500 ring-2 ring-orange-100' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-gray-900">{t.name}</h3>
                      {isSelected && <Check className="w-5 h-5 text-orange-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
                      {v1CategoryLabels[t.category]}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-3">{t.description}</p>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                disabled={!selected}
                onClick={() => setStep('enter-business')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md shadow-orange-200"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Tell us about your business</h1>
              <p className="text-sm text-gray-600">
                Template: <span className="font-medium text-gray-900">{selected?.name}</span>.
                We&apos;ll research your Google Business Profile and pre-fill the page.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 space-y-5">
              <label className="block">
                <span className="block text-sm font-medium text-gray-900 mb-1">Business name</span>
                <input
                  type="text"
                  required
                  autoFocus
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Aqua Pro Plumbing"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-gray-900 mb-1">
                  City &amp; state <span className="text-gray-500 font-normal">(optional, improves accuracy)</span>
                </span>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Chicago, Illinois, United States"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </label>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('pick-template')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                type="submit"
                disabled={!businessName.trim() || submitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md shadow-orange-200"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Queueing research…
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Look up my business
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
