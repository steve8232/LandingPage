'use client';

import { useReducer, useCallback, useMemo } from 'react';
import {
  EditorState,
  EditorAction,
  EditorSection,
  EditorColors,
  EditorTypography,
  HistoryEntry,
} from '@/lib/editorTypes';

const MAX_HISTORY = 50;

const initialColors: EditorColors = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  secondary: '#6366f1',
  accent: '#10b981',
  background: '#ffffff',
  backgroundAlt: '#f8fafc',
  text: '#1e293b',
  textMuted: '#64748b',
  ctaBackground: '#2563eb',
  ctaText: '#ffffff',
  heroBackground: '#2563eb',
  heroText: '#ffffff',
  sectionAltBackground: '#f8fafc',
  sectionAltText: '#1e293b',
  cardBackground: '#ffffff',
  cardText: '#1e293b',
  headerBackground: '#ffffff',
  headerText: '#1e293b',
  footerBackground: '#1e293b',
  footerText: '#ffffff',
};

const initialTypography: EditorTypography = {
  headingFont: 'Inter, system-ui, sans-serif',
  bodyFont: 'Inter, system-ui, sans-serif',
  headingWeight: '700',
  baseFontSize: '16px',
};

const createInitialState = (sections: EditorSection[] = []): EditorState => ({
  sections,
  colors: initialColors,
  typography: initialTypography,
  selectedSectionId: null,
  selectedElementId: null,
  editMode: 'preview',
  history: [],
  historyIndex: -1,
  isDirty: false,
});

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_SECTIONS':
      return { ...state, sections: action.payload, isDirty: true };

    case 'UPDATE_SECTION': {
      const { id, updates } = action.payload;
      const sections = state.sections.map((section) =>
        section.id === id ? { ...section, ...updates } : section
      );
      return { ...state, sections, isDirty: true };
    }

    case 'DELETE_SECTION': {
      const sections = state.sections.filter((s) => s.id !== action.payload);
      return {
        ...state,
        sections,
        selectedSectionId: state.selectedSectionId === action.payload ? null : state.selectedSectionId,
        isDirty: true,
      };
    }

    case 'REORDER_SECTIONS': {
      const { fromIndex, toIndex } = action.payload;
      const sections = [...state.sections];
      const [removed] = sections.splice(fromIndex, 1);
      sections.splice(toIndex, 0, removed);
      // Update order property
      const reorderedSections = sections.map((s, i) => ({ ...s, order: i }));
      return { ...state, sections: reorderedSections, isDirty: true };
    }

    case 'ADD_SECTION': {
      const { section, afterId } = action.payload;
      let sections: EditorSection[];
      if (afterId) {
        const index = state.sections.findIndex((s) => s.id === afterId);
        sections = [
          ...state.sections.slice(0, index + 1),
          section,
          ...state.sections.slice(index + 1),
        ];
      } else {
        sections = [...state.sections, section];
      }
      // Update order property
      const reorderedSections = sections.map((s, i) => ({ ...s, order: i }));
      return { ...state, sections: reorderedSections, isDirty: true };
    }

    case 'SET_COLORS':
      return { ...state, colors: { ...state.colors, ...action.payload }, isDirty: true };

    case 'SET_TYPOGRAPHY':
      return { ...state, typography: { ...state.typography, ...action.payload }, isDirty: true };

    case 'SELECT_SECTION':
      return { ...state, selectedSectionId: action.payload };

    case 'SELECT_ELEMENT':
      return { ...state, selectedElementId: action.payload };

    case 'SET_EDIT_MODE':
      return { ...state, editMode: action.payload };

    case 'SAVE_HISTORY': {
      const entry: HistoryEntry = {
        sections: JSON.parse(JSON.stringify(state.sections)),
        colors: { ...state.colors },
        typography: { ...state.typography },
        timestamp: Date.now(),
      };
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(entry);
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }
      return { ...state, history: newHistory, historyIndex: newHistory.length - 1 };
    }

    case 'UNDO': {
      if (state.historyIndex <= 0) return state;
      const prevEntry = state.history[state.historyIndex - 1];
      return {
        ...state,
        sections: prevEntry.sections,
        colors: prevEntry.colors,
        typography: prevEntry.typography,
        historyIndex: state.historyIndex - 1,
        isDirty: true,
      };
    }

    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state;
      const nextEntry = state.history[state.historyIndex + 1];
      return {
        ...state,
        sections: nextEntry.sections,
        colors: nextEntry.colors,
        typography: nextEntry.typography,
        historyIndex: state.historyIndex + 1,
        isDirty: true,
      };
    }

    case 'RESET':
      return createInitialState();

    default:
      return state;
  }
}

export function useEditorState(initialSections: EditorSection[] = [], initialColorsOverride?: Partial<EditorColors>) {
  const [state, dispatch] = useReducer(
    editorReducer,
    createInitialState(initialSections),
    (initial) => ({
      ...initial,
      colors: { ...initial.colors, ...initialColorsOverride },
    })
  );

  const updateSection = useCallback((id: string, updates: Partial<EditorSection>) => {
    dispatch({ type: 'UPDATE_SECTION', payload: { id, updates } });
  }, []);

  const deleteSection = useCallback((id: string) => {
    dispatch({ type: 'DELETE_SECTION', payload: id });
  }, []);

  const reorderSections = useCallback((fromIndex: number, toIndex: number) => {
    dispatch({ type: 'REORDER_SECTIONS', payload: { fromIndex, toIndex } });
  }, []);

  const addSection = useCallback((section: EditorSection, afterId?: string) => {
    dispatch({ type: 'ADD_SECTION', payload: { section, afterId } });
  }, []);

  const setColors = useCallback((colors: Partial<EditorColors>) => {
    dispatch({ type: 'SET_COLORS', payload: colors });
  }, []);

  const setTypography = useCallback((typography: Partial<EditorTypography>) => {
    dispatch({ type: 'SET_TYPOGRAPHY', payload: typography });
  }, []);

  const selectSection = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_SECTION', payload: id });
  }, []);

  const selectElement = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_ELEMENT', payload: id });
  }, []);

  const setEditMode = useCallback((mode: 'preview' | 'edit') => {
    dispatch({ type: 'SET_EDIT_MODE', payload: mode });
  }, []);

  const saveHistory = useCallback(() => {
    dispatch({ type: 'SAVE_HISTORY' });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const canUndo = useMemo(() => state.historyIndex > 0, [state.historyIndex]);
  const canRedo = useMemo(
    () => state.historyIndex < state.history.length - 1,
    [state.historyIndex, state.history.length]
  );

  return {
    state,
    dispatch,
    updateSection,
    deleteSection,
    reorderSections,
    addSection,
    setColors,
    setTypography,
    selectSection,
    selectElement,
    setEditMode,
    saveHistory,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
  };
}

export type EditorStateHook = ReturnType<typeof useEditorState>;

