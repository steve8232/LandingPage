// Minimal regression verification for the v1 adapter in
// src/app/api/generate-landing-page/route.ts
//
// Usage (from landing-page-designer/):
//   npx next build
//   node scripts/verify-v1-adapter.mjs

function fail(msg) {
  console.error(`\n[verify-v1-adapter] FAIL: ${msg}`);
  process.exitCode = 1;
}

function ok(msg) {
  console.log(`[verify-v1-adapter] OK: ${msg}`);
}

function assert(cond, msg) {
  if (!cond) fail(msg);
}

// Prevent any accidental network calls during verification.
globalThis.fetch = async () => {
  throw new Error('fetch disabled in verify-v1-adapter');
};

const templateId = 'v1-plumber';

const formData = {
  selectedTemplate: { id: templateId, name: templateId },
  customizeWithUrl: false,
  design: { option: 'description', description: 'test', designAnalysis: '' },
  business: {
    productService: 'Riverstone Plumbing',
    offer: 'Free flat-rate quote',
    pricing: 'Flat-rate pricing',
    cta: 'Get my free quote',
    uniqueValue: '24/7 emergency service with up-front pricing.',
    customerLove: 'Fast response and clean workmanship.',
    images: [],
    // Ensure the v1 adapter accepts template-specific answers (used by the
    // generator UI for toggles like hiding testimonial/image sections).
    templateAnswers: {
      hideTestimonials: false,
      hideImages: false,
    },
  },
  contact: { email: 'test@example.com', phone: '555-555-5555' },
};

// Import the BUILT route module to avoid TS path alias issues.
// This script is intended to run after `next build`.
//
// In Next App Router builds, the module is a wrapper; the actual handlers live
// under `default.routeModule.methods`.
const mod = await import(`../.next/server/app/api/generate-landing-page/route.js`);
const routeModule = mod?.default?.routeModule;
const POST = routeModule?.methods?.POST;

assert(typeof POST === 'function', 'POST handler not found at default.routeModule.methods.POST');

const req = new Request('http://localhost/api/generate-landing-page', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(formData),
});

const res = await POST(req);
assert(res && typeof res.json === 'function', 'POST did not return a Response-like object');

const data = await res.json();
assert(typeof data?.html === 'string', 'Response JSON missing `html` string');
assert(typeof data?.preview === 'string', 'Response JSON missing `preview` string');
assert(typeof data?.css === 'string', 'Response JSON missing `css` string');

// Stage B support: the v1 adapter should return enough metadata to enable
// a v1-safe editor to round-trip structured overrides.
assert(typeof data?.v1 === 'object' && data.v1 !== null, 'Response JSON missing `v1` metadata object');
assert(data.v1.templateId === templateId, 'Expected data.v1.templateId to match requested templateId');
assert(
  data.v1.overrides === undefined || (typeof data.v1.overrides === 'object' && data.v1.overrides !== null),
  'Expected data.v1.overrides to be an object or undefined'
);

// v1 adapter contract
assert(data.css === '', 'Expected v1 adapter to return empty `css` (CSS should be inlined in HTML)');
assert(data.preview === data.html, 'Expected v1 adapter `preview` to equal `html`');

// v1 composer markers (stable identifiers)
const hasV1Markers =
  /\bclass=["']v1-page["']/.test(data.html) ||
  /\/\*\s*===\s*v1 tokens\s*===\s*\*\//.test(data.html);
assert(hasV1Markers, 'Expected v1 HTML markers (v1-page class or v1 tokens comment)');

	// v1 click-to-edit contract: v1-rendered images must include stable assetKey
	// attributes so the client can map DOM clicks back to overrides.assets keys.
	assert(
	  /data-v1-asset-key=["']heroImageId["']/.test(data.html),
	  'Expected v1 hero image to include data-v1-asset-key="heroImageId"'
	);
	assert(
	  /data-v1-asset-key=["']supportImage1["']/.test(data.html),
	  'Expected v1 support image to include data-v1-asset-key="supportImage1"'
	);
	assert(
	  /data-v1-asset-key=["']supportImage2["']/.test(data.html),
	  'Expected v1 support image to include data-v1-asset-key="supportImage2"'
	);

ok('v1 adapter returned v1 HTML + v1 metadata with expected markers and response shape');

