/**
 * v1 Template Composer
 *
 * composeV1Template(templateId) is the single entry point that turns a
 * declarative TemplateSpec into a self-contained HTML string.
 *
 * Pipeline:
 *   1. Load spec from the spec registry
 *   2. Validate it
 *   3. Read tokens.css + theme CSS (inlined)
 *   4. Render form fields from spec.form
 *   5. Loop through spec.sections → call sectionRegistry[type](props)
 *   6. Wrap everything in a full HTML document with <div class="v1-page">
 *
 * Architecture decision: CSS is inlined via <style> tags so the output is
 * fully self-contained — no external file dependencies. This makes preview
 * generation and thumbnail screenshots trivial.
 */

import { getV1Spec } from '../specs/index';
import { validateSpec, TemplateSpec, V1FormField } from '../specs/schema';
import { sectionRegistry } from '../sections/index';
import { resolveAsset, getDemoAttributions, DemoAssetEntry, ResolvedAsset } from '../assets/resolveAsset';

// ── Asset inlining (SVG placeholders) ─────────────────────────────────────────

/**
 * v1 outputs are intended to be *single-file* HTML. Specs reference SVG
 * placeholders via /v1/assets/... paths, but those paths won't exist when
 * the HTML is opened as a standalone file.
 *
 * To preserve the architecture while meeting the self-contained constraint,
 * we inline local SVG placeholder files as data: URIs at compose-time.
 */
const _svgDataUriCache = new Map<string, string>();

function inlineLocalSvgIfPossible(src: string): string {
  // Only inline local v1 SVGs (placeholders/logo/avatar). Remote demo images stay remote.
  if (!src.startsWith('/v1/assets/') || !src.toLowerCase().endsWith('.svg')) return src;
  if (src.startsWith('data:')) return src;

  const cached = _svgDataUriCache.get(src);
  if (cached) return cached;

  try {
    if (!_readFileSync) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      _readFileSync = require('fs').readFileSync;
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path');
    const relativePath = src.replace(/^\//, ''); // "/v1/assets/..." → "v1/assets/..."
    const filePath = path.resolve(process.cwd(), relativePath);
    const svg = _readFileSync!(filePath, 'utf-8');
    const b64 = Buffer.from(svg, 'utf-8').toString('base64');
    const dataUri = `data:image/svg+xml;base64,${b64}`;
    _svgDataUriCache.set(src, dataUri);
    return dataUri;
  } catch {
    // If we can't read it (e.g. browser context), fall back to original.
    return src;
  }
}

// ── CSS loading ────────────────────────────────────────────────────────────────

/**
 * In a Node / build-script context we read CSS from disk.
 * In a Next.js server-component context we also have access to `fs`.
 * We lazy-import fs so this module can be safely imported in environments
 * where fs is available (server) without crashing in the browser.
 */
let _readFileSync: ((path: string, enc: string) => string) | null = null;

function readCssFile(relativePath: string): string {
  try {
    if (!_readFileSync) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      _readFileSync = require('fs').readFileSync;
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path');
    const filePath = path.resolve(process.cwd(), relativePath);
    return _readFileSync!(filePath, 'utf-8');
  } catch {
    // Fallback: return empty string (e.g. when running in browser context)
    console.warn(`[v1 composer] Could not read CSS file: ${relativePath}`);
    return '';
  }
}

export function loadTokensCss(): string {
  return readCssFile('v1/themes/tokens.css');
}

/**
 * Render the wizard-captured business phone as `(NPA) NXX-XXXX` so the visible
 * page text matches the format the wizard's own input enforces, and so swap.js
 * has a deterministic string to match against on the page. Strings that don't
 * normalize to 10 or 11 digits are returned unchanged.
 */
function formatBusinessPhone(input: string): string {
  const d = input.replace(/\D/g, '');
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length === 11 && d.startsWith('1')) {
    return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  }
  return input;
}

// Spec demo data uses bracketed placeholders ([Your Neighborhood], [Your Zip])
// as the last two chips in every ServiceAreas array so reviewers can see what
// a hand-completed chip set looks like. Strip them before render so the live
// page never ships those literal strings.
export function isPlaceholderChip(s: unknown): boolean {
  if (typeof s !== 'string') return false;
  return /^\[your\b[^\]]*\]$/i.test(s.trim());
}

// Token interpolation. Spec copy uses [City], [Neighborhood], and [County]
// tokens in section footnotes, guarantee descriptions, and footer addresses.
// We replace them with the wizard's city/state values + the first chip in
// the resolved areas array. When a token can't be resolved we collapse the
// surrounding punctuation so the rendered copy doesn't leak dangling commas
// or "  Metro," fragments.
export function interpolateTokens(
  value: string,
  tokens: { city?: string; neighborhood?: string; county?: string }
): string {
  let out = value;
  out = out.replace(/\[City\]/g, tokens.city || '');
  out = out.replace(/\[Neighborhood\]/g, tokens.neighborhood || '');
  out = out.replace(/\[County\]/g, tokens.county || '');
  // Clean up dangling punctuation left behind by empty token replacements.
  // Examples: "358 Oakridge Ln,  Metro, 90521" → "358 Oakridge Ln, Metro, 90521"
  //           "We cover  and surrounding  — just ask." → "We cover and surrounding — just ask."
  out = out.replace(/[ \t]{2,}/g, ' ');
  out = out.replace(/,\s*,/g, ',');
  out = out.replace(/\(\s*\)/g, '');
  out = out.replace(/\s+([,.;:!?])/g, '$1');
  return out.trim();
}

// Walk a section's props (one level deep, plus arrays of strings/objects)
// and interpolate every string field. Skips internal `_resolved*` keys and
// numeric/boolean props so we never accidentally corrupt asset URLs or
// section toggles.
function interpolateProps(
  props: Record<string, unknown>,
  tokens: { city?: string; neighborhood?: string; county?: string }
): void {
  for (const key of Object.keys(props)) {
    if (key.startsWith('_')) continue;
    const v = props[key];
    if (typeof v === 'string') {
      props[key] = interpolateTokens(v, tokens);
    } else if (Array.isArray(v)) {
      props[key] = v.map((item) => {
        if (typeof item === 'string') return interpolateTokens(item, tokens);
        if (item && typeof item === 'object') {
          const obj = { ...(item as Record<string, unknown>) };
          for (const k of Object.keys(obj)) {
            if (typeof obj[k] === 'string') obj[k] = interpolateTokens(obj[k] as string, tokens);
          }
          return obj;
        }
        return item;
      });
    }
  }
}

export function loadThemeCss(themeName: string): string {
  return readCssFile(`v1/themes/${themeName}.css`);
}

// ── Form rendering ─────────────────────────────────────────────────────────────

function renderFormFields(
  fields: V1FormField[],
  formOverrides?: Record<string, { placeholder?: string; label?: string }>
): string {
  return fields
    .map((f) => {
      const req = f.required ? 'required' : '';
      const overridePh = formOverrides?.[f.name]?.placeholder;
      const placeholder = overridePh || f.placeholder;
      const ph = placeholder ? `placeholder="${escapeAttr(placeholder)}"` : '';
      const overrideLabel = formOverrides?.[f.name]?.label;
      const labelHtml = overrideLabel
        ? `<label for="v1-${escapeAttr(f.name)}" class="v1-label">${escapeHtml(overrideLabel)}</label>`
        : '';

      const baseAttrs = `id="v1-${escapeAttr(f.name)}" name="${escapeAttr(f.name)}" ${ph} ${req} class="v1-input"`;

      if (f.type === 'textarea') {
        return `<div class="v1-field">${labelHtml}<textarea ${baseAttrs} rows="4"></textarea></div>`;
      }
      if (f.type === 'select') {
        const opts = (f.options ?? []).map((o) => `<option value="${escapeAttr(o)}">${escapeHtml(o)}</option>`).join('');
        const placeholderOpt = placeholder
          ? `<option value="" disabled selected>${escapeHtml(placeholder)}</option>`
          : '';
        return `<div class="v1-field">${labelHtml}<select id="v1-${escapeAttr(f.name)}" name="${escapeAttr(f.name)}" ${req} class="v1-input">${placeholderOpt}${opts}</select></div>`;
      }
      if (f.type === 'checkbox') {
        const labelText = overrideLabel || placeholder || f.name;
        return `<div class="v1-field v1-field--checkbox"><label class="v1-checkbox-label"><input id="v1-${escapeAttr(f.name)}" name="${escapeAttr(f.name)}" type="checkbox" ${req} class="v1-checkbox" /> <span>${escapeHtml(labelText)}</span></label></div>`;
      }
      return `<div class="v1-field">${labelHtml}<input ${baseAttrs} type="${escapeAttr(f.type)}" /></div>`;
    })
    .join('\n');
}

