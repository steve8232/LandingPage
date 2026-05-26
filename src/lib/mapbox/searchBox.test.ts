/**
 * node:test specs for the Mapbox Search Box client.
 *
 *   node --test --experimental-transform-types src/lib/mapbox/searchBox.test.ts
 */

import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  getSuggestions,
  retrieveFeature,
  toDataForSeoLocation,
  newSessionToken,
  MapboxError,
} from './searchBox.ts';

type FetchFn = typeof globalThis.fetch;
const realFetch: FetchFn = globalThis.fetch;
const realToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

function mockFetch(response: { status: number; body: unknown }): {
  calls: Array<{ url: string }>;
} {
  const calls: Array<{ url: string }> = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    calls.push({ url: String(input) });
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      async json() { return response.body; },
    } as Response;
  }) as FetchFn;
  return { calls };
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN = 'pk.test_token';
});
afterEach(() => {
  globalThis.fetch = realFetch;
  if (realToken === undefined) delete process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  else process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN = realToken;
});

// ── newSessionToken ───────────────────────────────────────────────────────

test('newSessionToken: returns RFC4122-shaped UUID', () => {
  const t = newSessionToken();
  assert.match(t, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  // Distinct on repeat call.
  assert.notEqual(newSessionToken(), t);
});

// ── getSuggestions ────────────────────────────────────────────────────────

test('getSuggestions: returns empty array for empty query without hitting network', async () => {
  let called = false;
  globalThis.fetch = (async () => { called = true; return new Response(); }) as FetchFn;
  const out = await getSuggestions('   ', 'session-1');
  assert.deepEqual(out, []);
  assert.equal(called, false);
});

test('getSuggestions: passes query, session_token, country=US, types=address', async () => {
  const { calls } = mockFetch({ status: 200, body: { suggestions: [] } });
  await getSuggestions('1201 S Main', 'sess-abc');
  assert.equal(calls.length, 1);
  const url = new URL(calls[0].url);
  assert.equal(url.pathname, '/search/searchbox/v1/suggest');
  assert.equal(url.searchParams.get('q'), '1201 S Main');
  assert.equal(url.searchParams.get('session_token'), 'sess-abc');
  assert.equal(url.searchParams.get('country'), 'US');
  assert.equal(url.searchParams.get('types'), 'address');
  assert.equal(url.searchParams.get('access_token'), 'pk.test_token');
});

test('getSuggestions: maps response objects, drops entries with no mapbox_id', async () => {
  mockFetch({
    status: 200,
    body: {
      suggestions: [
        { mapbox_id: 'id-1', name: '1201 S Main St', full_address: '1201 S Main St, Ann Arbor, MI 48104, United States', place_formatted: 'Ann Arbor, MI', feature_type: 'address' },
        { name: 'missing id' },
      ],
    },
  });
  const out = await getSuggestions('1201', 'sess-1');
  assert.equal(out.length, 1);
  assert.equal(out[0].mapboxId, 'id-1');
  assert.equal(out[0].fullAddress, '1201 S Main St, Ann Arbor, MI 48104, United States');
});

test('getSuggestions: throws MapboxError when token missing', async () => {
  delete process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  await assert.rejects(() => getSuggestions('x', 's'), (err) => err instanceof MapboxError);
});

test('getSuggestions: throws MapboxError on non-2xx', async () => {
  mockFetch({ status: 401, body: { message: 'Not authorized' } });
  await assert.rejects(() => getSuggestions('x', 's'), (err: unknown) => {
    assert.ok(err instanceof MapboxError);
    assert.equal((err as MapboxError).status, 401);
    return true;
  });
});

// ── retrieveFeature ───────────────────────────────────────────────────────

test('retrieveFeature: extracts streetAddress + city + region + regionCode + coords', async () => {
  mockFetch({
    status: 200,
    body: {
      features: [{
        properties: {
          name: '1201 S Main St',
          address: '1201 S Main St',
          full_address: '1201 S Main St, Ann Arbor, Michigan 48104, United States',
          context: {
            country: { name: 'United States', country_code: 'US' },
            region: { name: 'Michigan', region_code: 'MI' },
            place:  { name: 'Ann Arbor' },
            postcode: { name: '48104' },
          },
          coordinates: { latitude: 42.265837, longitude: -83.748708 },
        },
      }],
    },
  });
  const f = await retrieveFeature('id-1', 'sess-1');
  assert.ok(f);
  assert.equal(f.streetAddress, '1201 S Main St');
  assert.equal(f.city, 'Ann Arbor');
  assert.equal(f.region, 'Michigan');
  assert.equal(f.regionCode, 'MI');
  assert.equal(f.postcode, '48104');
  assert.equal(f.latitude, 42.265837);
});

test('retrieveFeature: returns null when features array is empty', async () => {
  mockFetch({ status: 200, body: { features: [] } });
  const f = await retrieveFeature('id-1', 'sess-1');
  assert.equal(f, null);
});

// ── toDataForSeoLocation ──────────────────────────────────────────────────

test('toDataForSeoLocation: joins city + region + United States, no spaces around commas', () => {
  assert.equal(toDataForSeoLocation({ city: 'Chicago', region: 'Illinois' }), 'Chicago,Illinois,United States');
});

test('toDataForSeoLocation: tolerates missing city or region', () => {
  assert.equal(toDataForSeoLocation({ city: '', region: 'Illinois' }), 'Illinois,United States');
  assert.equal(toDataForSeoLocation({ city: '', region: '' }), 'United States');
});
