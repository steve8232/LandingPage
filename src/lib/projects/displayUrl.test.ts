/**
 * Tests for the project display-URL precedence helper. Run with:
 *
 *   node --test --experimental-transform-types src/lib/projects/displayUrl.test.ts
 *
 * Pure helper (no I/O), so each case constructs its inputs inline and asserts
 * the returned shape. Covers the full matrix surfaced in the dashboard.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  resolveProjectDisplayUrls,
  type DisplayUrlDeploymentInput,
  type DisplayUrlProjectInput,
} from './displayUrl.ts';

const PARENT = 'pages.sparkpage.us';

function project(overrides: Partial<DisplayUrlProjectInput> = {}): DisplayUrlProjectInput {
  return {
    subdomain: null,
    subdomainStatus: null,
    customDomain: null,
    customDomainStatus: null,
    ...overrides,
  };
}

const READY_DEP: DisplayUrlDeploymentInput = {
  status: 'ready',
  url: 'https://sparkpage-aaaa1111.vercel.app',
};

test('custom ready + subdomain ready → custom primary, subdomain secondary', () => {
  const r = resolveProjectDisplayUrls(
    project({
      subdomain: 'acme', subdomainStatus: 'ready',
      customDomain: 'www.acme.com', customDomainStatus: 'ready',
    }),
    READY_DEP,
    PARENT,
  );
  assert.equal(r.primaryUrl, 'https://www.acme.com');
  assert.equal(r.primaryHost, 'www.acme.com');
  assert.equal(r.primaryIsCustomDomain, true);
  assert.equal(r.secondaryHost, 'acme.pages.sparkpage.us');
  assert.equal(r.pending, null);
});

test('custom ready, no subdomain → custom primary, no secondary', () => {
  const r = resolveProjectDisplayUrls(
    project({ customDomain: 'www.acme.com', customDomainStatus: 'ready' }),
    READY_DEP,
    PARENT,
  );
  assert.equal(r.primaryUrl, 'https://www.acme.com');
  assert.equal(r.primaryIsCustomDomain, true);
  assert.equal(r.secondaryHost, null);
  assert.equal(r.pending, null);
});

test('custom pending_dns + subdomain ready → subdomain primary, DNS pending pill', () => {
  const r = resolveProjectDisplayUrls(
    project({
      subdomain: 'acme', subdomainStatus: 'ready',
      customDomain: 'www.acme.com', customDomainStatus: 'pending_dns',
    }),
    READY_DEP,
    PARENT,
  );
  assert.equal(r.primaryUrl, 'https://acme.pages.sparkpage.us');
  assert.equal(r.primaryHost, 'acme.pages.sparkpage.us');
  assert.equal(r.primaryIsCustomDomain, false);
  assert.equal(r.secondaryHost, null);
  assert.deepEqual(r.pending, { kind: 'dns', label: 'DNS pending' });
});

test('custom pending_verification + subdomain ready → Verifying pill', () => {
  const r = resolveProjectDisplayUrls(
    project({
      subdomain: 'acme', subdomainStatus: 'ready',
      customDomain: 'www.acme.com', customDomainStatus: 'pending_verification',
    }),
    READY_DEP,
    PARENT,
  );
  assert.equal(r.primaryHost, 'acme.pages.sparkpage.us');
  assert.deepEqual(r.pending, { kind: 'verifying', label: 'Verifying…' });
});

test('custom error + subdomain ready → Domain error pill', () => {
  const r = resolveProjectDisplayUrls(
    project({
      subdomain: 'acme', subdomainStatus: 'ready',
      customDomain: 'www.acme.com', customDomainStatus: 'error',
    }),
    READY_DEP,
    PARENT,
  );
  assert.equal(r.primaryHost, 'acme.pages.sparkpage.us');
  assert.deepEqual(r.pending, { kind: 'error', label: 'Domain error' });
});

test('custom pending, no subdomain, vercel deploy ready → vercel primary, pill', () => {
  const r = resolveProjectDisplayUrls(
    project({ customDomain: 'www.acme.com', customDomainStatus: 'pending_dns' }),
    READY_DEP,
    PARENT,
  );
  assert.equal(r.primaryUrl, 'https://sparkpage-aaaa1111.vercel.app');
  assert.equal(r.primaryHost, null);
  assert.equal(r.primaryIsCustomDomain, false);
  assert.equal(r.secondaryHost, null);
  assert.deepEqual(r.pending, { kind: 'dns', label: 'DNS pending' });
});

test('custom pending, no subdomain, no deploy → primaryUrl null but pill present', () => {
  const r = resolveProjectDisplayUrls(
    project({ customDomain: 'www.acme.com', customDomainStatus: 'pending_dns' }),
    null,
    PARENT,
  );
  assert.equal(r.primaryUrl, null);
  assert.equal(r.primaryHost, null);
  assert.deepEqual(r.pending, { kind: 'dns', label: 'DNS pending' });
});

test('no custom, subdomain ready → subdomain primary, no pill (unchanged legacy behavior)', () => {
  const r = resolveProjectDisplayUrls(
    project({ subdomain: 'acme', subdomainStatus: 'ready' }),
    READY_DEP,
    PARENT,
  );
  assert.equal(r.primaryUrl, 'https://acme.pages.sparkpage.us');
  assert.equal(r.primaryHost, 'acme.pages.sparkpage.us');
  assert.equal(r.primaryIsCustomDomain, false);
  assert.equal(r.secondaryHost, null);
  assert.equal(r.pending, null);
});

test('no custom, subdomain pending, vercel deploy ready → vercel fallback, no pill', () => {
  const r = resolveProjectDisplayUrls(
    project({ subdomain: 'acme', subdomainStatus: 'pending' }),
    READY_DEP,
    PARENT,
  );
  assert.equal(r.primaryUrl, 'https://sparkpage-aaaa1111.vercel.app');
  assert.equal(r.primaryHost, null);
  assert.equal(r.pending, null);
});

test('no custom, no subdomain, no deploy → all-null draft state', () => {
  const r = resolveProjectDisplayUrls(project(), null, PARENT);
  assert.equal(r.primaryUrl, null);
  assert.equal(r.primaryHost, null);
  assert.equal(r.secondaryHost, null);
  assert.equal(r.pending, null);
});

test('no custom, no subdomain, deploy errored → no URL', () => {
  const r = resolveProjectDisplayUrls(
    project(),
    { status: 'error', url: null },
    PARENT,
  );
  assert.equal(r.primaryUrl, null);
  assert.equal(r.pending, null);
});

test('custom ready + subdomain pending → custom primary, no secondary (subdomain not live)', () => {
  const r = resolveProjectDisplayUrls(
    project({
      subdomain: 'acme', subdomainStatus: 'pending',
      customDomain: 'www.acme.com', customDomainStatus: 'ready',
    }),
    READY_DEP,
    PARENT,
  );
  assert.equal(r.primaryHost, 'www.acme.com');
  assert.equal(r.secondaryHost, null);
});

test('parentDomain is honored (e.g. dev override)', () => {
  const r = resolveProjectDisplayUrls(
    project({ subdomain: 'acme', subdomainStatus: 'ready' }),
    null,
    'dev.example',
  );
  assert.equal(r.primaryHost, 'acme.dev.example');
  assert.equal(r.primaryUrl, 'https://acme.dev.example');
});
