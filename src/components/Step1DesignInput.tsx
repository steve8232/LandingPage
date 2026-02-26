'use client';

import { useState } from 'react';
import { Globe, FileText, Loader2, Check, Palette, Layout, Type } from 'lucide-react';
import { DesignInput } from '@/types';

interface DesignAnalysisResult {
  colors: {
    primary: string;
    primaryDark: string;
    secondary: string;
    accent: string;
    background: string;
    backgroundAlt: string;
    text: string;
    textMuted: string;
  };
  colorUsage: {
    heroBackground: string;
    heroText: string;
    ctaBackground: string;
    ctaText: string;
    sectionAltBackground: string;
    cardBackground: string;
    cardText: string;
    headerBackground: string;
    headerText: string;
    footerBackground: string;
    footerText: string;
  };
  colorHarmony: {
    scheme: string;
    saturation: string;
    contrast: string;
    dominantColor: string;
    accentUsage: string;
  };
  typography: {
    style: string;
    headingWeight: string;
    fontStack: string;
    headingCase: string;
  };
  layout: {
    style: string;
    borderRadius: string;
    spacing: string;
    buttonStyle: string;
    shadowIntensity: string;
  };
  mood: string;
  isDark: boolean;
}

interface Step1Props {
  data: DesignInput;
  onUpdate: (data: DesignInput) => void;
  onNext: () => void;
  onBack?: () => void;
}

