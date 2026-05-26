/**
 * Phase 0 smoke test for the v1 AI content generator.
 *
 *   npx tsx --test v1/composer/generateV1Content.test.ts
 *
 * For every registered v1 spec we:
 *   1. Auto-extract the spec's distinctive demo strings (long strings buried
 *      in `sections[*].props` that would identify the spec's stock content).
 *   2. Mock both OpenAI passes (marketing + supporting) and run the generator.
 *   3. Compose the page HTML and assert that none of the extracted demo
 *      strings survive in three scenarios: both passes ok, supporting fail,
 *      both fail.
 *
 * `globalThis.fetch` is stubbed for the duration of each test; the supporting
 * pass is identified by a marker string in the request body.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { generateV1Content, type V1FormInput } from './generateV1Content.ts';
import { composeV1Template } from './composeV1Template.ts';
import type { TemplateSpec } from '../specs/schema.ts';

// ── Demo-string extraction ────────────────────────────────────────────────────

/** Renderer-equivalent escape — matches what every section's escapeHtml does. */
function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Recursively collect every string value living inside an object/array. */
function collectStrings(value: unknown, out: Set<string>): void {
  if (typeof value === 'string') {
    out.add(value);
  } else if (Array.isArray(value)) {
    for (const v of value) collectStrings(v, out);
  } else if (value && typeof value === 'object') {
    for (const v of Object.values(value as Record<string, unknown>)) {
      collectStrings(v, out);
    }
  }
}

/**
 * Renderer fallback strings — defaults emitted by section renderers when a
 * prop is missing or empty. These are intentionally generic, niche-agnostic
 * copy that ships with the renderer; a spec string that's a substring of one
 * of these will appear in the HTML regardless of AI behaviour and must not
 * be flagged as a demo leak.
 *
 * Kept in sync with the `props.X || '...'` defaults in v1/sections/*.ts.
 */
const RENDERER_FALLBACKS: readonly string[] = [
  'Every job, every visit',
  'What is included — no fine print',
  'Every service includes the items below at the price we quote you. No upsells, no surprises.',
  'Why homeowners choose us',
  'Tired of the same old service-business runaround?',
  'No-shows, surprise add-ons, and sloppy work end here. Here is what working with us actually looks like.',
  'Frequently asked questions',
  'Quick answers to the questions homeowners ask us most. Not seeing yours? Just ask in the form below.',
  'Ready to Get Started?',
  'Fill out the form below and we will be in touch.',
  'If anything is not exactly the way you wanted, we come back free of charge until it is. No questions, no fine print.',
  'Get a free estimate today',
  'Tell us what you need — we will reply fast.',
  'Request my estimate',
  'Request your free estimate',
  'No obligation. Quick reply.',
  'Stop guessing. Start getting results today.',
  'Free, no-obligation quote in under 30 minutes.',
  'Get my free quote',
  'Recent jobs in your neighborhood',
  'A few snapshots of the kind of work — and cleanup — you can expect.',
  'Three simple steps from quote to results — no chasing, no surprises.',
  'Proudly serving your neighborhood',
  'Local crews, local routes, local trust. We service these communities and the surrounding areas every week.',
  'What Our Customers Say',
  'Thanks — we got your request',
  'We\u2019ll be in touch shortly.',
];

/** Collect the niche-structural strings that ship in `spec.form` (field
 * labels, placeholders, and select option enums). These are not AI-controlled
 * narrative copy, so they should not count as demo leaks. */
function collectFormStrings(spec: TemplateSpec): Set<string> {
  const out = new Set<string>();
  collectStrings(spec.form, out);
  return out;
}

/**
 * Return the distinctive demo strings a given spec ships with. Filters out
 * generic/short tokens (anchor hrefs, icon names, asset IDs, single words)
 * so the leak check focuses on niche-identifying copy.
 */
function extractDemoStrings(spec: TemplateSpec): string[] {
  const raw = new Set<string>();
  for (const s of spec.sections) collectStrings(s.props, raw);
  const formStrings = collectFormStrings(spec);
  return Array.from(raw).filter((s) => {
    if (s.length < 18) return false;
    if (!/[a-z].* [a-z]/i.test(s)) return false; // skip single tokens
    if (s.startsWith('#') || s.startsWith('http') || s.startsWith('tel:') || s.startsWith('mailto:')) return false;
    if (s.includes('@') && !s.includes(' ')) return false;
    // Niche-structural form enums/labels — render regardless of AI overrides.
    if (formStrings.has(s)) return false;
    return true;
  });
}

