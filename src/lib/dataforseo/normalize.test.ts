/**
 * node:test specs for the DataForSEO research payload normalizer.
 *
 *   npx tsx --test src/lib/dataforseo/normalize.test.ts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { draftToOverrides, normalizeResearchPayload, type ResearchDraft } from './normalize.ts';

/** Build a ResearchDraft with sensible empty defaults; overrides win. */
function mkDraft(overrides: Partial<ResearchDraft> = {}): ResearchDraft {
  return {
    businessName: '',
    phone: '',
    website: '',
    address: '',
    description: '',
    rating: null,
    reviewCount: null,
    hours: [],
    photos: [],
    category: '',
    categoryIds: [],
    addressCity: '',
    addressRegion: '',
    addressBorough: '',
    addressZip: '',
    placeTopics: [],
    relatedBusinesses: [],
    serviceAreas: [],
    ...overrides,
  };
}

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

// Regression: a real `google_business_info` postback observed in production
// against d4autospa.com. Shapes differ from the docs sample in three ways
// the original normalizer missed:
//   - type discriminator is "google_business_info" (not "my_business_info")
//   - `snippet` duplicates the address; the real blurb is in `description`
//   - hours live under `work_time.work_hours.timetable` and open/close are
//     `{hour,minute}` objects, not "HH:MM" strings.
test('normalize: real google_business_info postback shape', () => {
  const draft = normalizeResearchPayload({
    tasks: [{
      result: [{
        items: [{
          type: 'google_business_info',
          title: 'D4 Mobile auto spa and Detailing',
          phone: '+1614-270-0908',
          url: 'https://d4autospa.com/',
          address: '3737 Easton Market #1244, Columbus, OH 43219',
          snippet: '3737 Easton Market #1244, Columbus, OH 43219',
          description: 'We are committed to exceeding your expectations with quality and affordable detailing services.',
          rating: { value: 4.6, votes_count: 268 },
          work_time: {
            work_hours: {
              timetable: {
                monday: [{ open: { hour: 9, minute: 0 }, close: { hour: 19, minute: 0 } }],
                sunday: [{ open: { hour: 9, minute: 0 }, close: { hour: 17, minute: 0 } }],
              },
            },
          },
        }],
      }],
    }],
  });
  assert.equal(draft.businessName, 'D4 Mobile auto spa and Detailing');
  assert.equal(draft.phone, '+1614-270-0908');
  assert.equal(draft.website, 'https://d4autospa.com/');
  assert.equal(draft.address, '3737 Easton Market #1244, Columbus, OH 43219');
  assert.ok(draft.description.startsWith('We are committed'), 'description must win over snippet');
  assert.equal(draft.rating, 4.6);
  assert.equal(draft.reviewCount, 268);
  assert.deepEqual(draft.hours, [
    'monday: 09:00–19:00',
    'sunday: 09:00–17:00',
  ]);
});