// ── Main composer ──────────────────────────────────────────────────────────────

export interface ComposeResult {
  html: string;
  templateId: string;
}

/**
 * Content overrides — generated by the AI content module and merged into
 * the spec's section props before rendering.
 *
 * `sections` is an array parallel to spec.sections: each element is a
 * partial prop object that gets shallow-merged on top of the spec defaults.
 * `null` entries mean "keep the original spec props unchanged".
 *
 * `assets` maps spec asset keys to user-provided URLs (e.g. base64 data URIs
 * from uploaded images) which override the demo/placeholder URLs.
 */
/**
 * SEO and branding metadata produced by the enhancement pass.
 */
export interface V1MetaOverrides {
  pageTitle?: string;
  metaDescription?: string;
  tagline?: string;
  imageAltTexts?: Record<string, string>;
  /** Optional credits for user-selected (non-demo) images, keyed by assetKey. */
  imageAttributions?: Record<string, V1ImageAttribution>;
  /**
   * Destination phone captured from the wizard's Contact step. Used as the
   * forwarding number when provisioning a CallRail tracker and as the
   * default swap.js target on the published page. Stored exactly as the
   * user entered it (digits, with or without formatting).
   */
  businessPhone?: string;
  /**
   * Legal/display business name captured from the wizard's optional
   * template-specific fields (Step 2 — `templateAnswers.businessName`).
   * Used as the CallRail Company name on provision so users see their
   * real business name in CallRail instead of "<template> – <date>".
   */
  businessName?: string;
  /**
   * Mailing/visit address. Captured by the research wizard's Mapbox
   * autocomplete (street + city/state joined by composer) and rendered
   * in any section whose props declare an `address` field. Treated as
   * free-form: the composer does no further parsing.
   */
  businessAddress?: string;
  /**
   * City portion of the business address, persisted alongside
   * `businessAddress` so the composer's token-interpolation pass can
   * resolve `[City]` placeholders in spec copy without re-parsing the
   * full address string.
   */
  city?: string;
  /** State portion of the business address. Persisted for completeness. */
  state?: string;
  /**
   * Raw free-form service-area text as the user typed it in the chat
   * wizard ("Within 30 miles of Chicago", or a chip-able list like
   * "Lakemont, Aspen Bluff, …"). Not rendered directly — used as a
   * fallback source by /api/projects/[id]/regenerate when DataForSEO,
   * enrichment, and competitor research all return zero chips.
   */
  serviceAreaText?: string;
  /**
   * Visibility flag for the rendered street address. Treated as `true`
   * when undefined so legacy projects keep showing the spec/wizard
   * address. When explicitly `false`, the composer strips `props.address`
   * from every section before render — meta.businessAddress is still
   * persisted for research/CallRail/billing.
   */
  displayAddress?: boolean;
  /**
   * Microsoft Clarity project ID. When set, the standard Clarity tracking
   * snippet is injected into the document `<head>` so visits to the
   * rendered page are recorded for session replay and heatmaps. See
   * https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup
   * for the snippet shape.
   */
  clarityProjectId?: string;
  /**
   * Google tag (gtag.js) ID — typically a Google Ads conversion tag
   * (`AW-…`), GA4 measurement ID (`G-…`), or floodlight (`DC-…`). When
   * set, the standard gtag.js loader and init snippet are injected into
   * the document `<head>` so page views and conversions are reported.
   */
  googleTagId?: string;
  /**
   * First-party heatmap tracker switch. The deploy route passes a
   * pre-built tracker URL (`heatmapTrackerUrl` option) on every publish;
   * this flag lets the project owner opt out. Treated as `true` when
   * undefined so newly created projects ship with tracking on.
   */
  heatmapEnabled?: boolean;
  /**
   * Original URL that seeded this project (URL onboarding lane). Used as
   * a "view source site" reference for the operator; never rendered to
   * visitors.
   */
  sourceUrl?: string;
  /**
   * Full-page Firecrawl screenshot of `sourceUrl`, captured during URL
   * onboarding. Stored for reference only — the hero is filled by the
   * standard Unsplash auto-picker, same as every other onboarding lane.
   */
  sourceScreenshotUrl?: string;
}

export interface V1ImageAttribution {
  text: string;
  url: string;
  provider?: string;
  licenseSummary?: string;
}

/**
 * Editable copy for the per-project Thank You page rendered at /thank-you.
 * Any unset field falls back to niche-aware defaults in composeV1ThankYou.
 */
export interface V1ThankYouOverrides {
  headline?: string;
  message?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
}

export interface V1ContentOverrides {
  sections?: (Record<string, unknown> | null)[];
  assets?: Record<string, string>;
  /** SEO / branding metadata from the enhancement pass */
  meta?: V1MetaOverrides;
  /** Personalized form-field placeholders keyed by field name */
  formOverrides?: Record<string, { placeholder?: string; label?: string }>;
  /** AI-generated stock photo search terms keyed by section role */
  imageSearchTerms?: Record<string, string>;
  /**
   * Custom display order for sections. Each entry is an index into the
   * spec.sections array (for original sections) or a string key prefixed
   * with "added:" for user-added sections.  When absent the spec order is
   * used.
   */
  sectionOrder?: (number | string)[];
  /**
   * User-added sections not present in the original spec.  Keyed by a
   * stable id (e.g. "added:1679012345678").  The value contains the section
   * type and initial props.
   */
  addedSections?: Record<string, { type: string; props: Record<string, unknown> }>;
  /** Editable copy for the secondary /thank-you page. */
  thankYou?: V1ThankYouOverrides;
}

export interface ComposeV1Options {
  /**
   * If true, demo asset IDs (demo-*) resolve to remote image URLs.
   * If false (default), demo assets resolve to their local SVG fallbacks so
   * composed HTML contains no remote demo image URLs.
   */
  allowRemoteDemoImages?: boolean;
  /**
   * Absolute URL of the lead-capture endpoint (e.g.
   * `https://app.sparkpage.us/api/leads/<projectId>`). When set, form
   * sections render a `<form action="…" method="POST">` and the document
   * inlines a small submit-handler script that POSTs the fields and
   * redirects to `redirectTo` on success. Omit for preview/editor mode
   * where submissions stay inert.
   */
  submitUrl?: string;
  /**
   * Path to redirect to on a successful submission. Defaults to
   * `/thank-you` (served by the sibling thank-you/index.html on Vercel).
   */
  redirectTo?: string;
  /**
   * AudienceLab pixel `install_url` (a JS file). When set, a single
   * `<script async src="…">` is injected into the document `<head>` so
   * visits to the published page are tracked. Omit for preview/editor
   * mode where pixels should not fire.
   */
  pixelUrl?: string;
  /**
   * CallRail swap.js URL (the company-scoped `script_url` returned by
   * /companies.json, normalized to https). When set, a single
   * `<script async src="…">` is injected into <head> so Dynamic Number
   * Insertion replaces matching numbers on the page with the project's
   * tracking number. Omit for preview/editor mode.
   */
  callrailScriptUrl?: string;
  /**
   * Absolute URL of the SparkPage heatmap tracker including the project
   * id as a query parameter (e.g. `https://app.sparkpage.us/h.js?p=<id>`).
   * When set AND `meta.heatmapEnabled !== false`, a single
   * `<script async src="…">` is injected into <head> so the first-party
   * tracker batches clicks back to `/api/heatmap/ingest/<id>`. Omit for
   * preview/editor mode.
   */
  heatmapTrackerUrl?: string;
  /**
   * When true, render the visitor-facing cookie consent banner and emit
   * every tracking script (AudienceLab, CallRail, heatmap, Clarity, gtag)
   * as inert `<script type="text/plain" data-consent-category="…">` blocks
   * that the banner promotes to live scripts based on the visitor's
   * per-category selections. Set only by the deploy route — the editor
   * iframe, template gallery, and /api/v1/compose leave this unset so no
   * banner appears and the existing (pre-consent) script behavior is
   * preserved for those non-visitor surfaces.
   */
  isPublished?: boolean;
}