const WIZARD: V1FormInput = {
  business: {
    productService: 'Residential plumbing',
    offer: 'Same-day repair quotes',
    pricing: 'Flat-rate, written before work starts',
    cta: 'Get your free quote',
    uniqueValue: 'Family-owned crew that arrives on time',
    customerLove: 'Honest pricing and clean job sites',
    images: [],
    brandName: 'Brightway Plumbing & Drain',
    address: '99 Sample St, Test City',
    hours: 'Mon–Sat 7a–9p',
    serviceAreas: ['North Test', 'South Test', 'East Test'],
    licenseLine: 'License #TST-99999 · Insured',
  },
  contact: {
    email: 'hello@brightway.test',
    phone: '(212) 555-0100',
  },
};

// ── Mocked AI payloads ────────────────────────────────────────────────────────
const MARKETING_OK = {
  heroHeadline: 'Same-day plumbing without the surprises',
  heroSubheadline: 'Flat-rate quotes in writing and a clean job site every visit.',
  heroCta: 'Request a free quote',
  heroTrustBadge: '✓ Family-owned since 2008',
  socialProofHeading: 'Trusted by Test City homeowners',
  socialProofLogos: ['google', 'angi', 'bbb', 'homeadvisor'],
  servicesHeading: 'What we fix',
  servicesSubheading: 'Tell us what is going on and we recommend the best fix.',
  services: Array.from({ length: 6 }, (_, i) => ({
    title: `Service ${i + 1}`,
    description: `Description for service ${i + 1}`,
    benefit: 'Concrete benefit here',
    icon: 'wrench',
  })),
  imagePairHeading: 'On the job',
  imagePairSubheading: 'Snapshots from recent calls.',
  imagePairCaption1: 'Caption A',
  imagePairCaption2: 'Caption B',
  testimonialsHeading: 'What customers say',
  testimonialsSubheading: 'Verified reviews from Test City.',
  testimonials: [
    { quote: 'Brightway showed up on time and quoted exactly what we paid.', name: 'Alex P.', title: 'Test City homeowner', rating: 5 },
    { quote: 'Cleanest install I have ever seen in my house.', name: 'Jamie K.', title: 'Repeat customer', rating: 5 },
    { quote: 'Honest pricing, fast response, will call them again.', name: 'Sam W.', title: 'Verified review', rating: 5 },
  ],
  ctaHeading: 'Ready when you are',
  ctaSubheading: 'Tell us what you need and we lock in a same-day slot.',
  ctaButtonLabel: 'Get my quote',
  ctaUrgency: 'Booking up fast for this week',
  ctaGuarantee: 'Written 2-year warranty on all work',
};

