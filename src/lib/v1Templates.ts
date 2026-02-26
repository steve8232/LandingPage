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
  | 'saas'
  | 'product'
  | 'leadgen'
  | 'waitlist'
  | 'event';

export const v1CategoryLabels: Record<V1DisplayCategory, string> = {
  saas: 'SaaS',
  product: 'E-commerce',
  leadgen: 'Lead Gen',
  waitlist: 'Coming Soon',
  event: 'Events',
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
  { id: 'v1-saas-modern-light',          name: 'SaaS Modern (Light)',              category: 'saas',     description: 'Clean, modern SaaS layout with blue tones and lightweight social proof.',                          isDark: false },
  { id: 'v1-saas-dark-purple',           name: 'SaaS Dark Mode (Purple)',          category: 'saas',     description: 'Dark mode SaaS landing page with purple accents and premium styling.',                             isDark: true  },
  { id: 'v1-ecommerce-clean-warm',       name: 'E-commerce Clean (Warm)',          category: 'product',  description: 'Minimal e-commerce layout with warm accents and a direct purchase CTA.',                           isDark: false },
  { id: 'v1-ecommerce-bold-red',         name: 'E-commerce Bold (Red)',            category: 'product',  description: 'High-contrast e-commerce template with bold red CTAs optimized for fast conversion.',               isDark: false },
  { id: 'v1-leadgen-local-01',           name: 'Local Pro Lead Gen',              category: 'leadgen',  description: 'A high-trust lead generation template for local service businesses.',                               isDark: false },
  { id: 'v1-local-services-trust',       name: 'Local Services Trust (Light)',     category: 'leadgen',  description: 'Trust-forward local services template for contractors, plumbers, electricians, and repair pros.',    isDark: false },
  { id: 'v1-eco-friendly-services',      name: 'Eco-Friendly Services (Light)',    category: 'leadgen',  description: 'Green, sustainability-forward services template for cleaning, landscaping, and eco providers.',      isDark: false },
  { id: 'v1-professional-consulting',    name: 'Professional Consulting (Light)',  category: 'leadgen',  description: 'Professional consulting template for consultants, coaches, and advisors focused on lead capture.',   isDark: false },
  { id: 'v1-law-finance',               name: 'Law & Finance (Light)',            category: 'leadgen',  description: 'Authoritative law/finance template with strong trust cues and a straightforward consultation form.', isDark: false },
  { id: 'v1-ebook-download',            name: 'Ebook Download (Lead Gen, Light)', category: 'leadgen',  description: 'Lead magnet template for ebook/resource downloads with clean content blocks and email capture.',     isDark: false },
  { id: 'v1-webinar-signup',            name: 'Webinar Signup (Lead Gen, Light)', category: 'event',    description: 'Event registration template for webinars and live sessions with a clean lead-gen style.',            isDark: false },
  { id: 'v1-coming-soon-minimal-dark',  name: 'Coming Soon Minimal (Dark)',       category: 'waitlist', description: 'Minimal dark coming-soon template with waitlist signup and demo imagery.',                           isDark: true  },
  { id: 'v1-coming-soon-vibrant-light', name: 'Coming Soon Vibrant (Light)',      category: 'waitlist', description: 'Bright, gradient-forward coming soon template with a lightweight waitlist signup.',                  isDark: false },
];

// ── Legacy Template shim ────────────────────────────────────────────────────

/** Map v1 category → closest legacy TemplateCategory for downstream compat. */
const categoryBridge: Record<V1DisplayCategory, TemplateCategory> = {
  saas: 'saas',
  product: 'ecommerce',
  leadgen: 'lead-gen',
  waitlist: 'coming-soon',
  event: 'lead-gen',
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

