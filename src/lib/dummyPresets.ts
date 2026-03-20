import type { FormData } from '@/types';
import { v1EntryToTemplate, v1Templates } from '@/lib/v1Templates';

export type DummyPresetId = 'saas' | 'agency' | 'ecommerce' | 'creator';

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
  return v === 'saas' || v === 'agency' || v === 'ecommerce' || v === 'creator';
}

export const DUMMY_PRESETS: DummyPreset[] = [
  {
    id: 'saas',
    label: 'SaaS',
    description: 'B2B SaaS with free trial and a product-led CTA.',
    formData: {
      selectedTemplate: v1TemplateById('v1-saas-modern-light'),
      customizeWithUrl: false,
      design: {
        option: 'description',
        url: 'https://example.com',
        description:
          'Clean, modern SaaS design. Lots of whitespace, subtle gradients, crisp typography, and a confident blue primary CTA.',
        designAnalysis:
          'Clean, modern SaaS design with whitespace, subtle gradients, crisp typography, and a confident blue primary CTA.',
      },
      business: {
        productService: 'FluxMetrics — analytics that teams actually use',
        offer: '14-day free trial (no credit card)',
        pricing: 'From $29/mo (Starter) · $99/mo (Team)',
        cta: 'Start free trial',
        uniqueValue:
          'Set up in 10 minutes, track your full funnel, and get weekly insights your team will act on — without a data warehouse.',
        customerLove:
          'They love the fast setup, clear dashboards, and the weekly “what to do next” insights that save hours of analysis.',
        images: [],
        templateAnswers: {
          hideTestimonials: false,
          hideImages: false,
        },
      },
      contact: {
        email: 'hello@fluxmetrics.example.com',
        phone: '5550101234',
      },
    },
  },
  {
    id: 'agency',
    label: 'Agency / Consulting',
    description: 'Lead-gen consulting page with an audit offer.',
    formData: {
      selectedTemplate: v1TemplateById('v1-professional-consulting'),
      customizeWithUrl: false,
      design: {
        option: 'description',
        url: 'https://example.com',
        description:
          'Professional consulting look: neutral palette, strong contrast headings, trust-forward layout, and a single primary CTA.',
        designAnalysis:
          'Professional consulting look: neutral palette, trust-forward layout, and a single primary CTA.',
      },
      business: {
        productService: 'Northwind Growth Studio (B2B pipeline + positioning)',
        offer: 'Free 30-minute growth audit',
        pricing: 'Engagements from $2,500/mo',
        cta: 'Book your audit',
        uniqueValue:
          'We combine positioning, landing pages, and paid search to turn “maybe later” traffic into qualified pipeline — with weekly deliverables.',
        customerLove:
          'Clients mention clearer messaging, faster lead response, and a noticeable lift in booked calls within the first month.',
        images: [],
        templateAnswers: {
          hideTestimonials: false,
          hideImages: true,
        },
      },
      contact: {
        email: 'audit@northwind.example.com',
        phone: '5550102345',
      },
    },
  },
  {
    id: 'ecommerce',
    label: 'E-commerce',
    description: 'Product-focused page with a direct purchase CTA.',
    formData: {
      selectedTemplate: v1TemplateById('v1-ecommerce-clean-warm'),
      customizeWithUrl: false,
      design: {
        option: 'description',
        url: 'https://example.com',
        description:
          'Warm, minimal e-commerce design with lifestyle imagery, bold product value props, and a high-contrast “Shop” CTA.',
        designAnalysis:
          'Warm, minimal e-commerce design with lifestyle imagery, bold value props, and a high-contrast “Shop” CTA.',
      },
      business: {
        productService: 'Cedar & Saffron — small-batch candles + room mists',
        offer: 'Limited-time launch bundle (save 20%)',
        pricing: '$39 each · Bundles from $99',
        cta: 'Shop the collection',
        uniqueValue:
          'Clean ingredients, long burn time, and scents designed to feel like a place — not a perfume counter.',
        customerLove:
          'Customers say the scents are strong but never overpowering, shipping is fast, and the packaging feels gift-ready.',
        images: [],
        templateAnswers: {
          hideTestimonials: false,
          hideImages: false,
        },
      },
      contact: {
        email: 'support@cedarandsaffron.example.com',
        phone: '5550103456',
      },
    },
  },
  {
    id: 'creator',
    label: 'Creator / Waitlist',
    description: 'Coming-soon waitlist for a digital product.',
    formData: {
      selectedTemplate: v1TemplateById('v1-coming-soon-vibrant-light'),
      customizeWithUrl: false,
      design: {
        option: 'description',
        url: 'https://example.com',
        description:
          'Playful, vibrant creator vibe with gradients, friendly typography, and an optimistic early-access waitlist CTA.',
        designAnalysis:
          'Playful, vibrant creator vibe with gradients, friendly typography, and an optimistic early-access waitlist CTA.',
      },
      business: {
        productService: 'The Notion Sprint Kit — templates + prompts for shipping weekly',
        offer: 'Early access + bonus template pack',
        pricing: 'Free for early members (paid later)',
        cta: 'Join the waitlist',
        uniqueValue:
          'A lightweight system to plan, ship, and review every week — built for creators who want momentum without burnout.',
        customerLove:
          'People love the simplicity: fewer tools, clearer priorities, and a weekly ritual that actually gets shipped work out the door.',
        images: [],
        templateAnswers: {
          hideTestimonials: true,
          hideImages: true,
        },
      },
      contact: {
        email: 'earlyaccess@notionsprint.example.com',
        phone: '5550104567',
      },
    },
  },
];

export function getDummyPreset(id: DummyPresetId): DummyPreset {
  const p = DUMMY_PRESETS.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown dummy preset: ${id}`);
  return p;
}

