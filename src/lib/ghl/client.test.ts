/**
 * Tests for the GHL client. Run with:
 *
 *   GHL_AGENCY_PIT=test GHL_COMPANY_ID=test npx tsx --test src/lib/ghl/client.test.ts
 *
 * Uses Node's built-in `node:test` runner and monkey-patches `fetch` so the
 * helpers never make real network calls. Mirrors src/lib/vercel/domains.test.ts.
 */

import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';

process.env.GHL_AGENCY_PIT = process.env.GHL_AGENCY_PIT || 'test-pit';
process.env.GHL_COMPANY_ID = process.env.GHL_COMPANY_ID || 'test-company';

import { inviteLocationAdmin } from './client.ts';

type FetchFn = typeof globalThis.fetch;
const realFetch: FetchFn = globalThis.fetch;

interface MockResponse { status: number; body?: unknown }

function mockFetchOnce(response: MockResponse): { calls: Array<{ url: string; init?: RequestInit }> } {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    const bodyText =
      response.body === undefined ? '' :
      typeof response.body === 'string' ? response.body :
      JSON.stringify(response.body);
    return new Response(bodyText, {
      status: response.status,
      headers: { 'content-type': 'application/json' },
    });
  }) as FetchFn;
  return { calls };
}

function readJsonBody(init?: RequestInit): Record<string, unknown> {
  if (!init?.body) return {};
  return JSON.parse(String(init.body));
}

afterEach(() => { globalThis.fetch = realFetch; });

test('inviteLocationAdmin: forwards password when supplied', async () => {
  const { calls } = mockFetchOnce({ status: 200, body: { id: 'usr_abc' } });
  const res = await inviteLocationAdmin({
    locationId: 'loc_1',
    email: 'owner@example.com',
    firstName: 'Owner',
    lastName: 'User',
    password: 'S3cret!pass',
  });
  assert.equal(res.id, 'usr_abc');
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /\/users\/$/);
  const body = readJsonBody(calls[0].init);
  assert.equal(body.password, 'S3cret!pass');
  assert.equal(body.email, 'owner@example.com');
  assert.equal(body.role, 'admin');
  assert.equal(body.type, 'account');
  assert.deepEqual(body.locationIds, ['loc_1']);
});

test('inviteLocationAdmin: omits password when not supplied', async () => {
  const { calls } = mockFetchOnce({ status: 200, body: { id: 'usr_xyz' } });
  await inviteLocationAdmin({
    locationId: 'loc_2',
    email: 'invitee@example.com',
    firstName: 'In',
    lastName: 'Vitee',
  });
  const body = readJsonBody(calls[0].init);
  assert.equal('password' in body, false);
});

test('inviteLocationAdmin: omits empty-string password', async () => {
  const { calls } = mockFetchOnce({ status: 200, body: { id: 'usr_q' } });
  await inviteLocationAdmin({
    locationId: 'loc_3',
    email: 'a@b.com',
    firstName: 'A',
    lastName: 'B',
    password: '',
  });
  const body = readJsonBody(calls[0].init);
  assert.equal('password' in body, false);
});

test('inviteLocationAdmin: extracts id from nested { user: { id } } response', async () => {
  mockFetchOnce({ status: 200, body: { user: { id: 'usr_nested' } } });
  const res = await inviteLocationAdmin({
    locationId: 'loc_4',
    email: 'a@b.com',
    firstName: 'A',
    lastName: 'B',
  });
  assert.equal(res.id, 'usr_nested');
});

test('inviteLocationAdmin: throws on non-OK response', async () => {
  mockFetchOnce({ status: 422, body: { message: 'password too weak' } });
  await assert.rejects(
    () => inviteLocationAdmin({
      locationId: 'loc_5',
      email: 'a@b.com',
      firstName: 'A',
      lastName: 'B',
      password: 'weak',
    }),
    (err) => err instanceof Error && /inviteLocationAdmin failed/.test(err.message),
  );
});

test('inviteLocationAdmin: throws when response has no user id', async () => {
  mockFetchOnce({ status: 200, body: { ok: true } });
  await assert.rejects(
    () => inviteLocationAdmin({
      locationId: 'loc_6',
      email: 'a@b.com',
      firstName: 'A',
      lastName: 'B',
    }),
    (err) => err instanceof Error && /missing user id/.test(err.message),
  );
});

test('inviteLocationAdmin: sends Bearer token + Version header', async () => {
  const { calls } = mockFetchOnce({ status: 200, body: { id: 'usr_h' } });
  await inviteLocationAdmin({
    locationId: 'loc_7',
    email: 'a@b.com',
    firstName: 'A',
    lastName: 'B',
  });
  const headers = (calls[0].init?.headers ?? {}) as Record<string, string>;
  assert.equal(headers.Authorization, `Bearer ${process.env.GHL_AGENCY_PIT}`);
  assert.ok(headers.Version, 'expected Version header to be present');
});