export default function Step1DesignInput({ data, onUpdate, onNext, onBack }: Step1Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisPreview, setAnalysisPreview] = useState<DesignAnalysisResult | null>(null);

  const handleUrlSubmit = async () => {
    if (!data.url) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysisPreview(null);

    try {
      const response = await fetch('/api/analyze-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: data.url }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to analyze URL');
      }

      // Parse and show the analysis
      try {
        const parsed = JSON.parse(result.analysis) as DesignAnalysisResult;
        setAnalysisPreview(parsed);
      } catch {
        // If parsing fails, still continue
      }

      onUpdate({ ...data, designAnalysis: result.analysis });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueWithAnalysis = () => {
    onNext();
  };

  const handleDescriptionSubmit = () => {
    if (!data.description) {
      setError('Please enter a description');
      return;
    }
    onUpdate({ ...data, designAnalysis: data.description });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Design Reference</h2>
        <p className="text-gray-600">
          Choose how you want to provide design inspiration for your landing page.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <button
          onClick={() => onUpdate({ ...data, option: 'url' })}
          className={`p-6 rounded-xl border-2 text-left transition-all ${
            data.option === 'url'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Globe className={`w-8 h-8 mb-3 ${data.option === 'url' ? 'text-blue-600' : 'text-gray-400'}`} />
          <h3 className="font-semibold text-gray-900 mb-1">Use Existing Website</h3>
          <p className="text-sm text-gray-600">
            Enter the URL of a website to analyze its design
          </p>
        </button>

        <button
          onClick={() => onUpdate({ ...data, option: 'description' })}
          className={`p-6 rounded-xl border-2 text-left transition-all ${
            data.option === 'description'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <FileText className={`w-8 h-8 mb-3 ${data.option === 'description' ? 'text-blue-600' : 'text-gray-400'}`} />
          <h3 className="font-semibold text-gray-900 mb-1">Describe Your Design</h3>
          <p className="text-sm text-gray-600">
            Write a description of the design you want
          </p>
        </button>
      </div>

      {data.option === 'url' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website URL
            </label>
            <input
              type="url"
              value={data.url || ''}
              onChange={(e) => {
                onUpdate({ ...data, url: e.target.value });
                setAnalysisPreview(null);
              }}
              placeholder="https://example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {!analysisPreview && (
            <button
              onClick={handleUrlSubmit}
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing design...
                </>
              ) : (
                'Analyze Website Design'
              )}
            </button>
          )}

          {/* Design Analysis Preview */}
          {analysisPreview && (
            <div className="bg-gray-50 rounded-xl p-5 space-y-5">
              <div className="flex items-center gap-2 text-green-600">
                <Check className="w-5 h-5" />
                <span className="font-semibold">Design Analyzed Successfully</span>
              </div>

              {/* Visual Preview - Hero Section Mock */}
              <div
                className="rounded-lg p-6 text-center"
                style={{
                  backgroundColor: analysisPreview.colorUsage?.heroBackground || analysisPreview.colors.background,
                  color: analysisPreview.colorUsage?.heroText || analysisPreview.colors.text
                }}
              >
                <p className="text-xs opacity-70 mb-2">Preview: Hero Section</p>
                <h3 className="text-lg font-bold mb-2">Your Headline Here</h3>
                <button
                  className="px-4 py-2 rounded text-sm font-semibold"
                  style={{
                    backgroundColor: analysisPreview.colorUsage?.ctaBackground || analysisPreview.colors.primary,
                    color: analysisPreview.colorUsage?.ctaText || '#ffffff',
                    borderRadius: analysisPreview.layout.borderRadius === 'full' ? '9999px' :
                                  analysisPreview.layout.borderRadius === 'large' ? '12px' : '6px'
                  }}
                >
                  Call to Action
                </button>
              </div>

              {/* Color Usage */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Color Application</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {analysisPreview.colorUsage && Object.entries({
                    'Hero BG': analysisPreview.colorUsage.heroBackground,
                    'Hero Text': analysisPreview.colorUsage.heroText,
                    'CTA Button': analysisPreview.colorUsage.ctaBackground,
                    'CTA Text': analysisPreview.colorUsage.ctaText,
                    'Cards': analysisPreview.colorUsage.cardBackground,
                    'Footer': analysisPreview.colorUsage.footerBackground,
                  }).map(([name, color]) => (
                    <div key={name} className="flex items-center gap-2 bg-white px-2 py-1.5 rounded border">
                      <div
                        className="w-5 h-5 rounded border border-gray-200 flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs text-gray-600">{name}</span>
                      <span className="text-xs font-mono text-gray-400 ml-auto">{color}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Color Harmony */}
              {analysisPreview.colorHarmony && (
                <div className="bg-white rounded-lg p-3 border">
                  <div className="flex items-center gap-2 mb-2">
                    <Layout className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Color Harmony</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-1 bg-gray-100 rounded">{analysisPreview.colorHarmony.scheme}</span>
                    <span className="px-2 py-1 bg-gray-100 rounded">{analysisPreview.colorHarmony.saturation} saturation</span>
                    <span className="px-2 py-1 bg-gray-100 rounded">{analysisPreview.colorHarmony.contrast} contrast</span>
                    <span className="px-2 py-1 bg-gray-100 rounded">{analysisPreview.colorHarmony.accentUsage}</span>
                  </div>
                </div>
              )}

              {/* Typography & Layout */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white rounded-lg p-3 border">
                  <div className="flex items-center gap-2 mb-2">
                    <Type className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-700">Typography</span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600">
                    <p>Style: <span className="text-gray-900">{analysisPreview.typography.style}</span></p>
                    <p>Weight: <span className="text-gray-900">{analysisPreview.typography.headingWeight}</span></p>
                    <p>Case: <span className="text-gray-900">{analysisPreview.typography.headingCase || 'normal'}</span></p>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border">
                  <div className="flex items-center gap-2 mb-2">
                    <Layout className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-700">Layout</span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600">
                    <p>Style: <span className="text-gray-900">{analysisPreview.layout.style}</span></p>
                    <p>Corners: <span className="text-gray-900">{analysisPreview.layout.borderRadius}</span></p>
                    <p>Buttons: <span className="text-gray-900">{analysisPreview.layout.buttonStyle || 'solid'}</span></p>
                  </div>
                </div>
              </div>

              {/* Theme & Mood */}
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  analysisPreview.isDark
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}>
                  {analysisPreview.isDark ? '🌙 Dark Theme' : '☀️ Light Theme'}
                </span>
              </div>

              {/* Mood */}
              <div className="text-sm bg-white rounded-lg p-3 border">
                <span className="text-gray-500 block mb-1">Overall Mood:</span>
                <span className="text-gray-900">{analysisPreview.mood}</span>
              </div>

              <button
                onClick={handleContinueWithAnalysis}
                className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                Use This Design & Continue
              </button>
            </div>
          )}
        </div>
      )}

      {data.option === 'description' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Design Description
            </label>
            <textarea
              value={data.description || ''}
              onChange={(e) => onUpdate({ ...data, description: e.target.value })}
              placeholder="Describe the look and feel you want for your landing page. Include colors, style, mood, layout preferences..."
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
          <button
            onClick={handleDescriptionSubmit}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
          >
            Continue
          </button>
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {onBack && (
        <button
          onClick={onBack}
          className="w-full mt-4 py-3 text-gray-600 font-medium hover:text-gray-800"
        >
          ← Back to Template Selection
        </button>
      )}
    </div>
  );
}

