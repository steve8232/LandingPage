/**
 * v1 Template Adapter
 *
 * Client-safe module that provides v1 template metadata for the template
 * selection UI (Step0).  No server-only imports (no `fs`).
 *
 * Each entry carries just enough info for the gallery grid + category filter.
 * When a v1 template is selected the `toTemplate()` helper creates a minimal
 * legacy `Template`-compatible object so the downstream FormData / API
 * adapter can route it to the v1 composer.
 */

import { Template, TemplateCategory } from './templates';

// ── v1 display category ─────────────────────────────────────────────────────

export type V1DisplayCategory =
  | 'home'
  | 'outdoor'
  | 'wellness'
  | 'auto';

export const v1CategoryLabels: Record<V1DisplayCategory, string> = {
  home: 'Home Services',
  outdoor: 'Outdoor & Yard',
  wellness: 'Wellness & Pets',
  auto: 'Auto',
};

// ── v1 template entry (client-safe) ─────────────────────────────────────────

export interface V1TemplateEntry {
  id: string;
  name: string;
  category: V1DisplayCategory;
  description: string;
  isDark: boolean;
}

export const v1Templates: V1TemplateEntry[] = [
  // ── Home services ───────────────────────────────────────────────────────
  { id: 'v1-plumber',          name: 'Plumber',                category: 'home',     description: 'Lead-gen page for residential plumbers — emergency calls, flat-rate quotes, and 2-year warranty framing.',           isDark: false },
  { id: 'v1-hvac',             name: 'HVAC',                   category: 'home',     description: 'Lead-gen page for heating & cooling pros — same-day service, financing, and tune-up positioning.',                    isDark: false },
  { id: 'v1-electrical',       name: 'Electrician',            category: 'home',     description: 'Lead-gen page for licensed electricians — panels, EV chargers, and code-compliant repairs.',                         isDark: false },
  { id: 'v1-roofing',          name: 'Roofing',                category: 'home',     description: 'Lead-gen page for residential roofers — free inspections, insurance claims, and lifetime workmanship warranty.',      isDark: false },
  { id: 'v1-painters',         name: 'Painters',               category: 'home',     description: 'Lead-gen page for interior & exterior painters — clean prep, fixed pricing, and a quality guarantee.',              isDark: false },
  { id: 'v1-fencing',          name: 'Fencing',                category: 'home',     description: 'Lead-gen page for fencing contractors — wood, vinyl, and metal installs with on-site quotes.',                       isDark: false },
  { id: 'v1-pressure-washing', name: 'Pressure Washing',       category: 'home',     description: 'Lead-gen page for pressure washing pros — soft-wash siding, driveways, and exterior brightening.',                  isDark: false },
  { id: 'v1-window-cleaning',  name: 'Window Cleaning',        category: 'home',     description: 'Lead-gen page for residential window cleaners — streak-free, pure-water systems, and recurring plans.',             isDark: false },
  { id: 'v1-junk-removal',     name: 'Junk Removal',           category: 'home',     description: 'Lead-gen page for full-service junk haulers — same-day pickup, all-in pricing, and donation/recycle.',              isDark: false },
  { id: 'v1-house-cleaning',   name: 'House Cleaning',         category: 'home',     description: 'Lead-gen page for residential cleaning services — vetted teams, recurring plans, and a satisfaction guarantee.',    isDark: false },
  { id: 'v1-carpet-cleaning',  name: 'Carpet Cleaning',        category: 'home',     description: 'Lead-gen page for carpet & upholstery cleaners — hot-water extraction, fast-dry, and pet-safe products.',          isDark: false },

  // ── Outdoor & yard ──────────────────────────────────────────────────────
  { id: 'v1-lawn-landscaping', name: 'Lawn & Landscaping',     category: 'outdoor',  description: 'Lead-gen page for lawn care and landscaping — weekly route reliability and a clear estimate form.',                  isDark: false },
  { id: 'v1-tree-service',     name: 'Tree Service',           category: 'outdoor',  description: 'Lead-gen page for tree care companies — certified arborists, removals, trimming, and emergency response.',          isDark: false },
  { id: 'v1-pool-service',     name: 'Pool Service',           category: 'outdoor',  description: 'Lead-gen page for residential pool service — weekly maintenance, repairs, and seasonal openings/closings.',        isDark: false },

  // ── Wellness & pets ─────────────────────────────────────────────────────
  { id: 'v1-med-spa',          name: 'Med Spa',                category: 'wellness', description: 'Lead-gen page for medical spas — Botox, fillers, laser, and MD-supervised treatments with free consult.',          isDark: false },
  { id: 'v1-personal-trainer', name: 'Personal Trainer',       category: 'wellness', description: 'Lead-gen page for personal trainers and fitness coaches — free intro session and certified-coach framing.',        isDark: false },
  { id: 'v1-dog-grooming',     name: 'Dog Grooming & Training',category: 'wellness', description: 'Lead-gen page for dog grooming & training — fear-free certified, no-kennel boutique, and free meet-and-greet.',    isDark: false },

  // ── Auto ────────────────────────────────────────────────────────────────
  { id: 'v1-auto-detail',      name: 'Auto Detail',            category: 'auto',     description: 'Lead-gen page for mobile and shop-based auto detailing — paint correction, ceramic, and free quote.',              isDark: false },
];

// ── Legacy Template shim ────────────────────────────────────────────────────

/** Map v1 category → closest legacy TemplateCategory for downstream compat. */
const categoryBridge: Record<V1DisplayCategory, TemplateCategory> = {
  home: 'lead-gen',
  outdoor: 'lead-gen',
  wellness: 'lead-gen',
  auto: 'lead-gen',
};

const STUB_DESIGN: Template['design'] = {
  colors:       { primary: '#2563eb', primaryDark: '#1e40af', secondary: '#6366f1', accent: '#10b981', background: '#ffffff', backgroundAlt: '#f8fafc', text: '#1e293b', textMuted: '#64748b' },
  colorUsage:   { heroBackground: '#fff', heroText: '#1e293b', ctaBackground: '#2563eb', ctaText: '#fff', sectionAltBackground: '#f8fafc', sectionAltText: '#1e293b', cardBackground: '#fff', cardText: '#1e293b', headerBackground: '#fff', headerText: '#1e293b', footerBackground: '#1e293b', footerText: '#f8fafc' },
  colorHarmony: { scheme: 'analogous', saturation: 'vibrant', contrast: 'high', dominantColor: '#2563eb', accentUsage: 'bold-pops' },
  typography:   { style: 'modern', headingWeight: '700', fontStack: 'Inter, sans-serif', headingCase: 'normal' },
  layout:       { style: 'modern', borderRadius: 'medium', spacing: 'normal', buttonStyle: 'solid', shadowIntensity: 'subtle' },
  mood: 'Professional and modern',
  isDark: false,
};

const STUB_SECTIONS: Template['sections'] = {
  hero: true, features: true, pricing: false, testimonials: true, gallery: false, contact: true, footer: true,
};

/**
 * Convert a v1 template entry into a minimal legacy `Template` object.
 *
 * The only field the downstream v1 API adapter actually uses is `id`.
 * Everything else is stubbed so TypeScript is satisfied.
 */
export function v1EntryToTemplate(entry: V1TemplateEntry): Template {
  return {
    id: entry.id,
    name: entry.name,
    category: categoryBridge[entry.category],
    description: entry.description,
    previewColors: ['#2563eb', '#1e40af', '#f8fafc', '#10b981'],
    design: { ...STUB_DESIGN, isDark: entry.isDark },
    sections: STUB_SECTIONS,
    industryKeywords: [],
  };
}

