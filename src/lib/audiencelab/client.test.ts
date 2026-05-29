/**
 * Tests for the AudienceLab client. Run with:
 *
 *   AUDIENCELAB_API_KEY=test npx tsx --test src/lib/audiencelab/client.test.ts
 *
 * Uses Node's built-in `node:test` runner and monkey-patches `fetch` so the
 * helpers never make real network calls. Mirrors src/lib/ghl/client.test.ts.
 */

import test, { afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

process.env.AUDIENCELAB_API_KEY = process.env.AUDIENCELAB_API_KEY || 'test-key';

import {
  AudienceLabUpstreamError,
  __setSleepForTests,
  lookupPixelV4,
} from './client.ts';

type FetchFn = typeof globalThis.fetch;
const realFetch: FetchFn = globalThis.fetch;

interface MockResponse { status: number; body?: unknown }

function mockFetchSequence(responses: MockResponse[]): { calls: Array<{ url: string }> } {
  const calls: Array<{ url: string }> = [];
  let i = 0;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    calls.push({ url: String(input) });
    const r = responses[Math.min(i, responses.length - 1)];
    i += 1;
    const bodyText =
      r.body === undefined ? '' :
      typeof r.body === 'string' ? r.body :
      JSON.stringify(r.body);
    return new Response(bodyText, {
      status: r.status,
      headers: { 'content-type': 'application/json' },
    });
  }) as FetchFn;
  return { calls };
}

beforeEach(() => {
  // No-op sleep so the retry path executes in ms, not seconds.
  __setSleepForTests(async () => {});
});

afterEach(() => {
  globalThis.fetch = realFetch;
  __setSleepForTests((ms) => new Promise((r) => setTimeout(r, ms)));
});

test('lookupPixelV4: returns parsed payload on first-try 200', async () => {
  const { calls } = mockFetchSequence([
    { status: 200, body: { total_records: 1, page_size: 100, page: 1, total_pages: 1, events: [{ pixel_id: 'PIX1' }] } },
  ]);
  const data = await lookupPixelV4({ pixelId: 'PIX1', pageSize: 100 });
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /\/pixels\/PIX1\/v4\?page_size=100$/);
  assert.equal(data.total_records, 1);
  assert.equal(data.events.length, 1);
});

test('lookupPixelV4: retries 5xx then succeeds', async () => {
  const { calls } = mockFetchSequence([
    { status: 500, body: { message: 'Internal server error' } },
    { status: 502, body: { message: 'Bad gateway' } },
    { status: 200, body: { total_records: 0, page_size: 100, page: 1, total_pages: 0, events: [] } },
  ]);
  const data = await lookupPixelV4({ pixelId: 'PIX2' });
  assert.equal(calls.length, 3);
  assert.equal(data.total_records, 0);
  assert.deepEqual(data.events, []);
});

test('lookupPixelV4: throws AudienceLabUpstreamError after all 5xx retries exhaust', async () => {
  const { calls } = mockFetchSequence([
    { status: 500, body: { message: 'Internal server error' } },
  ]);
  await assert.rejects(
    () => lookupPixelV4({ pixelId: 'PIX3' }),
    (err: unknown) => {
      assert.ok(err instanceof AudienceLabUpstreamError, 'expected AudienceLabUpstreamError');
      assert.equal((err as AudienceLabUpstreamError).status, 500);
      assert.match((err as Error).message, /upstream 500/);
      assert.match((err as Error).message, /Internal server error/);
      return true;
    },
  );
  assert.equal(calls.length, 3);
});

test('lookupPixelV4: does NOT retry 4xx and throws plain Error', async () => {
  const { calls } = mockFetchSequence([
    { status: 404, body: { message: 'Pixel not found' } },
  ]);
  await assert.rejects(
    () => lookupPixelV4({ pixelId: 'missing' }),
    (err: unknown) => {
      assert.ok(err instanceof Error);
      assert.ok(!(err instanceof AudienceLabUpstreamError));
      assert.match((err as Error).message, /lookupPixelV4 failed: Pixel not found/);
      return true;
    },
  );
  assert.equal(calls.length, 1);
});

test('lookupPixelV4: forwards page and page_size query params', async () => {
  const { calls } = mockFetchSequence([
    { status: 200, body: { total_records: 0, page_size: 50, page: 2, total_pages: 0, events: [] } },
  ]);
  await lookupPixelV4({ pixelId: 'PIX4', page: 2, pageSize: 50 });
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /[?&]page=2(&|$)/);
  assert.match(calls[0].url, /[?&]page_size=50(&|$)/);
});
