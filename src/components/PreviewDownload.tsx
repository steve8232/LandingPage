'use client';

import { useState, useMemo, useCallback, useEffect, useRef, type PointerEvent } from 'react';
import {
  Eye,
  Edit3,
  Image as ImageIcon,
  Monitor,
  Smartphone,
  RotateCcw,
  RefreshCw,
  Save,
  GripVertical,
  Trash2,
  Plus,
  Sparkles,
} from 'lucide-react';
import { GeneratedLandingPage, FormData } from '@/types';
import VisualEditor from '@/components/editor/VisualEditor';
import type { V1ContentOverrides } from '../../v1/composer/composeV1Template';
import type { UnsplashNormalizedImage } from '@/lib/unsplash/types';
import {
  loadV1PanelWidthPx,
  makeClientResultId,
  saveActiveV1EditorSession,
  saveV1PanelWidthPx,
} from '@/lib/v1EditorStorage';
import { useSession } from '@/lib/useSession';
import { createProject, updateProject } from '@/lib/projects/remoteStorage';
import { v1Templates } from '@/lib/v1Templates';

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
  niche?: string;
  metadata?: { name?: string; description?: string };
  sections: V1SpecSection[];
  assets?: Record<string, string>;
  assetSearchSeeds?: Record<string, string>;
  resolvedAssets?: Record<string, string>;
};

type StockImageResult = UnsplashNormalizedImage;

type V1ImageAttribution = {
  text: string;
  url: string;
  provider?: string;
  licenseSummary?: string;
};

type V1ImageSlot = {
  assetKey: string;
  label: string;
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
}

