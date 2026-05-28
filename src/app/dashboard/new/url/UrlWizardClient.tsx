'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Globe,
  Loader2,
  Sparkles,
  Wand2,
} from 'lucide-react';

/**
 * URL-method wizard.
 *
 * Single-step: user pastes a URL → POST /api/url-onboard. Firecrawl scrape
 * + OpenAI extraction + template pick + generate+enhance + image auto-pick
 * all run server-side; this client just shows a progress hint and routes
 * into the project on success.
 */

interface UrlOnboardResponse {
  project?: { id: string };
  error?: string;
}

/**
 * Loose client-side URL validation — matches the server normalizer's
 * "add https:// when missing" behavior so the user can paste either form.
 */
function isLikelyUrl(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(candidate);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    return /\.[a-z]{2,}$/i.test(u.hostname);
  } catch {
    return false;
  }
}

export default function UrlWizardClient() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = isLikelyUrl(url) && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/url-onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as UrlOnboardResponse;
      if (!res.ok || !data.project?.id) {
        setError(data.error || `Request failed (${res.status})`);
        setSubmitting(false);
        return;
      }
      router.push(`/dashboard/projects/${data.project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </Link>
          <div className="inline-flex items-center gap-1.5 text-sm text-gray-500">
            <Sparkles className="w-4 h-4 text-orange-500" />
            Drop your URL
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Already have a site? Drop the URL.
          </h1>
          <p className="text-sm text-gray-600">
            We&apos;ll scan your site, pick the best-fitting template, and draft a fresh
            page using your existing business facts. The full pipeline takes about a
            minute.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <label className="block">
            <span className="block text-sm font-medium text-gray-900 mb-1">
              Website URL
            </span>
            <div className="relative">
              <Globe className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                inputMode="url"
                autoFocus
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="acmeplumbing.com"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Paste the homepage URL — we&apos;ll add <code className="font-mono">https://</code> if you leave it off.
            </p>
          </label>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {submitting && (
            <ul className="mt-4 text-xs text-gray-600 space-y-1">
              <li>· Scanning your site with Firecrawl</li>
              <li>· Extracting business facts</li>
              <li>· Picking the best-fitting template</li>
              <li>· Drafting AI copy + sourcing images</li>
            </ul>
          )}

          <div className="mt-5 flex items-center justify-end">
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md shadow-orange-200"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Building your page…
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Scan and draft my page
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
