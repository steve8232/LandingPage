import type { FormData } from '@/types';
import { v1EntryToTemplate, v1Templates } from '@/lib/v1Templates';

export type DummyPresetId = 'plumber' | 'lawn' | 'medspa' | 'autodetail';

export interface DummyPreset {
  id: DummyPresetId;
  label: string;
  description: string;
  /** Full form payload (not placeholders) that can be submitted as-is. */
  formData: FormData;
}

function v1TemplateById(templateId: string) {
  const entry = v1Templates.find((t) => t.id === templateId);
  if (!entry) throw new Error(`Unknown v1 templateId for dummy preset: ${templateId}`);
  return v1EntryToTemplate(entry);
}

export function isDummyPresetId(v: unknown): v is DummyPresetId {
  return v === 'plumber' || v === 'lawn' || v === 'medspa' || v === 'autodetail';
}

export const DUMMY_PRESETS: DummyPreset[] = [
  {
    id: 'plumber',
    label: 'Plumber',
    description: 'Residential plumbing with emergency service and flat-rate quotes.',
    formData: {
      selectedTemplate: v1TemplateById('v1-plumber'),
      customizeWithUrl: false,
      design: {
        option: 'description',
        url: 'https://example.com',
        description:
          'High-trust home-services design: confident blue primary, clean type, and a strong above-the-fold quote form.',
        designAnalysis:
          'High-trust home-services design: confident blue primary, clean type, and a strong above-the-fold quote form.',
      },
      business: {
        productService: 'Riverstone Plumbing — residential + light-commercial plumbing',
        offer: 'Free flat-rate quote · Same-day appointments',
        pricing: 'Flat-rate pricing · 2-year warranty on parts and labor',
        cta: 'Get my free quote',
        uniqueValue:
          '24/7 emergency service, up-front flat-rate pricing, and a 2-year warranty on every job — no hourly surprises.',
        customerLove:
          'Customers love the fast response, clean workmanship, and that the price they’re quoted is the price they pay.',
        images: [],
        templateAnswers: {
          hideTestimonials: false,
          hideImages: false,
        },
      },
      contact: {
        email: 'dispatch@riverstoneplumbing.example.com',
        phone: '5550112233',
      },
    },
  },
  {
    id: 'lawn',
    label: 'Lawn & Landscaping',
    description: 'Lawn care and landscaping with weekly routes and clear estimates.',
    formData: {
      selectedTemplate: v1TemplateById('v1-lawn-landscaping'),
      customizeWithUrl: false,
      design: {
        option: 'description',
        url: 'https://example.com',
        description:
          'Clean outdoor-services look: green primary, friendly type, and a no-friction estimate form.',
        designAnalysis:
          'Clean outdoor-services look: green primary, friendly type, and a no-friction estimate form.',
      },
      business: {
        productService: 'Greenleaf Lawn & Landscape — weekly mowing, cleanups, beds & landscape installs',
        offer: 'Free on-site estimate within 24 hours',
        pricing: 'Weekly mowing from $45 · Landscape installs by quote',
        cta: 'Get my free estimate',
        uniqueValue:
          'Reliable weekly routes, two-person crews, and a same-week start on most installs — backed by a satisfaction guarantee.',
        customerLove:
          'Customers love the consistent crew, the tidy finish line, and that we actually show up the day we say we will.',
        images: [],
        templateAnswers: {
          hideTestimonials: false,
          hideImages: false,
        },
      },
      contact: {
        email: 'hello@greenleaflawn.example.com',
        phone: '5550113344',
      },
    },
  },
  {
    id: 'medspa',
    label: 'Med Spa',
    description: 'Medical spa with Botox, fillers, lasers, and free consults.',
    formData: {
      selectedTemplate: v1TemplateById('v1-med-spa'),
      customizeWithUrl: false,
      design: {
        option: 'description',
        url: 'https://example.com',
        description:
          'Warm, premium wellness palette with soft neutrals, elegant type, and an inviting consult-booking form.',
        designAnalysis:
          'Warm, premium wellness palette with soft neutrals, elegant type, and an inviting consult-booking form.',
      },
      business: {
        productService: 'Lumière Aesthetics — Botox, fillers, laser, facials, body contouring',
        offer: 'Free 30-minute consultation',
        pricing: 'Botox from $12/unit · Filler from $650/syringe · Laser packages by plan',
        cta: 'Book my free consult',
        uniqueValue:
          'MD-supervised treatments, board-certified injectors, and honest plans — we tell you the smallest thing that gets the result you want.',
        customerLove:
          'Clients love the natural-looking results, the calm, no-pressure atmosphere, and that the team genuinely listens.',
        images: [],
        templateAnswers: {
          hideTestimonials: false,
          hideImages: false,
        },
      },
      contact: {
        email: 'concierge@lumiereaesthetics.example.com',
        phone: '5550114455',
      },
    },
  },
  {
    id: 'autodetail',
    label: 'Auto Detail',
    description: 'Mobile auto detailing with paint correction and ceramic coatings.',
    formData: {
      selectedTemplate: v1TemplateById('v1-auto-detail'),
      customizeWithUrl: false,
      design: {
        option: 'description',
        url: 'https://example.com',
        description:
          'Bold automotive vibe: high-contrast palette, confident type, and a clear quote-request form.',
        designAnalysis:
          'Bold automotive vibe: high-contrast palette, confident type, and a clear quote-request form.',
      },
      business: {
        productService: 'Apex Mobile Detail — paint correction, ceramic coatings, full interiors',
        offer: 'Free same-day quote · Mobile service to your driveway',
        pricing: 'Maintenance wash from $89 · Correction from $499 · Ceramic from $899',
        cta: 'Request my free quote',
        uniqueValue:
          'Pro-grade products, paint-safe technique, and a visible-difference guarantee — we bring power and water to you.',
        customerLove:
          'Customers love the showroom-clean finish, the meticulous attention to detail, and that the truck shows up on time, every time.',
        images: [],
        templateAnswers: {
          hideTestimonials: false,
          hideImages: false,
        },
      },
      contact: {
        email: 'book@apexmobiledetail.example.com',
        phone: '5550115566',
      },
    },
  },
];

export function getDummyPreset(id: DummyPresetId): DummyPreset {
  const p = DUMMY_PRESETS.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown dummy preset: ${id}`);
  return p;
}