const SUPPORTING_OK = {
  announcementBarText: 'Same-day appointments available',
  announcementBarHours: 'Open today',
  heroEyebrow: 'Licensed & insured',
  heroBullets: ['Bullet one', 'Bullet two', 'Bullet three'],
  heroProofPoints: ['4.9 stars', 'Family-owned', 'On-time guarantee'],
  heroFormHeading: 'Tell us what you need',
  heroFormSubheading: 'Reply within 15 minutes during business hours.',
  trustStripItems: [
    { label: '4.9 stars', detail: 'verified reviews', icon: 'star' },
    { label: 'Licensed', detail: 'and fully insured', icon: 'shield' },
    { label: 'On time', detail: 'or it is free', icon: 'clock' },
    { label: 'Family owned', detail: 'since 2008', icon: 'badge' },
    { label: 'A+ rated', detail: 'with the BBB', icon: 'medal' },
  ],
  differentiatorEyebrow: 'Why neighbors choose us',
  differentiatorHeading: 'No surprises, just clean work',
  differentiatorSubheading: 'Here is what working with our crew actually looks like.',
  differentiatorItems: [
    { title: 'Live phones', description: 'A real person picks up under 90 seconds.' },
    { title: 'Flat pricing', description: 'You see the total before any work starts.' },
    { title: 'Tidy crews', description: 'Drop cloths and shoe covers on every visit.' },
    { title: 'Owner backed', description: 'A 2-year warranty on every job.' },
  ],
  checklistEyebrow: 'Every visit includes',
  checklistHeading: 'What your free quote covers',
  checklistSubheading: 'No fine print, ever.',
  checklistItems: ['Same-day window', 'Flat-rate quote', 'Drop cloths', 'Diagnosis included', 'Cleanup walkthrough', 'Two-year warranty', 'Owner sign-off', 'Up-front parts pricing'],
  midCtaEyebrow: 'Ready when you are',
  midCtaHeadline: 'Your quote is 30 minutes away',
  midCtaSubheadline: 'Tell us what you need and we lock in a same-day slot.',
  midCtaLabel: 'Get my quote',
  midCtaSecondaryText: 'or call us directly',
  galleryHeading: 'Recent jobs nearby',
  gallerySubheading: 'Snapshots from this month.',
  galleryCaptions: ['Caption one', 'Caption two', 'Caption three'],
  processEyebrow: 'How it works',
  processHeading: 'From call to clean in four steps',
  processSubheading: 'No phone tag, no chasing.',
  processSteps: [
    { title: '1. You call', description: 'A real human picks up.' },
    { title: '2. We schedule', description: 'Confirmed in writing.' },
    { title: '3. We diagnose', description: 'Single flat price.' },
    { title: '4. We fix it', description: 'Cleanup included.' },
  ],
  faqEyebrow: 'FAQ',
  faqHeading: 'Questions we hear most',
  faqSubheading: 'Quick answers, no fluff.',
  faqItems: [
    { question: 'How fast can you arrive?', answer: 'Most emergency calls inside two hours.' },
    { question: 'Do you charge for quotes?', answer: 'Standard quotes are always free.' },
    { question: 'Are you licensed?', answer: 'Yes, fully licensed and insured.' },
    { question: 'What if the price changes?', answer: 'It does not. Quotes are flat-rate.' },
    { question: 'Do you guarantee the work?', answer: 'Yes, two years on parts and labor.' },
  ],
  serviceAreasEyebrow: 'Local crews',
  serviceAreasHeading: 'Serving our community',
  serviceAreasSubheading: 'Same-day coverage across the metro.',
  serviceAreasFootnote: 'Not sure? Just ask.',
  guaranteeEyebrow: 'Our promise',
  guaranteeHeadline: 'If we touched it and it breaks, we fix it free',
  guaranteeDescription: 'Two-year written warranty on parts and labor.',
  finalCtaNextSteps: ['Share details', 'We confirm pricing', 'We show up and fix it'],
  finalCtaPrivacyNote: 'We only contact you about your request.',
  footerTagline: 'Family-owned plumbing for Test City and the surrounding metro.',
};


// ── Fetch mock ────────────────────────────────────────────────────────────────
type MockBehavior = {
  marketing: 'ok' | 'fail';
  supporting: 'ok' | 'fail';
};

function installFetchMock(behavior: MockBehavior): () => void {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async (_input: unknown, init?: { body?: string }) => {
    const body = typeof init?.body === 'string' ? init.body : '';
    const isSupportingPass = body.includes('writing supporting page sections');

    if (isSupportingPass) {
      if (behavior.supporting === 'fail') {
        return {
          ok: false,
          json: async () => ({ error: { message: 'mock supporting failure' } }),
        } as unknown as Response;
      }
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(SUPPORTING_OK) } }],
        }),
      } as unknown as Response;
    }

    if (behavior.marketing === 'fail') {
      return {
        ok: false,
        json: async () => ({ error: { message: 'mock marketing failure' } }),
      } as unknown as Response;
    }
    return {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(MARKETING_OK) } }],
      }),
    } as unknown as Response;
  }) as typeof globalThis.fetch;

  return () => {
    globalThis.fetch = originalFetch;
  };
}

