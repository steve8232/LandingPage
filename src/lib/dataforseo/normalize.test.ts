/**
 * node:test specs for the DataForSEO research payload normalizer.
 *
 *   npx tsx --test src/lib/dataforseo/normalize.test.ts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { draftToOverrides, normalizeResearchPayload } from './normalize.ts';

// A representative-but-trimmed DataForSEO "my_business_info" response, modelled
// on the docs' example envelope (https://docs.dataforseo.com/.../task_get/).
const fullPayload = {
  tasks: [
    {
      id: 'task-1',
      result: [
        {
          items: [
            {
              type: 'my_business_info',
              title: 'Aqua Pro Plumbing',
              phone: '+1 312-555-1234',
              url: 'https://aquaproplumbing.example',
              address: '123 W Madison St, Chicago, IL 60602',
              snippet: 'Family-owned plumber serving the Chicagoland area for 25+ years.',
              rating: { value: 4.8, votes_count: 312 },
              work_hours: {
                timetable: {
                  monday: [{ open: '08:00', close: '17:00' }],
                  tuesday: [{ open: '08:00', close: '17:00' }],
                  saturday: [],
                },
              },
              photos: [
                { url: 'https://lh3.googleusercontent.com/p/aaa' },
                { url: 'https://lh3.googleusercontent.com/p/bbb' },
              ],
            },
          ],
        },
      ],
    },
  ],
};

test('normalize: pulls all top-level fields out of a full response', () => {
  const draft = normalizeResearchPayload(fullPayload);
  assert.equal(draft.businessName, 'Aqua Pro Plumbing');
  assert.equal(draft.phone, '+1 312-555-1234');
  assert.equal(draft.website, 'https://aquaproplumbing.example');
  assert.equal(draft.address, '123 W Madison St, Chicago, IL 60602');
  assert.ok(draft.description.startsWith('Family-owned plumber'));
  assert.equal(draft.rating, 4.8);
  assert.equal(draft.reviewCount, 312);
  assert.equal(draft.photos.length, 2);
});

test('normalize: flattens timetable into "day: open–close" strings', () => {
  const draft = normalizeResearchPayload(fullPayload);
  assert.deepEqual(draft.hours, [
    'monday: 08:00–17:00',
    'tuesday: 08:00–17:00',
  ]);
});

test('normalize: handles nested rating object and reviews_count fallback', () => {
  const draft = normalizeResearchPayload({
    tasks: [{ result: [{ items: [{ title: 'X', reviews_count: 42 }] }] }],
  });
  assert.equal(draft.reviewCount, 42);
  assert.equal(draft.rating, null);
});

test('normalize: falls back to name / description / website / domain', () => {
  const draft = normalizeResearchPayload({
    tasks: [{
      result: [{
        items: [{
          name: 'Fallback Plumber',
          description: 'desc here',
          domain: 'fallback.example',
        }],
      }],
    }],
  });
  assert.equal(draft.businessName, 'Fallback Plumber');
  assert.equal(draft.description, 'desc here');
  assert.equal(draft.website, 'fallback.example');
});

test('normalize: missing items / non-array result → empty draft', () => {
  const empty = normalizeResearchPayload({ tasks: [{ result: null }] });
  assert.equal(empty.businessName, '');
  assert.equal(empty.phone, '');
  assert.equal(empty.rating, null);
  assert.deepEqual(empty.hours, []);
  assert.deepEqual(empty.photos, []);
});

test('normalize: null / non-object payloads → empty draft (no throw)', () => {
  assert.equal(normalizeResearchPayload(null).businessName, '');
  assert.equal(normalizeResearchPayload(undefined).businessName, '');
  assert.equal(normalizeResearchPayload('not an object').businessName, '');
  assert.equal(normalizeResearchPayload(42).businessName, '');
});

test('normalize: accepts `result` as a single object (legacy sandbox shape)', () => {
  const draft = normalizeResearchPayload({
    tasks: [{ result: { items: [{ title: 'Legacy Co' }] } }],
  });
  assert.equal(draft.businessName, 'Legacy Co');
});

// ── draftToOverrides ───────────────────────────────────────────────────────

test('draftToOverrides: maps populated fields to meta-only overrides', () => {
  const out = draftToOverrides({
    businessName: 'Aqua Pro',
    phone: '312-555-1234',
    website: 'https://x.example',
    address: '',
    description: 'desc',
    rating: 4.8,
    reviewCount: 10,
    hours: [],
    photos: [],
  });
  assert.deepEqual(out, {
    meta: {
      businessName: 'Aqua Pro',
      businessPhone: '312-555-1234',
      metaDescription: 'desc',
    },
  });
});

test('draftToOverrides: empty / blank fields → empty object (no meta key)', () => {
  const out = draftToOverrides({
    businessName: '',
    phone: '',
    website: '',
    address: '',
    description: '',
    rating: null,
    reviewCount: null,
    hours: [],
    photos: [],
  });
  assert.deepEqual(out, {});
});
