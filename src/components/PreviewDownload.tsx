'use client';

import { useState, useMemo, useCallback } from 'react';
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

  function findOverrideSectionIndex(
    overrides: V1ContentOverrides | undefined,
    predicate: (section: Record<string, unknown>) => boolean
  ): number {
    const arr = overrides?.sections;
    if (!Array.isArray(arr)) return -1;
    for (let i = 0; i < arr.length; i++) {
      const s = arr[i];
      if (!s || typeof s !== 'object') continue;
      if (predicate(s as Record<string, unknown>)) return i;
    }
    return -1;
  }

  const heroIdx = useMemo(
    () =>
      findOverrideSectionIndex(v1Overrides, (s) =>
        typeof s.headline === 'string' && typeof s.ctaLabel === 'string'
      ),
    [v1Overrides]
  );
  const finalCtaIdx = useMemo(
    () =>
      findOverrideSectionIndex(v1Overrides, (s) =>
        typeof s.heading === 'string' && typeof s.ctaLabel === 'string'
      ),
    [v1Overrides]
  );

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
                      <div className="space-y-6">
                        <div>
                          <div className="text-sm font-semibold text-gray-900 mb-2">Hero</div>
                          {heroIdx < 0 ? (
                            <div className="text-sm text-gray-600">Hero overrides not found for this template.</div>
                          ) : (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Headline</label>
                                <input
                                  value={String((v1Overrides?.sections?.[heroIdx] as any)?.headline ?? '')}
                                  onChange={(e) => updateV1Section(heroIdx, { headline: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Subheadline</label>
                                <textarea
                                  value={String((v1Overrides?.sections?.[heroIdx] as any)?.subheadline ?? '')}
                                  onChange={(e) => updateV1Section(heroIdx, { subheadline: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                  rows={3}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">CTA label</label>
                                  <input
                                    value={String((v1Overrides?.sections?.[heroIdx] as any)?.ctaLabel ?? '')}
                                    onChange={(e) => updateV1Section(heroIdx, { ctaLabel: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Trust badge</label>
                                  <input
                                    value={String((v1Overrides?.sections?.[heroIdx] as any)?.trustBadge ?? '')}
                                    onChange={(e) => updateV1Section(heroIdx, { trustBadge: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="text-sm font-semibold text-gray-900 mb-2">Final CTA</div>
                          {finalCtaIdx < 0 ? (
                            <div className="text-sm text-gray-600">Final CTA overrides not found for this template.</div>
                          ) : (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Heading</label>
                                <input
                                  value={String((v1Overrides?.sections?.[finalCtaIdx] as any)?.heading ?? '')}
                                  onChange={(e) => updateV1Section(finalCtaIdx, { heading: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Subheading</label>
                                <textarea
                                  value={String((v1Overrides?.sections?.[finalCtaIdx] as any)?.subheading ?? '')}
                                  onChange={(e) => updateV1Section(finalCtaIdx, { subheading: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                  rows={2}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Button label</label>
                                <input
                                  value={String((v1Overrides?.sections?.[finalCtaIdx] as any)?.ctaLabel ?? '')}
                                  onChange={(e) => updateV1Section(finalCtaIdx, { ctaLabel: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Urgency</label>
                                <input
                                  value={String((v1Overrides?.sections?.[finalCtaIdx] as any)?.urgency ?? '')}
                                  onChange={(e) => updateV1Section(finalCtaIdx, { urgency: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Guarantee</label>
                                <input
                                  value={String((v1Overrides?.sections?.[finalCtaIdx] as any)?.guarantee ?? '')}
                                  onChange={(e) => updateV1Section(finalCtaIdx, { guarantee: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                />
                              </div>
                            </div>
                          )}
                        </div>

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
                            value={String((v1Overrides as any)?.meta?.pageTitle ?? '')}
                            onChange={(e) => updateV1Meta({ pageTitle: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Meta description</label>
                          <textarea
                            value={String((v1Overrides as any)?.meta?.metaDescription ?? '')}
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

