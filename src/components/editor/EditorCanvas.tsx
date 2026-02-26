'use client';

import { useState, useRef, useMemo } from 'react';
import { Trash2, ChevronUp, ChevronDown, Edit2, Check, X } from 'lucide-react';
import { EditorSection, EditorColors, EditorTypography } from '@/lib/editorTypes';
import { FormData } from '@/types';
import { sectionsToHtml, generateEditorCss } from '@/lib/editorUtils';

interface EditorCanvasProps {
  sections: EditorSection[];
  colors: EditorColors;
  typography: EditorTypography;
  editMode: 'preview' | 'edit';
  viewMode: 'desktop' | 'mobile';
  selectedSectionId: string | null;
  onSelectSection: (id: string | null) => void;
  onUpdateSection: (id: string, updates: Partial<EditorSection>) => void;
  onDeleteSection: (id: string) => void;
  onReorderSections: (fromIndex: number, toIndex: number) => void;
  formData?: FormData;
}

export default function EditorCanvas({
  sections, colors, typography, editMode, viewMode, selectedSectionId,
  onSelectSection, onUpdateSection, onDeleteSection, onReorderSections, formData,
}: EditorCanvasProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [editingText, setEditingText] = useState<{ sectionId: string; field: string } | null>(null);
  const [tempTextValue, setTempTextValue] = useState('');

  const previewHtml = useMemo(() => {
    const html = sectionsToHtml(sections, colors, formData);
    const css = generateEditorCss(colors, typography);
    return html.replace('<link rel="stylesheet" href="styles.css">', `<style>${css}</style>`);
  }, [sections, colors, typography, formData]);

  if (editMode === 'preview') {
    return (
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="bg-gray-200 px-4 py-2 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <div className="flex-1 text-center text-xs text-gray-500">Preview</div>
        </div>
        <iframe ref={iframeRef} srcDoc={previewHtml} className="w-full border-0"
          style={{ height: viewMode === 'mobile' ? '667px' : '800px' }} title="Preview" />
      </div>
    );
  }

  const sortedSections = [...sections].sort((a, b) => a.order - b.order);
  const handleMoveUp = (i: number) => { if (i > 0) onReorderSections(i, i - 1); };
  const handleMoveDown = (i: number) => { if (i < sortedSections.length - 1) onReorderSections(i, i + 1); };
  const startEditing = (sectionId: string, field: string, val: string) => { setEditingText({ sectionId, field }); setTempTextValue(val); };
  const saveEdit = () => {
    if (editingText) {
      const section = sections.find(s => s.id === editingText.sectionId);
      if (section) onUpdateSection(editingText.sectionId, { content: { ...section.content, [editingText.field]: tempTextValue } });
      setEditingText(null);
    }
  };
  const cancelEdit = () => { setEditingText(null); setTempTextValue(''); };

  return (
    <div className="space-y-4">
      {sortedSections.map((section, index) => (
        <div key={section.id}
          className={`relative group bg-white rounded-xl shadow-lg overflow-hidden transition-all ${selectedSectionId === section.id ? 'ring-2 ring-blue-500' : 'hover:ring-2 hover:ring-gray-300'}`}
          onClick={() => onSelectSection(section.id)}>
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={(e) => { e.stopPropagation(); handleMoveUp(index); }} disabled={index === 0}
              className="p-1.5 bg-white rounded-md shadow border border-gray-200 hover:bg-gray-50 disabled:opacity-40" title="Move up">
              <ChevronUp className="w-4 h-4" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleMoveDown(index); }} disabled={index === sortedSections.length - 1}
              className="p-1.5 bg-white rounded-md shadow border border-gray-200 hover:bg-gray-50 disabled:opacity-40" title="Move down">
              <ChevronDown className="w-4 h-4" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDeleteSection(section.id); }}
              className="p-1.5 bg-white rounded-md shadow border border-gray-200 hover:bg-red-50 hover:text-red-600" title="Delete">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-black/70 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
            {section.type}
          </div>
          <SectionPreview section={section} colors={colors} editingText={editingText} tempTextValue={tempTextValue}
            setTempTextValue={setTempTextValue} startEditing={startEditing} saveEdit={saveEdit} cancelEdit={cancelEdit} />
        </div>
      ))}
      {sortedSections.length === 0 && (
        <div className="text-center py-20 bg-white rounded-xl shadow-lg">
          <p className="text-gray-500">No sections yet. Add components from the left panel.</p>
        </div>
      )}
    </div>
  );
}


