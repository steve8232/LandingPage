'use client';

import { useState } from 'react';
import { Palette, Type, Layout } from 'lucide-react';
import { EditorColors, EditorTypography, EditorSection } from '@/lib/editorTypes';

interface StylePanelProps {
  colors: EditorColors;
  typography: EditorTypography;
  selectedSection?: EditorSection;
  onUpdateColors: (colors: Partial<EditorColors>) => void;
  onUpdateTypography: (typography: Partial<EditorTypography>) => void;
  onUpdateSection: (id: string, updates: Partial<EditorSection>) => void;
}

type Tab = 'colors' | 'typography' | 'section';

const globalColorKeys: (keyof EditorColors)[] = [
  'primary', 'primaryDark', 'secondary', 'accent',
  'background', 'backgroundAlt', 'text', 'textMuted',
];

const sectionColorKeys: (keyof EditorColors)[] = [
  'heroBackground', 'heroText',
  'ctaBackground', 'ctaText',
  'sectionAltBackground', 'sectionAltText',
  'cardBackground', 'cardText',
  'headerBackground', 'headerText',
  'footerBackground', 'footerText',
];

const colorLabels: Record<keyof EditorColors, string> = {
  primary: 'Primary',
  primaryDark: 'Primary Dark',
  secondary: 'Secondary',
  accent: 'Accent',
  background: 'Background',
  backgroundAlt: 'Alt Background',
  text: 'Text',
  textMuted: 'Muted Text',
  ctaBackground: 'CTA Button BG',
  ctaText: 'CTA Button Text',
  heroBackground: 'Hero Background',
  heroText: 'Hero Text',
  sectionAltBackground: 'Section Alt BG',
  sectionAltText: 'Section Alt Text',
  cardBackground: 'Card Background',
  cardText: 'Card Text',
  headerBackground: 'Header Background',
  headerText: 'Header Text',
  footerBackground: 'Footer Background',
  footerText: 'Footer Text',
};

