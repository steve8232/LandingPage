/**
 * Tests for the Vercel domain helpers. Run with:
 *
 *   VERCEL_TOKEN=test npx tsx --test src/lib/vercel/domains.test.ts
 *
 * Uses Node's built-in `node:test` runner so it doesn't pull in a test
 * framework. `fetch` is monkey-patched per test so the helpers don't make
 * real network calls.
 */

import test, { afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Force the env read inside readEnv() to succeed when the module loads.
process.env.VERCEL_TOKEN = process.env.VERCEL_TOKEN || 'test-token';
delete process.env.VERCEL_TEAM_ID;

import {
  addProjectDomain,
  getDomainConfig,
  getDomainVerification,
  verifyProjectDomain,
  DomainClaimedError,
  ProjectNotProvisionedError,
} from './domains.ts';

type FetchFn = typeof globalThis.fetch;
const realFetch: FetchFn = globalThis.fetch;

interface MockResponse { status: number; body?: unknown }

function mockFetchOnce(response: MockResponse): { calls: Array<{ url: string; init?: RequestInit }> } {
  return mockFetchSequence([response]);
}

/**
 * Mock fetch with a fixed sequence of responses. The Nth fetch call returns
 * `responses[N]`; calls beyond the sequence throw. Use this for code paths
 * that issue multiple Vercel calls (e.g. releaseOrphan: detach + retry attach).
 */
function mockFetchSequence(
  responses: MockResponse[],
): { calls: Array<{ url: string; init?: RequestInit }> } {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  let i = 0;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    const response = responses[i++];
    if (!response) {
      throw new Error(`mockFetchSequence: unexpected fetch call #${i} to ${String(input)}`);
    }
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

beforeEach(() => { /* fresh fetch installed inside each test */ });
afterEach(() => { globalThis.fetch = realFetch; });

test('addProjectDomain: 200 OK resolves silently', async () => {
  const { calls } = mockFetchOnce({ status: 200, body: { name: 'foo.example' } });
  await assert.doesNotReject(addProjectDomain('sparkpage-aaaa1111', 'foo.example'));
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /\/v10\/projects\/sparkpage-aaaa1111\/domains/);
  assert.equal(calls[0].init?.method, 'POST');
});

test('addProjectDomain: 409 already attached to same project is soft', async () => {
  mockFetchOnce({
    status: 409,
    body: { error: { code: 'domain_already_in_use', message: 'already attached to this project' } },
  });
  await assert.doesNotReject(addProjectDomain('sparkpage-aaaa1111', 'foo.example'));
});

test('addProjectDomain: 409 owned by another sparkpage project throws DomainClaimedError(same_team)', async () => {
  mockFetchOnce({
    status: 409,
    body: { error: { code: 'domain_already_in_use', message: 'in use by project sparkpage-bbbb2222' } },
  });
  await assert.rejects(
    () => addProjectDomain('sparkpage-aaaa1111', 'foo.example'),
    (err) => {
      assert.ok(err instanceof DomainClaimedError, 'expected DomainClaimedError');
      assert.equal((err as DomainClaimedError).scope, 'same_team');
      assert.equal((err as DomainClaimedError).conflictingProjectName, 'sparkpage-bbbb2222');
      assert.equal((err as DomainClaimedError).errorCode, 'domain_claimed_same_team');
      return true;
    },
  );
});

test('addProjectDomain: 409 conflict with non-sparkpage project throws DomainClaimedError(same_team)', async () => {
  // Even with releaseOrphan: true, we refuse to detach non-sparkpage projects.
  mockFetchOnce({
    status: 409,
    body: { error: { code: 'domain_already_in_use', message: 'in use by project my-other-app' } },
  });
  await assert.rejects(
    () => addProjectDomain('sparkpage-aaaa1111', 'foo.example', { releaseOrphan: true }),
    (err) => {
      assert.ok(err instanceof DomainClaimedError);
      assert.equal((err as DomainClaimedError).scope, 'same_team');
      assert.equal((err as DomainClaimedError).conflictingProjectName, 'my-other-app');
      return true;
    },
  );
});

test('addProjectDomain: 409 with releaseOrphan detaches sparkpage orphan and retries', async () => {
  const { calls } = mockFetchSequence([
    // 1) attach attempt: 409 conflict with sparkpage orphan
    { status: 409, body: { error: { code: 'domain_already_in_use', message: 'in use by project sparkpage-bbbb2222' } } },
    // 2) DELETE the orphan's domain — succeeds
    { status: 200, body: { uid: 'xxx' } },
    // 3) retry attach — succeeds
    { status: 200, body: { name: 'foo.example' } },
  ]);
  await assert.doesNotReject(
    addProjectDomain('sparkpage-aaaa1111', 'foo.example', { releaseOrphan: true }),
  );
  assert.equal(calls.length, 3);
  assert.match(calls[0].url, /\/v10\/projects\/sparkpage-aaaa1111\/domains/);
  assert.equal(calls[0].init?.method, 'POST');
  assert.match(calls[1].url, /\/v9\/projects\/sparkpage-bbbb2222\/domains\/foo\.example/);
  assert.equal(calls[1].init?.method, 'DELETE');
  assert.match(calls[2].url, /\/v10\/projects\/sparkpage-aaaa1111\/domains/);
  assert.equal(calls[2].init?.method, 'POST');
});

test('addProjectDomain: releaseOrphan retry that still 409s collapses to DomainClaimedError', async () => {
  // Vercel races / Vercel cache: detach succeeded but reattach still conflicts.
  mockFetchSequence([
    { status: 409, body: { error: { code: 'domain_already_in_use', message: 'in use by project sparkpage-bbbb2222' } } },
    { status: 200, body: {} }, // detach OK
    { status: 409, body: { error: { code: 'domain_already_in_use', message: 'still claimed somehow' } } },
  ]);
  await assert.rejects(
    () => addProjectDomain('sparkpage-aaaa1111', 'foo.example', { releaseOrphan: true }),
    (err) => {
      assert.ok(err instanceof DomainClaimedError);
      assert.equal((err as DomainClaimedError).scope, 'same_team');
      return true;
    },
  );
});

test('addProjectDomain: releaseOrphan with failing DELETE surfaces same_team error', async () => {
  mockFetchSequence([
    { status: 409, body: { error: { code: 'domain_already_in_use', message: 'in use by project sparkpage-bbbb2222' } } },
    { status: 500, body: { error: { code: 'internal_server_error', message: 'detach boom' } } },
  ]);
  await assert.rejects(
    () => addProjectDomain('sparkpage-aaaa1111', 'foo.example', { releaseOrphan: true }),
    (err) => {
      assert.ok(err instanceof DomainClaimedError);
      assert.equal((err as DomainClaimedError).scope, 'same_team');
      assert.match((err as Error).message, /auto-release failed.*detach boom/);
      return true;
    },
  );
});

test('addProjectDomain: 403 forbidden throws DomainClaimedError(other_account)', async () => {
  mockFetchOnce({
    status: 403,
    body: { error: { code: 'forbidden', message: 'verified by another Vercel account' } },
  });
  await assert.rejects(
    () => addProjectDomain('sparkpage-aaaa1111', 'foo.example'),
    (err) => {
      assert.ok(err instanceof DomainClaimedError);
      assert.equal((err as DomainClaimedError).scope, 'other_account');
      assert.equal((err as DomainClaimedError).conflictingProjectName, null);
      assert.equal((err as DomainClaimedError).errorCode, 'domain_claimed_other_account');
      return true;
    },
  );
});

test('addProjectDomain: 200 with not_authorized code maps to other_account', async () => {
  // Some Vercel responses use the code rather than the HTTP status to signal
  // the cross-account claim. Match on code as well as on status.
  mockFetchOnce({
    status: 400,
    body: { error: { code: 'not_authorized', message: 'not your domain' } },
  });
  await assert.rejects(
    () => addProjectDomain('sparkpage-aaaa1111', 'foo.example'),
    (err) => {
      assert.ok(err instanceof DomainClaimedError);
      assert.equal((err as DomainClaimedError).scope, 'other_account');
      return true;
    },
  );
});

test('addProjectDomain: 404 throws ProjectNotProvisionedError (pre-publish case)', async () => {
  mockFetchOnce({
    status: 404,
    body: { error: { code: 'not_found', message: 'The project does not exist' } },
  });
  await assert.rejects(
    () => addProjectDomain('sparkpage-aaaa1111', 'foo.example'),
    (err) => {
      assert.ok(err instanceof ProjectNotProvisionedError, 'expected ProjectNotProvisionedError');
      assert.equal((err as ProjectNotProvisionedError).projectName, 'sparkpage-aaaa1111');
      assert.equal((err as Error).name, 'ProjectNotProvisionedError');
      return true;
    },
  );
});

test('addProjectDomain: not_found code with non-404 status still maps to ProjectNotProvisionedError', async () => {
  // Defensive: Vercel sometimes returns 400 with a not_found-shaped code.
  mockFetchOnce({
    status: 400,
    body: { error: { code: 'not_found', message: 'project missing' } },
  });
  await assert.rejects(
    () => addProjectDomain('sparkpage-aaaa1111', 'foo.example'),
    (err) => err instanceof ProjectNotProvisionedError,
  );
});

test('addProjectDomain: 500 propagates as generic Error', async () => {
  mockFetchOnce({
    status: 500,
    body: { error: { code: 'internal_server_error', message: 'boom' } },
  });
  await assert.rejects(
    () => addProjectDomain('sparkpage-aaaa1111', 'foo.example'),
    (err) => {
      assert.ok(err instanceof Error);
      assert.ok(!(err instanceof ProjectNotProvisionedError));
      assert.match((err as Error).message, /addProjectDomain failed.*boom/);
      return true;
    },
  );
});

test('getDomainConfig: misconfigured=true surfaces expected records', async () => {
  const { calls } = mockFetchOnce({
    status: 200,
    body: { misconfigured: true, aValues: ['76.76.21.21'], cnames: ['cname.vercel-dns.com'] },
  });
  const cfg = await getDomainConfig('sparkpage-aaaa1111', 'www.acme.com');
  assert.equal(cfg.misconfigured, true);
  assert.equal(cfg.aRecord, '76.76.21.21');
  assert.equal(cfg.cname, 'cname.vercel-dns.com');
  assert.match(calls[0].url, /\/v9\/projects\/sparkpage-aaaa1111\/domains\/www\.acme\.com\/config/);
});

test('getDomainConfig: misconfigured=false with empty record arrays', async () => {
  mockFetchOnce({ status: 200, body: { misconfigured: false } });
  const cfg = await getDomainConfig('sparkpage-aaaa1111', 'www.acme.com');
  assert.equal(cfg.misconfigured, false);
  assert.equal(cfg.aRecord, null);
  assert.equal(cfg.cname, null);
});

test('getDomainConfig: 404 throws ProjectNotProvisionedError', async () => {
  mockFetchOnce({ status: 404, body: { error: { code: 'not_found', message: 'gone' } } });
  await assert.rejects(
    () => getDomainConfig('sparkpage-aaaa1111', 'www.acme.com'),
    (err) => err instanceof ProjectNotProvisionedError,
  );
});

test('getDomainVerification: returns TXT challenge when present', async () => {
  mockFetchOnce({
    status: 200,
    body: {
      verified: false,
      verification: [
        { type: 'TXT', domain: '_vercel.acme.com', value: 'vc-domain-verify=abc123' },
      ],
    },
  });
  const v = await getDomainVerification('sparkpage-aaaa1111', 'acme.com');
  assert.equal(v.verified, false);
  assert.equal(v.txtName, '_vercel.acme.com');
  assert.equal(v.txtValue, 'vc-domain-verify=abc123');
});

test('getDomainVerification: verified=true with no challenge', async () => {
  mockFetchOnce({ status: 200, body: { verified: true } });
  const v = await getDomainVerification('sparkpage-aaaa1111', 'acme.com');
  assert.equal(v.verified, true);
  assert.equal(v.txtName, null);
  assert.equal(v.txtValue, null);
});

test('verifyProjectDomain: returns true on verified response', async () => {
  const { calls } = mockFetchOnce({ status: 200, body: { verified: true } });
  const ok = await verifyProjectDomain('sparkpage-aaaa1111', 'acme.com');
  assert.equal(ok, true);
  assert.equal(calls[0].init?.method, 'POST');
  assert.match(calls[0].url, /\/domains\/acme\.com\/verify/);
});

test('verifyProjectDomain: returns false when still unverified', async () => {
  mockFetchOnce({ status: 200, body: { verified: false } });
  const ok = await verifyProjectDomain('sparkpage-aaaa1111', 'acme.com');
  assert.equal(ok, false);
});

test('verifyProjectDomain: 404 throws ProjectNotProvisionedError', async () => {
  mockFetchOnce({ status: 404, body: { error: { code: 'not_found' } } });
  await assert.rejects(
    () => verifyProjectDomain('sparkpage-aaaa1111', 'acme.com'),
    (err) => err instanceof ProjectNotProvisionedError,
  );
});
