'use client';

import {
  Layout,
  Grid3X3,
  Quote,
  MousePointerClick,
  Images,
  Type,
  Mail,
  DollarSign,
  Plus,
} from 'lucide-react';
import { EditorSection, componentTemplates, ComponentTemplate } from '@/lib/editorTypes';
import { generateId } from '@/lib/editorUtils';

interface ComponentSidebarProps {
  onAddSection: (section: EditorSection, afterId?: string) => void;
  selectedSectionId: string | null;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Layout,
  Grid3X3,
  Quote,
  MousePointerClick,
  Images,
  Type,
  Mail,
  DollarSign,
};

export default function ComponentSidebar({
  onAddSection,
  selectedSectionId,
}: ComponentSidebarProps) {
  const handleAddComponent = (template: ComponentTemplate) => {
    const newSection: EditorSection = {
      id: generateId(),
      type: template.type,
      content: { ...template.defaultContent },
      styles: { ...template.defaultStyles },
      order: Date.now(), // Will be reordered by reducer
    };
    onAddSection(newSection, selectedSectionId || undefined);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">Components</h2>
        <p className="text-xs text-gray-500 mt-1">Click to add a section</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-2">
          {componentTemplates.map((template) => {
            const Icon = iconMap[template.icon] || Layout;
            return (
              <button
                key={template.id}
                onClick={() => handleAddComponent(template)}
                className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 group-hover:text-blue-600 group-hover:border-blue-200">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {template.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {template.description}
                    </p>
                  </div>
                  <Plus className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500">
          <p className="font-medium text-gray-700 mb-1">Tips:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Click any component to add it</li>
            <li>Select a section first to insert after it</li>
            <li>Use the canvas to reorder sections</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