interface SectionPreviewProps {
  section: EditorSection;
  colors: EditorColors;
  editingText: { sectionId: string; field: string } | null;
  tempTextValue: string;
  setTempTextValue: (v: string) => void;
  startEditing: (id: string, field: string, val: string) => void;
  saveEdit: () => void;
  cancelEdit: () => void;
}

function SectionPreview({ section, colors, editingText, tempTextValue, setTempTextValue, startEditing, saveEdit, cancelEdit }: SectionPreviewProps) {
  const isEditing = editingText?.sectionId === section.id;

  const renderEditableText = (field: string, value: string, className: string, placeholder: string) => {
    if (isEditing && editingText?.field === field) {
      return (
        <div className="flex items-center gap-2 justify-center">
          <input type="text" value={tempTextValue} onChange={(e) => setTempTextValue(e.target.value)}
            className={`${className} bg-white/90 border border-blue-500 rounded px-2 py-1 text-gray-900`} autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }} />
          <button onClick={saveEdit} className="p-1 bg-green-500 text-white rounded"><Check className="w-4 h-4" /></button>
          <button onClick={cancelEdit} className="p-1 bg-gray-500 text-white rounded"><X className="w-4 h-4" /></button>
        </div>
      );
    }
    return (
      <div className={`${className} cursor-pointer hover:bg-black/10 rounded px-1 inline-block group/text`}
        onClick={(e) => { e.stopPropagation(); startEditing(section.id, field, value || placeholder); }}>
        {value || placeholder}
        <Edit2 className="w-3 h-3 inline-block ml-1 opacity-0 group-hover/text:opacity-100" />
      </div>
    );
  };

  const getStyle = (): React.CSSProperties => {
    const style: React.CSSProperties = { padding: '40px 20px', backgroundColor: section.styles.backgroundColor || colors.background, color: section.styles.textColor || colors.text };
    if (section.type === 'hero') {
      if (section.styles.backgroundImage) {
        const opacity = section.styles.backgroundOverlayOpacity ?? 0.4;
        style.backgroundImage = `linear-gradient(rgba(0,0,0,${opacity}), rgba(0,0,0,${opacity})), url(${section.styles.backgroundImage})`;
        style.backgroundSize = 'cover';
        style.backgroundPosition = 'center';
      } else {
        style.backgroundColor = colors.heroBackground;
      }
      style.color = colors.heroText;
      style.textAlign = 'center';
    } else if (section.type === 'cta') {
      if (section.styles.backgroundImage) {
        const opacity = section.styles.backgroundOverlayOpacity ?? 0.4;
        style.backgroundImage = `linear-gradient(rgba(0,0,0,${opacity}), rgba(0,0,0,${opacity})), url(${section.styles.backgroundImage})`;
        style.backgroundSize = 'cover';
        style.backgroundPosition = 'center';
      } else {
        style.backgroundColor = colors.ctaBackground;
      }
      style.color = colors.ctaText;
      style.textAlign = 'center';
    } else if (section.type === 'features' || section.type === 'testimonials') {
      style.backgroundColor = section.styles.backgroundColor || colors.sectionAltBackground;
      style.color = section.styles.textColor || colors.sectionAltText;
    } else if (section.type === 'footer') {
      style.backgroundColor = colors.footerBackground;
      style.color = colors.footerText;
    }
    return style;
  };

  switch (section.type) {
    case 'hero':
      return (
        <div style={getStyle()} className="min-h-[200px]">
          <div className="max-w-3xl mx-auto">
            {renderEditableText('headline', section.content.headline, 'text-3xl font-bold mb-2', 'Your Headline')}
            {renderEditableText('subheadline', section.content.subheadline, 'text-lg opacity-90 mb-4', 'Your subheadline')}
            <div className="mt-4">
              <div className="inline-block px-6 py-3 rounded-lg font-semibold" style={{ backgroundColor: colors.ctaBackground, color: colors.ctaText }}>
                {renderEditableText('ctaText', section.content.ctaText, '', 'Get Started')}
              </div>
            </div>
          </div>
        </div>
      );
    case 'features':
      return (
        <div style={getStyle()}>
          <div className="max-w-4xl mx-auto">
            {renderEditableText('title', section.content.title, 'text-2xl font-bold mb-4 text-center', 'Why Choose Us')}
            <div className="grid grid-cols-3 gap-4 mt-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white/10 p-4 rounded-lg"><div className="w-10 h-10 bg-white/20 rounded-lg mb-2" /><p className="font-medium">Feature {i}</p></div>
              ))}
            </div>
          </div>
        </div>
      );
    case 'testimonials':
      return (
        <div style={getStyle()}>
          <div className="max-w-4xl mx-auto">
            {renderEditableText('title', section.content.title, 'text-2xl font-bold mb-4 text-center', 'What Our Customers Say')}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-4 rounded-lg shadow" style={{ backgroundColor: colors.cardBackground, color: colors.cardText }}><p className="italic">"Great service!"</p><p className="mt-2 font-medium text-sm">- Happy Customer</p></div>
              <div className="p-4 rounded-lg shadow" style={{ backgroundColor: colors.cardBackground, color: colors.cardText }}><p className="italic">"Highly recommended!"</p><p className="mt-2 font-medium text-sm">- Another Customer</p></div>
            </div>
          </div>
        </div>
      );
    case 'cta':
      return (
        <div style={getStyle()} className="text-center">
          <div className="max-w-2xl mx-auto">
            {renderEditableText('headline', section.content.headline, 'text-2xl font-bold mb-2', 'Ready to Get Started?')}
            {renderEditableText('subheadline', section.content.subheadline, 'text-lg opacity-90 mb-4', 'Join thousands today')}
            <div className="inline-block px-6 py-3 rounded-lg font-semibold mt-2" style={{ backgroundColor: colors.ctaBackground, color: colors.ctaText }}>
              {renderEditableText('ctaText', section.content.ctaText, '', 'Sign Up Now')}
            </div>
          </div>
        </div>
      );
    case 'contact':
      return (
        <div style={getStyle()}>
          <div className="max-w-md mx-auto text-center">
            {renderEditableText('title', section.content.title, 'text-2xl font-bold mb-2', 'Get In Touch')}
            <div className="space-y-3 mt-4">
              <div className="h-10 bg-white rounded border border-gray-300" />
              <div className="h-10 bg-white rounded border border-gray-300" />
              <div className="h-24 bg-white rounded border border-gray-300" />
              <div className="w-full py-3 rounded-lg font-semibold" style={{ backgroundColor: colors.ctaBackground, color: colors.ctaText }}>
                {renderEditableText('ctaText', section.content.ctaText, '', 'Send Message')}
              </div>
            </div>
          </div>
        </div>
      );
    case 'footer':
      return <div style={{ backgroundColor: colors.footerBackground, color: colors.footerText, padding: '20px', textAlign: 'center' }}>{renderEditableText('text', section.content.text, 'text-sm', '© 2024 Your Company')}</div>;
    case 'pricing':
      return (
        <div style={getStyle()}>
          <div className="max-w-3xl mx-auto text-center">
            {renderEditableText('title', section.content.title, 'text-2xl font-bold mb-4', 'Choose Your Plan')}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-6 rounded-lg shadow" style={{ backgroundColor: colors.cardBackground, color: colors.cardText }}><h3 className="font-bold">Basic</h3><p className="text-2xl font-bold mt-2" style={{ color: colors.primary }}>$9/mo</p></div>
              <div className="p-6 rounded-lg shadow" style={{ backgroundColor: colors.cardBackground, color: colors.cardText }}><h3 className="font-bold">Pro</h3><p className="text-2xl font-bold mt-2" style={{ color: colors.primary }}>$29/mo</p></div>
            </div>
          </div>
        </div>
      );
    default:
      return <div style={getStyle()} className="min-h-[100px] text-center py-8"><p className="text-gray-500">Section: {section.type}</p>{renderEditableText('title', section.content.title, 'text-xl font-bold', 'Edit Title')}</div>;
  }
}