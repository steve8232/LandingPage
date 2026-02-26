'use client';

import { useState, useCallback } from 'react';
import { Check, Palette, Sparkles, X, Eye, Maximize2 } from 'lucide-react';
import {
  v1Templates,
  v1CategoryLabels,
  V1DisplayCategory,
  V1TemplateEntry,
  v1EntryToTemplate,
} from '@/lib/v1Templates';
import { Template } from '@/lib/templates';

interface Step0TemplateSelectProps {
  onSelect: (template: Template, customizeWithUrl: boolean) => void;
}

export default function Step0TemplateSelect({ onSelect }: Step0TemplateSelectProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<V1TemplateEntry | null>(null);
  const [customizeWithUrl, setCustomizeWithUrl] = useState(false);
  const [activeCategory, setActiveCategory] = useState<V1DisplayCategory | 'all'>('all');
  const [previewModal, setPreviewModal] = useState<V1TemplateEntry | null>(null);

  const categories: (V1DisplayCategory | 'all')[] = [
    'all', 'saas', 'product', 'leadgen', 'waitlist', 'event'
  ];

  const filteredTemplates = activeCategory === 'all'
    ? v1Templates
    : v1Templates.filter(t => t.category === activeCategory);

  const handleContinue = () => {
    if (selectedTemplate) {
      onSelect(v1EntryToTemplate(selectedTemplate), customizeWithUrl);
    }
  };

  const openPreview = useCallback((e: React.MouseEvent, template: V1TemplateEntry) => {
    e.stopPropagation();
    setPreviewModal(template);
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl mb-4">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Template</h2>
        <p className="text-gray-600">Select a starting template — each shows a real preview with example content</p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === cat
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat === 'all' ? 'All Templates' : v1CategoryLabels[cat as V1DisplayCategory]}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            onClick={() => setSelectedTemplate(template)}
            className={`relative bg-white rounded-xl border-2 cursor-pointer transition-all hover:shadow-xl group ${
              selectedTemplate?.id === template.id
                ? 'border-indigo-600 ring-2 ring-indigo-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Live Preview Thumbnail */}
            <div className="relative overflow-hidden rounded-t-lg bg-gray-100" style={{ height: '220px' }}>
              <iframe
                src={`/v1/previews/${template.id}`}
                title={`${template.name} preview`}
                className="pointer-events-none border-0"
                style={{
                  width: '1200px',
                  height: '900px',
                  transform: 'scale(0.275)',
                  transformOrigin: 'top left',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                }}
                sandbox="allow-same-origin"
                loading="lazy"
              />
              {/* Hover overlay with preview button */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button
                  onClick={(e) => openPreview(e, template)}
                  className="bg-white text-gray-800 px-4 py-2 rounded-lg font-medium text-sm shadow-lg flex items-center gap-2 hover:bg-gray-50 transition-colors"
                >
                  <Maximize2 className="w-4 h-4" />
                  Full Preview
                </button>
              </div>
              {/* Selected checkmark */}
              {selectedTemplate?.id === template.id && (
                <div className="absolute top-3 right-3 w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg z-10">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            {/* Template Info */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-semibold text-gray-900">{template.name}</h3>
                <button
                  onClick={(e) => openPreview(e, template)}
                  className="text-gray-400 hover:text-indigo-600 transition-colors p-1"
                  title="Preview template"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-2 line-clamp-2">{template.description}</p>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                  {v1CategoryLabels[template.category]}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs ${template.isDark ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {template.isDark ? 'Dark' : 'Light'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Customize Option */}
      {selectedTemplate && (
        <div className="bg-gray-50 rounded-xl p-5 mb-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={customizeWithUrl}
              onChange={(e) => setCustomizeWithUrl(e.target.checked)}
              className="mt-1 w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <span className="font-medium text-gray-900 flex items-center gap-2">
                <Palette className="w-4 h-4 text-indigo-600" />
                Customize colors with a reference URL
              </span>
              <p className="text-sm text-gray-500 mt-1">
                Optionally analyze another website to extract its color scheme and apply it to this template
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Continue Button */}
      <div className="flex justify-center">
        <button
          onClick={handleContinue}
          disabled={!selectedTemplate}
          className={`px-8 py-3 rounded-xl font-semibold transition-all ${
            selectedTemplate
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Continue with {selectedTemplate?.name || 'Template'} →
        </button>
      </div>

      {/* Full Preview Modal */}
      {previewModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewModal(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{previewModal.name}</h3>
                <p className="text-sm text-gray-500">{previewModal.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedTemplate(previewModal);
                    setPreviewModal(null);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Use This Template
                </button>
                <button
                  onClick={() => setPreviewModal(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <iframe
                src={`/v1/previews/${previewModal.id}`}
                title={`${previewModal.name} full preview`}
                className="w-full border-0"
                style={{ height: '800px' }}
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