// ── Composition helper ────────────────────────────────────────────────────────
async function renderSpecHtml(
  templateId: string,
  behavior: MockBehavior
): Promise<{ html: string; spec: TemplateSpec }> {
  const restore = installFetchMock(behavior);
  try {
    const { getV1Spec } = await import('../specs/index.ts');
    const spec = getV1Spec(templateId);
    assert.ok(spec, `${templateId} spec should load`);

    const overrides = await generateV1Content(WIZARD, spec!);
    const { html } = composeV1Template(templateId, overrides, { allowRemoteDemoImages: true });
    return { html, spec: spec! };
  } finally {
    restore();
  }
}

/**
 * Strings the mock AI / wizard legitimately emit. We subtract these from each
 * spec's candidate demo strings before checking the HTML so a string the mock
 * happens to share with a spec doesn't get flagged as a leak.
 */
const MOCK_AND_WIZARD_STRINGS: Set<string> = (() => {
  const out = new Set<string>();
  collectStrings(WIZARD, out);
  collectStrings(MARKETING_OK, out);
  collectStrings(SUPPORTING_OK, out);
  return out;
})();

/** Pre-built list of mock/wizard/fallback strings used for substring filtering. */
const NON_SPEC_STRING_SOURCES: readonly string[] = (() => {
  const out: string[] = [];
  for (const s of MOCK_AND_WIZARD_STRINGS) out.push(s);
  for (const s of RENDERER_FALLBACKS) out.push(s);
  return out;
})();

function assertNoDemoLeaks(html: string, spec: TemplateSpec, scenario: string): void {
  const candidates = extractDemoStrings(spec).filter((s) => {
    // Drop candidates that are subsumed by any string the renderer or mock
    // legitimately emits. Two-way check: either source contains candidate
    // (e.g. fallback "Local crews, local routes, local trust…" contains the
    // spec eyebrow "Local crews, local routes"), or candidate contains the
    // mock string entirely (covers the inverse direction defensively).
    for (const src of NON_SPEC_STRING_SOURCES) {
      if (src === s) return false;
      if (src.includes(s)) return false;
    }
    return true;
  });
  const leaks = candidates.filter((s) => html.includes(s) || html.includes(escapeHtml(s)));
  assert.deepEqual(
    leaks,
    [],
    `[${spec.templateId} · ${scenario}] expected zero demo-string leaks, found ${leaks.length}: ` +
      JSON.stringify(leaks.slice(0, 5))
  );
}

// ── Test cases ────────────────────────────────────────────────────────────────

const ALL_TEMPLATE_IDS: string[] = (() => {
  // Imported synchronously via require-equivalent: pull the registry once at
  // module-load time so the test discovery output lists each spec explicitly.
  // The async import inside renderSpecHtml is what the test bodies actually
  // use; this is just for enumeration.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getAllV1TemplateIds } = require('../specs/index.ts') as {
    getAllV1TemplateIds: () => string[];
  };
  return getAllV1TemplateIds();
})();

for (const templateId of ALL_TEMPLATE_IDS) {
  test(`spec ${templateId} — no demo strings leak across failure modes`, async (t) => {
    await t.test('both AI passes succeed', async () => {
      const { html, spec } = await renderSpecHtml(templateId, { marketing: 'ok', supporting: 'ok' });
      assertNoDemoLeaks(html, spec, 'both ok');
      // Wizard-grounded facts must always reach the page.
      assert.ok(html.includes('Brightway Plumbing &amp; Drain'), 'wizard brand name escaped');
      assert.ok(html.includes('(212) 555-0100'), 'wizard phone formatted');
    });

    await t.test('supporting pass fails — marketing succeeds', async () => {
      const { html, spec } = await renderSpecHtml(templateId, { marketing: 'ok', supporting: 'fail' });
      assertNoDemoLeaks(html, spec, 'supporting fail');
      assert.ok(html.includes('Brightway Plumbing &amp; Drain'), 'wizard brand name still rendered');
    });

    await t.test('both passes fail — wizard fallback only', async () => {
      const { html, spec } = await renderSpecHtml(templateId, { marketing: 'fail', supporting: 'fail' });
      assertNoDemoLeaks(html, spec, 'both fail');
      assert.ok(html.includes('Brightway Plumbing &amp; Drain'), 'wizard brand name still rendered');
      assert.ok(html.includes('Get your free quote'), 'wizard CTA label');
    });
  });
}