export default function PreviewDownload({
  landingPage,
  onStartOver,
  formData,
}: PreviewDownloadProps) {
  const [editedHtml, setEditedHtml] = useState(landingPage.html);
  const [editedCss, setEditedCss] = useState(landingPage.css);

  // v1 editor state (v1-safe: no HTML parsing; all changes are either direct HTML edits
  // or structured override edits that round-trip through the v1 composer endpoint).
  const [v1Mode, setV1Mode] = useState<'preview' | 'edit'>('preview');
  const [v1Device, setV1Device] = useState<'desktop' | 'mobile'>('desktop');
  const [v1PanelTab, setV1PanelTab] = useState<'content' | 'images' | 'seo' | 'advanced'>('content');
  const [v1Overrides, setV1Overrides] = useState<V1ContentOverrides | undefined>(landingPage.v1?.overrides);
  const [v1OverridesJson, setV1OverridesJson] = useState(() =>
    JSON.stringify(landingPage.v1?.overrides ?? {}, null, 2)
  );
  const [v1OverridesJsonError, setV1OverridesJsonError] = useState<string>('');
  const [draftHtml, setDraftHtml] = useState(landingPage.html);
  const [isComposing, setIsComposing] = useState(false);
  const [composeError, setComposeError] = useState('');

	// Detect v1 based on the HTML currently shown in the iframe (editedHtml), not just
	// the original generated HTML. This keeps v1 behaviours (like click-to-edit)
	// aligned with what the user is actually previewing.
	const isV1 = useMemo(() => isV1HtmlDocument(editedHtml), [editedHtml]);

		// Optional debug mode for diagnosing deployed click-to-edit regressions.
		// Enable by appending `?v1debug=1` to the URL.
		const [v1Debug, setV1Debug] = useState(false);
		const [v1ClickDebugInfo, setV1ClickDebugInfo] = useState<{
			attached: boolean;
			lastAttachReason: string;
			docReadyState: string;
			assetKeyElementCount: number;
			fieldKeyElementCount: number;
			lastClickTarget: string;
			lastClickedAssetKey: string;
			lastClickedFieldKey: string;
			lastClickedSectionId: string;
			lastError: string;
		}>({
			attached: false,
			lastAttachReason: '',
			docReadyState: '',
			assetKeyElementCount: 0,
			fieldKeyElementCount: 0,
			lastClickTarget: '',
			lastClickedAssetKey: '',
			lastClickedFieldKey: '',
			lastClickedSectionId: '',
			lastError: '',
		});

		useEffect(() => {
			try {
				const q = new URLSearchParams(window.location.search);
				setV1Debug(q.get('v1debug') === '1');
			} catch {
				setV1Debug(false);
			}
		}, []);

  const v1TemplateId = useMemo(() => {
    if (!isV1) return undefined;
    return landingPage.v1?.templateId || formData?.selectedTemplate?.id;
  }, [isV1, landingPage.v1?.templateId, formData?.selectedTemplate?.id]);

  // v1 local persistence
  const v1ResultId = useMemo(
    () => landingPage.v1?.resultId ?? makeClientResultId(),
    [landingPage.v1?.resultId]
  );
  const [v1SaveStatus, setV1SaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [v1SaveError, setV1SaveError] = useState<string>('');

  // Cloud-save (Phase 2): when the user is signed in, "Save changes" also
  // persists to Supabase. First save auto-creates a project; subsequent saves
  // patch the existing row and append a revision.
  const { user } = useSession();
  const [v1ProjectId, setV1ProjectId] = useState<string | undefined>(landingPage.v1?.projectId);
  const [cloudSaved, setCloudSaved] = useState(false);
  const lastSavedOverridesJsonRef = useRef<string>(JSON.stringify(landingPage.v1?.overrides ?? {}, null, 0));
	  const v1PreviewIframeRef = useRef<HTMLIFrameElement | null>(null);

	  useEffect(() => {
	    if (!isV1) return;
	    const iframe = v1PreviewIframeRef.current;
	    if (!iframe) return;

	    const applyModeClass = (): boolean => {
	      const doc = iframe.contentDocument || iframe.contentWindow?.document || null;
	      const body = doc?.body;
	      if (!body) return false;
	      body.classList.toggle('v1-edit-mode', v1Mode === 'edit');
	      return true;
	    };

	    applyModeClass();

	    const onLoad = () => {
	      applyModeClass();
	    };
	    iframe.addEventListener('load', onLoad);

	    let tries = 0;
	    const maxTries = 40;
	    const retryTimer = window.setInterval(() => {
	      tries += 1;
	      const ok = applyModeClass();
	      if (ok || tries >= maxTries) {
	        window.clearInterval(retryTimer);
	      }
	    }, 50);

	    return () => {
	      window.clearInterval(retryTimer);
	      iframe.removeEventListener('load', onLoad);
	    };
	  }, [isV1, v1Mode, editedHtml]);
  const currentOverridesJson = useMemo(
    () => JSON.stringify(v1Overrides ?? {}, null, 0),
    [v1Overrides]
  );
  const hasUnsavedOverrides = currentOverridesJson !== lastSavedOverridesJsonRef.current;

  // v1 resizable panel
  const [v1PanelWidthPx, setV1PanelWidthPx] = useState<number>(() => loadV1PanelWidthPx() ?? 420);
  const resizeStartRef = useRef<{ x: number; width: number } | null>(null);

  const clampPanelWidth = useCallback((w: number) => {
    const min = 320;
    const max = Math.min(720, typeof window !== 'undefined' ? window.innerWidth - 320 : 720);
    return Math.max(min, Math.min(max, w));
  }, []);

  const handlePanelResizePointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      e.preventDefault();
      resizeStartRef.current = { x: e.clientX, width: v1PanelWidthPx };
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    },
    [v1PanelWidthPx]
  );

  const handlePanelResizePointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (!resizeStartRef.current) return;
      const delta = resizeStartRef.current.x - e.clientX;
      const next = clampPanelWidth(resizeStartRef.current.width + delta);
      setV1PanelWidthPx(next);
    },
    [clampPanelWidth]
  );

  const handlePanelResizePointerUp = useCallback(() => {
    if (!resizeStartRef.current) return;
    resizeStartRef.current = null;
    saveV1PanelWidthPx(v1PanelWidthPx);
  }, [v1PanelWidthPx]);

  const handleSaveV1Overrides = useCallback(async () => {
    if (!isV1) return;
    if (!v1TemplateId) {
      setV1SaveStatus('error');
      setV1SaveError('Missing templateId for this v1 result.');
      return;
    }

    setV1SaveStatus('saving');
    setV1SaveError('');
    setComposeError('');
    setIsComposing(true);

    try {
      // 1) Compose the latest HTML from overrides so the preview + download match.
      const res = await fetch('/api/v1/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: v1TemplateId,
          overrides: v1Overrides,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error((data as any)?.error || 'Failed to compose v1 HTML');
      const html = typeof (data as any)?.html === 'string' ? (data as any).html : '';
      if (!html) throw new Error('Compose API returned invalid response');
      setEditedHtml(html);

      // 2) Persist overrides locally for refresh/auto-resume (offline-safe).
      saveActiveV1EditorSession({
        version: 1,
        id: v1ResultId,
        templateId: v1TemplateId,
        overrides: v1Overrides,
        savedAt: Date.now(),
      });

      // 3) When signed in, mirror to Supabase. First save auto-creates the
      // project and stamps ?project=<id> on the URL so a refresh resumes the
      // same record. Subsequent saves PATCH and append a revision.
      let cloudOk = false;
      if (user) {
        try {
          if (v1ProjectId) {
            await updateProject(v1ProjectId, { overrides: v1Overrides });
          } else {
            const tplName = v1Templates.find((t) => t.id === v1TemplateId)?.name ?? 'SparkPage';
            const today = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            const created = await createProject({
              templateId: v1TemplateId,
              title: `${tplName} – ${today}`,
              overrides: v1Overrides,
            });
            setV1ProjectId(created.id);
            try {
              const url = new URL(window.location.href);
              url.searchParams.set('project', created.id);
              window.history.replaceState(null, '', url.toString());
            } catch {
              // ignore URL update failures; the project is still saved
            }
          }
          cloudOk = true;
        } catch (err) {
          // Cloud failure must not block local save success.
          console.warn('[v1 cloud save] failed:', err);
        }
      }

      lastSavedOverridesJsonRef.current = currentOverridesJson;
      setCloudSaved(cloudOk);
      setV1SaveStatus('saved');
      window.setTimeout(() => {
        setV1SaveStatus('idle');
        setCloudSaved(false);
      }, 1800);
    } catch (err) {
      setV1SaveStatus('error');
      setV1SaveError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsComposing(false);
    }
  }, [currentOverridesJson, isV1, v1Overrides, v1ResultId, v1TemplateId, setComposeError, setIsComposing, user, v1ProjectId]);

  // v1 spec defaults (for effective props = spec defaults + overrides)
  const [v1Spec, setV1Spec] = useState<V1SpecResponse | null>(null);
  const [v1SpecError, setV1SpecError] = useState<string>('');
  const [v1SelectedSectionIndex, setV1SelectedSectionIndex] = useState<number>(0);
  const [v1SectionJsonDrafts, setV1SectionJsonDrafts] = useState<Record<number, string>>({});
  const [v1SectionJsonErrors, setV1SectionJsonErrors] = useState<Record<number, string>>({});
  const [v1DragIndex, setV1DragIndex] = useState<number | null>(null);
  const [v1DragOverIndex, setV1DragOverIndex] = useState<number | null>(null);

  // v1 Images workflow state
  const [v1SelectedAssetKey, setV1SelectedAssetKey] = useState<string>('');
  const [v1ImagesError, setV1ImagesError] = useState<string>('');
  const [stockQuery, setStockQuery] = useState<string>('');
  const [stockResults, setStockResults] = useState<StockImageResult[]>([]);
  const [stockLoading, setStockLoading] = useState<boolean>(false);
  const [stockError, setStockError] = useState<string>('');

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

  type V1DisplayItem = {
    /** Stable id: string index for spec sections ("0", "1"…) or "added:xxx" for user-added */
    id: string;
    type: string;
    defaultProps: Record<string, unknown>;
    override: Record<string, unknown> | null;
    effective: Record<string, unknown>;
    omitted: boolean;
    /** Whether this is a user-added section (not in the original spec) */
    isAdded: boolean;
  };

  /** Ordered list of sections as they should appear in preview & sidebar. */
  const v1DisplayOrder: V1DisplayItem[] = useMemo(() => {
    const specSections = v1Spec?.sections;
    if (!Array.isArray(specSections)) return [];

    // Helper to build an item from a spec section
    const buildSpecItem = (i: number): V1DisplayItem => {
      const s = specSections[i];
      const ov = v1Overrides?.sections?.[i];
      const override = ov && typeof ov === 'object' ? (ov as Record<string, unknown>) : null;
      const omitted = override?._omit === true;
      const effective = { ...(s.props || {}), ...(override || {}) };
      return { id: String(i), type: s.type, defaultProps: s.props || {}, override, effective, omitted, isAdded: false };
    };

    // Helper to build an item from an added section
    const buildAddedItem = (key: string, added: { type: string; props: Record<string, unknown> }): V1DisplayItem => {
      return { id: key, type: added.type, defaultProps: added.props, override: null, effective: { ...added.props }, omitted: false, isAdded: true };
    };

    const order = v1Overrides?.sectionOrder;
    if (Array.isArray(order) && order.length > 0) {
      const items: V1DisplayItem[] = [];
      for (const key of order) {
        if (typeof key === 'number' && key >= 0 && key < specSections.length) {
          items.push(buildSpecItem(key));
        } else if (typeof key === 'string' && key.startsWith('added:')) {
          const added = v1Overrides?.addedSections?.[key];
          if (added) items.push(buildAddedItem(key, added));
        }
      }
      return items;
    }

    // Default: spec order, no added sections shown (they only appear once sectionOrder is set)
    return specSections.map((_, i) => buildSpecItem(i));
  }, [v1Spec?.sections, v1Overrides?.sections, v1Overrides?.sectionOrder, v1Overrides?.addedSections]);

  // Keep the old alias for the selected section
  const effectiveV1Sections = v1DisplayOrder;
  const selectedV1Section = effectiveV1Sections[v1SelectedSectionIndex];

  /** Map display-order index → spec index (or -1 for added sections). */
  const v1SelectedSpecIndex = useMemo(() => {
    const item = v1DisplayOrder[v1SelectedSectionIndex];
    if (!item) return -1;
    if (item.isAdded) return -1;
    const n = parseInt(item.id, 10);
    return Number.isFinite(n) ? n : -1;
  }, [v1DisplayOrder, v1SelectedSectionIndex]);

  /** Reorder sections by moving item at `from` to `to` in the display order. */
  const reorderV1Sections = useCallback(
    (from: number, to: number) => {
      if (from === to) return;
      setV1Overrides((prev) => {
        const next: V1ContentOverrides = { ...(prev || {}) };
        // Build current order keys from v1DisplayOrder
        const specSections = v1Spec?.sections;
        if (!specSections) return next;

        // Get current order as array of keys (number for spec sections, string for added)
        let orderKeys: (number | string)[];
        if (Array.isArray(next.sectionOrder) && next.sectionOrder.length > 0) {
          orderKeys = [...next.sectionOrder];
        } else {
          orderKeys = specSections.map((_, i) => i);
        }

        // Move
        const [moved] = orderKeys.splice(from, 1);
        orderKeys.splice(to, 0, moved);
        next.sectionOrder = orderKeys;
        return next;
      });

      // Update selection to follow the moved item
      setV1SelectedSectionIndex(to);
    },
    [v1Spec?.sections]
  );

  /** Delete a section from the display order by index. */
  const deleteV1Section = useCallback(
    (displayIndex: number) => {
      setV1Overrides((prev) => {
        const next: V1ContentOverrides = { ...(prev || {}) };
        const specSections = v1Spec?.sections;
        if (!specSections) return next;

        let orderKeys: (number | string)[];
        if (Array.isArray(next.sectionOrder) && next.sectionOrder.length > 0) {
          orderKeys = [...next.sectionOrder];
        } else {
          orderKeys = specSections.map((_, i) => i);
        }

        const removedKey = orderKeys[displayIndex];
        orderKeys.splice(displayIndex, 1);
        next.sectionOrder = orderKeys;

        // If it's an added section, also remove from addedSections
        if (typeof removedKey === 'string' && removedKey.startsWith('added:') && next.addedSections) {
          const added = { ...next.addedSections };
          delete added[removedKey];
          next.addedSections = added;
        }

        return next;
      });

      // Adjust selection
      setV1SelectedSectionIndex((prev) => {
        if (prev === displayIndex) return Math.max(0, prev - 1);
        if (prev > displayIndex) return prev - 1;
        return prev;
      });
    },
    [v1Spec?.sections]
  );

  /** Add a new section of a given type at the end of the display order. */
  const addV1Section = useCallback(
    (sectionType: string, defaultProps: Record<string, unknown>) => {
      const addedKey = `added:${Date.now()}`;
      setV1Overrides((prev) => {
        const next: V1ContentOverrides = { ...(prev || {}) };
        const specSections = v1Spec?.sections;
        if (!specSections) return next;

        // Ensure sectionOrder exists
        let orderKeys: (number | string)[];
        if (Array.isArray(next.sectionOrder) && next.sectionOrder.length > 0) {
          orderKeys = [...next.sectionOrder];
        } else {
          orderKeys = specSections.map((_, i) => i);
        }
        orderKeys.push(addedKey);
        next.sectionOrder = orderKeys;

        // Add to addedSections
        const added = { ...(next.addedSections || {}) };
        added[addedKey] = { type: sectionType, props: { ...defaultProps } };
        next.addedSections = added;
        return next;
      });
    },
    [v1Spec?.sections]
  );

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

  const v1ImageSlots: V1ImageSlot[] = useMemo(() => {
    const spec = v1Spec;
    const assetKeys = new Set(Object.keys(spec?.assets || {}));
    if (!spec || assetKeys.size === 0) return [];

    const slots: V1ImageSlot[] = [];
    for (let i = 0; i < (spec.sections || []).length; i++) {
      const sec = spec.sections[i];
      const props = (sec && typeof sec.props === 'object' ? sec.props : {}) as Record<string, unknown>;

      for (const [propName, propValue] of Object.entries(props)) {
        if (typeof propValue !== 'string') continue;
        const nameLc = propName.toLowerCase();
        if (!nameLc.includes('asset')) continue;
        if (nameLc.includes('fallback')) continue;
        if (propName.startsWith('_')) continue;
        if (!assetKeys.has(propValue)) continue;
        const label = `${labelForSectionType(sec.type)} · ${propName}`;
        slots.push({ assetKey: propValue, label });
      }
    }

    // Deduplicate by assetKey: one override changes all usages.
    const dedup = new Map<string, V1ImageSlot>();
    for (const s of slots) {
      if (!dedup.has(s.assetKey)) dedup.set(s.assetKey, s);
    }
    return Array.from(dedup.values());
  }, [v1Spec]);

  useEffect(() => {
    if (!v1Spec) return;
    if (v1ImageSlots.length === 0) return;

    // Only auto-select a default slot when nothing is selected yet.
    // If the user selected a slot via click-to-edit (or typed one manually),
    // don't override their choice just because it isn't currently in the
    // computed slot list.
    if (!v1SelectedAssetKey) {
      setV1SelectedAssetKey(v1ImageSlots[0].assetKey);
    }
  }, [v1Spec, v1ImageSlots, v1SelectedAssetKey]);

  // Pre-fill the stock-image search query with a niche-relevant seed whenever
  // the selected image slot changes. Honours per-asset seeds first, then the
  // spec-level niche, so the user gets useful results on the first search.
  useEffect(() => {
    if (!v1Spec || !v1SelectedAssetKey) return;
    const seeds = v1Spec.assetSearchSeeds || {};
    const seed = seeds[v1SelectedAssetKey] || v1Spec.niche || '';
    if (seed) setStockQuery(seed);
  }, [v1Spec, v1SelectedAssetKey]);


  // v1 click-to-edit (images + sections): when in Edit mode, clicking elements
  // in the iframe triggers:  images → Images tab, sections → Content tab.
  useEffect(() => {
    if (!isV1) return;
    if (v1Mode !== 'edit') return;
    const iframe = v1PreviewIframeRef.current;
    if (!iframe) return;

    const slotKeys = new Set(v1ImageSlots.map((s) => s.assetKey));

	    // Normalise event targets coming from the iframe document. We *cannot* rely on
	    // `instanceof Element/Node` here because events are dispatched from the
	    // iframe's Window/Document context, so their prototypes won't match the
	    // parent window's globals. Instead, use `nodeType` to detect Element/Text.
	    const resolveEventElement = (target: EventTarget | null): Element | null => {
	      if (!target || typeof target !== 'object') return null;
	      const node = target as Node & { parentElement: Element | null; nodeType: number };
	      const nodeType = node.nodeType;
	      if (nodeType === 1) {
	        // ELEMENT_NODE
	        return node as unknown as Element;
	      }
	      if (nodeType === 3) {
	        // TEXT_NODE → use parent element so CSS selectors/closest() work.
	        return node.parentElement;
	      }
	      return null;
	    };

	    let detach: (() => void) | null = null;
	    let cancelled = false;

	    // mousedown handler: enables contentEditable BEFORE the browser processes focus.
	    // Must NOT call e.preventDefault() so the browser naturally gives focus to the element.
	    const mousedownHandler = (e: MouseEvent) => {
		      const t = resolveEventElement(e.target);
		      if (!t) return;
	      // Image elements are handled by the click handler; skip here.
	      if (t.closest('[data-v1-asset-key]')) return;

	      const fieldEl = t.closest('[data-v1-field-key]') as HTMLElement | null;
	      if (!fieldEl) return;
	      // If already editable, let mousedown through so the browser can reposition the cursor.
	      if (fieldEl.isContentEditable) return;

	      const fieldKey = fieldEl.getAttribute('data-v1-field-key') || '';
	      const sectionWrapper = fieldEl.closest('[data-v1-section-id]');
	      const sectionId = sectionWrapper?.getAttribute('data-v1-section-id') || '';
	      if (!fieldKey || !sectionId) return;

	      // Enable contentEditable BEFORE the browser processes focus (mousedown timing).
	      fieldEl.contentEditable = 'true';

	      // Explicitly focus + place caret after the browser finishes this event tick.
	      // caretRangeFromPoint (Chrome/Safari) / caretPositionFromPoint (Firefox) gives
	      // the exact text position the user clicked — far more reliable than relying on
	      // the browser to auto-place the cursor inside an iframe contentEditable.
	      const clickX = e.clientX;
	      const clickY = e.clientY;
	      const ownerDoc = fieldEl.ownerDocument;
	      requestAnimationFrame(() => {
	        try {
	          fieldEl.focus();
	          let range: Range | null = null;
	          if (typeof ownerDoc.caretRangeFromPoint === 'function') {
	            range = ownerDoc.caretRangeFromPoint(clickX, clickY);
	          } else if (typeof (ownerDoc as any).caretPositionFromPoint === 'function') {
	            const pos = (ownerDoc as any).caretPositionFromPoint(clickX, clickY);
	            if (pos) {
	              range = ownerDoc.createRange();
	              range.setStart(pos.offsetNode, pos.offset);
	              range.collapse(true);
	            }
	          }
	          if (range) {
	            const sel = ownerDoc.getSelection();
	            if (sel) {
	              sel.removeAllRanges();
	              sel.addRange(range);
	            }
	          }
	        } catch {
	          // Fallback: plain focus without precise cursor placement.
	          try { fieldEl.focus(); } catch { /* ignore */ }
	        }
	      });

	      const onBlur = () => {
	        fieldEl.removeEventListener('blur', onBlur);
	        fieldEl.removeEventListener('keydown', onKeydown);
	        fieldEl.contentEditable = 'false';
	        const newText = (fieldEl.innerText || fieldEl.textContent || '').trim();
	        if (!newText) return;

	        const item = v1DisplayOrder.find((d) => d.id === sectionId);
	        if (!item || item.isAdded) return;
	        const specIdx = parseInt(item.id, 10);
	        if (isNaN(specIdx) || specIdx < 0) return;

	        const parts = fieldKey.split('.');
	        if (parts.length === 1) {
	          updateV1Section(specIdx, { [fieldKey]: newText });
	        } else if (parts.length === 3) {
	          const [arrKey, idxStr, prop] = parts;
	          const arrIdx = parseInt(idxStr, 10);
	          if (isNaN(arrIdx)) return;
	          const currentArr = item.effective?.[arrKey];
	          if (Array.isArray(currentArr)) {
	            const next = currentArr.map((x: any) => ({ ...x }));
	            if (next[arrIdx]) {
	              next[arrIdx] = { ...next[arrIdx], [prop]: newText };
	              updateV1Section(specIdx, { [arrKey]: next });
	            }
	          }
	        }

	        if (v1Debug) {
	          console.log('[v1 inline-edit] saved field:', fieldKey, '→', newText);
	        }
	      };

	      const onKeydown = (ke: KeyboardEvent) => {
	        if (ke.key === 'Enter' && !ke.shiftKey) {
	          ke.preventDefault();
	          fieldEl.blur();
	        }
	        if (ke.key === 'Escape') {
	          fieldEl.contentEditable = 'false';
	          fieldEl.removeEventListener('blur', onBlur);
	          fieldEl.removeEventListener('keydown', onKeydown);
	        }
	      };

	      fieldEl.addEventListener('blur', onBlur);
	      fieldEl.addEventListener('keydown', onKeydown);

	      if (v1Debug) {
		        setV1ClickDebugInfo((prev) => ({
		          ...prev,
		          lastClickTarget: `<${t.tagName.toLowerCase()}> field:${fieldKey} section:${sectionId} (mousedown)`,
		          lastClickedAssetKey: '',
		          lastClickedFieldKey: fieldKey,
		          lastClickedSectionId: sectionId,
		          lastError: '',
		        }));
	        console.log('[v1 inline-edit] mousedown: enabling field:', fieldKey, 'in section:', sectionId);
	      }
	    };

	    const handler = (e: MouseEvent) => {
		      const t = resolveEventElement(e.target);
		      if (!t) return;

	      // Priority 1: image click-to-edit (asset key)
	      const assetEl = t.closest('[data-v1-asset-key]');
	      if (assetEl) {
	        const assetKey = assetEl.getAttribute('data-v1-asset-key') || '';
	        if (assetKey) {
	          e.preventDefault();
	          e.stopPropagation();

	          if (slotKeys.size > 0 && !slotKeys.has(assetKey)) {
	            setV1ImagesError(
	              `Clicked image slot "${assetKey}" is not recognised for this template. ` +
	                `Try re-generating the page, or ensure the v1 template spec is available.`
	            );
	          } else {
	            setV1ImagesError('');
	          }
	          setV1PanelTab('images');
	          setV1SelectedAssetKey(assetKey);

	          if (v1Debug) {
	            setV1ClickDebugInfo((prev) => ({
	              ...prev,
	              lastClickTarget: `<${t.tagName.toLowerCase()}>`,
	              lastClickedAssetKey: assetKey,
		              lastClickedFieldKey: '',
		              lastClickedSectionId: '',
		              lastError: '',
	            }));
	            console.log('[v1 click-to-edit] clicked assetKey:', assetKey);
	          }
	          return;
	        }
	      }

	      // Priority 2: inline text editing — handled by mousedownHandler above.
	      // Here, just update the sidebar selection and let the click through (no stopPropagation
	      // and no preventDefault) so the browser positions the cursor inside contentEditable.
	      const fieldEl = t.closest('[data-v1-field-key]') as HTMLElement | null;
	      if (fieldEl) {
		        const fieldKey = fieldEl.getAttribute('data-v1-field-key') || '';
	        const sectionWrapper = fieldEl.closest('[data-v1-section-id]');
	        const sectionId = sectionWrapper?.getAttribute('data-v1-section-id') || '';
	        const displayIdx = v1DisplayOrder.findIndex((item) => item.id === sectionId);
	        if (displayIdx >= 0) {
	          setV1SelectedSectionIndex(displayIdx);
	          setV1PanelTab('content');
	        }
		        if (v1Debug) {
		          setV1ClickDebugInfo((prev) => ({
		            ...prev,
		            lastClickTarget: `<${t.tagName.toLowerCase()}> field:${fieldKey || 'unknown'} section:${sectionId || 'unknown'} (click)`,
		            lastClickedAssetKey: '',
		            lastClickedFieldKey: fieldKey,
		            lastClickedSectionId: sectionId,
		            lastError: '',
		          }));
		        }
	        return; // Don't preventDefault — let the browser position the cursor naturally
	      }

	      // For all remaining clicks, prevent default (link navigation, etc.)
	      e.preventDefault();

	      // Priority 3: section click-to-edit
	      const sectionEl = t.closest('[data-v1-section-id]');
	      if (sectionEl) {
	        e.stopPropagation();
	        const sectionId = sectionEl.getAttribute('data-v1-section-id') || '';

	        // Remove previous selection highlight
	        const doc = iframe.contentDocument || iframe.contentWindow?.document;
	        if (doc) {
	          doc.querySelectorAll('[data-v1-section-id].v1-section-selected').forEach((el) =>
	            el.classList.remove('v1-section-selected')
	          );
	          sectionEl.classList.add('v1-section-selected');
	        }

	        // Map sectionId back to the sidebar index
	        const idx = v1DisplayOrder.findIndex((item) => item.id === sectionId);
	        if (idx >= 0) {
	          setV1SelectedSectionIndex(idx);
	          setV1PanelTab('content');
	        }

	        if (v1Debug) {
	          setV1ClickDebugInfo((prev) => ({
	            ...prev,
	            lastClickTarget: `<${t.tagName.toLowerCase()}> section:${sectionId}`,
		            lastClickedAssetKey: '',
		            lastClickedFieldKey: '',
		            lastClickedSectionId: sectionId,
		            lastError: '',
	          }));
	          console.log('[v1 click-to-edit] clicked section:', sectionId);
	        }
	        return;
	      }

	      if (v1Debug) {
	        setV1ClickDebugInfo((prev) => ({
	          ...prev,
	          lastClickTarget: `<${t.tagName.toLowerCase()}> (no match)`,
		          lastClickedAssetKey: '',
		          lastClickedFieldKey: '',
		          lastClickedSectionId: '',
	        }));
	      }
	    };

	    const attachToCurrentDocument = (reason: string): boolean => {
	      const doc = iframe.contentDocument || iframe.contentWindow?.document || null;
	      if (!doc) {
	        if (v1Debug) {
	          setV1ClickDebugInfo((prev) => ({
	            ...prev,
	            attached: false,
	            lastAttachReason: reason,
	            lastError: 'iframe.contentDocument unavailable',
	          }));
	        }
	        return false;
	      }

	      detach?.();
	      doc.addEventListener('mousedown', mousedownHandler, true);
	      doc.addEventListener('click', handler, true);
	      detach = () => {
	        doc.removeEventListener('mousedown', mousedownHandler, true);
	        doc.removeEventListener('click', handler, true);
	      };

	      if (v1Debug) {
	        setV1ClickDebugInfo((prev) => ({
	          ...prev,
	          attached: true,
	          lastAttachReason: reason,
	          docReadyState: doc.readyState || '',
	          assetKeyElementCount: doc.querySelectorAll('[data-v1-asset-key]').length,
		          fieldKeyElementCount: doc.querySelectorAll('[data-v1-field-key]').length,
	          lastError: '',
	        }));
	        // eslint-disable-next-line no-console
	        console.log('[v1 click-to-edit] listener attached:', { reason, readyState: doc.readyState });
	      }
	      return true;
	    };

	    // 1) Try immediately.
	    attachToCurrentDocument('effect');

	    // 2) Re-attach after iframe load (srcDoc updates can replace the document).
	    const onLoad = () => {
	      attachToCurrentDocument('iframe.load');
	    };
	    iframe.addEventListener('load', onLoad);

	    // 3) Defensive retry: if the iframe is already loaded before this effect runs,
	    // the load event may not fire. Retry briefly until contentDocument is available.
	    let tries = 0;
	    const maxTries = 40; // ~2s at 50ms
	    const retryTimer = window.setInterval(() => {
	      if (cancelled) return;
	      tries += 1;
	      const ok = attachToCurrentDocument('retry');
	      if (ok || tries >= maxTries) {
	        window.clearInterval(retryTimer);
	      }
	    }, 50);

	    return () => {
	      cancelled = true;
	      window.clearInterval(retryTimer);
	      detach?.();
	      detach = null;
	      iframe.removeEventListener('load', onLoad);
	    };
	  // eslint-disable-next-line react-hooks/exhaustive-deps
	  }, [isV1, v1Mode, v1ImageSlots, editedHtml, v1Debug, v1DisplayOrder, updateV1Section]);

  const setV1AssetOverride = useCallback((assetKey: string, src: string, attribution?: V1ImageAttribution) => {
    setV1Overrides((prev) => {
      const next: V1ContentOverrides = { ...(prev || {}) };
      const assets = { ...(next.assets || {}) };
      assets[assetKey] = src;
      next.assets = assets;

      // Keep attribution metadata (used for stock picks) in meta.imageAttributions.
      const meta = { ...((next.meta || {}) as any) } as any;
      const map = { ...((meta.imageAttributions || {}) as Record<string, V1ImageAttribution>) };
      if (attribution) map[assetKey] = attribution;
      else delete map[assetKey];
      if (Object.keys(map).length > 0) meta.imageAttributions = map;
      else delete meta.imageAttributions;
      next.meta = meta;

      return next;
    });
  }, []);

  const resetV1AssetOverride = useCallback((assetKey: string) => {
    setV1Overrides((prev) => {
      const next: V1ContentOverrides = { ...(prev || {}) };
      const assets = { ...(next.assets || {}) };
      delete assets[assetKey];
      next.assets = Object.keys(assets).length > 0 ? assets : undefined;

      const meta = { ...((next.meta || {}) as any) } as any;
      if (meta.imageAttributions && typeof meta.imageAttributions === 'object') {
        const map = { ...(meta.imageAttributions as Record<string, V1ImageAttribution>) };
        delete map[assetKey];
        if (Object.keys(map).length > 0) meta.imageAttributions = map;
        else delete meta.imageAttributions;
      }
      next.meta = Object.keys(meta).length > 0 ? meta : undefined;
      return next;
    });
  }, []);

  const readFileAsDataUrl = useCallback((file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.onload = () => resolve(String(reader.result || ''));
      reader.readAsDataURL(file);
    });
  }, []);

  const handleUploadSelectedAsset = useCallback(
    async (file: File) => {
      const allowed = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']);
      const maxBytes = 5 * 1024 * 1024;
      if (!v1SelectedAssetKey) {
        setV1ImagesError('Select an image slot first.');
        return;
      }
      if (!allowed.has(file.type)) {
        setV1ImagesError('Unsupported file type. Please upload PNG, JPG, WebP, or SVG.');
        return;
      }
      if (file.size > maxBytes) {
        setV1ImagesError('File is too large. Please upload an image under 5MB.');
        return;
      }

      setV1ImagesError('');
      const dataUrl = await readFileAsDataUrl(file);
      setV1AssetOverride(v1SelectedAssetKey, dataUrl, undefined);
    },
    [readFileAsDataUrl, setV1AssetOverride, v1SelectedAssetKey]
  );

  const runStockSearch = useCallback(async () => {
    setStockError('');
    setStockLoading(true);
    try {
	      const q = stockQuery.trim();
	      if (q.length < 2) {
	        setStockResults([]);
	        setStockError('Search query must be at least 2 characters.');
	        return;
	      }
	      const res = await fetch(`/api/v1/stock-images?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to fetch stock images');
	      const results = Array.isArray(data?.images) ? (data.images as StockImageResult[]) : [];
      setStockResults(results);
    } catch (e) {
      setStockResults([]);
      setStockError(e instanceof Error ? e.message : 'Failed to fetch stock images');
    } finally {
      setStockLoading(false);
    }
  }, [stockQuery]);

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
      {/* Output */}
      <div className="flex-1 min-h-0">
        {isV1 ? (
          <div className="h-full flex flex-col min-h-0">
            {/* v1 Toolbar */}
            <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between flex-none">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-orange-500 text-white">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">SparkPage</div>
                      <div className="text-xs text-gray-500">Edits are v1-safe (no HTML parsing; full document preserved)</div>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                      isV1
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    Pipeline: {isV1 ? 'v1' : 'legacy'}
                  </span>
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
					{v1SaveStatus === 'error' && (
					  <div
						className="text-xs text-red-600 max-w-[260px] truncate"
						title={v1SaveError}
					  >
						{v1SaveError}
					  </div>
					)}
					<button
					  onClick={handleSaveV1Overrides}
					  disabled={!v1TemplateId || v1SaveStatus === 'saving' || isComposing}
					  className="px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-black text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
					  title={!v1TemplateId
						? 'Missing templateId for v1 persistence'
						: user
							? 'Save changes locally and to your SparkPage account'
							: 'Save v1 overrides so they persist across refresh'}
					>
					  <Save className="w-4 h-4" />
					  {v1SaveStatus === 'saving'
						? 'Saving…'
						: v1SaveStatus === 'saved'
							? (cloudSaved ? 'Saved to cloud' : 'Saved')
							: 'Save changes'}
					</button>
					{hasUnsavedOverrides && (
					  <span className="text-xs text-amber-700">Unsaved</span>
					)}
					{user && (
					  <a
						href="/dashboard"
						className="text-xs text-gray-500 hover:text-orange-600 ml-1"
						title="My SparkPages"
					  >
						My pages
					  </a>
					)}
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
						  ref={v1PreviewIframeRef}
                      srcDoc={editedHtml}
                      className="w-full h-full border-0"
                    />
                  </div>
                </div>
              </div>

				  {v1Mode === 'edit' && (
					<div
					  role="separator"
					  aria-orientation="vertical"
					  title="Drag to resize the editor panel"
					  className="w-2 flex-none cursor-col-resize bg-gray-100 hover:bg-indigo-200 active:bg-indigo-300 touch-none select-none"
					  onPointerDown={handlePanelResizePointerDown}
					  onPointerMove={handlePanelResizePointerMove}
					  onPointerUp={handlePanelResizePointerUp}
					  onPointerCancel={handlePanelResizePointerUp}
					/>
				  )}

              {/* Edit Panel */}
              {v1Mode === 'edit' && (
	                <div
						style={{ width: v1PanelWidthPx }}
						className="bg-white border-l border-gray-200 flex-none overflow-y-auto"
					>
                  <div className="p-4">
						{v1Debug && (
							<div className="mb-3 p-3 bg-gray-50 border border-gray-200 text-gray-800 rounded-lg text-xs">
								<div className="font-semibold mb-1">v1 debug (disable by removing <span className="font-mono">?v1debug=1</span>)</div>
								<div className="grid grid-cols-2 gap-x-4 gap-y-1">
									<div><span className="font-mono">v1Mode</span>: {v1Mode}</div>
									<div><span className="font-mono">isV1</span>: {String(isV1)}</div>
									<div><span className="font-mono">v1TemplateId</span>: {v1TemplateId || '(missing)'}</div>
									<div><span className="font-mono">v1Spec</span>: {v1Spec ? 'loaded' : v1SpecError ? 'error' : v1TemplateId ? 'loading' : 'n/a'}</div>
									<div><span className="font-mono">v1ImageSlots</span>: {v1ImageSlots.length}</div>
									<div><span className="font-mono">clickListener</span>: {v1ClickDebugInfo.attached ? 'attached' : 'not attached'} ({v1ClickDebugInfo.lastAttachReason || '—'})</div>
									<div><span className="font-mono">docReadyState</span>: {v1ClickDebugInfo.docReadyState || '—'}</div>
									<div><span className="font-mono">assetKeyEls</span>: {v1ClickDebugInfo.assetKeyElementCount}</div>
									<div><span className="font-mono">fieldKeyEls</span>: {v1ClickDebugInfo.fieldKeyElementCount}</div>
									<div className="col-span-2"><span className="font-mono">lastClickTarget</span>: {v1ClickDebugInfo.lastClickTarget || '—'}</div>
									<div className="col-span-2"><span className="font-mono">lastClickedAssetKey</span>: {v1ClickDebugInfo.lastClickedAssetKey || '—'}</div>
									<div className="col-span-2"><span className="font-mono">lastClickedFieldKey</span>: {v1ClickDebugInfo.lastClickedFieldKey || '—'}</div>
									<div className="col-span-2"><span className="font-mono">lastClickedSectionId</span>: {v1ClickDebugInfo.lastClickedSectionId || '—'}</div>
									{v1ClickDebugInfo.lastError && (
										<div className="col-span-2 text-red-700"><span className="font-mono">error</span>: {v1ClickDebugInfo.lastError}</div>
									)}
								</div>
							</div>
						)}
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
						  onClick={() => setV1PanelTab('images')}
						  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
							v1PanelTab === 'images' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
						  }`}
						>
						  Images
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
                            {/* Section list (draggable) */}
                            <div className="w-[180px] flex-shrink-0">
                              <div className="text-xs font-semibold text-gray-700 mb-2">Sections</div>
                              <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="max-h-[320px] overflow-y-auto">
                                  {effectiveV1Sections.map((sec, i) => {
                                    const active = i === v1SelectedSectionIndex;
                                    const isDragging = v1DragIndex === i;
                                    const isDragOver = v1DragOverIndex === i;
                                    return (
                                      <div
                                        key={`${sec.id}-${i}`}
                                        draggable
                                        onDragStart={(e) => {
                                          setV1DragIndex(i);
                                          e.dataTransfer.effectAllowed = 'move';
                                          e.dataTransfer.setData('text/plain', String(i));
                                        }}
                                        onDragOver={(e) => {
                                          e.preventDefault();
                                          e.dataTransfer.dropEffect = 'move';
                                          setV1DragOverIndex(i);
                                        }}
                                        onDragLeave={() => setV1DragOverIndex(null)}
                                        onDrop={(e) => {
                                          e.preventDefault();
                                          const from = v1DragIndex;
                                          if (from !== null && from !== i) reorderV1Sections(from, i);
                                          setV1DragIndex(null);
                                          setV1DragOverIndex(null);
                                        }}
                                        onDragEnd={() => { setV1DragIndex(null); setV1DragOverIndex(null); }}
                                        onClick={() => setV1SelectedSectionIndex(i)}
                                        className={`w-full text-left px-1.5 py-1.5 border-b border-gray-100 text-xs flex items-center gap-1 cursor-grab select-none ${
                                          active ? 'bg-indigo-50 text-indigo-800' : 'hover:bg-gray-50 text-gray-700'
                                        } ${isDragging ? 'opacity-40' : ''} ${isDragOver ? 'border-t-2 border-t-indigo-400' : ''}`}
                                      >
                                        <GripVertical className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                        <span className="truncate flex-1">
                                          {i + 1}. {labelForSectionType(sec.type)}
                                        </span>
                                        {sec.omitted && (
                                          <span className="px-1 py-0.5 rounded bg-gray-200 text-gray-700 text-[10px] flex-shrink-0">
                                            off
                                          </span>
                                        )}
                                        {sec.isAdded && (
                                          <span className="px-1 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] flex-shrink-0">
                                            +
                                          </span>
                                        )}
                                        <button
                                          onClick={(e) => { e.stopPropagation(); deleteV1Section(i); }}
                                          className="p-0.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 flex-shrink-0"
                                          title="Remove section"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                              {/* Add section dropdown */}
                              <div className="mt-2">
                                <select
                                  className="w-full text-xs border border-gray-200 rounded px-2 py-1 text-gray-700"
                                  value=""
                                  onChange={(e) => {
                                    const sType = e.target.value;
                                    if (!sType) return;
                                    // Find default props from an existing spec section of the same type
                                    const existing = v1Spec.sections.find((s) => s.type === sType);
                                    addV1Section(sType, existing?.props || {});
                                  }}
                                >
                                  <option value="">+ Add section…</option>
                                  {Array.from(new Set(v1Spec.sections.map((s) => s.type))).map((sType) => (
                                    <option key={sType} value={sType}>{labelForSectionType(sType)}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="mt-1 text-[11px] text-gray-500">
                                Drag to reorder. Click to edit.
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
                                        onChange={(e) => updateV1Section(v1SelectedSpecIndex, { _omit: e.target.checked })}
                                      />
                                      Omit section
                                    </label>
                                  </div>

                                  {/* Per-type editors */}
                                  {(selectedV1Section.type === 'HeroSplit' || selectedV1Section.type === 'HeroLeadForm') && (() => {
                                    const eff = selectedV1Section.effective;
                                    const bulletsText = asStringArray(eff.bullets).join('\n');
                                    const proofText = asStringArray(eff.proofPoints).join('\n');
                                    const isLeadForm = selectedV1Section.type === 'HeroLeadForm';
                                    return (
                                      <div className="space-y-3">
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">Eyebrow</label>
                                          <input
                                            value={asString(eff.eyebrow)}
                                            onChange={(e) => updateV1Section(v1SelectedSpecIndex, { eyebrow: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">Headline</label>
                                          <input
                                            value={asString(eff.headline)}
                                            onChange={(e) => updateV1Section(v1SelectedSpecIndex, { headline: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">Subheadline</label>
                                          <textarea
                                            value={asString(eff.subheadline)}
                                            onChange={(e) => updateV1Section(v1SelectedSpecIndex, { subheadline: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            rows={3}
                                          />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Primary CTA</label>
                                            <input
                                              value={asString(eff.ctaLabel)}
                                              onChange={(e) => updateV1Section(v1SelectedSpecIndex, { ctaLabel: e.target.value })}
                                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Trust badge</label>
                                            <input
                                              value={asString(eff.trustBadge)}
                                              onChange={(e) => updateV1Section(v1SelectedSpecIndex, { trustBadge: e.target.value })}
                                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            />
                                          </div>
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">Bullets (one per line)</label>
                                          <textarea
                                            value={bulletsText}
                                            onChange={(e) =>
                                              updateV1Section(v1SelectedSpecIndex, { bullets: parseLinesToStringArray(e.target.value) })
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
                                              updateV1Section(v1SelectedSpecIndex, { proofPoints: parseLinesToStringArray(e.target.value) })
                                            }
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            rows={3}
                                          />
                                        </div>
                                        {isLeadForm && (
                                          <div className="grid grid-cols-2 gap-2">
                                            <div>
                                              <label className="block text-xs font-medium text-gray-700 mb-1">Form heading</label>
                                              <input
                                                value={asString(eff.formHeading)}
                                                onChange={(e) => updateV1Section(v1SelectedSpecIndex, { formHeading: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-xs font-medium text-gray-700 mb-1">Form subheading</label>
                                              <input
                                                value={asString(eff.formSubheading)}
                                                onChange={(e) => updateV1Section(v1SelectedSpecIndex, { formSubheading: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                              />
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}

                                  {selectedV1Section.type === 'Footer' && (() => {
                                    const eff = selectedV1Section.effective;
                                    return (
                                      <div className="space-y-3">
                                        <div className="text-[11px] text-gray-500 -mt-1">
                                          Business info shown in the page footer. These default to the template&apos;s spec values; your edits become per-section overrides.
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">Business name</label>
                                          <input
                                            value={asString(eff.brandName)}
                                            onChange={(e) => updateV1Section(v1SelectedSpecIndex, { brandName: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">Tagline</label>
                                          <textarea
                                            value={asString(eff.tagline)}
                                            onChange={(e) => updateV1Section(v1SelectedSpecIndex, { tagline: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            rows={2}
                                          />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                                            <input
                                              value={asString(eff.phone)}
                                              onChange={(e) => updateV1Section(v1SelectedSpecIndex, { phone: e.target.value })}
                                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                                            <input
                                              value={asString(eff.email)}
                                              onChange={(e) => updateV1Section(v1SelectedSpecIndex, { email: e.target.value })}
                                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            />
                                          </div>
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">Address / service area</label>
                                          <input
                                            value={asString(eff.address)}
                                            onChange={(e) => updateV1Section(v1SelectedSpecIndex, { address: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                          />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Hours</label>
                                            <input
                                              value={asString(eff.hours)}
                                              onChange={(e) => updateV1Section(v1SelectedSpecIndex, { hours: e.target.value })}
                                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">License line</label>
                                            <input
                                              value={asString(eff.licenseLine)}
                                              onChange={(e) => updateV1Section(v1SelectedSpecIndex, { licenseLine: e.target.value })}
                                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            />
                                          </div>
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
                                            onChange={(e) => updateV1Section(v1SelectedSpecIndex, { heading: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">Supporting text</label>
                                          <textarea
                                            value={asString(eff.supportingText)}
                                            onChange={(e) => updateV1Section(v1SelectedSpecIndex, { supportingText: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            rows={2}
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">Logos / badges (one per line)</label>
                                          <textarea
                                            value={logosText}
                                            onChange={(e) => updateV1Section(v1SelectedSpecIndex, { logos: parseLinesToStringArray(e.target.value) })}
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
                                      updateV1Section(v1SelectedSpecIndex, { services: next });
                                    };
                                    const addService = () => {
                                      const next = servicesRec.map((x) => ({ ...x }));
                                      next.push({ title: 'New service', description: '' });
                                      updateV1Section(v1SelectedSpecIndex, { services: next });
                                    };
                                    const removeService = (idx: number) => {
                                      const next = servicesRec.filter((_, i) => i !== idx).map((x) => ({ ...x }));
                                      updateV1Section(v1SelectedSpecIndex, { services: next });
                                    };

                                    return (
                                      <div className="space-y-3">
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">Heading</label>
                                          <input
                                            value={asString(eff.heading)}
                                            onChange={(e) => updateV1Section(v1SelectedSpecIndex, { heading: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">Subheading</label>
                                          <textarea
                                            value={asString(eff.subheading)}
                                            onChange={(e) => updateV1Section(v1SelectedSpecIndex, { subheading: e.target.value })}
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
                                            onChange={(e) => updateV1Section(v1SelectedSpecIndex, { heading: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">Subheading</label>
                                          <textarea
                                            value={asString(eff.subheading)}
                                            onChange={(e) => updateV1Section(v1SelectedSpecIndex, { subheading: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            rows={2}
                                          />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Caption 1</label>
                                            <input
                                              value={asString(eff.caption1)}
                                              onChange={(e) => updateV1Section(v1SelectedSpecIndex, { caption1: e.target.value })}
                                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Caption 2</label>
                                            <input
                                              value={asString(eff.caption2)}
                                              onChange={(e) => updateV1Section(v1SelectedSpecIndex, { caption2: e.target.value })}
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
                                      updateV1Section(v1SelectedSpecIndex, { testimonials: next });
                                    };
                                    const addTestimonial = () => {
                                      const next = testiRec.map((x) => ({ ...x }));
                                      next.push({ quote: '', name: 'Name', title: '' });
                                      updateV1Section(v1SelectedSpecIndex, { testimonials: next });
                                    };
                                    const removeTestimonial = (idx: number) => {
                                      const next = testiRec.filter((_, i) => i !== idx).map((x) => ({ ...x }));
                                      updateV1Section(v1SelectedSpecIndex, { testimonials: next });
                                    };

                                    return (
                                      <div className="space-y-3">
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">Heading</label>
                                          <input
                                            value={asString(eff.heading)}
                                            onChange={(e) => updateV1Section(v1SelectedSpecIndex, { heading: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">Subheading</label>
                                          <textarea
                                            value={asString(eff.subheading)}
                                            onChange={(e) => updateV1Section(v1SelectedSpecIndex, { subheading: e.target.value })}
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
                                            onChange={(e) => updateV1Section(v1SelectedSpecIndex, { heading: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">Subheading</label>
                                          <textarea
                                            value={asString(eff.subheading)}
                                            onChange={(e) => updateV1Section(v1SelectedSpecIndex, { subheading: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            rows={2}
                                          />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Button label</label>
                                            <input
                                              value={asString(eff.ctaLabel)}
                                              onChange={(e) => updateV1Section(v1SelectedSpecIndex, { ctaLabel: e.target.value })}
                                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Urgency</label>
                                            <input
                                              value={asString(eff.urgency)}
                                              onChange={(e) => updateV1Section(v1SelectedSpecIndex, { urgency: e.target.value })}
                                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            />
                                          </div>
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">Next steps (one per line)</label>
                                          <textarea
                                            value={nextStepsText}
                                            onChange={(e) =>
                                              updateV1Section(v1SelectedSpecIndex, { nextSteps: parseLinesToStringArray(e.target.value) })
                                            }
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            rows={3}
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">Guarantee</label>
                                          <input
                                            value={asString(eff.guarantee)}
                                            onChange={(e) => updateV1Section(v1SelectedSpecIndex, { guarantee: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">Privacy note</label>
                                          <input
                                            value={asString(eff.privacyNote)}
                                            onChange={(e) => updateV1Section(v1SelectedSpecIndex, { privacyNote: e.target.value })}
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
                                            replaceV1SectionOverride(v1SelectedSpecIndex, parsed);
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
                                          replaceV1SectionOverride(v1SelectedSpecIndex, null);
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

					{v1PanelTab === 'images' && (
					  <div className="space-y-4">
						{!v1TemplateId && (
						  <div className="text-sm text-gray-700">
							Missing <code className="font-mono">templateId</code> for this v1 result.
						  </div>
						)}

						{v1SpecError && (
						  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{v1SpecError}</div>
						)}

						{v1TemplateId && !v1Spec && !v1SpecError && (
						  <div className="text-sm text-gray-600">Loading template spec…</div>
						)}

						{v1ImagesError && (
						  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{v1ImagesError}</div>
						)}

						{v1Spec && (
						  <div className="flex gap-3">
							{/* Image slot list */}
							<div className="w-[170px] flex-shrink-0">
							  <div className="text-xs font-semibold text-gray-700 mb-2">Image slots</div>
							  <div className="border border-gray-200 rounded-lg overflow-hidden">
								<div className="max-h-[320px] overflow-y-auto">
								  {v1ImageSlots.length === 0 ? (
									<div className="p-3 text-xs text-gray-600">No image slots detected in this template.</div>
								  ) : (
									v1ImageSlots.map((slot) => {
									  const active = slot.assetKey === v1SelectedAssetKey;
									  const src =
										(v1Overrides?.assets && (v1Overrides.assets as any)[slot.assetKey]) ||
										(v1Spec.resolvedAssets && (v1Spec.resolvedAssets as any)[slot.assetKey]) ||
										'';
									  return (
										<button
										  key={slot.assetKey}
										  onClick={() => setV1SelectedAssetKey(slot.assetKey)}
										  className={`w-full text-left px-2.5 py-2 border-b border-gray-100 text-xs flex items-center gap-2 ${
											active ? 'bg-indigo-50 text-indigo-800' : 'hover:bg-gray-50 text-gray-700'
										  }`}
										>
										  <div className="w-8 h-8 rounded bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
											{src ? (
											  // eslint-disable-next-line @next/next/no-img-element
											  <img src={src} alt="" className="w-full h-full object-cover" />
											) : (
											  <ImageIcon className="w-4 h-4 text-gray-400" />
											)}
										  </div>
										  <div className="min-w-0">
											<div className="truncate">{slot.label}</div>
											<div className="truncate text-[10px] text-gray-500 font-mono">{slot.assetKey}</div>
										  </div>
										</button>
									  );
									})
								  )}
								</div>
							  </div>
							  <div className="mt-2 text-[11px] text-gray-500">Overrides write to <code className="font-mono">overrides.assets</code>.</div>
							</div>

							{/* Image editor */}
							<div className="flex-1 min-w-0 space-y-3">
							  {!v1SelectedAssetKey ? (
								<div className="text-sm text-gray-600">Select an image slot to edit.</div>
							  ) : (
								(() => {
								  const currentSrc =
									(v1Overrides?.assets && (v1Overrides.assets as any)[v1SelectedAssetKey]) ||
									(v1Spec.resolvedAssets && (v1Spec.resolvedAssets as any)[v1SelectedAssetKey]) ||
									'';
								  const isOverridden = Boolean(v1Overrides?.assets && (v1Overrides.assets as any)[v1SelectedAssetKey]);
								  return (
									<div className="space-y-3">
									  <div className="flex items-start justify-between gap-3">
										<div>
										  <div className="text-sm font-semibold text-gray-900">Selected slot</div>
										  <div className="text-xs text-gray-500 font-mono">{v1SelectedAssetKey}</div>
										  <div className="text-[11px] text-gray-500">Status: {isOverridden ? 'overridden' : 'default'}</div>
										</div>
										<button
										  type="button"
										  onClick={() => {
											if (!confirm('Reset this image override?')) return;
											resetV1AssetOverride(v1SelectedAssetKey);
										  }}
										  className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200"
										>
										  Reset
										</button>
									  </div>

									  <div className="border border-gray-200 rounded-lg p-3">
										<div className="text-xs font-medium text-gray-700 mb-2">Preview</div>
										<div className="w-full h-[160px] rounded bg-gray-50 overflow-hidden flex items-center justify-center">
										  {currentSrc ? (
											// eslint-disable-next-line @next/next/no-img-element
											<img src={currentSrc} alt="" className="w-full h-full object-cover" />
										  ) : (
											<div className="text-xs text-gray-500">No image</div>
										  )}
										</div>
									  </div>

									  <div className="space-y-2">
										<div className="text-xs font-semibold text-gray-900">Upload your own image</div>
										<input
										  type="file"
										  accept="image/png,image/jpeg,image/webp,image/svg+xml"
										  onChange={(e) => {
											const f = e.target.files && e.target.files[0];
											if (!f) return;
											handleUploadSelectedAsset(f).catch((err) =>
											  setV1ImagesError(err instanceof Error ? err.message : 'Upload failed')
											);
											e.target.value = '';
										  }}
										  className="w-full text-sm"
										/>
										<div className="text-[11px] text-gray-500">PNG/JPG/WebP/SVG, up to 5MB. Uploads are stored as a data URL in overrides.</div>
									  </div>

									  <div className="border-t border-gray-200 pt-3 space-y-2">
										<div className="text-xs font-semibold text-gray-900">Pick a free stock image</div>
										<div className="flex gap-2">
										  <input
											value={stockQuery}
											onChange={(e) => setStockQuery(e.target.value)}
											placeholder="Search (e.g. software, team, cafe)"
											className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
										  />
										  <button
											onClick={runStockSearch}
											disabled={stockLoading}
											className="px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium disabled:opacity-60"
										  >
											{stockLoading ? 'Searching…' : 'Search'}
										  </button>
										</div>
										{stockError && <div className="text-xs text-red-700">{stockError}</div>}
										{stockResults.length > 0 && (
										  <div className="grid grid-cols-2 gap-2">
											{stockResults.map((r) => (
											  <button
												key={r.id}
												onClick={() => {
												  if (!v1SelectedAssetKey) return;
												  // Fire-and-forget: comply with Unsplash download tracking guidelines.
												  fetch('/api/v1/stock-images/track-download', {
													method: 'POST',
													headers: { 'content-type': 'application/json' },
													body: JSON.stringify({ photoId: r.id, downloadLocation: r.downloadLocation }),
												  }).catch(() => {
													// Ignore tracking errors in the UI.
												  });

												  setV1AssetOverride(v1SelectedAssetKey, r.urls.regular, {
													text: `Photo by ${r.photographerName} on Unsplash`,
													url: r.unsplashPageUrl,
													provider: 'unsplash',
													licenseSummary: 'Unsplash License',
												});
												}}
												className="border border-gray-200 rounded-lg overflow-hidden hover:border-indigo-300 text-left"
											  >
												<div className="w-full h-[90px] bg-gray-50">
												  {/* eslint-disable-next-line @next/next/no-img-element */}
												  <img src={r.urls.thumb} alt={r.description || ''} className="w-full h-full object-cover" />
												</div>
												<div className="p-2">
												  <div className="text-[11px] text-gray-700 truncate">{r.photographerName}</div>
												  <div className="text-[10px] text-gray-500 truncate">Unsplash</div>
												</div>
											  </button>
											))}
										  </div>
										)}
									  </div>
									</div>
								  );
								})()
							  )}
							</div>
						  </div>
						)}

						<button
						  onClick={handleComposeV1}
						  disabled={!v1TemplateId || isComposing}
						  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

