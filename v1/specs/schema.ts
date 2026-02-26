/**
 * v1 Template Spec Schema
 *
 * Every v1 template is fully described by a TemplateSpec object.
 * The spec declares what the template contains (sections, theme, form, metadata)
 * without embedding any rendering logic — rendering is handled by the composer
 * and the section registry.
 *
 * Architecture decision: specs are plain TypeScript objects (not JSON files) so
 * they benefit from type-checking at author time while still being serialisable.
 */

// ── Category & Goal enums ──────────────────────────────────────────────────────

/** High-level template category — drives gallery filtering and default content. */
export type V1Category =
  | 'leadgen'
  | 'waitlist'
  | 'saas'
  | 'booking'
  | 'product'
  | 'event';

/** Primary conversion goal — determines CTA wording and form layout. */
export type V1Goal =
  | 'call'
  | 'form'
  | 'signup'
  | 'booking'
  | 'checkout'
  | 'register';

// ── Section definition ─────────────────────────────────────────────────────────

/** A single section entry in the spec's `sections` array. */
export interface V1SectionEntry {
  /** Must match a key in the sectionRegistry (e.g. "HeroSplit", "FinalCTA"). */
  type: string;
  /** Arbitrary props forwarded to the section's render function. */
  props: Record<string, unknown>;
}

// ── Form field definition ──────────────────────────────────────────────────────

/** A single form field rendered in the template's contact/lead form. */
export interface V1FormField {
  name: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'checkbox';
  label?: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // for select fields
}

// ── Asset map ──────────────────────────────────────────────────────────────────

/**
 * Maps logical asset IDs (e.g. "hero-bg", "logo") to URLs or base64 strings.
 * Section renderers reference assets by ID so the spec controls what's shown.
 */
export type V1AssetMap = Record<string, string>;

// ── Metadata ───────────────────────────────────────────────────────────────────

export interface V1Metadata {
  name: string;
  description: string;
  tags: string[];
}

// ── Top-level spec ─────────────────────────────────────────────────────────────

export interface TemplateSpec {
  templateId: string;
  version: 'v1';
  category: V1Category;
  goal: V1Goal;
  /** Reference to a theme file name in /v1/themes/ (without .css extension). */
  theme: string;
  sections: V1SectionEntry[];
  assets: V1AssetMap;
  form: V1FormField[];
  metadata: V1Metadata;
}

// ── Validation ─────────────────────────────────────────────────────────────────

const VALID_CATEGORIES: V1Category[] = [
  'leadgen', 'waitlist', 'saas', 'booking', 'product', 'event',
];

const VALID_GOALS: V1Goal[] = [
  'call', 'form', 'signup', 'booking', 'checkout', 'register',
];

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate a TemplateSpec at runtime.
 *
 * Returns { valid: true, errors: [] } when the spec is well-formed.
 * Intentionally kept lightweight — no external validation library needed.
 */
export function validateSpec(spec: unknown): ValidationResult {
  const errors: string[] = [];
  const s = spec as Record<string, unknown>;

  if (!s || typeof s !== 'object') {
    return { valid: false, errors: ['Spec must be a non-null object'] };
  }

  // Required string fields
  if (typeof s.templateId !== 'string' || s.templateId.length === 0) {
    errors.push('templateId must be a non-empty string');
  }
  if (s.version !== 'v1') {
    errors.push('version must be "v1"');
  }
  if (!VALID_CATEGORIES.includes(s.category as V1Category)) {
    errors.push(`category must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }
  if (!VALID_GOALS.includes(s.goal as V1Goal)) {
    errors.push(`goal must be one of: ${VALID_GOALS.join(', ')}`);
  }
  if (typeof s.theme !== 'string' || s.theme.length === 0) {
    errors.push('theme must be a non-empty string');
  }

  // Sections array
  if (!Array.isArray(s.sections) || s.sections.length === 0) {
    errors.push('sections must be a non-empty array');
  } else {
    (s.sections as unknown[]).forEach((sec, i) => {
      const entry = sec as Record<string, unknown>;
      if (typeof entry?.type !== 'string') {
        errors.push(`sections[${i}].type must be a string`);
      }
      if (!entry?.props || typeof entry.props !== 'object') {
        errors.push(`sections[${i}].props must be an object`);
      }
    });
  }

  // Assets — must be an object (can be empty)
  if (!s.assets || typeof s.assets !== 'object' || Array.isArray(s.assets)) {
    errors.push('assets must be an object');
  }

  // Form array
  if (!Array.isArray(s.form)) {
    errors.push('form must be an array');
  } else {
    (s.form as unknown[]).forEach((field, i) => {
      const f = field as Record<string, unknown>;
      if (typeof f?.name !== 'string') errors.push(`form[${i}].name must be a string`);
      if (typeof f?.type !== 'string') errors.push(`form[${i}].type must be a string`);
      if (typeof f?.required !== 'boolean') errors.push(`form[${i}].required must be a boolean`);
    });
  }

  // Metadata
  const meta = s.metadata as Record<string, unknown> | undefined;
  if (!meta || typeof meta !== 'object') {
    errors.push('metadata must be an object');
  } else {
    if (typeof meta.name !== 'string') errors.push('metadata.name must be a string');
    if (typeof meta.description !== 'string') errors.push('metadata.description must be a string');
    if (!Array.isArray(meta.tags)) errors.push('metadata.tags must be an array');
  }

  return { valid: errors.length === 0, errors };
}

