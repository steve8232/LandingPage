'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Eye,
  Edit3,
  Undo2,
  Redo2,
  Download,
  RotateCcw,
  Monitor,
  Smartphone,
  Save,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import JSZip from 'jszip';
import { GeneratedLandingPage, FormData } from '@/types';
import { useEditorState } from '@/hooks/useEditorState';
import { EditorColors } from '@/lib/editorTypes';
import ComponentSidebar from './ComponentSidebar';
import EditorCanvas from './EditorCanvas';
import StylePanel from './StylePanel';
import { parseHtmlToSections, sectionsToHtml, generateEditorCss } from '@/lib/editorUtils';

interface VisualEditorProps {
  landingPage: GeneratedLandingPage;
  formData?: FormData;
  onSave?: (html: string, css: string) => void;
  onStartOver: () => void;
}

export default function VisualEditor({
  landingPage,
  formData,
  onSave,
  onStartOver,
}: VisualEditorProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [originalHtml] = useState(landingPage.html);
  const [originalCss] = useState(landingPage.css);

  // Parse initial sections from HTML
  const initialSections = parseHtmlToSections(landingPage.html);
  const initialColors = extractColorsFromCss(landingPage.css);

  const editor = useEditorState(initialSections, initialColors);
  const { state, setEditMode, undo, redo, canUndo, canRedo, saveHistory } = editor;

  // Save initial state to history
  useEffect(() => {
    saveHistory();
  }, [saveHistory]);

  const handleSave = useCallback(() => {
    const html = sectionsToHtml(state.sections, state.colors, formData);
    const css = generateEditorCss(state.colors, state.typography);
    onSave?.(html, css);
    saveHistory();
  }, [state, formData, onSave, saveHistory]);

  const handleDownload = useCallback(async () => {
    const html = sectionsToHtml(state.sections, state.colors, formData);
    const css = generateEditorCss(state.colors, state.typography);

    try {
      const zip = new JSZip();
      zip.file('index.html', html);
      zip.file('styles.css', css);

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'landing-page.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
    }
  }, [state, formData]);

  const handleReset = useCallback(() => {
    if (confirm('Reset all changes? This cannot be undone.')) {
      const sections = parseHtmlToSections(originalHtml);
      editor.dispatch({ type: 'SET_SECTIONS', payload: sections });
      const colors = extractColorsFromCss(originalCss);
      editor.setColors(colors);
    }
  }, [originalHtml, originalCss, editor]);

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Top Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-gray-900">Visual Editor</h1>
          
          {/* Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setEditMode('preview')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                state.editMode === 'preview'
                  ? 'bg-white shadow text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={() => setEditMode('edit')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                state.editMode === 'edit'
                  ? 'bg-white shadow text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
          </div>

          {/* Device Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('desktop')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'desktop' ? 'bg-white shadow text-blue-600' : 'text-gray-500'
              }`}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'mobile' ? 'bg-white shadow text-blue-600' : 'text-gray-500'
              }`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          {/* Undo/Redo */}
          <div className="flex items-center gap-1 border-l border-gray-200 pl-4">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-gray-600 hover:text-gray-900 flex items-center gap-1.5 text-sm"
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
          {state.isDirty && (
            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1.5 text-sm font-medium"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          )}
          <button
            onClick={handleDownload}
            className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5 text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Component Library */}
        {state.editMode === 'edit' && (
          <div
            className={`bg-white border-r border-gray-200 transition-all duration-300 flex-shrink-0 ${
              leftPanelOpen ? 'w-64' : 'w-0'
            }`}
          >
            {leftPanelOpen && (
              <ComponentSidebar
                onAddSection={editor.addSection}
                selectedSectionId={state.selectedSectionId}
              />
            )}
          </div>
        )}

        {/* Toggle Left Panel */}
        {state.editMode === 'edit' && (
          <button
            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white border border-gray-200 rounded-r-lg p-1 shadow-sm hover:bg-gray-50"
            style={{ left: leftPanelOpen ? '256px' : '0' }}
          >
            {leftPanelOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        )}

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto p-6">
          <div
            className={`mx-auto transition-all duration-300 ${
              viewMode === 'mobile' ? 'max-w-[375px]' : 'max-w-5xl'
            }`}
          >
            <EditorCanvas
              sections={state.sections}
              colors={state.colors}
              typography={state.typography}
              editMode={state.editMode}
              viewMode={viewMode}
              selectedSectionId={state.selectedSectionId}
              onSelectSection={editor.selectSection}
              onUpdateSection={editor.updateSection}
              onDeleteSection={editor.deleteSection}
              onReorderSections={editor.reorderSections}
              formData={formData}
            />
          </div>
        </div>

        {/* Right Panel - Style Controls */}
        {state.editMode === 'edit' && (
          <div
            className={`bg-white border-l border-gray-200 transition-all duration-300 flex-shrink-0 ${
              rightPanelOpen ? 'w-72' : 'w-0'
            }`}
          >
            {rightPanelOpen && (
              <StylePanel
                colors={state.colors}
                typography={state.typography}
                selectedSection={state.sections.find((s) => s.id === state.selectedSectionId)}
                onUpdateColors={editor.setColors}
                onUpdateTypography={editor.setTypography}
                onUpdateSection={editor.updateSection}
              />
            )}
          </div>
        )}

        {/* Toggle Right Panel */}
        {state.editMode === 'edit' && (
          <button
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white border border-gray-200 rounded-l-lg p-1 shadow-sm hover:bg-gray-50"
            style={{ right: rightPanelOpen ? '288px' : '0' }}
          >
            {rightPanelOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

// Helper function to extract colors from CSS
function extractColorsFromCss(css: string): Partial<EditorColors> {
  const colors: Partial<EditorColors> = {};

  const colorPatterns: { key: keyof EditorColors; pattern: RegExp }[] = [
    // Global colors (match --bg: but not --bg-alt:)
    { key: 'primary', pattern: /--primary:\s*([^;]+);/ },
    { key: 'primaryDark', pattern: /--primary-dark:\s*([^;]+);/ },
    { key: 'secondary', pattern: /--secondary:\s*([^;]+);/ },
    { key: 'accent', pattern: /--accent:\s*([^;]+);/ },
    { key: 'background', pattern: /--bg:\s*([^;]+);/ },
    { key: 'backgroundAlt', pattern: /--bg-alt:\s*([^;]+);/ },
    { key: 'text', pattern: /--text:\s*([^;]+);/ },
    { key: 'textMuted', pattern: /--text-muted:\s*([^;]+);/ },
    // Contextual section colors
    { key: 'heroBackground', pattern: /--hero-bg:\s*([^;]+);/ },
    { key: 'heroText', pattern: /--hero-text:\s*([^;]+);/ },
    { key: 'ctaBackground', pattern: /--cta-bg:\s*([^;]+);/ },
    { key: 'ctaText', pattern: /--cta-text:\s*([^;]+);/ },
    { key: 'sectionAltBackground', pattern: /--section-alt-bg:\s*([^;]+);/ },
    { key: 'sectionAltText', pattern: /--section-alt-text:\s*([^;]+);/ },
    { key: 'cardBackground', pattern: /--card-bg:\s*([^;]+);/ },
    { key: 'cardText', pattern: /--card-text:\s*([^;]+);/ },
    { key: 'headerBackground', pattern: /--header-bg:\s*([^;]+);/ },
    { key: 'headerText', pattern: /--header-text:\s*([^;]+);/ },
    { key: 'footerBackground', pattern: /--footer-bg:\s*([^;]+);/ },
    { key: 'footerText', pattern: /--footer-text:\s*([^;]+);/ },
  ];

  for (const { key, pattern } of colorPatterns) {
    const match = css.match(pattern);
    if (match) {
      colors[key] = match[1].trim();
    }
  }

  return colors;
}

