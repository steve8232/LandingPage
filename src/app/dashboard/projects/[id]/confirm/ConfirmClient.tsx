'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { v1Templates, v1CategoryLabels, type V1DisplayCategory } from '@/lib/v1Templates';
import type { OnboardingState } from '@/lib/projects/types';
import type { ExtractedBusinessInfo } from '@/lib/firecrawl/extractBusinessInfo';

/**
 * Review-and-edit screen for the unified onboarding funnel.
 *
 * Every field of ExtractedBusinessInfo is editable. The user either
 * confirms the AI draft as-is or fixes whatever it got wrong, then
 * "Build my page" persists the edited draft and triggers the heavy
 * generate phase on the server. Blank contact fields stay blank — the
 * downstream composer omits those sections rather than inventing data.
 */
interface ConfirmClientProps {
  projectId: string;
  projectTitle: string;
  templateId: string;
  state: OnboardingState;
}

export default function ConfirmClient({
  projectId,
  projectTitle,
  templateId,
  state,
}: ConfirmClientProps) {
  const router = useRouter();
  const initial: ExtractedBusinessInfo = {
    ...state.draft,
    templateId: state.draft.templateId || templateId,
  };
  const [draft, setDraft] = useState<ExtractedBusinessInfo>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sourceLine = state.source === 'url' && state.url
    ? state.url
    : state.source === 'describe' && state.description
      ? `“${state.description.slice(0, 140)}${state.description.length > 140 ? '…' : ''}”`
      : null;

  const groupedTemplates = v1Templates.reduce<Record<V1DisplayCategory, typeof v1Templates>>(
    (acc, t) => {
      (acc[t.category] ??= []).push(t);
      return acc;
    },
    {} as Record<V1DisplayCategory, typeof v1Templates>,
  );

  function patch<K extends keyof ExtractedBusinessInfo>(k: K, v: ExtractedBusinessInfo[K]) {
    setDraft((prev) => ({ ...prev, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ draft }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || `Submit failed (${res.status})`);
      }
      router.replace(`/dashboard/projects/${projectId}/building`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed');
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <header className="border-b border-orange-100 bg-white/80 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </Link>
          <span className="text-xs uppercase tracking-wider text-orange-600 font-semibold">
            Step 2 of 3 · Confirm
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Here&apos;s what we found about {projectTitle.replace(/^Building /, '').replace(/…$/, '') || 'your business'}
          </h1>
          <p className="text-sm text-gray-600">
            Confirm or edit the details below. Anything you leave blank will be left off
            the page — we won&apos;t invent contact info.
          </p>
          {sourceLine && (
            <p className="text-xs text-gray-500 mt-2 break-all">
              Source: <span className="font-mono">{sourceLine}</span>
            </p>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-8"
        >
          <Section title="Template">
            <Field label="Template style" hint="We picked the closest match — switch if a different layout fits better.">
              <select
                value={draft.templateId}
                onChange={(e) => patch('templateId', e.target.value)}
                className={inputClass}
              >
                {(Object.keys(groupedTemplates) as V1DisplayCategory[]).map((cat) => (
                  <optgroup key={cat} label={v1CategoryLabels[cat]}>
                    {groupedTemplates[cat].map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Field>
          </Section>

          <Section title="The basics">
            <Field label="Business name">
              <input type="text" value={draft.brandName} onChange={(e) => patch('brandName', e.target.value)} className={inputClass} />
            </Field>
            <Field label="What you sell or offer" hint="One short line — used as the hero subheadline.">
              <input type="text" value={draft.productService} onChange={(e) => patch('productService', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Headline offer / hook" hint='e.g. "Free quote within 24 hours" or "Same-day service".'>
              <input type="text" value={draft.offer} onChange={(e) => patch('offer', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Pricing note (optional)">
              <input type="text" value={draft.pricing} onChange={(e) => patch('pricing', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Primary call-to-action label">
              <input type="text" value={draft.cta} onChange={(e) => patch('cta', e.target.value)} className={inputClass} placeholder="Get a free quote" />
            </Field>
          </Section>

          <Section title="Positioning">
            <Field label="What makes you different" hint="Used in the value-prop section.">
              <textarea value={draft.uniqueValue} onChange={(e) => patch('uniqueValue', e.target.value)} className={textareaClass} rows={3} />
            </Field>
            <Field label="What customers love about you">
              <textarea value={draft.customerLove} onChange={(e) => patch('customerLove', e.target.value)} className={textareaClass} rows={3} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Years in business (optional)">
                <input type="text" value={draft.yearsInBusiness} onChange={(e) => patch('yearsInBusiness', e.target.value)} className={inputClass} placeholder="15" />
              </Field>
              <Field label="Licensed & insured?">
                <select
                  value={draft.licensedInsured ? 'yes' : 'no'}
                  onChange={(e) => patch('licensedInsured', e.target.value === 'yes')}
                  className={inputClass}
                >
                  <option value="no">No / not sure</option>
                  <option value="yes">Yes</option>
                </select>
              </Field>
            </div>
          </Section>

          <Section title="Contact (leave blank to skip)">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Phone">
                <input type="tel" value={draft.phone} onChange={(e) => patch('phone', e.target.value)} className={inputClass} placeholder="(555) 123-4567" />
              </Field>
              <Field label="Email">
                <input type="email" value={draft.email} onChange={(e) => patch('email', e.target.value)} className={inputClass} placeholder="hello@example.com" />
              </Field>
            </div>
            <Field label="Hours">
              <input type="text" value={draft.hours} onChange={(e) => patch('hours', e.target.value)} className={inputClass} placeholder="Mon–Fri 8a–6p" />
            </Field>
          </Section>

          <Section title="Location">
            <Field label="Street address">
              <input type="text" value={draft.streetAddress} onChange={(e) => patch('streetAddress', e.target.value)} className={inputClass} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="City"><input type="text" value={draft.city} onChange={(e) => patch('city', e.target.value)} className={inputClass} /></Field>
              <Field label="State"><input type="text" value={draft.state} onChange={(e) => patch('state', e.target.value)} className={inputClass} placeholder="TX" /></Field>
              <Field label="ZIP"><input type="text" value={draft.zip} onChange={(e) => patch('zip', e.target.value)} className={inputClass} /></Field>
            </div>
            <Field label="Service areas" hint="Comma-separated neighborhoods/cities. We'll expand nearby areas automatically.">
              <textarea value={draft.serviceAreaText} onChange={(e) => patch('serviceAreaText', e.target.value)} className={textareaClass} rows={2} />
            </Field>
          </Section>

          {error && (
            <div className="text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg p-3">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Save for later
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 disabled:opacity-60 shadow-md shadow-orange-200"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Build my page
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none text-sm';
const textareaClass = inputClass + ' resize-y';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-800 mb-1">{label}</span>
      {hint && <span className="block text-xs text-gray-500 mb-1.5">{hint}</span>}
      {children}
    </label>
  );
}
