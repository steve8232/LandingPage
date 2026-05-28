'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, Check, Clock, Loader2, MapPin, MessageCircle,
  Phone, Sparkles, Wrench,
} from 'lucide-react';
import {
  v1Templates, v1CategoryLabels,
  type V1DisplayCategory, type V1TemplateEntry,
} from '@/lib/v1Templates';
import type { ChatHoursPreset } from '@/lib/chat/normalize';

/**
 * Four-step "describe my business" wizard.
 *
 *   1. Pick template (niche).
 *   2. Who      — business name, city + state, phone.
 *   3. What     — services offered, service area.
 *   4. When     — years in business, hours (preset radio).
 *
 * Submits to POST /api/chat. The server bakes answers into overrides and
 * queues a background research lookup. We redirect into the project
 * dashboard; the Research tab is where any incoming research lands.
 */

type Step = 'template' | 'who' | 'what' | 'when';
const STEPS: Step[] = ['template', 'who', 'what', 'when'];

interface CreateResponse {
  project?: { id: string };
  error?: string;
}

export default function ChatWizardClient() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('template');
  const [activeCategory, setActiveCategory] = useState<V1DisplayCategory | 'all'>('all');
  const [selected, setSelected] = useState<V1TemplateEntry | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [displayAddress, setDisplayAddress] = useState(true);
  const [phone, setPhone] = useState('');
  const [services, setServices] = useState('');
  const [serviceArea, setServiceArea] = useState('');
  const [yearsStr, setYearsStr] = useState('');
  const [hoursPreset, setHoursPreset] = useState<ChatHoursPreset>('standard');
  const [customHours, setCustomHours] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories: (V1DisplayCategory | 'all')[] = ['all', 'home', 'outdoor', 'wellness', 'auto'];
  const filtered = activeCategory === 'all'
    ? v1Templates
    : v1Templates.filter((t) => t.category === activeCategory);

  const stepIndex = STEPS.indexOf(step);
  const goNext = () => setStep(STEPS[Math.min(STEPS.length - 1, stepIndex + 1)]);
  const goBack = () => setStep(STEPS[Math.max(0, stepIndex - 1)]);

  const canAdvanceFromTemplate = !!selected;
  const canAdvanceFromWho =
    businessName.trim().length > 0 &&
    location.trim().length > 0 &&
    streetAddress.trim().length > 0;
  const canSubmit = !submitting && selected && businessName.trim() && location.trim() && streetAddress.trim()
    && (hoursPreset !== 'custom' || customHours.trim().length > 0);

  async function handleSubmit() {
    if (!canSubmit || !selected) return;
    setSubmitting(true); setError(null);
    try {
      const yearsParsed = parseInt(yearsStr.trim(), 10);
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selected.id,
          businessName: businessName.trim(),
          location: location.trim(),
          streetAddress: streetAddress.trim(),
          displayAddress,
          phone: phone.trim(),
          services: services.trim(),
          serviceArea: serviceArea.trim(),
          yearsInBusiness: Number.isFinite(yearsParsed) && yearsParsed > 0 ? yearsParsed : null,
          hoursPreset,
          customHours: hoursPreset === 'custom' ? customHours.trim() : '',
        }),
      });
      const data = (await res.json().catch(() => ({}))) as CreateResponse;
      if (!res.ok || !data.project?.id) {
        setError(data.error || `Request failed (${res.status})`);
        setSubmitting(false);
        return;
      }
      router.push(`/dashboard/projects/${data.project.id}?chat=created`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </Link>
          <div className="inline-flex items-center gap-1.5 text-sm text-gray-500">
            <MessageCircle className="w-4 h-4 text-orange-500" />
            Describe my business
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-8 py-8">
        <ProgressDots stepIndex={stepIndex} />

        {step === 'template' && (
          <TemplateStep
            categories={categories}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            filtered={filtered}
            selected={selected}
            setSelected={setSelected}
            onNext={goNext}
            canAdvance={canAdvanceFromTemplate}
          />
        )}

        {step === 'who' && (
          <WhoStep
            selected={selected}
            businessName={businessName} setBusinessName={setBusinessName}
            location={location} setLocation={setLocation}
            streetAddress={streetAddress} setStreetAddress={setStreetAddress}
            displayAddress={displayAddress} setDisplayAddress={setDisplayAddress}
            phone={phone} setPhone={setPhone}
            onBack={goBack}
            onNext={goNext}
            canAdvance={canAdvanceFromWho}
          />
        )}

        {step === 'what' && (
          <WhatStep
            services={services} setServices={setServices}
            serviceArea={serviceArea} setServiceArea={setServiceArea}
            onBack={goBack}
            onNext={goNext}
          />
        )}

        {step === 'when' && (
          <WhenStep
            yearsStr={yearsStr} setYearsStr={setYearsStr}
            hoursPreset={hoursPreset} setHoursPreset={setHoursPreset}
            customHours={customHours} setCustomHours={setCustomHours}
            error={error}
            submitting={submitting}
            canSubmit={!!canSubmit}
            onBack={goBack}
            onSubmit={handleSubmit}
          />
        )}
      </main>
    </div>
  );
}