export function composeV1Template(
  templateId: string,
  overrides?: V1ContentOverrides,
  options?: ComposeV1Options
): ComposeResult {
  const allowRemoteDemoImages = options?.allowRemoteDemoImages === true;
  const submitUrl = typeof options?.submitUrl === 'string' ? options.submitUrl : '';
  const redirectTo =
    typeof options?.redirectTo === 'string' && options.redirectTo
      ? options.redirectTo
      : '/thank-you';
  const pixelUrl = typeof options?.pixelUrl === 'string' ? options.pixelUrl : '';
  const callrailScriptUrl = typeof options?.callrailScriptUrl === 'string' ? options.callrailScriptUrl : '';
  const heatmapTrackerUrl = typeof options?.heatmapTrackerUrl === 'string' ? options.heatmapTrackerUrl : '';
  const isPublished = options?.isPublished === true;

  // 1. Load spec
  const spec = getV1Spec(templateId);
  if (!spec) {
    throw new Error(`[v1 composer] No spec found for templateId: ${templateId}`);
  }

  // 2. Validate
  const validation = validateSpec(spec);
  if (!validation.valid) {
    throw new Error(
      `[v1 composer] Invalid spec "${templateId}":\n  ${validation.errors.join('\n  ')}`
    );
  }

  // 3. Load CSS
  const tokensCss = loadTokensCss();
  const themeCss = loadThemeCss(spec.theme);

  // 4. Pre-render form HTML for injection into FinalCTA
  const formHtml = renderFormFields(spec.form, overrides?.formOverrides);

  // 4b. Resolve all asset IDs → final src strings (offline-safe by default)
  // User-provided asset overrides take priority over spec defaults
  const mergedAssets = { ...spec.assets, ...(overrides?.assets ?? {}) };
  const resolvedAssets: Record<string, string> = {};
  for (const [key, value] of Object.entries(mergedAssets)) {
    // User-provided data URIs or absolute URLs don't need demo resolution
    if (value.startsWith('data:') || value.startsWith('http://') || value.startsWith('https://')) {
      resolvedAssets[key] = value;
    } else {
      const fallback = getFallbackForAssetKey(key, mergedAssets);
      if (value.startsWith('demo-')) {
        // Default: keep v1 HTML self-contained by using local SVG fallbacks.
        // Opt-in: allow remote demo images for online previews.
        resolvedAssets[key] = allowRemoteDemoImages
          ? resolveAsset(value, fallback).src
          : fallback || '/v1/assets/placeholders/common/logo-placeholder.svg';
      } else {
        resolvedAssets[key] = resolveAsset(value).src;
      }
    }

    // Inline local SVG placeholders so the final HTML is truly single-file.
    resolvedAssets[key] = inlineLocalSvgIfPossible(resolvedAssets[key]);
  }

  // 5. Build the ordered list of sections to render.
  //    If sectionOrder is provided, use it; otherwise use spec order.
  //    Each item is { id: string, entry: V1SectionEntry, overrideProps }
  type RenderItem = {
    id: string;                              // e.g. "0", "1", or "added:xxxxx"
    entry: { type: string; props: Record<string, unknown> };
    overrideProps: Record<string, unknown> | null;
  };

  const renderOrder: RenderItem[] = [];
  const order = overrides?.sectionOrder;
  if (Array.isArray(order) && order.length > 0) {
    for (const key of order) {
      if (typeof key === 'number') {
        const entry = spec.sections[key];
        if (!entry) continue;
        renderOrder.push({ id: String(key), entry, overrideProps: overrides?.sections?.[key] as Record<string, unknown> | null ?? null });
      } else if (typeof key === 'string' && key.startsWith('added:')) {
        const added = overrides?.addedSections?.[key];
        if (!added) continue;
        renderOrder.push({ id: key, entry: added, overrideProps: null });
      }
    }
  } else {
    // Default: spec order
    spec.sections.forEach((entry, i) => {
      renderOrder.push({ id: String(i), entry, overrideProps: overrides?.sections?.[i] as Record<string, unknown> | null ?? null });
    });
  }

  const sectionsHtml = renderOrder
    .map((item) => {
      const { id: sectionId, entry, overrideProps: sectionOverride } = item;
      const renderer = sectionRegistry[entry.type];
      if (!renderer) {
        console.warn(`[v1 composer] Unknown section type: ${entry.type}`);
        return `<!-- unknown section: ${entry.type} -->`;
      }

      // Prepare props — merge spec defaults with content overrides
      if (
        sectionOverride &&
        typeof sectionOverride === 'object' &&
        (sectionOverride as Record<string, unknown>)._omit === true
      ) {
        return `<!-- omitted section: ${entry.type} -->`;
      }
      const props = sectionOverride
        ? { ...entry.props, ...sectionOverride }
        : { ...entry.props };

      // Phone resolution — when the spec slot declares a `phone` field and the
      // wizard captured a business phone, replace the spec's demo number with
      // the wizard value. Formatted to (NPA) NXX-XXXX so it matches the swap
      // targets we register with CallRail and renders nicely on the page.
      if (
        typeof (entry.props as Record<string, unknown>).phone === 'string' &&
        typeof overrides?.meta?.businessPhone === 'string' &&
        overrides.meta.businessPhone.replace(/\D/g, '').length >= 10
      ) {
        (props as Record<string, unknown>).phone = formatBusinessPhone(overrides.meta.businessPhone);
      }

      // Address resolution — same shape as phone. The wizard's full assembled
      // address (street, city, state, zip) lives on meta.businessAddress and
      // takes priority over the spec's demo placeholder. When the project's
      // displayAddress toggle is false we omit the field entirely so the
      // Footer's `${address ? <li>… : ''}` branch renders nothing.
      const propsRec = props as Record<string, unknown>;
      if (typeof (entry.props as Record<string, unknown>).address === 'string') {
        const realAddr = typeof overrides?.meta?.businessAddress === 'string'
          ? overrides.meta.businessAddress.trim()
          : '';
        if (overrides?.meta?.displayAddress === false) {
          propsRec.address = '';
        } else if (realAddr) {
          propsRec.address = realAddr;
        }
      }

      // Strip demo "[Your Neighborhood]" / "[Your Zip]" chips from any
      // ServiceAreas-style array so the live page never ships spec
      // placeholders even when the AI/research/expand chain returned zero
      // chips and we fell back to spec defaults.
      if (Array.isArray(propsRec.areas)) {
        const filtered = (propsRec.areas as unknown[]).filter((a) => !isPlaceholderChip(a));
        if (filtered.length !== (propsRec.areas as unknown[]).length) {
          propsRec.areas = filtered;
        }
      }

      // Token interpolation — replace [City]/[Neighborhood]/[County] across
      // every string prop and array-of-string prop. `neighborhood` is seeded
      // from the first resolved area chip so footnotes like
      // "Don't see your [Neighborhood]?" pick up a real local name.
      const metaCity = typeof overrides?.meta?.city === 'string' ? overrides.meta.city.trim() : '';
      const firstArea = Array.isArray(propsRec.areas) && (propsRec.areas as unknown[]).length
        ? String((propsRec.areas as unknown[])[0])
        : '';
      interpolateProps(propsRec, {
        city: metaCity,
        neighborhood: firstArea,
        county: '',
      });

      // Resolve image asset references in props (using resolved URLs)
      // HeroSplit
      if (typeof props.imageAsset === 'string' && resolvedAssets[props.imageAsset as string]) {
        const assetKey = props.imageAsset as string;
        props._resolvedImageUrl = resolvedAssets[assetKey];
      }
      if (typeof (props as Record<string, unknown>).fallbackAsset === 'string') {
        const fbKey = (props as Record<string, unknown>).fallbackAsset as string;
        if (resolvedAssets[fbKey]) props._fallbackImageUrl = resolvedAssets[fbKey];
      }

      // PhotoGalleryStrip — array of items with imageAsset + optional fallbackAsset
      if (entry.type === 'PhotoGalleryStrip' && Array.isArray((props as Record<string, unknown>).items)) {
        const galleryItems = (props as Record<string, unknown>).items as Array<Record<string, unknown>>;
        const urlMap: Record<string, string> = {};
        const altMap: Record<string, string> = {};
        for (const it of galleryItems) {
          const k = typeof it.imageAsset === 'string' ? it.imageAsset : '';
          if (k && resolvedAssets[k]) urlMap[k] = resolvedAssets[k];
          const fbk = typeof it.fallbackAsset === 'string' ? it.fallbackAsset : '';
          if (fbk && resolvedAssets[fbk]) urlMap[`${k}__fallback`] = resolvedAssets[fbk];
          if (k && overrides?.meta?.imageAltTexts?.[k]) altMap[k] = overrides.meta.imageAltTexts[k];
        }
        (props as Record<string, unknown>)._resolvedImageUrls = urlMap;
        (props as Record<string, unknown>)._altTexts = altMap;
      }

      // TestimonialsCards — per-testimonial avatarAsset + optional fallbackAsset
      if (entry.type === 'TestimonialsCards' && Array.isArray((props as Record<string, unknown>).testimonials)) {
        const items = (props as Record<string, unknown>).testimonials as Array<Record<string, unknown>>;
        const urlMap: Record<string, string> = {};
        const altMap: Record<string, string> = {};
        for (const it of items) {
          const k = typeof it.avatarAsset === 'string' ? it.avatarAsset : '';
          if (k && resolvedAssets[k]) urlMap[k] = resolvedAssets[k];
          const fbk = typeof it.fallbackAsset === 'string' ? it.fallbackAsset : '';
          if (fbk && resolvedAssets[fbk]) urlMap[`${k}__fallback`] = resolvedAssets[fbk];
          if (k && overrides?.meta?.imageAltTexts?.[k]) altMap[k] = overrides.meta.imageAltTexts[k];
        }
        (props as Record<string, unknown>)._resolvedAvatarUrls = urlMap;
        (props as Record<string, unknown>)._avatarAltTexts = altMap;
      }

      // ImagePair
      if (typeof (props as Record<string, unknown>).imageAsset1 === 'string') {
        const k = (props as Record<string, unknown>).imageAsset1 as string;
        if (resolvedAssets[k]) {
          (props as Record<string, unknown>)._resolvedImageUrl1 = resolvedAssets[k];
        }
      }
      if (typeof (props as Record<string, unknown>).fallbackAsset1 === 'string') {
        const k = (props as Record<string, unknown>).fallbackAsset1 as string;
        if (resolvedAssets[k]) (props as Record<string, unknown>)._fallbackImageUrl1 = resolvedAssets[k];
      }
      if (typeof (props as Record<string, unknown>).imageAsset2 === 'string') {
        const k = (props as Record<string, unknown>).imageAsset2 as string;
        if (resolvedAssets[k]) {
          (props as Record<string, unknown>)._resolvedImageUrl2 = resolvedAssets[k];
        }
      }
      if (typeof (props as Record<string, unknown>).fallbackAsset2 === 'string') {
        const k = (props as Record<string, unknown>).fallbackAsset2 as string;
        if (resolvedAssets[k]) (props as Record<string, unknown>)._fallbackImageUrl2 = resolvedAssets[k];
      }

      // Inject alt text from enhancement overrides
      const altTexts = overrides?.meta?.imageAltTexts;
      if (altTexts) {
        // HeroSplit: imageAsset → _altText
        if (typeof props.imageAsset === 'string' && altTexts[props.imageAsset as string]) {
          props._altText = altTexts[props.imageAsset as string];
        }
        // ImagePair: imageAsset1 → _altText1, imageAsset2 → _altText2
        const p = props as Record<string, unknown>;
        if (typeof p.imageAsset1 === 'string' && altTexts[p.imageAsset1 as string]) {
          p._altText1 = altTexts[p.imageAsset1 as string];
        }
        if (typeof p.imageAsset2 === 'string' && altTexts[p.imageAsset2 as string]) {
          p._altText2 = altTexts[p.imageAsset2 as string];
        }
      }

      // Inject AI-generated image search terms as fallback alt texts
      const imgTerms = overrides?.imageSearchTerms;
      if (imgTerms) {
        const p = props as Record<string, unknown>;
        if ((entry.type === 'HeroSplit' || entry.type === 'HeroLeadForm') && imgTerms.hero && !props._altText) {
          props._altText = imgTerms.hero;
        }
        if (entry.type === 'ImagePair') {
          if (imgTerms.image1 && !p._altText1) p._altText1 = imgTerms.image1;
          if (imgTerms.image2 && !p._altText2) p._altText2 = imgTerms.image2;
        }
      }

      // Inject form HTML into sections that embed the spec.form
      if (entry.type === 'FinalCTA' || entry.type === 'HeroLeadForm') {
        props._formHtml = formHtml;
        // When a lead-capture endpoint is configured, the section renders
        // a live `<form action method>`; otherwise the form stays inert
        // (preview/editor mode).
        if (submitUrl) {
          props._submitUrl = submitUrl;
          props._redirectTo = redirectTo;
        }
      }

      const innerHtml = renderer(props);
      // Wrap in a section-id container so the iframe click handler can identify it
      return `<div data-v1-section-id="${escapeAttr(sectionId)}" data-v1-section-type="${escapeAttr(entry.type)}">${innerHtml}</div>`;
    })
    .join('\n');

  // 5b. Attribution footer: only render user-selected image credits.
  // (We intentionally do not render demo image attributions/links.)
  const attrHtml = renderAttributionFooter([], overrides?.meta?.imageAttributions);

  // 6. Wrap in full HTML document. The submit-handler script is only
  // inlined when a lead-capture endpoint is configured.
  const html = buildV1Document(
    spec,
    tokensCss,
    themeCss,
    sectionsHtml,
    attrHtml,
    overrides?.meta,
    submitUrl ? { submitUrl, redirectTo } : undefined,
    pixelUrl || undefined,
    callrailScriptUrl || undefined,
    heatmapTrackerUrl || undefined,
    isPublished
  );

  return { html, templateId };
}

