/**
 * Tests for the BYO custom-domain validator + DNS hint helper. Run with:
 *
 *   node --test --experimental-transform-types src/lib/projects/customDomain.test.ts
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  validateCustomDomain,
  dnsInstructionFor,
  VERCEL_APEX_A_RECORD,
  VERCEL_CNAME_TARGET,
} from './customDomain.ts';

test('validateCustomDomain: rejects non-strings', () => {
  assert.equal(validateCustomDomain(42).ok, false);
  assert.equal(validateCustomDomain(null).ok, false);
  assert.equal(validateCustomDomain(undefined).ok, false);
});

test('validateCustomDomain: rejects empty / whitespace', () => {
  assert.equal(validateCustomDomain('').ok, false);
  assert.equal(validateCustomDomain('   ').ok, false);
});

test('validateCustomDomain: strips https:// and trailing path', () => {
  const r = validateCustomDomain('https://www.Acme.com/landing?x=1');
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.value, 'www.acme.com');
    assert.equal(r.apex, false);
  }
});

test('validateCustomDomain: apex domain detected as apex', () => {
  const r = validateCustomDomain('acme.com');
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.value, 'acme.com');
    assert.equal(r.apex, true);
  }
});

test('validateCustomDomain: rejects sparkpage.us zones', () => {
  assert.equal(validateCustomDomain('sparkpage.us').ok, false);
  assert.equal(validateCustomDomain('foo.sparkpage.us').ok, false);
  assert.equal(validateCustomDomain('foo.pages.sparkpage.us').ok, false);
});

test('validateCustomDomain: rejects bogus shapes', () => {
  assert.equal(validateCustomDomain('not a domain').ok, false);
  assert.equal(validateCustomDomain('-acme.com').ok, false);
  assert.equal(validateCustomDomain('acme-.com').ok, false);
  assert.equal(validateCustomDomain('acme').ok, false); // single label
  assert.equal(validateCustomDomain('a..b.com').ok, false);
});

test('validateCustomDomain: accepts deep subdomains', () => {
  const r = validateCustomDomain('shop.eu.acme.co');
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.apex, false);
});

test('dnsInstructionFor: apex returns A record', () => {
  const hint = dnsInstructionFor('acme.com', true);
  assert.equal(hint.recordType, 'A');
  assert.equal(hint.host, '@');
  assert.equal(hint.value, VERCEL_APEX_A_RECORD);
});

test('dnsInstructionFor: www subdomain returns CNAME with host=www', () => {
  const hint = dnsInstructionFor('www.acme.com', false);
  assert.equal(hint.recordType, 'CNAME');
  assert.equal(hint.host, 'www');
  assert.equal(hint.value, VERCEL_CNAME_TARGET);
});

test('dnsInstructionFor: deep subdomain returns dotted host', () => {
  const hint = dnsInstructionFor('shop.us.acme.com', false);
  assert.equal(hint.recordType, 'CNAME');
  assert.equal(hint.host, 'shop.us');
  assert.equal(hint.value, VERCEL_CNAME_TARGET);
});