function ProgressDots({ stepIndex }: { stepIndex: number }) {
  return (
    <div className="flex items-center gap-1.5 mb-6 justify-center">
      {STEPS.map((_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i <= stepIndex ? 'bg-orange-500 w-8' : 'bg-gray-200 w-4'
          }`}
        />
      ))}
    </div>
  );
}

interface TemplateStepProps {
  categories: (V1DisplayCategory | 'all')[];
  activeCategory: V1DisplayCategory | 'all';
  setActiveCategory: (v: V1DisplayCategory | 'all') => void;
  filtered: V1TemplateEntry[];
  selected: V1TemplateEntry | null;
  setSelected: (t: V1TemplateEntry) => void;
  onNext: () => void;
  canAdvance: boolean;
}

function TemplateStep(p: TemplateStepProps) {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">What kind of business?</h1>
        <p className="text-sm text-gray-600">
          Pick the layout closest to your niche. You can fine-tune everything in the editor afterwards.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {p.categories.map((cat) => (
          <button
            key={cat}
            onClick={() => p.setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              p.activeCategory === cat
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {cat === 'all' ? 'All templates' : v1CategoryLabels[cat as V1DisplayCategory]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {p.filtered.map((t) => {
          const isSelected = p.selected?.id === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => p.setSelected(t)}
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
          disabled={!p.canAdvance}
          onClick={p.onNext}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md shadow-orange-200"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </>
  );
}

interface WhoStepProps {
  selected: V1TemplateEntry | null;
  businessName: string;   setBusinessName: (v: string) => void;
  location: string;       setLocation: (v: string) => void;
  streetAddress: string;  setStreetAddress: (v: string) => void;
  displayAddress: boolean; setDisplayAddress: (v: boolean) => void;
  phone: string;          setPhone: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
  canAdvance: boolean;
}

function WhoStep(p: WhoStepProps) {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Tell us about your business</h1>
        <p className="text-sm text-gray-600">
          Template: <span className="font-medium text-gray-900">{p.selected?.name}</span>.
          We&apos;ll also research your Google Business Profile in the background.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 space-y-5">
        <Field icon={<Sparkles className="w-4 h-4 text-gray-400" />} label="Business name">
          <input
            type="text" required autoFocus
            value={p.businessName}
            onChange={(e) => p.setBusinessName(e.target.value)}
            placeholder="e.g. Aqua Pro Plumbing"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
        </Field>
        <Field icon={<MapPin className="w-4 h-4 text-gray-400" />} label="Street address">
          <input
            type="text" required autoComplete="street-address"
            value={p.streetAddress}
            onChange={(e) => p.setStreetAddress(e.target.value)}
            placeholder="e.g. 1200 Main St, Suite 4"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
        </Field>
        <Field icon={<MapPin className="w-4 h-4 text-gray-400" />} label="City &amp; state">
          <input
            type="text" required
            value={p.location}
            onChange={(e) => p.setLocation(e.target.value)}
            placeholder="e.g. Chicago, Illinois"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
        </Field>
        <div className="flex items-start gap-3 pl-1">
          <input
            id="chat-display-address"
            type="checkbox"
            checked={p.displayAddress}
            onChange={(e) => p.setDisplayAddress(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
          />
          <div>
            <label htmlFor="chat-display-address" className="text-sm font-medium text-gray-800">
              Show my street address on the page
            </label>
            <p className="text-xs text-gray-500">
              Off-by-choice: we still keep it on file for research, CallRail, and billing —
              it just won&apos;t appear in the footer.
            </p>
          </div>
        </div>
        <Field icon={<Phone className="w-4 h-4 text-gray-400" />} label="Phone number" optional>
          <input
            type="tel"
            value={p.phone}
            onChange={(e) => p.setPhone(e.target.value)}
            placeholder="e.g. (312) 555-0100"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
        </Field>
      </div>

      <StepFooter onBack={p.onBack} onNext={p.onNext} canAdvance={p.canAdvance} />
    </>
  );
}

interface WhatStepProps {
  services: string;    setServices: (v: string) => void;
  serviceArea: string; setServiceArea: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
}

function WhatStep(p: WhatStepProps) {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">What do you do?</h1>
        <p className="text-sm text-gray-600">
          List the services you offer and where you serve customers. Both are optional but make the page much sharper.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 space-y-5">
        <Field icon={<Wrench className="w-4 h-4 text-gray-400" />} label="Services offered" optional>
          <textarea
            value={p.services}
            onChange={(e) => p.setServices(e.target.value)}
            rows={3}
            placeholder="e.g. Drain cleaning, water heaters, leak detection"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
        </Field>
        <Field icon={<MapPin className="w-4 h-4 text-gray-400" />} label="Service area" optional>
          <input
            type="text"
            value={p.serviceArea}
            onChange={(e) => p.setServiceArea(e.target.value)}
            placeholder="e.g. Within 30 miles of Chicago"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
        </Field>
      </div>

      <StepFooter onBack={p.onBack} onNext={p.onNext} canAdvance={true} />
    </>
  );
}

interface WhenStepProps {
  yearsStr: string; setYearsStr: (v: string) => void;
  hoursPreset: ChatHoursPreset; setHoursPreset: (v: ChatHoursPreset) => void;
  customHours: string; setCustomHours: (v: string) => void;
  error: string | null;
  submitting: boolean;
  canSubmit: boolean;
  onBack: () => void;
  onSubmit: () => void;
}

function WhenStep(p: WhenStepProps) {
  const presets: { value: ChatHoursPreset; label: string }[] = [
    { value: 'standard',         label: 'Mon–Fri, 9 AM – 5 PM' },
    { value: 'twentyfour-seven', label: 'Open 24/7' },
    { value: 'weekends',         label: 'Mon–Sat, 8 AM – 6 PM' },
    { value: 'custom',           label: 'Custom' },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">When are you open?</h1>
        <p className="text-sm text-gray-600">
          A couple last details and we&apos;ll build your page.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 space-y-5">
        <Field icon={<Sparkles className="w-4 h-4 text-gray-400" />} label="Years in business" optional>
          <input
            type="number" min="0" max="200"
            value={p.yearsStr}
            onChange={(e) => p.setYearsStr(e.target.value)}
            placeholder="e.g. 12"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
        </Field>
        <Field icon={<Clock className="w-4 h-4 text-gray-400" />} label="Hours">
          <div className="space-y-2">
            {presets.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-2 px-3 py-2 border-2 rounded-lg cursor-pointer transition-all ${
                  p.hoursPreset === opt.value
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio" name="hours"
                  checked={p.hoursPreset === opt.value}
                  onChange={() => p.setHoursPreset(opt.value)}
                  className="accent-orange-500"
                />
                <span className="text-sm text-gray-900">{opt.label}</span>
              </label>
            ))}
            {p.hoursPreset === 'custom' && (
              <input
                type="text"
                value={p.customHours}
                onChange={(e) => p.setCustomHours(e.target.value)}
                placeholder="e.g. Tue–Sun, noon–10 PM"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 mt-1"
              />
            )}
          </div>
        </Field>
      </div>

      {p.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {p.error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={p.onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          type="button"
          disabled={!p.canSubmit}
          onClick={p.onSubmit}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md shadow-orange-200"
        >
          {p.submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Building your page…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Build my page
            </>
          )}
        </button>
      </div>
    </>
  );
}

function Field({
  icon, label, optional, children,
}: { icon: React.ReactNode; label: React.ReactNode; optional?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 text-sm font-medium text-gray-900 mb-1">
        {icon}
        {label}
        {optional && <span className="text-gray-400 font-normal">(optional)</span>}
      </span>
      {children}
    </label>
  );
}

function StepFooter({ onBack, onNext, canAdvance }: { onBack: () => void; onNext: () => void; canAdvance: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-100"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>
      <button
        type="button"
        disabled={!canAdvance}
        onClick={onNext}
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md shadow-orange-200"
      >
        Continue
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