function getFallbackForAssetKey(key: string, assets: Record<string, string>): string | undefined {
  if (key.startsWith('fallback')) return undefined;

  const cap = key.length > 0 ? key[0].toUpperCase() + key.slice(1) : key;
  const candidates = [`fallback${cap}`, `fallback-${key}`];
  for (const c of candidates) {
    if (c in assets && typeof assets[c] === 'string') return assets[c];
  }
  return undefined;
}

// ── Document wrapper ───────────────────────────────────────────────────────────

/**
 * Options that control runtime form behaviour. When `submitUrl` is set,
 * `buildV1Document` inlines a small vanilla-JS handler that intercepts
 * `<form data-v1-lead-form>` submissions, POSTs them as JSON, manages a
 * Sending… button state, and redirects to `redirectTo` on success.
 */
export interface BuildV1DocumentFormConfig {
  submitUrl: string;
  redirectTo: string;
}

/**
 * Wrap section HTML in a full HTML document with the standard v1 head:
 * inlined tokens + theme CSS, edit-mode interaction styles, and meta tags.
 * Exported so sibling composers (e.g. composeV1ThankYou) can reuse it.
 */
export function buildV1Document(
  spec: TemplateSpec,
  tokensCss: string,
  themeCss: string,
  sectionsHtml: string,
  attributionHtml: string,
  meta?: V1MetaOverrides,
  formConfig?: BuildV1DocumentFormConfig,
  pixelUrl?: string,
  callrailScriptUrl?: string,
  heatmapTrackerUrl?: string,
  isPublished?: boolean
): string {
  const pageTitle = meta?.pageTitle || spec.metadata.name;
  const metaDesc = meta?.metaDescription || spec.metadata.description;
  const taglineTag = meta?.tagline
    ? `\n  <meta name="v1-tagline" content="${escapeAttr(meta.tagline)}">`
    : '';

  const submitScript = formConfig
    ? renderLeadFormScript(formConfig.redirectTo)
    : '';

  // ── Tracking scripts ──────────────────────────────────────────────────
  // When `isPublished === true`, every tracking script is emitted as an
  // inert `<script type="text/plain" data-consent-category="…">` block so
  // it does NOT execute until the cookie consent banner promotes it via
  // the visitor's per-category selection. The banner's runtime walks
  // `[data-consent-category]` and rewrites matching blocks to live
  // `<script>` nodes on accept.
  //
  // When `isPublished` is undefined (preview iframe, template gallery,
  // /api/v1/compose), the existing pre-consent behavior is preserved so
  // operators can still verify wiring in the editor without a banner.
  //
  // Category mapping (see renderCookieConsentBanner):
  //   identity  — AudienceLab (third-party data matching pixel)
  //   analytics — CallRail, Clarity, SparkPage heatmap (measurement)
  //   marketing — gtag.js (Google Ads / GA4 retargeting & conversions)

  // AudienceLab pixel tag — single `<script async>` in <head> per AudienceLab
  // guidance. Only emitted on published deploys (deploy route opts in).
  const pixelTag = pixelUrl
    ? (isPublished
        ? `\n  <script type="text/plain" data-consent-category="identity" data-src="${escapeAttr(pixelUrl)}" data-async></script>`
        : `\n  <script async src="${escapeAttr(pixelUrl)}"></script>`)
    : '';

  // CallRail swap.js — same shape as the pixel tag. The script reads its
  // company config from the URL itself and replaces matching swap_targets
  // on the page with the project's tracking number.
  const callrailTag = callrailScriptUrl
    ? (isPublished
        ? `\n  <script type="text/plain" data-consent-category="analytics" data-src="${escapeAttr(callrailScriptUrl)}" data-async></script>`
        : `\n  <script async src="${escapeAttr(callrailScriptUrl)}"></script>`)
    : '';

  // Microsoft Clarity tracking snippet — emitted when meta.clarityProjectId
  // is set. Standard install per
  // https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup.
  // The ID is JSON-escaped and `</` sequences are neutralized to keep the
  // inline script safe.
  const clarityId = typeof meta?.clarityProjectId === 'string'
    ? meta.clarityProjectId.trim()
    : '';
  const clarityBody = `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script",${JSON.stringify(clarityId).replace(/</g, '\\u003c')});`;
  const clarityTag = clarityId
    ? (isPublished
        ? `\n  <script type="text/plain" data-consent-category="analytics">${clarityBody}</script>`
        : `\n  <script>\n  ${clarityBody}\n  </script>`)
    : '';

  // Google tag (gtag.js) — emitted when meta.googleTagId is set. Loads
  // the gtag loader and configures the supplied ID. Accepts any gtag.js
  // identifier (AW-…, G-…, DC-…). ID is escapeAttr'd in the src URL and
  // JSON-escaped with `</` neutralization in the inline config call.
  const googleTagId = typeof meta?.googleTagId === 'string'
    ? meta.googleTagId.trim()
    : '';
  const googleTagLoaderSrc = `https://www.googletagmanager.com/gtag/js?id=${escapeAttr(googleTagId)}`;
  const googleTagBody = `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', ${JSON.stringify(googleTagId).replace(/</g, '\\u003c')});`;
  const googleTag = googleTagId
    ? (isPublished
        ? `\n  <!-- Google tag (gtag.js) -->\n  <script type="text/plain" data-consent-category="marketing" data-src="${googleTagLoaderSrc}" data-async></script>\n  <script type="text/plain" data-consent-category="marketing">${googleTagBody}</script>`
        : `\n  <!-- Google tag (gtag.js) -->\n  <script async src="${googleTagLoaderSrc}"></script>\n  <script>\n    ${googleTagBody}\n  </script>`)
    : '';

  // SparkPage first-party heatmap tracker — emitted when the deploy route
  // passes a tracker URL AND the project hasn't opted out via
  // `meta.heatmapEnabled === false`. The tracker self-configures from the
  // `?p=<projectId>` query string baked into the src URL.
  const heatmapOptOut = meta?.heatmapEnabled === false;
  const heatmapTag = heatmapTrackerUrl && !heatmapOptOut
    ? (isPublished
        ? `\n  <script type="text/plain" data-consent-category="analytics" data-src="${escapeAttr(heatmapTrackerUrl)}" data-async></script>`
        : `\n  <script async src="${escapeAttr(heatmapTrackerUrl)}"></script>`)
    : '';

  // Cookie consent banner — visitor-facing UI + runtime that promotes
  // deferred tracking scripts based on per-category consent. Injected just
  // before </body> only on published pages.
  const consentBanner = isPublished ? renderCookieConsentBanner() : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${escapeAttr(metaDesc)}">${taglineTag}${pixelTag}${callrailTag}${clarityTag}${googleTag}${heatmapTag}
  <title>${escapeHtml(pageTitle)}</title>
  <style>
/* === v1 tokens === */
${tokensCss}
/* === v1 theme: ${spec.theme} === */
${themeCss}
/* === v1 section interaction highlights === */
[data-v1-section-id] { transition: outline 0.15s ease, outline-offset 0.15s ease; outline: 2px solid transparent; outline-offset: -2px; }
body.v1-edit-mode [data-v1-section-id]:hover { outline: 2px dashed rgba(99,102,241,0.45); outline-offset: -2px; cursor: pointer; }
body.v1-edit-mode [data-v1-section-id].v1-section-selected { outline: 2px solid rgba(99,102,241,0.8); outline-offset: -2px; }
/* === v1 inline field editing === */
[data-v1-field-key] { transition: outline 0.12s ease, background 0.12s ease; border-radius: 3px; }
body.v1-edit-mode [data-v1-field-key] { cursor: text; }
body.v1-edit-mode [data-v1-field-key]:hover { outline: 1px dashed rgba(99,102,241,0.5); outline-offset: 2px; }
body.v1-edit-mode [data-v1-field-key][contenteditable="true"] { outline: 2px solid rgba(99,102,241,0.8); outline-offset: 2px; background: rgba(99,102,241,0.06); min-width: 20px; }
/* === v1 lead-form runtime states === */
.v1-form-error { color: #b91c1c; font-size: var(--v1-font-size-sm); margin-top: var(--v1-space-2); display: none; }
.v1-form-error.is-visible { display: block; }
  </style>
</head>
<body>
  <div class="v1-page">
${sectionsHtml}
${attributionHtml}
  </div>${submitScript}${consentBanner}
</body>
</html>`;
}

/**
 * Inlined submit handler for published pages. Intentionally vanilla JS so
 * the deployed HTML stays single-file and dependency-free.
 *
 * Wires every `<form data-v1-lead-form>` on the page:
 *  - prevents default submission
 *  - serialises fields to JSON
 *  - POSTs to the form's `action` attribute (baked in by the section)
 *  - flips the submit button to "Sending…" while in flight
 *  - on 2xx → redirects to `redirectTo` (server response can override via
 *    the `redirect` field)
 *  - on failure → restores the button and shows an inline error
 */
function renderLeadFormScript(redirectTo: string): string {
  // The redirect path is JSON-encoded so any special characters survive
  // the round-trip through the <script> tag verbatim.
  return `
  <script>
  (function(){
    var DEFAULT_REDIRECT = ${JSON.stringify(redirectTo)};
    function handle(form){
      if (form.dataset.v1Bound === '1') return;
      form.dataset.v1Bound = '1';
      form.addEventListener('submit', function(ev){
        ev.preventDefault();
        var action = form.getAttribute('action');
        if (!action) return;
        var btn = form.querySelector('button[type="submit"], button:not([type])');
        var errEl = form.querySelector('[data-v1-form-error]');
        var originalLabel = btn ? btn.innerHTML : '';
        if (btn) { btn.disabled = true; btn.innerHTML = 'Sending…'; }
        if (errEl) { errEl.classList.remove('is-visible'); errEl.textContent = ''; }
        var data = {};
        var fd = new FormData(form);
        fd.forEach(function(value, key){ data[key] = value; });
        fetch(action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(data)
        }).then(function(res){
          if (!res.ok) throw new Error('Request failed (' + res.status + ')');
          return res.json().catch(function(){ return {}; });
        }).then(function(body){
          var target = (body && body.redirect) ? body.redirect : DEFAULT_REDIRECT;
          window.location.href = target;
        }).catch(function(err){
          if (btn) { btn.disabled = false; btn.innerHTML = originalLabel; }
          if (errEl) {
            errEl.textContent = 'Sorry — we couldn’t send that. Please try again.';
            errEl.classList.add('is-visible');
          }
          if (window.console) console.warn('[v1 lead-form]', err);
        });
      });
    }
    var forms = document.querySelectorAll('form[data-v1-lead-form]');
    for (var i = 0; i < forms.length; i++) handle(forms[i]);
  })();
  </script>`;
}

// ── Cookie consent banner ───────────────────────────────────────────────────

/** Static markup for the consent banner card + privacy policy modal. */
function renderCookieConsentMarkup(): string {
  return `
<div id="ck-wrap" role="dialog" aria-live="polite" aria-label="Cookie consent">
  <div class="ck-card">
    <div class="ck-top">
      <div class="ck-icon">
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="3.5"/>
          <circle cx="22" cy="26" r="3.5" fill="currentColor"/>
          <circle cx="38" cy="20" r="2.5" fill="currentColor"/>
          <circle cx="42" cy="36" r="3.5" fill="currentColor"/>
          <circle cx="26" cy="42" r="2.5" fill="currentColor"/>
          <circle cx="34" cy="48" r="2" fill="currentColor"/>
          <circle cx="20" cy="38" r="2" fill="currentColor"/>
        </svg>
      </div>
      <p class="ck-text">This site uses cookies to improve your experience. See our <button class="ck-link" id="btn-open-policy" type="button">Privacy Policy</button>.</p>
      <button class="ck-close" id="btn-close" type="button" aria-label="Close">&#x2715;</button>
    </div>
    <div id="ck-customize">
      <div class="ck-cust-header">
        <span class="ck-cust-label">Preferences</span>
        <button id="btn-sel-all" type="button">Deselect All</button>
      </div>
      <div class="ck-option active" data-id="marketing">
        <div class="ck-option-text">
          <div class="ck-option-label">Marketing</div>
          <div class="ck-option-desc">Ads &amp; third-party data matching.</div>
        </div>
        <button class="ck-toggle on" data-id="marketing" type="button" aria-label="Toggle Marketing"></button>
      </div>
      <div class="ck-option active" data-id="analytics">
        <div class="ck-option-text">
          <div class="ck-option-label">Analytics</div>
          <div class="ck-option-desc">Site usage &amp; performance tracking.</div>
        </div>
        <button class="ck-toggle on" data-id="analytics" type="button" aria-label="Toggle Analytics"></button>
      </div>
      <div class="ck-option active" data-id="identity">
        <div class="ck-option-text">
          <div class="ck-option-label">Identifiable</div>
          <div class="ck-option-desc">Cross-session &amp; device identification.</div>
        </div>
        <button class="ck-toggle on" data-id="identity" type="button" aria-label="Toggle Identifiable"></button>
      </div>
      <div class="ck-save-row">
        <button id="btn-decline-all" type="button">Decline All</button>
        <button id="btn-save" type="button">Save Preferences</button>
      </div>
    </div>
    <div class="ck-actions">
      <button class="btn-ck" id="btn-customize" type="button">Customize Cookies</button>
      <div class="btn-ck-divider"></div>
      <button class="btn-ck" id="btn-ok" type="button">Ok</button>
    </div>
  </div>
</div>
<div id="policy-overlay">
  <div class="policy-modal">
    <div class="policy-header">
      <div class="policy-header-title">Privacy Policy</div>
      <button id="policy-close" type="button" aria-label="Close">&#x2715;</button>
    </div>
    <div class="policy-body">
      <p class="policy-lede">When you visit this site, we collect data about your visit and use it — along with information matched from third-party and publicly available sources — to understand your interests and deliver relevant marketing. You control what we collect and can opt out at any time.</p>
      <div class="policy-section"><div class="policy-section-title">What We Collect</div><div class="policy-section-text">Pages viewed, time on site, traffic source, and device/browser signals. All tied to a session cookie ID.</div></div>
      <div class="policy-section"><div class="policy-section-title">How We Use It</div><div class="policy-section-text">To measure performance, build audience segments, and power retargeting across platforms and ad channels.</div></div>
      <div class="policy-section"><div class="policy-section-title">Third-Party Data Matching</div><div class="policy-section-text">Your visit data may be matched against third-party records — including public databases and cross-site profiles — to build a fuller picture for targeted advertising. Partners are contractually bound to applicable privacy laws.</div></div>
      <div class="policy-section"><div class="policy-section-title">Marketing Cookies</div><div class="policy-section-text">Enable retargeted advertising by tracking activity across our site and other platforms.</div></div>
      <div class="policy-section"><div class="policy-section-title">Analytics Cookies</div><div class="policy-section-text">Measure how visitors use our site in aggregate to improve content and performance.</div></div>
      <div class="policy-section"><div class="policy-section-title">Identifiable Cookies</div><div class="policy-section-text">With consent, may link your visit data to contact information or profiles held by our data partners.</div></div>
      <div class="policy-section"><div class="policy-section-title">Your Right to Opt Out</div><div class="policy-section-text">Decline all cookies or pick only the categories you're comfortable with using the Customize Cookies option. Withdrawing consent stops new collection but doesn't affect data already collected.</div></div>
      <div class="policy-section"><div class="policy-section-title">Retention</div><div class="policy-section-text">Cookie data is kept for up to 90 days. Third-party partner retention is governed by their own policies.</div></div>
    </div>
    <div class="policy-footer"><button id="btn-policy-close" type="button">Got It</button></div>
  </div>
</div>`;
}

/**
 * Visitor-facing cookie consent banner injected into published pages only
 * (gated by ComposeV1Options.isPublished). Categorized per-tracker consent:
 *
 *   marketing — gtag.js (Google Ads / GA4 retargeting + conversions)
 *   analytics — CallRail swap.js, Microsoft Clarity, SparkPage heatmap
 *   identity  — AudienceLab pixel
 *
 * Runtime contract:
 *   - On load, read `localStorage['sp_consent_v1']`. If present, immediately
 *     promote every `<script type="text/plain" data-consent-category="X">`
 *     whose category was accepted, and do NOT show the banner.
 *   - If no prior record, reveal the banner and listen for the visitor's
 *     choice (Ok / Customize / Decline All / Close).
 *   - "Close" (X) and scroll BOTH dismiss the banner without recording a
 *     choice — trackers stay inert and the banner returns next visit.
 *     This is the conservative GDPR-safe interpretation; no implicit accept.
 *   - On accept (full or partial), persist the per-category selections and
 *     promote matching deferred scripts in place.
 *
 * CSS scoping: the original snippet's global `*` reset and `body` rule
 * would bleed into the published page. Both are replaced with selectors
 * scoped to `#ck-wrap` and `#policy-overlay` only.
 */
function renderCookieConsentBanner(): string {
  return `
<!-- SparkPage cookie consent banner -->
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
#ck-wrap, #ck-wrap *, #ck-wrap *::before, #ck-wrap *::after,
#policy-overlay, #policy-overlay *, #policy-overlay *::before, #policy-overlay *::after { box-sizing: border-box; margin: 0; padding: 0; }

#ck-wrap {
  position: fixed;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2147483000;
  width: calc(100% - 24px);
  max-width: 380px;
  display: none;
  font-family: 'DM Sans', sans-serif;
}
#ck-wrap.is-visible { display: block; animation: ckUp 0.32s cubic-bezier(0.16,1,0.3,1) forwards; }
#ck-wrap.closing { animation: ckDown 0.28s cubic-bezier(0.7,0,0.84,0) forwards; }
@keyframes ckUp { from { opacity:0; transform:translateX(-50%) translateY(14px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
@keyframes ckDown { from { opacity:1; transform:translateX(-50%) translateY(0); } to { opacity:0; transform:translateX(-50%) translateY(10px); } }

#ck-wrap .ck-card { background: #1a1a1a; border-radius: 10px; box-shadow: 0 6px 28px rgba(0,0,0,0.5); overflow: hidden; }
#ck-wrap .ck-top { display: flex; align-items: flex-start; gap: 10px; padding: 12px 12px 0; }
#ck-wrap .ck-icon svg { width: 28px; height: 28px; color: rgba(255,255,255,0.45); display: block; flex-shrink: 0; }
#ck-wrap .ck-text { flex: 1; font-size: 11.5px; color: rgba(255,255,255,0.8); line-height: 1.55; }
#ck-wrap .ck-link { background: none; border: none; padding: 0; color: #F26722; font-size: 11.5px; font-family: 'DM Sans', sans-serif; cursor: pointer; }
#ck-wrap .ck-link:hover { text-decoration: underline; }
#ck-wrap .ck-close { background: none; border: none; color: rgba(255,255,255,0.4); font-size: 14px; cursor: pointer; padding: 0 0 0 4px; line-height: 1; flex-shrink: 0; transition: color 0.15s; font-family: 'DM Sans', sans-serif; }
#ck-wrap .ck-close:hover { color: #fff; }

#ck-customize { display: none; padding: 10px 12px 0; border-top: 1px solid rgba(255,255,255,0.07); margin-top: 10px; }
#ck-customize.open { display: block; }
#ck-wrap .ck-cust-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
#ck-wrap .ck-cust-label { font-size: 9.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; color: rgba(255,255,255,0.25); }
#btn-sel-all { background: none; border: none; color: #F26722; font-size: 10.5px; font-family: 'DM Sans', sans-serif; font-weight: 500; cursor: pointer; padding: 0; }
#btn-sel-all:hover { opacity: 0.8; }

#ck-wrap .ck-option { display: flex; align-items: center; gap: 10px; padding: 7px 9px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 7px; margin-bottom: 5px; transition: border-color 0.2s, background 0.2s; }
#ck-wrap .ck-option.active { border-color: rgba(242,103,34,0.28); background: rgba(242,103,34,0.05); }
#ck-wrap .ck-option-text { flex: 1; min-width: 0; }
#ck-wrap .ck-option-label { font-size: 11.5px; font-weight: 600; color: #fff; }
#ck-wrap .ck-option-desc { font-size: 10px; color: rgba(255,255,255,0.32); line-height: 1.4; }
#ck-wrap .ck-toggle { width: 28px; height: 16px; border-radius: 100px; border: none; background: rgba(255,255,255,0.1); position: relative; cursor: pointer; flex-shrink: 0; padding: 0; transition: background 0.2s; }
#ck-wrap .ck-toggle.on { background: #F26722; }
#ck-wrap .ck-toggle::after { content: ''; position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.3); transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1); }
#ck-wrap .ck-toggle.on::after { transform: translateX(12px); }

#ck-wrap .ck-save-row { display: flex; justify-content: flex-end; gap: 8px; padding: 8px 0 10px; align-items: center; }
#btn-decline-all { background: none; border: none; color: rgba(255,255,255,0.25); font-family: 'DM Sans', sans-serif; font-size: 10.5px; cursor: pointer; padding: 0; transition: color 0.15s; }
#btn-decline-all:hover { color: rgba(255,255,255,0.55); }
#btn-save { padding: 5px 14px; background: #F26722; color: #fff; font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 700; border: none; border-radius: 6px; cursor: pointer; transition: opacity 0.15s; }
#btn-save:hover { opacity: 0.85; }

#ck-wrap .ck-actions { display: flex; border-top: 1px solid rgba(255,255,255,0.08); margin-top: 10px; }
#ck-wrap .btn-ck { flex: 1; padding: 11px 8px; background: transparent; color: #fff; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 700; border: none; cursor: pointer; transition: background 0.15s; letter-spacing: 0.01em; }
#ck-wrap .btn-ck:hover { background: rgba(255,255,255,0.05); }
#ck-wrap .btn-ck-divider { width: 1px; background: rgba(255,255,255,0.08); flex-shrink: 0; }

#policy-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.65); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); z-index: 2147483001; align-items: center; justify-content: center; padding: 16px; font-family: 'DM Sans', sans-serif; }
#policy-overlay.open { display: flex; animation: ckFadeIn 0.2s ease forwards; }
@keyframes ckFadeIn { from{opacity:0} to{opacity:1} }
#policy-overlay .policy-modal { background: #fff; border-radius: 12px; width: 100%; max-width: 420px; max-height: 85vh; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.4); animation: ckPopIn 0.28s cubic-bezier(0.16,1,0.3,1) forwards; }
@keyframes ckPopIn { from { opacity:0; transform:scale(0.96) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
#policy-overlay .policy-header { background: #1a1a1a; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
#policy-overlay .policy-header-title { font-size: 13px; font-weight: 700; color: #fff; font-family: 'DM Sans', sans-serif; }
#policy-close { background: rgba(255,255,255,0.1); border: none; width: 24px; height: 24px; border-radius: 5px; cursor: pointer; color: rgba(255,255,255,0.5); display: flex; align-items: center; justify-content: center; font-size: 12px; font-family: 'DM Sans', sans-serif; transition: background 0.15s; }
#policy-close:hover { background: rgba(255,255,255,0.2); color:#fff; }
#policy-overlay .policy-body { overflow-y: auto; padding: 16px 18px 6px; flex: 1; }
#policy-overlay .policy-lede { font-size: 12px; color: #374151; line-height: 1.65; margin-bottom: 14px; padding-bottom: 14px; border-bottom: 1px solid #f0f0f0; font-family: 'DM Sans', sans-serif; }
#policy-overlay .policy-section { margin-bottom: 13px; }
#policy-overlay .policy-section-title { font-size: 11.5px; font-weight: 700; color: #111; margin-bottom: 4px; display: flex; align-items: center; gap: 6px; font-family: 'DM Sans', sans-serif; }
#policy-overlay .policy-section-title::before { content: ''; display: inline-block; width: 3px; height: 11px; background: #F26722; border-radius: 2px; flex-shrink: 0; }
#policy-overlay .policy-section-text { font-size: 11.5px; color: #6b7280; line-height: 1.65; font-family: 'DM Sans', sans-serif; }
#policy-overlay .policy-footer { padding: 12px 18px; border-top: 1px solid #f0f0f0; flex-shrink: 0; display: flex; justify-content: flex-end; }
#btn-policy-close { padding: 7px 16px; background: #1a1a1a; color: #fff; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 700; border: none; border-radius: 7px; cursor: pointer; transition: opacity 0.15s; }
#btn-policy-close:hover { opacity: 0.78; }
</style>` + renderCookieConsentMarkup() + renderCookieConsentScript();
}

/**
 * Inlined runtime for the consent banner. Vanilla JS, no dependencies.
 *
 * On page load:
 *   1. Read prior selection from localStorage['sp_consent_v1'].
 *   2. If present, promote every deferred `<script type="text/plain"
 *      data-consent-category="X">` whose category was accepted. Banner
 *      stays hidden.
 *   3. If absent, reveal the banner and wire button + scroll handlers.
 *      Scroll dismisses without recording — banner returns next visit.
 */
function renderCookieConsentScript(): string {
  return `
<script>
(function(){
  var STORAGE_KEY = 'sp_consent_v1';
  var CATEGORIES = ['marketing','analytics','identity'];

  function readPrior() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      return parsed;
    } catch (e) { return null; }
  }

  function writeChoice(sel) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        marketing: !!sel.marketing,
        analytics: !!sel.analytics,
        identity: !!sel.identity,
        recordedAt: Date.now()
      }));
    } catch (e) {}
  }

  function promote(sel) {
    var nodes = document.querySelectorAll('script[type="text/plain"][data-consent-category]');
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var cat = node.getAttribute('data-consent-category');
      if (!sel[cat]) continue;
      var live = document.createElement('script');
      var src = node.getAttribute('data-src');
      if (src) {
        live.src = src;
        if (node.hasAttribute('data-async')) live.async = true;
      } else {
        live.text = node.textContent || '';
      }
      if (node.parentNode) node.parentNode.replaceChild(live, node);
    }
  }

  var prior = readPrior();
  if (prior) {
    // Returning visitor — apply prior choices, don't show banner.
    promote(prior);
    return;
  }

  // First visit — wire up the banner.
  var selected = { marketing: true, analytics: true, identity: true };
  var wrap = document.getElementById('ck-wrap');
  if (!wrap) return;

  function dismiss(closeOnly) {
    wrap.classList.add('closing');
    setTimeout(function(){ wrap.style.display = 'none'; }, 320);
    window.removeEventListener('scroll', onScrollDismiss);
    if (!closeOnly) writeChoice(selected);
  }

  function commit() {
    promote(selected);
    dismiss(false);
  }

  function onScrollDismiss() {
    // Scroll = banner closes WITHOUT recording consent. Trackers stay
    // inert; banner returns next visit. Conservative, GDPR-safe default.
    dismiss(true);
  }

  function updateToggles() {
    for (var i = 0; i < CATEGORIES.length; i++) {
      var id = CATEGORIES[i];
      var btn = document.querySelector('.ck-toggle[data-id="' + id + '"]');
      var row = document.querySelector('.ck-option[data-id="' + id + '"]');
      if (!btn || !row) continue;
      if (selected[id]) { btn.classList.add('on'); row.classList.add('active'); }
      else { btn.classList.remove('on'); row.classList.remove('active'); }
    }
    var allOn = CATEGORIES.every(function(k){ return selected[k]; });
    var selAll = document.getElementById('btn-sel-all');
    if (selAll) selAll.textContent = allOn ? 'Deselect All' : 'Select All';
  }

  var toggles = document.querySelectorAll('.ck-toggle');
  for (var t = 0; t < toggles.length; t++) {
    (function(btn){
      btn.addEventListener('click', function(){
        var id = btn.dataset.id;
        selected[id] = !selected[id];
        updateToggles();
      });
    })(toggles[t]);
  }

  var selAllBtn = document.getElementById('btn-sel-all');
  if (selAllBtn) selAllBtn.addEventListener('click', function(){
    var allOn = CATEGORIES.every(function(k){ return selected[k]; });
    for (var i = 0; i < CATEGORIES.length; i++) selected[CATEGORIES[i]] = !allOn;
    updateToggles();
  });

  var customizeBtn = document.getElementById('btn-customize');
  if (customizeBtn) customizeBtn.addEventListener('click', function(){
    var panel = document.getElementById('ck-customize');
    if (panel) panel.classList.toggle('open');
  });

  var okBtn = document.getElementById('btn-ok');
  if (okBtn) okBtn.addEventListener('click', commit);

  var saveBtn = document.getElementById('btn-save');
  if (saveBtn) saveBtn.addEventListener('click', commit);

  var declineBtn = document.getElementById('btn-decline-all');
  if (declineBtn) declineBtn.addEventListener('click', function(){
    for (var i = 0; i < CATEGORIES.length; i++) selected[CATEGORIES[i]] = false;
    updateToggles();
    setTimeout(commit, 100);
  });

  var closeBtn = document.getElementById('btn-close');
  if (closeBtn) closeBtn.addEventListener('click', function(){ dismiss(true); });

  // Privacy policy modal wiring.
  var openPolicy = document.getElementById('btn-open-policy');
  var overlay = document.getElementById('policy-overlay');
  var closePolicy1 = document.getElementById('policy-close');
  var closePolicy2 = document.getElementById('btn-policy-close');
  if (openPolicy && overlay) openPolicy.addEventListener('click', function(){ overlay.classList.add('open'); });
  if (closePolicy1 && overlay) closePolicy1.addEventListener('click', function(){ overlay.classList.remove('open'); });
  if (closePolicy2 && overlay) closePolicy2.addEventListener('click', function(){ overlay.classList.remove('open'); });
  if (overlay) overlay.addEventListener('click', function(e){ if (e.target === overlay) overlay.classList.remove('open'); });

  // Reveal banner + register scroll dismiss.
  wrap.classList.add('is-visible');
  window.addEventListener('scroll', onScrollDismiss, { passive: true, once: true });
})();
</script>
<!-- /SparkPage cookie consent banner -->`;
}

// ── Attribution footer ──────────────────────────────────────────────────────

function renderAttributionFooter(
  demoAttributions: DemoAssetEntry[],
  imageAttributions?: Record<string, V1ImageAttribution>
): string {
  const customEntries = imageAttributions ? Object.values(imageAttributions) : [];
  const customCredits = customEntries
    .filter((a) => a && typeof a.text === 'string' && typeof a.url === 'string')
    .map(
      (a) =>
        `<a href="${escapeAttr(a.url)}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline;">${escapeHtml(a.text)}</a>`
    )
    .join(' · ');

  // Suppress demo image attribution links (e.g. Pexels). Only show credits for
  // user-selected images (e.g. Unsplash picks via the v1 Images workflow).
  // Touch the param so TS doesn't flag it if noUnusedParameters is enabled.
  void demoAttributions;

  if (!customCredits) return '';

  const customLine = `<div>Image credits: ${customCredits}</div>`;

  return `
<footer class="v1-attribution" style="
  padding: 12px 24px;
  background: #f5f5f5;
  color: #666;
  font-size: 11px;
  text-align: center;
  border-top: 1px solid #e0e0e0;
">
	  ${customLine}
</footer>`;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function escapeAttr(str: string): string {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