// Regression: extended fields lifted from the Allied Roofing production
// payload — category, structured address, review-derived topics, and
// "people also search" entries. These feed the niche-enrichment pre-pass
// and grounded competitor research downstream.
test('normalize: extracts category, address_info, place_topics, people_also_search', () => {
  const draft = normalizeResearchPayload({
    tasks: [{
      result: [{
        items: [{
          type: 'google_business_info',
          title: 'Allied Roofing Inc',
          category: 'Roofing contractor',
          category_ids: ['roofing_contractor'],
          address_info: {
            zip: '43209',
            city: 'Columbus',
            region: 'Ohio',
            address: '1960 Integrity Dr S',
            borough: 'South Side',
            country_code: 'US',
          },
          place_topics: {
            shingles: 2,
            'leak repair': 2,
            'fair pricing': 3,
            'quick response': 7,
            'timely manner': 4,
          },
          people_also_search: [
            { title: 'Supreme Roofing & Exterior', rating: { value: 4.9, votes_count: 142 } },
            { title: 'Innovative Roofing Systems', rating: { value: 4.9, votes_count: 75 } },
            { title: 'Ace Roofing', rating: { value: 5, votes_count: 13 } },
            { title: 'Nail It Roofing and Contracting', rating: { value: null, votes_count: null } },
            { title: 'Legacy Roofing', rating: { value: 4.6, votes_count: 44 } },
          ],
        }],
      }],
    }],
  });
  assert.equal(draft.category, 'Roofing contractor');
  assert.deepEqual(draft.categoryIds, ['roofing_contractor']);
  assert.equal(draft.addressCity, 'Columbus');
  assert.equal(draft.addressRegion, 'Ohio');
  assert.equal(draft.addressBorough, 'South Side');
  assert.equal(draft.addressZip, '43209');
  // Topics sort by count desc.
  assert.equal(draft.placeTopics[0].topic, 'quick response');
  assert.equal(draft.placeTopics[0].count, 7);
  assert.equal(draft.placeTopics[1].topic, 'timely manner');
  assert.equal(draft.placeTopics.length, 5);
  assert.equal(draft.relatedBusinesses.length, 5);
  assert.equal(draft.relatedBusinesses[0].name, 'Supreme Roofing & Exterior');
  assert.equal(draft.relatedBusinesses[0].rating, 4.9);
  assert.equal(draft.relatedBusinesses[0].reviewCount, 142);
  assert.equal(draft.relatedBusinesses[3].rating, null);
  assert.deepEqual(draft.serviceAreas, []);
});

test('normalize: empty / missing extended fields → empty arrays + blank strings', () => {
  const draft = normalizeResearchPayload({
    tasks: [{ result: [{ items: [{ title: 'X' }] }] }],
  });
  assert.equal(draft.category, '');
  assert.deepEqual(draft.categoryIds, []);
  assert.equal(draft.addressCity, '');
  assert.deepEqual(draft.placeTopics, []);
  assert.deepEqual(draft.relatedBusinesses, []);
  assert.deepEqual(draft.serviceAreas, []);
});

// ── draftToOverrides ───────────────────────────────────────────────────────

test('draftToOverrides: maps populated fields to meta-only overrides', () => {
  const out = draftToOverrides(mkDraft({
    businessName: 'Aqua Pro',
    phone: '312-555-1234',
    website: 'https://x.example',
    description: 'desc',
    rating: 4.8,
    reviewCount: 10,
  }));
  assert.deepEqual(out, {
    meta: {
      businessName: 'Aqua Pro',
      businessPhone: '312-555-1234',
      metaDescription: 'desc',
    },
  });
});

test('draftToOverrides: empty / blank fields → empty object (no meta key)', () => {
  const out = draftToOverrides(mkDraft());
  assert.deepEqual(out, {});
});

test('draftToOverrides: maps address → meta.businessAddress', () => {
  const out = draftToOverrides(mkDraft({ address: '123 Main St, Chicago, IL' }));
  assert.deepEqual(out, { meta: { businessAddress: '123 Main St, Chicago, IL' } });
});

test('draftToOverrides: existing user values are not clobbered', () => {
  const out = draftToOverrides(
    mkDraft({
      businessName: 'DataForSEO Name',
      phone: '3125550199',
      address: 'DataForSEO address',
      description: 'DataForSEO description',
    }),
    {
      businessName: 'User Typed Name',
      businessPhone: '3125550100',
      businessAddress: 'User Typed address',
      metaDescription: 'User typed description',
    },
  );
  // All four were pre-set by the user, so the slice contains no overrides.
  assert.deepEqual(out, {});
});

test('draftToOverrides: existing fills only the blanks', () => {
  const out = draftToOverrides(
    mkDraft({
      businessName: 'DataForSEO Name',
      phone: '3125550199',
      address: 'DataForSEO address',
    }),
    { businessName: 'User Typed Name' }, // phone + address blank → DataForSEO fills
  );
  assert.deepEqual(out, {
    meta: {
      businessPhone: '3125550199',
      businessAddress: 'DataForSEO address',
    },
  });
});