export default function StylePanel({
  colors,
  typography,
  selectedSection,
  onUpdateColors,
  onUpdateTypography,
  onUpdateSection,
}: StylePanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('colors');

  const tabs = [
    { id: 'colors' as Tab, label: 'Colors', icon: Palette },
    { id: 'typography' as Tab, label: 'Typography', icon: Type },
    { id: 'section' as Tab, label: 'Section', icon: Layout },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-2 text-xs font-medium flex flex-col items-center gap-1 transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'colors' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700">Global Colors</h3>
            {globalColorKeys.map((key) => (
              <div key={key} className="flex items-center justify-between">
                <label className="text-sm text-gray-600">{colorLabels[key]}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={colors[key]}
                    onChange={(e) => onUpdateColors({ [key]: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer border border-gray-200"
                  />
                  <input
                    type="text"
                    value={colors[key]}
                    onChange={(e) => onUpdateColors({ [key]: e.target.value })}
                    className="w-20 text-xs px-2 py-1 border border-gray-200 rounded"
                  />
                </div>
              </div>
            ))}
            <div className="border-t border-gray-200 pt-3 mt-3">
              <h3 className="font-semibold text-sm text-gray-700 mb-3">Section Colors</h3>
              {sectionColorKeys.map((key) => (
                <div key={key} className="flex items-center justify-between mb-3">
                  <label className="text-sm text-gray-600">{colorLabels[key]}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colors[key]}
                      onChange={(e) => onUpdateColors({ [key]: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer border border-gray-200"
                    />
                    <input
                      type="text"
                      value={colors[key]}
                      onChange={(e) => onUpdateColors({ [key]: e.target.value })}
                      className="w-20 text-xs px-2 py-1 border border-gray-200 rounded"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'typography' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700">Typography</h3>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Global Font (applies to all)</label>
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    onUpdateTypography({
                      headingFont: `${e.target.value}, system-ui, sans-serif`,
                      bodyFont: `${e.target.value}, system-ui, sans-serif`
                    });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
              >
                <option value="">-- Select to apply same font everywhere --</option>
                <option value="Inter">Inter</option>
                <option value="Poppins">Poppins</option>
                <option value="Roboto">Roboto</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Playfair Display">Playfair Display</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Lato">Lato</option>
                <option value="Source Sans Pro">Source Sans Pro</option>
              </select>
            </div>
            <div className="border-t border-gray-200 my-3 pt-3">
              <p className="text-xs text-gray-500 mb-2">Or customize individually:</p>
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Heading Font</label>
              <select
                value={typography.headingFont.split(',')[0]}
                onChange={(e) => onUpdateTypography({ headingFont: `${e.target.value}, system-ui, sans-serif` })}
                className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
              >
                <option value="Inter">Inter</option>
                <option value="Poppins">Poppins</option>
                <option value="Roboto">Roboto</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Playfair Display">Playfair Display</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Body Font</label>
              <select
                value={typography.bodyFont.split(',')[0]}
                onChange={(e) => onUpdateTypography({ bodyFont: `${e.target.value}, system-ui, sans-serif` })}
                className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
              >
                <option value="Inter">Inter</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Roboto">Roboto</option>
                <option value="Lato">Lato</option>
                <option value="Source Sans Pro">Source Sans Pro</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Heading Weight</label>
              <select
                value={typography.headingWeight}
                onChange={(e) => onUpdateTypography({ headingWeight: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
              >
                <option value="400">Normal (400)</option>
                <option value="500">Medium (500)</option>
                <option value="600">Semibold (600)</option>
                <option value="700">Bold (700)</option>
                <option value="800">Extra Bold (800)</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Base Font Size</label>
              <select
                value={typography.baseFontSize}
                onChange={(e) => onUpdateTypography({ baseFontSize: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
              >
                <option value="14px">Small (14px)</option>
                <option value="16px">Medium (16px)</option>
                <option value="18px">Large (18px)</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'section' && (
          <div className="space-y-4">
            {selectedSection ? (
              <>
                <h3 className="font-semibold text-sm text-gray-700">Section: {selectedSection.type}</h3>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Background Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedSection.styles.backgroundColor || colors.backgroundAlt}
                      onChange={(e) => onUpdateSection(selectedSection.id, {
                        styles: { ...selectedSection.styles, backgroundColor: e.target.value }
                      })}
                      className="w-8 h-8 rounded cursor-pointer border border-gray-200"
                    />
                    <input
                      type="text"
                      value={selectedSection.styles.backgroundColor || ''}
                      onChange={(e) => onUpdateSection(selectedSection.id, {
                        styles: { ...selectedSection.styles, backgroundColor: e.target.value }
                      })}
                      placeholder="var(--background)"
                      className="flex-1 text-xs px-2 py-1 border border-gray-200 rounded"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Text Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedSection.styles.textColor || colors.text}
                      onChange={(e) => onUpdateSection(selectedSection.id, {
                        styles: { ...selectedSection.styles, textColor: e.target.value }
                      })}
                      className="w-8 h-8 rounded cursor-pointer border border-gray-200"
                    />
                    <input
                      type="text"
                      value={selectedSection.styles.textColor || ''}
                      onChange={(e) => onUpdateSection(selectedSection.id, {
                        styles: { ...selectedSection.styles, textColor: e.target.value }
                      })}
                      placeholder="var(--text)"
                      className="flex-1 text-xs px-2 py-1 border border-gray-200 rounded"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Container Width</label>
                  <select
                    value={selectedSection.styles.containerWidth || 'contained'}
                    onChange={(e) => onUpdateSection(selectedSection.id, {
                      styles: { ...selectedSection.styles, containerWidth: e.target.value as 'full' | 'contained' | 'narrow' }
                    })}
                    className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
                  >
                    <option value="full">Full Width</option>
                    <option value="contained">Contained (1200px)</option>
                    <option value="narrow">Narrow (800px)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Padding</label>
                  <select
                    value={selectedSection.styles.padding || '60px 0'}
                    onChange={(e) => onUpdateSection(selectedSection.id, {
                      styles: { ...selectedSection.styles, padding: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
                  >
                    <option value="20px 0">Small (20px)</option>
                    <option value="40px 0">Medium (40px)</option>
                    <option value="60px 0">Large (60px)</option>
                    <option value="80px 0">Extra Large (80px)</option>
                  </select>
                </div>
                {(selectedSection.type === 'hero' || selectedSection.type === 'cta') && (
                  <>
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <label className="text-sm text-gray-600 block mb-1">Background Image</label>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 5 * 1024 * 1024) {
                            alert('Image must be less than 5MB');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === 'string') {
                              onUpdateSection(selectedSection.id, {
                                styles: { ...selectedSection.styles, backgroundImage: reader.result }
                              });
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                        className="w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {selectedSection.styles.backgroundImage && (
                        <div className="mt-2">
                          <img
                            src={selectedSection.styles.backgroundImage}
                            alt="Background preview"
                            className="w-full h-20 object-cover rounded border border-gray-200"
                          />
                          <button
                            onClick={() => onUpdateSection(selectedSection.id, {
                              styles: { ...selectedSection.styles, backgroundImage: undefined, backgroundOverlayOpacity: undefined }
                            })}
                            className="text-xs text-red-600 hover:text-red-700 mt-1"
                          >
                            Remove Image
                          </button>
                        </div>
                      )}
                    </div>
                    {selectedSection.styles.backgroundImage && (
                      <div>
                        <label className="text-sm text-gray-600 block mb-1">
                          Overlay Opacity: {Math.round((selectedSection.styles.backgroundOverlayOpacity ?? 0.4) * 100)}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="80"
                          value={(selectedSection.styles.backgroundOverlayOpacity ?? 0.4) * 100}
                          onChange={(e) => onUpdateSection(selectedSection.id, {
                            styles: { ...selectedSection.styles, backgroundOverlayOpacity: parseInt(e.target.value) / 100 }
                          })}
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500 mt-1">Adjust darkness for text readability</p>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                <Layout className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>Select a section to edit its styles</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

