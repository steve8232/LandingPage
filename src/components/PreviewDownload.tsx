'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  CheckCircle,
  AlertCircle,
  Target,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit3,
  Monitor,
  Smartphone,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';
import { GeneratedLandingPage, FormData } from '@/types';
import { calculateConversionScore, extractScoreInput, ConversionScore } from '@/lib/conversionScore';
import VisualEditor from '@/components/editor/VisualEditor';
import type { V1ContentOverrides } from '../../v1/composer/composeV1Template';

type V1SpecSection = {
  type: string;
  props: Record<string, unknown>;
};

type V1SpecResponse = {
  templateId: string;
  version: 'v1';
  category?: string;
  goal?: string;
  theme?: string;
  metadata?: { name?: string; description?: string };
  sections: V1SpecSection[];
};

function asString(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x) => typeof x === 'string') as string[];
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function parseLinesToStringArray(text: string): string[] {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

function isV1HtmlDocument(html: string): boolean {
  // v1 composer outputs a full HTML document and includes stable markers.
  // We use these to bypass the legacy VisualEditor pipeline (which parses
  // legacy section markup and reconstructs its own CSS/HTML).
  return (
    /\bclass=["']v1-page["']/.test(html) ||
    /\/\*\s*===\s*v1 tokens\s*===\s*\*\//.test(html)
  );
}

interface PreviewDownloadProps {
  landingPage: GeneratedLandingPage;
  onStartOver: () => void;
  formData?: FormData;
  testimonialCount?: number;
}

export default function PreviewDownload({
  landingPage,
  onStartOver,
  formData,
  testimonialCount = 8
}: PreviewDownloadProps) {
  const [editedHtml, setEditedHtml] = useState(landingPage.html);
  const [editedCss, setEditedCss] = useState(landingPage.css);
  const [showScoreDetails, setShowScoreDetails] = useState(false);
  const [scoreCollapsed, setScoreCollapsed] = useState(false);

  // v1 editor state (v1-safe: no HTML parsing; all changes are either direct HTML edits
  // or structured override edits that round-trip through the v1 composer endpoint).
  const [v1Mode, setV1Mode] = useState<'preview' | 'edit'>('preview');
  const [v1Device, setV1Device] = useState<'desktop' | 'mobile'>('desktop');
  const [v1PanelTab, setV1PanelTab] = useState<'content' | 'seo' | 'advanced'>('content');
  const [v1Overrides, setV1Overrides] = useState<V1ContentOverrides | undefined>(landingPage.v1?.overrides);
  const [v1OverridesJson, setV1OverridesJson] = useState(() =>
    JSON.stringify(landingPage.v1?.overrides ?? {}, null, 2)
  );
  const [v1OverridesJsonError, setV1OverridesJsonError] = useState<string>('');
  const [draftHtml, setDraftHtml] = useState(landingPage.html);
  const [isComposing, setIsComposing] = useState(false);
  const [composeError, setComposeError] = useState('');

  const isV1 = useMemo(() => isV1HtmlDocument(landingPage.html), [landingPage.html]);

  const v1TemplateId = useMemo(() => {
    if (!isV1) return undefined;
    return landingPage.v1?.templateId || formData?.selectedTemplate?.id;
  }, [isV1, landingPage.v1?.templateId, formData?.selectedTemplate?.id]);

  // v1 spec defaults (for effective props = spec defaults + overrides)
  const [v1Spec, setV1Spec] = useState<V1SpecResponse | null>(null);
  const [v1SpecError, setV1SpecError] = useState<string>('');
  const [v1SelectedSectionIndex, setV1SelectedSectionIndex] = useState<number>(0);
  const [v1SectionJsonDrafts, setV1SectionJsonDrafts] = useState<Record<number, string>>({});
  const [v1SectionJsonErrors, setV1SectionJsonErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!v1TemplateId) {
        setV1Spec(null);
        setV1SpecError('');
        return;
      }
      setV1SpecError('');
      try {
        const res = await fetch(`/api/v1/spec?templateId=${encodeURIComponent(v1TemplateId)}`);
        const data = (await res.json()) as unknown;
        if (!res.ok) throw new Error((data as any)?.error || 'Failed to fetch v1 spec');
        if (cancelled) return;
        const spec = data as V1SpecResponse;
        if (!spec || !Array.isArray(spec.sections)) {
          throw new Error('Spec API returned invalid response');
        }
        setV1Spec(spec);
        setV1SelectedSectionIndex((prev) => {
          const max = Math.max(0, spec.sections.length - 1);
          return Math.min(prev, max);
        });
      } catch (e) {
        if (cancelled) return;
        setV1Spec(null);
        setV1SpecError(e instanceof Error ? e.message : 'Failed to fetch v1 spec');
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [v1TemplateId]);

  const updateV1Section = useCallback(
    (index: number, patch: Record<string, unknown>) => {
      if (index < 0) return;
      setV1Overrides((prev) => {
        const next: V1ContentOverrides = { ...(prev || {}) };
        const sections = next.sections ? [...next.sections] : [];
        while (sections.length <= index) sections.push(null);
        const cur = sections[index];
        const base = cur && typeof cur === 'object' ? (cur as Record<string, unknown>) : {};
        sections[index] = { ...base, ...patch };
        next.sections = sections;
        return next;
      });
    },
    []
  );

  const replaceV1SectionOverride = useCallback(
    (index: number, nextValue: Record<string, unknown> | null) => {
      if (index < 0) return;
      setV1Overrides((prev) => {
        const next: V1ContentOverrides = { ...(prev || {}) };
        const sections = next.sections ? [...next.sections] : [];
        while (sections.length <= index) sections.push(null);
        sections[index] = nextValue;
        next.sections = sections;
        return next;
      });
    },
    []
  );

  const updateV1Meta = useCallback((patch: Record<string, unknown>) => {
    setV1Overrides((prev) => ({
      ...(prev || {}),
      meta: {
        ...((prev && prev.meta) || {}),
        ...patch,
      },
    }));
  }, []);

  const handleComposeV1 = useCallback(async () => {
    if (!v1TemplateId) return;
    setIsComposing(true);
    setComposeError('');
    try {
      const res = await fetch('/api/v1/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: v1TemplateId,
          overrides: v1Overrides,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to compose v1 HTML');
      if (typeof data?.html !== 'string') throw new Error('Compose API returned invalid response');
      setEditedHtml(data.html);
    } catch (e) {
      setComposeError(e instanceof Error ? e.message : 'Failed to compose v1 HTML');
    } finally {
      setIsComposing(false);
    }
  }, [v1TemplateId, v1Overrides]);

  const handleResetV1 = useCallback(() => {
    if (!confirm('Reset all v1 changes? This will restore the original generated page.')) return;
    setEditedHtml(landingPage.html);
    setDraftHtml(landingPage.html);
    setV1Overrides(landingPage.v1?.overrides);
    setV1OverridesJson(JSON.stringify(landingPage.v1?.overrides ?? {}, null, 2));
    setV1OverridesJsonError('');
    setComposeError('');
  }, [landingPage.html, landingPage.v1?.overrides]);

  const applyOverridesJsonToState = useCallback(() => {
    setV1OverridesJsonError('');
    try {
      const parsed = JSON.parse(v1OverridesJson) as V1ContentOverrides;
      setV1Overrides(parsed);
    } catch (e) {
      setV1OverridesJsonError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  }, [v1OverridesJson]);

  const effectiveV1Sections = useMemo(() => {
    const specSections = v1Spec?.sections;
    if (!Array.isArray(specSections)) return [] as Array<{
      type: string;
      defaultProps: Record<string, unknown>;
      override: Record<string, unknown> | null;
      effective: Record<string, unknown>;
      omitted: boolean;
    }>;

    return specSections.map((s, i) => {
      const ov = v1Overrides?.sections?.[i];
      const override = ov && typeof ov === 'object' ? (ov as Record<string, unknown>) : null;
      const omitted = override?._omit === true;
      const effective = { ...(s.props || {}), ...(override || {}) };
      return {
        type: s.type,
        defaultProps: s.props || {},
        override,
        effective,
        omitted,
      };
    });
  }, [v1Spec?.sections, v1Overrides?.sections]);

  const selectedV1Section = effectiveV1Sections[v1SelectedSectionIndex];

  function labelForSectionType(type: string): string {
    switch (type) {
      case 'HeroSplit':
        return 'Hero';
      case 'SocialProofLogos':
        return 'Social proof';
      case 'ServiceList':
        return 'Services';
      case 'ImagePair':
        return 'Images';
      case 'TestimonialsCards':
        return 'Testimonials';
      case 'FinalCTA':
        return 'Final CTA';
      default:
        return type;
    }
  }

  // Calculate conversion score based on current edited HTML
  const conversionScore: ConversionScore = useMemo(() => {
    if (formData) {
      const scoreInput = extractScoreInput(editedHtml, formData, testimonialCount);
      return calculateConversionScore(scoreInput);
    }
    return { score: 85, maxScore: 100, grade: 'Great' as const, checks: [] };
  }, [editedHtml, formData, testimonialCount]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 75) return 'bg-blue-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleSave = useCallback((html: string, css: string) => {
    setEditedHtml(html);
    setEditedCss(css);
  }, []);

  const handleDownloadV1Html = useCallback(() => {
    const blob = new Blob([editedHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [editedHtml]);

  // Create edited landing page object for the legacy editor.
  // For v1 HTML documents, we bypass VisualEditor entirely (see below).
  const editedLandingPage: GeneratedLandingPage = useMemo(() => ({
    html: editedHtml,
    css: editedCss,
    preview: isV1
      ? editedHtml
      : `<!DOCTYPE html><html><head><style>${editedCss}</style></head><body>${editedHtml.replace(/<!DOCTYPE html>|<html[^>]*>|<\/html>|<head>[\s\S]*<\/head>/gi, '')}</body></html>`,
  }), [editedHtml, editedCss, isV1]);

  return (
    <div className="h-[100dvh] bg-gray-100 flex flex-col overflow-hidden">
      {/* Conversion Score Banner - Collapsible */}
      <div className="bg-white border-b border-gray-200 shadow-sm flex-none">
        <div className="max-w-7xl mx-auto px-4">
          <button
            onClick={() => setScoreCollapsed(!scoreCollapsed)}
            className="w-full py-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900">Conversion Score</span>
	              <span
	                className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
	                  isV1
	                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
	                    : 'bg-gray-50 text-gray-700 border-gray-200'
	                }`}
	              >
	                Pipeline: {isV1 ? 'v1' : 'legacy'}
	              </span>
              <span className={`text-xl font-bold ${getScoreColor(conversionScore.score)}`}>
                {conversionScore.score}/{conversionScore.maxScore}
              </span>
              <span className={`text-sm font-medium px-2 py-0.5 rounded ${getScoreColor(conversionScore.score)} bg-opacity-10`}
                style={{ backgroundColor: conversionScore.score >= 75 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)' }}>
                {conversionScore.grade}
              </span>
            </div>
            {scoreCollapsed ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronUp className="w-5 h-5 text-gray-400" />}
          </button>

          {!scoreCollapsed && (
            <div className="pb-4">
              {/* Score Bar */}
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full ${getScoreBarColor(conversionScore.score)} transition-all duration-500`}
                  style={{ width: `${(conversionScore.score / conversionScore.maxScore) * 100}%` }}
                />
              </div>

              {/* Toggle Details */}
              <button
                onClick={(e) => { e.stopPropagation(); setShowScoreDetails(!showScoreDetails); }}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                {showScoreDetails ? 'Hide details ▲' : 'Show details ▼'}
              </button>

              {/* Score Details */}
              {showScoreDetails && conversionScore.checks.length > 0 && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {conversionScore.checks.map((check, index) => (
                    <div key={index} className={`flex items-start gap-2 p-2 rounded-lg ${check.passed ? 'bg-green-50' : 'bg-amber-50'}`}>
                      {check.passed ? (
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className={`font-medium text-xs ${check.passed ? 'text-green-800' : 'text-amber-800'}`}>
                          {check.name} ({check.points} pts)
                        </p>
                        {check.suggestion && <p className="text-xs text-amber-700 mt-0.5">{check.suggestion}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Output */}
      <div className="flex-1 min-h-0">
        {isV1 ? (
          <div className="h-full flex flex-col min-h-0">
            {/* v1 Toolbar */}
            <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between flex-none">
              <div className="flex items-center gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900">v1 editor</div>
                  <div className="text-xs text-gray-500">Edits are v1-safe (no HTML parsing; full document preserved)</div>
                </div>

                {/* Mode Toggle */}
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setV1Mode('preview')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      v1Mode === 'preview' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                  <button
                    onClick={() => setV1Mode('edit')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      v1Mode === 'edit' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </button>
                </div>

                {/* Device Toggle */}
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setV1Device('desktop')}
                    className={`p-1.5 rounded-md transition-colors ${
                      v1Device === 'desktop' ? 'bg-white shadow text-blue-600' : 'text-gray-500'
                    }`}
                    title="Desktop"
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setV1Device('mobile')}
                    className={`p-1.5 rounded-md transition-colors ${
                      v1Device === 'mobile' ? 'bg-white shadow text-blue-600' : 'text-gray-500'
                    }`}
                    title="Mobile"
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetV1}
                  className="px-3 py-1.5 text-gray-600 hover:text-gray-900 flex items-center gap-1.5 text-sm"
                  title="Reset to the originally generated v1 page"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
                <button
                  onClick={onStartOver}
                  className="px-3 py-1.5 text-gray-600 hover:text-gray-900 text-sm"
                >
                  Start Over
                </button>
                <button
                  onClick={handleDownloadV1Html}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  Download HTML
                </button>
              </div>
            </div>

            {/* v1 Main Area */}
            <div className="flex-1 min-h-0 flex overflow-hidden">
              {/* Preview */}
              <div className="flex-1 min-h-0 p-4 overflow-hidden">
                <div className="bg-white rounded-xl shadow-xl overflow-hidden h-full">
                  <div
                    className={`h-full mx-auto transition-all duration-300 ${
                      v1Device === 'mobile' ? 'max-w-[390px] border-x border-gray-200' : 'w-full'
                    }`}
                  >
                    <iframe
                      title="v1 preview"
                      srcDoc={editedHtml}
                      className="w-full h-full border-0"
                    />
                  </div>
                </div>
              </div>

              {/* Edit Panel */}
              {v1Mode === 'edit' && (
                <div className="w-[420px] bg-white border-l border-gray-200 flex-shrink-0 overflow-y-auto">
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <button
                        onClick={() => setV1PanelTab('content')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                          v1PanelTab === 'content' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        Content
                      </button>
                      <button
                        onClick={() => setV1PanelTab('seo')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                          v1PanelTab === 'seo' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        SEO
                      </button>
                      <button
                        onClick={() => setV1PanelTab('advanced')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                          v1PanelTab === 'advanced' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        Advanced
                      </button>
                    </div>

                    {composeError && (
                      <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                        {composeError}
                      </div>
                    )}

                    {v1PanelTab === 'content' && (
                      <div className="space-y-4">
                        {!v1TemplateId && (
                          <div className="text-sm text-gray-700">
                            Missing <code className="font-mono">templateId</code> for this v1 result.
                          </div>
                        )}

                        {v1SpecError && (
                          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                            {v1SpecError}
                          </div>
                        )}

                        {v1TemplateId && !v1Spec && !v1SpecError && (
                          <div className="text-sm text-gray-600">Loading template spec…</div>
                        )}

                        {v1Spec && (
                          <div className="flex gap-3">
                            {/* Section list (spec order) */}
                            <div className="w-[150px] flex-shrink-0">
                              <div className="text-xs font-semibold text-gray-700 mb-2">Sections</div>
                              <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="max-h-[320px] overflow-y-auto">
                                  {effectiveV1Sections.map((sec, i) => {
                                    const active = i === v1SelectedSectionIndex;
                                    return (
                                      <button
                                        key={`${sec.type}-${i}`}
                                        onClick={() => setV1SelectedSectionIndex(i)}
                                        className={`w-full text-left px-2.5 py-2 border-b border-gray-100 text-xs flex items-center justify-between gap-2 ${
                                          active ? 'bg-indigo-50 text-indigo-800' : 'hover:bg-gray-50 text-gray-700'
                                        }`}
                                      >
                                        <span className="truncate">
                                          {i + 1}. {labelForSectionType(sec.type)}
                                        </span>
                                        {sec.omitted && (
                                          <span className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-700 text-[10px]">
                                            omitted
                                          </span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                              <div className="mt-2 text-[11px] text-gray-500">
                                In spec order. Inputs show defaults + overrides.
                              </div>
                            </div>

                            {/* Section editor */}
                            <div className="flex-1 min-w-0">
                              {!selectedV1Section ? (
                                <div className="text-sm text-gray-600">Select a section to edit.</div>
                              ) : (
                                <div className="space-y-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <div className="text-sm font-semibold text-gray-900">
                                        {v1SelectedSectionIndex + 1}. {labelForSectionType(selectedV1Section.type)}
                                      </div>
                                      <div className="text-xs text-gray-500 font-mono">{selectedV1Section.type}</div>
                                    </div>
                                    <label className="flex items-center gap-2 text-xs text-gray-700">
                                      <input
                                        type="checkbox"
                                        checked={selectedV1Section.omitted}
                                        onChange={(e) => updateV1Section(v1SelectedSectionIndex, { _omit: e.target.checked })}
                                      />
                                      Omit section
                                    </label>
                                  </div>

                                  {/* Per-type editors */}
                                  {selectedV1Section.type === 'HeroSplit' && (() => {
                                    const eff = selectedV1Section.effective;
                                    const bulletsText = asStringArray(eff.bullets).join('\n');
                                    const proofText = asStringArray(eff.proofPoints).join('\n');
                                    return (
                                      <div className="space-y-3">
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">Eyebrow</label>
                                          <input
                                            value={asString(eff.eyebrow)}
                                            onChange={(e) => updateV1Section(v1SelectedSectionIndex, { eyebrow: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">Headline</label>
                                          <input
                                            value={asString(eff.headline)}
                                            onChange={(e) => updateV1Section(v1SelectedSectionIndex, { headline: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">Subheadline</label>
                                          <textarea
                                            value={asString(eff.subheadline)}
                                            onChange={(e) => updateV1Section(v1SelectedSectionIndex, { subheadline: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            rows={3}
                                          />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Primary CTA</label>
                                            <input
                                              value={asString(eff.ctaLabel)}
                                              onChange={(e) => updateV1Section(v1SelectedSectionIndex, { ctaLabel: e.target.value })}
                                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Trust badge</label>
                                            <input
                                              value={asString(eff.trustBadge)}
                                              onChange={(e) => updateV1Section(v1SelectedSectionIndex, { trustBadge: e.target.value })}
                                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            />
                                          </div>
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">Bullets (one per line)</label>
                                          <textarea
                                            value={bulletsText}
                                            onChange={(e) =>
                                              updateV1Section(v1SelectedSectionIndex, { bullets: parseLinesToStringArray(e.target.value) })
                                            }
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            rows={3}
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">Proof points (one per line)</label>
                                          <textarea
                                            value={proofText}
                                            onChange={(e) =>
                                              updateV1Section(v1SelectedSectionIndex, { proofPoints: parseLinesToStringArray(e.target.value) })
                                            }
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            rows={3}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  {selectedV1Section.type === 'SocialProofLogos' && (() => {
                                    const eff = selectedV1Section.effective;
                                    const logosText = asStringArray(eff.logos).join('\n');
                                    return (
                                      <div className="space-y-3">
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">Heading</label>
                                          <input
                                            value={asString(eff.heading)}
                                            onChange={(e) => updateV1Section(v1SelectedSectionIndex, { heading: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">Supporting text</label>
                                          <textarea
                                            value={asString(eff.supportingText)}
                                            onChange={(e) => updateV1Section(v1SelectedSectionIndex, { supportingText: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            rows={2}
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">Logos / badges (one per line)</label>
                                          <textarea
                                            value={logosText}
                                            onChange={(e) => updateV1Section(v1SelectedSectionIndex, { logos: parseLinesToStringArray(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono"
                                            rows={5}
                                          />
                                          <div className="mt-1 text-[11px] text-gray-500">
                                            Tip: use badge IDs (e.g. <code className="font-mono">google</code>) or plain text.
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  {selectedV1Section.type === 'ServiceList' && (() => {
                                    const eff = selectedV1Section.effective;
                                    const services = Array.isArray(eff.services) ? (eff.services as unknown[]) : [];
                                    const servicesRec = services.map((s) => asRecord(s));

                                    const updateService = (idx: number, patch: Record<string, unknown>) => {
                                      const next = servicesRec.map((x) => ({ ...x }));
                                      next[idx] = { ...(next[idx] || {}), ...patch };
                                      updateV1Section(v1SelectedSectionIndex, { services: next });
                                    };
                                    const addService = () => {
                                      const next = servicesRec.map((x) => ({ ...x }));
                                      next.push({ title: 'New service', description: '' });
                                      updateV1Section(v1SelectedSectionIndex, { services: next });
                                    };
                                    const removeService = (idx: number) => {
                                      const next = servicesRec.filter((_, i) => i !== idx).map((x) => ({ ...x }));
                                      updateV1Section(v1SelectedSectionIndex, { services: next });
                                    };

                                    return (
                                      <div className="space-y-3">
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">Heading</label>
                                          <input
                                            value={asString(eff.heading)}
                                            onChange={(e) => updateV1Section(v1SelectedSectionIndex, { heading: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">Subheading</label>
                                          <textarea
                                            value={asString(eff.subheading)}
                                            onChange={(e) => updateV1Section(v1SelectedSectionIndex, { subheading: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            rows={2}
                                          />
                                        </div>

                                        <div>
                                          <div className="flex items-center justify-between">
                                            <div className="text-xs font-semibold text-gray-700">Services</div>
                                            <button
                                              type="button"
                                              onClick={addService}
                                              className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                                            >
                                              Add
                                            </button>
                                          </div>
                                          <div className="mt-2 space-y-3">
                                            {servicesRec.map((s, idx) => (
                                              <div key={idx} className="border border-gray-200 rounded-lg p-2.5">
                                                <div className="flex items-center justify-between gap-2 mb-2">
                                                  <div className="text-xs font-semibold text-gray-800">Item {idx + 1}</div>
                                                  <button
                                                    type="button"
                                                    onClick={() => removeService(idx)}
                                                    className="text-xs text-red-600 hover:text-red-700"
                                                  >
                                                    Remove
                                                  </button>
                                                </div>
                                                <div className="space-y-2">
                                                  <input
                                                    value={asString(s.title)}
                                                    onChange={(e) => updateService(idx, { title: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                                    placeholder="Title"
                                                  />
                                                  <textarea
                                                    value={asString(s.description)}
                                                    onChange={(e) => updateService(idx, { description: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                                    placeholder="Description"
                                                    rows={2}
                                                  />
                                                  <div className="grid grid-cols-2 gap-2">
                                                    <select
                                                      value={asString(s.icon) || 'tool'}
                                                      onChange={(e) => updateService(idx, { icon: e.target.value })}
                                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                                      title="Icon"
                                                    >
                                                      <option value="tool">tool</option>
                                                      <option value="wrench">wrench</option>
                                                      <option value="shield">shield</option>
                                                      <option value="search">search</option>
                                                    </select>
                                                    <input
                                                      value={asString(s.benefit)}
                                                      onChange={(e) => updateService(idx, { benefit: e.target.value })}
                                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                                      placeholder="Benefit (optional)"
                                                    />
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                            {servicesRec.length === 0 && (
                                              <div className="text-sm text-gray-600">No services. Add one to populate this section.</div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  {selectedV1Section.type === 'ImagePair' && (() => {
                                    const eff = selectedV1Section.effective;
                                    return (
                                      <div className="space-y-3">
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">Heading</label>
                                          <input
                                            value={asString(eff.heading)}
                                            onChange={(e) => updateV1Section(v1SelectedSectionIndex, { heading: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">Subheading</label>
                                          <textarea
                                            value={asString(eff.subheading)}
                                            onChange={(e) => updateV1Section(v1SelectedSectionIndex, { subheading: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            rows={2}
                                          />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Caption 1</label>
                                            <input
                                              value={asString(eff.caption1)}
                                              onChange={(e) => updateV1Section(v1SelectedSectionIndex, { caption1: e.target.value })}
                                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Caption 2</label>
                                            <input
                                              value={asString(eff.caption2)}
                                              onChange={(e) => updateV1Section(v1SelectedSectionIndex, { caption2: e.target.value })}
                                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            />
                                          </div>
                                        </div>
                                        <div className="text-[11px] text-gray-500">
                                          For image assets (image keys/URLs), use the Advanced JSON override below.
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  {selectedV1Section.type === 'TestimonialsCards' && (() => {
                                    const eff = selectedV1Section.effective;
                                    const testimonials = Array.isArray(eff.testimonials)
                                      ? (eff.testimonials as unknown[])
                                      : [];
                                    const testiRec = testimonials.map((t) => asRecord(t));

                                    const updateTestimonial = (idx: number, patch: Record<string, unknown>) => {
                                      const next = testiRec.map((x) => ({ ...x }));
                                      next[idx] = { ...(next[idx] || {}), ...patch };
                                      updateV1Section(v1SelectedSectionIndex, { testimonials: next });
                                    };
                                    const addTestimonial = () => {
                                      const next = testiRec.map((x) => ({ ...x }));
                                      next.push({ quote: '', name: 'Name', title: '' });
                                      updateV1Section(v1SelectedSectionIndex, { testimonials: next });
                                    };
                                    const removeTestimonial = (idx: number) => {
                                      const next = testiRec.filter((_, i) => i !== idx).map((x) => ({ ...x }));
                                      updateV1Section(v1SelectedSectionIndex, { testimonials: next });
                                    };

                                    return (
                                      <div className="space-y-3">
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">Heading</label>
                                          <input
                                            value={asString(eff.heading)}
                                            onChange={(e) => updateV1Section(v1SelectedSectionIndex, { heading: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">Subheading</label>
                                          <textarea
                                            value={asString(eff.subheading)}
                                            onChange={(e) => updateV1Section(v1SelectedSectionIndex, { subheading: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            rows={2}
                                          />
                                        </div>

                                        <div>
                                          <div className="flex items-center justify-between">
                                            <div className="text-xs font-semibold text-gray-700">Testimonials</div>
                                            <button
                                              type="button"
                                              onClick={addTestimonial}
                                              className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                                            >
                                              Add
                                            </button>
                                          </div>
                                          <div className="mt-2 space-y-3">
                                            {testiRec.map((t, idx) => (
                                              <div key={idx} className="border border-gray-200 rounded-lg p-2.5">
                                                <div className="flex items-center justify-between gap-2 mb-2">
                                                  <div className="text-xs font-semibold text-gray-800">Item {idx + 1}</div>
                                                  <button
                                                    type="button"
                                                    onClick={() => removeTestimonial(idx)}
                                                    className="text-xs text-red-600 hover:text-red-700"
                                                  >
                                                    Remove
                                                  </button>
                                                </div>
                                                <div className="space-y-2">
                                                  <textarea
                                                    value={asString(t.quote)}
                                                    onChange={(e) => updateTestimonial(idx, { quote: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                                    placeholder="Quote"
                                                    rows={3}
                                                  />
                                                  <div className="grid grid-cols-2 gap-2">
                                                    <input
                                                      value={asString(t.name)}
                                                      onChange={(e) => updateTestimonial(idx, { name: e.target.value })}
                                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                                      placeholder="Name"
                                                    />
                                                    <input
                                                      value={asString(t.title)}
                                                      onChange={(e) => updateTestimonial(idx, { title: e.target.value })}
                                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                                      placeholder="Title"
                                                    />
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                            {testiRec.length === 0 && (
                                              <div className="text-sm text-gray-600">No testimonials. Add one to populate this section.</div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  {selectedV1Section.type === 'FinalCTA' && (() => {
                                    const eff = selectedV1Section.effective;
                                    const nextStepsText = asStringArray(eff.nextSteps).join('\n');
                                    return (
                                      <div className="space-y-3">
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">Heading</label>
                                          <input
                                            value={asString(eff.heading)}
                                            onChange={(e) => updateV1Section(v1SelectedSectionIndex, { heading: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">Subheading</label>
                                          <textarea
                                            value={asString(eff.subheading)}
                                            onChange={(e) => updateV1Section(v1SelectedSectionIndex, { subheading: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            rows={2}
                                          />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Button label</label>
                                            <input
                                              value={asString(eff.ctaLabel)}
                                              onChange={(e) => updateV1Section(v1SelectedSectionIndex, { ctaLabel: e.target.value })}
                                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Urgency</label>
                                            <input
                                              value={asString(eff.urgency)}
                                              onChange={(e) => updateV1Section(v1SelectedSectionIndex, { urgency: e.target.value })}
                                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            />
                                          </div>
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">Next steps (one per line)</label>
                                          <textarea
                                            value={nextStepsText}
                                            onChange={(e) =>
                                              updateV1Section(v1SelectedSectionIndex, { nextSteps: parseLinesToStringArray(e.target.value) })
                                            }
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            rows={3}
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">Guarantee</label>
                                          <input
                                            value={asString(eff.guarantee)}
                                            onChange={(e) => updateV1Section(v1SelectedSectionIndex, { guarantee: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">Privacy note</label>
                                          <input
                                            value={asString(eff.privacyNote)}
                                            onChange={(e) => updateV1Section(v1SelectedSectionIndex, { privacyNote: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                          />
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  {/* Fallback + per-section Advanced JSON override */}
                                  <div className="pt-3 border-t border-gray-200">
                                    <div className="text-xs font-semibold text-gray-700 mb-1">Advanced JSON override (this section)</div>
                                    <div className="text-[11px] text-gray-500 mb-2">
                                      Use this for complex nested props or unknown section types. This edits the override only (not the spec defaults).
                                    </div>
                                    <textarea
                                      value={
                                        v1SectionJsonDrafts[v1SelectedSectionIndex] ??
                                        JSON.stringify(selectedV1Section.override ?? {}, null, 2)
                                      }
                                      onChange={(e) => {
                                        const text = e.target.value;
                                        setV1SectionJsonDrafts((prev) => ({ ...prev, [v1SelectedSectionIndex]: text }));
                                      }}
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono"
                                      rows={8}
                                    />
                                    {v1SectionJsonErrors[v1SelectedSectionIndex] && (
                                      <div className="mt-1 text-xs text-red-600">
                                        {v1SectionJsonErrors[v1SelectedSectionIndex]}
                                      </div>
                                    )}
                                    <div className="mt-2 flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setV1SectionJsonErrors((prev) => ({ ...prev, [v1SelectedSectionIndex]: '' }));
                                          try {
                                            const text =
                                              v1SectionJsonDrafts[v1SelectedSectionIndex] ??
                                              JSON.stringify(selectedV1Section.override ?? {}, null, 2);
                                            const parsed = JSON.parse(text) as Record<string, unknown>;
                                            replaceV1SectionOverride(v1SelectedSectionIndex, parsed);
                                          } catch (e) {
                                            const msg = e instanceof Error ? e.message : 'Invalid JSON';
                                            setV1SectionJsonErrors((prev) => ({ ...prev, [v1SelectedSectionIndex]: msg }));
                                          }
                                        }}
                                        className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200"
                                      >
                                        Apply override JSON
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setV1SectionJsonDrafts((prev) => ({
                                            ...prev,
                                            [v1SelectedSectionIndex]: JSON.stringify(selectedV1Section.override ?? {}, null, 2),
                                          }));
                                          setV1SectionJsonErrors((prev) => ({ ...prev, [v1SelectedSectionIndex]: '' }));
                                        }}
                                        className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200"
                                      >
                                        Load current
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (!confirm('Clear this section override? This will revert to spec defaults.')) return;
                                          replaceV1SectionOverride(v1SelectedSectionIndex, null);
                                          setV1SectionJsonDrafts((prev) => ({ ...prev, [v1SelectedSectionIndex]: '{}' }));
                                          setV1SectionJsonErrors((prev) => ({ ...prev, [v1SelectedSectionIndex]: '' }));
                                        }}
                                        className="px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100"
                                      >
                                        Clear
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <button
                          onClick={handleComposeV1}
                          disabled={!v1TemplateId || isComposing}
                          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          title={!v1TemplateId ? 'Missing templateId for v1 compose' : 'Re-render the page using the v1 composer'}
                        >
                          <RefreshCw className={`w-4 h-4 ${isComposing ? 'animate-spin' : ''}`} />
                          {isComposing ? 'Re-rendering…' : 'Re-render from overrides'}
                        </button>
                      </div>
                    )}

                    {v1PanelTab === 'seo' && (
                      <div className="space-y-3">
                        <div className="text-sm font-semibold text-gray-900">SEO / Metadata</div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Page title</label>
                          <input
                            value={String((v1Overrides as any)?.meta?.pageTitle ?? v1Spec?.metadata?.name ?? '')}
                            onChange={(e) => updateV1Meta({ pageTitle: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Meta description</label>
                          <textarea
                            value={String((v1Overrides as any)?.meta?.metaDescription ?? v1Spec?.metadata?.description ?? '')}
                            onChange={(e) => updateV1Meta({ metaDescription: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Tagline</label>
                          <input
                            value={String((v1Overrides as any)?.meta?.tagline ?? '')}
                            onChange={(e) => updateV1Meta({ tagline: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          />
                        </div>

                        <button
                          onClick={handleComposeV1}
                          disabled={!v1TemplateId || isComposing}
                          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <RefreshCw className={`w-4 h-4 ${isComposing ? 'animate-spin' : ''}`} />
                          {isComposing ? 'Re-rendering…' : 'Re-render'}
                        </button>
                      </div>
                    )}

                    {v1PanelTab === 'advanced' && (
                      <div className="space-y-4">
                        <div>
                          <div className="text-sm font-semibold text-gray-900 mb-1">Raw HTML (full document)</div>
                          <div className="text-xs text-gray-500 mb-2">Advanced: edits apply directly to the iframe srcDoc.</div>
                          <textarea
                            value={draftHtml}
                            onChange={(e) => setDraftHtml(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono"
                            rows={8}
                          />
                          <button
                            onClick={() => setEditedHtml(draftHtml)}
                            className="mt-2 w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black text-sm font-medium"
                          >
                            Apply HTML
                          </button>
                        </div>

                        <div>
                          <div className="text-sm font-semibold text-gray-900 mb-1">Overrides JSON</div>
                          <div className="text-xs text-gray-500 mb-2">Stage B: edit structured v1 overrides and re-render via the composer.</div>
                          <textarea
                            value={v1OverridesJson}
                            onChange={(e) => setV1OverridesJson(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono"
                            rows={10}
                          />
                          {v1OverridesJsonError && (
                            <div className="mt-2 text-xs text-red-600">{v1OverridesJsonError}</div>
                          )}
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={applyOverridesJsonToState}
                              className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200"
                            >
                              Apply JSON to state
                            </button>
                            <button
                              onClick={() => setV1OverridesJson(JSON.stringify(v1Overrides ?? {}, null, 2))}
                              className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200"
                              title="Replace the JSON editor contents with the current in-memory override state"
                            >
                              Load from state
                            </button>
                            <button
                              onClick={handleComposeV1}
                              disabled={!v1TemplateId || isComposing}
                              className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              <RefreshCw className={`w-4 h-4 ${isComposing ? 'animate-spin' : ''}`} />
                              Re-render
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <VisualEditor
            landingPage={editedLandingPage}
            formData={formData}
            onSave={handleSave}
            onStartOver={onStartOver}
          />
        )}
      </div>
    </div>
  );
}

