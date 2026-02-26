'use client';

import { useState, useMemo, useCallback } from 'react';
import { CheckCircle, AlertCircle, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { GeneratedLandingPage, FormData } from '@/types';
import { calculateConversionScore, extractScoreInput, ConversionScore } from '@/lib/conversionScore';
import VisualEditor from '@/components/editor/VisualEditor';

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

  // Create edited landing page object for the editor
  const editedLandingPage: GeneratedLandingPage = useMemo(() => ({
    html: editedHtml,
    css: editedCss,
    preview: `<!DOCTYPE html><html><head><style>${editedCss}</style></head><body>${editedHtml.replace(/<!DOCTYPE html>|<html[^>]*>|<\/html>|<head>[\s\S]*<\/head>/gi, '')}</body></html>`,
  }), [editedHtml, editedCss]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Conversion Score Banner - Collapsible */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
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

      {/* Visual Editor */}
      <div className="flex-1">
        <VisualEditor
          landingPage={editedLandingPage}
          formData={formData}
          onSave={handleSave}
          onStartOver={onStartOver}
        />
      </div>
    </div>
  );
}

