/**
 * node:test specs for the DataForSEO client. Mirrors the fetch-mocking
 * pattern from src/lib/vercel/domains.test.ts.
 *
 *   node --test --experimental-transform-types src/lib/dataforseo/client.test.ts
 */

import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  postMyBusinessInfoTask,
  DataForSEOAuthError,
  DataForSEOError,
} from './client.ts';

// ── Fetch mock helper ─────────────────────────────────────────────────────

type FetchFn = typeof globalThis.fetch;
const realFetch: FetchFn = globalThis.fetch;
const realBasicAuth = process.env.DATAFORSEO_BASIC_AUTH;
const realApiBase = process.env.DATAFORSEO_API_BASE;

interface MockResponse {
  status: number;
  body?: unknown;
  bodyText?: string; // for the non-JSON path
}

function mockFetchOnce(response: MockResponse): {
  calls: Array<{ url: string; init?: RequestInit }>;
} {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      async json() {
        if (response.bodyText !== undefined) {
          throw new SyntaxError('not JSON');
        }
        return response.body;
      },
    } as unknown as Response;
  }) as FetchFn;
  return { calls };
}

beforeEach(() => {
  process.env.DATAFORSEO_BASIC_AUTH = 'dGVzdDpwYXNz'; // base64("test:pass")
  process.env.DATAFORSEO_API_BASE = 'https://api.test.local';
});
afterEach(() => {
  globalThis.fetch = realFetch;
  if (realBasicAuth === undefined) delete process.env.DATAFORSEO_BASIC_AUTH;
  else process.env.DATAFORSEO_BASIC_AUTH = realBasicAuth;
  if (realApiBase === undefined) delete process.env.DATAFORSEO_API_BASE;
  else process.env.DATAFORSEO_API_BASE = realApiBase;
});

// ── postMyBusinessInfoTask ────────────────────────────────────────────────

const OK_BODY = {
  status_code: 20000,
  status_message: 'Ok.',
  tasks: [
    {
      id: 'task-abc-123',
      status_code: 20100,
      status_message: 'Task Created.',
      cost: 0.0025,
    },
  ],
};

test('postMyBusinessInfoTask: sends Basic auth header and JSON content-type', async () => {
  const { calls } = mockFetchOnce({ status: 200, body: OK_BODY });
  await postMyBusinessInfoTask({
    keyword: 'plumber chicago',
    postbackUrl: 'https://example.test/webhook',
  });
  assert.equal(calls.length, 1);
  const headers = (calls[0].init?.headers ?? {}) as Record<string, string>;
  assert.equal(headers['Authorization'], 'Basic dGVzdDpwYXNz');
  assert.equal(headers['Content-Type'], 'application/json');
});

test('postMyBusinessInfoTask: respects DATAFORSEO_API_BASE override', async () => {
  const { calls } = mockFetchOnce({ status: 200, body: OK_BODY });
  await postMyBusinessInfoTask({
    keyword: 'plumber',
    postbackUrl: 'https://example.test/webhook',
  });
  assert.equal(
    calls[0].url,
    'https://api.test.local/v3/business_data/google/my_business_info/task_post',
  );
});

test('postMyBusinessInfoTask: body is a single-task array with defaults applied', async () => {
  const { calls } = mockFetchOnce({ status: 200, body: OK_BODY });
  await postMyBusinessInfoTask({
    keyword: 'roofer austin tx',
    postbackUrl: 'https://example.test/webhook',
    tag: 'project-99',
  });
  const sent = JSON.parse(String(calls[0].init?.body)) as Array<Record<string, unknown>>;
  assert.equal(Array.isArray(sent), true);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].keyword, 'roofer austin tx');
  assert.equal(sent[0].location_name, 'United States');
  assert.equal(sent[0].language_code, 'en');
  assert.equal(sent[0].postback_url, 'https://example.test/webhook');
  assert.equal(sent[0].postback_data, 'advanced');
  assert.equal(sent[0].tag, 'project-99');
});

test('postMyBusinessInfoTask: returns taskId and cost on success', async () => {
  mockFetchOnce({ status: 200, body: OK_BODY });
  const out = await postMyBusinessInfoTask({
    keyword: 'plumber',
    postbackUrl: 'https://example.test/webhook',
  });
  assert.equal(out.taskId, 'task-abc-123');
  assert.equal(out.cost, 0.0025);
});

test('postMyBusinessInfoTask: HTTP 401 throws DataForSEOAuthError', async () => {
  mockFetchOnce({
    status: 401,
    body: { status_code: 40100, status_message: 'Authentication failed.', tasks: [] },
  });
  await assert.rejects(
    postMyBusinessInfoTask({ keyword: 'x', postbackUrl: 'https://e.t/w' }),
    (err) => err instanceof DataForSEOAuthError,
  );
});


test('postMyBusinessInfoTask: task-level 4xxxx throws DataForSEOError with code', async () => {
  mockFetchOnce({
    status: 200,
    body: {
      status_code: 20000,
      status_message: 'Ok.',
      tasks: [{ id: 't1', status_code: 40400, status_message: 'Not Found.' }],
    },
  });
  await assert.rejects(
    postMyBusinessInfoTask({ keyword: 'x', postbackUrl: 'https://e.t/w' }),
    (err) => err instanceof DataForSEOError && (err as DataForSEOError).code === 40400,
  );
});

test('postMyBusinessInfoTask: missing env var throws config error', async () => {
  delete process.env.DATAFORSEO_BASIC_AUTH;
  await assert.rejects(
    postMyBusinessInfoTask({ keyword: 'x', postbackUrl: 'https://e.t/w' }),
    /DATAFORSEO_BASIC_AUTH/,
  );
});

test('postMyBusinessInfoTask: non-JSON response throws DataForSEOError', async () => {
  mockFetchOnce({ status: 502, bodyText: '<html>bad gateway</html>' });
  await assert.rejects(
    postMyBusinessInfoTask({ keyword: 'x', postbackUrl: 'https://e.t/w' }),
    (err) => err instanceof DataForSEOError && (err as DataForSEOError).httpStatus === 502,
  );
});
