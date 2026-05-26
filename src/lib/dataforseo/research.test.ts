/**
 * node:test specs for the DataForSEO research helpers. Mirrors the recipe
 * used by client.test.ts:
 *
 *   npx tsx --test src/lib/dataforseo/research.test.ts
 */

import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildPostbackUrl,
  getWebhookToken,
  parsePostback,
  verifyWebhookToken,
} from './research.ts';

// ── getWebhookToken ────────────────────────────────────────────────────────

const realToken = process.env.DATAFORSEO_WEBHOOK_TOKEN;

beforeEach(() => {
  process.env.DATAFORSEO_WEBHOOK_TOKEN = 'abc-test-token-123';
});
afterEach(() => {
  if (realToken === undefined) delete process.env.DATAFORSEO_WEBHOOK_TOKEN;
  else process.env.DATAFORSEO_WEBHOOK_TOKEN = realToken;
});

test('getWebhookToken: returns the env var value', () => {
  assert.equal(getWebhookToken(), 'abc-test-token-123');
});

test('getWebhookToken: throws when env var is missing', () => {
  delete process.env.DATAFORSEO_WEBHOOK_TOKEN;
  assert.throws(() => getWebhookToken(), /DATAFORSEO_WEBHOOK_TOKEN/);
});

// ── buildPostbackUrl ───────────────────────────────────────────────────────

test('buildPostbackUrl: composes origin + path + url-encoded token', () => {
  assert.equal(
    buildPostbackUrl('https://sparkpage.us', 'abc-123'),
    'https://sparkpage.us/api/webhooks/dataforseo/abc-123',
  );
});

test('buildPostbackUrl: strips trailing slashes from origin', () => {
  assert.equal(
    buildPostbackUrl('https://sparkpage.us///', 'abc'),
    'https://sparkpage.us/api/webhooks/dataforseo/abc',
  );
});

test('buildPostbackUrl: url-encodes tokens that contain reserved chars', () => {
  // Defence-in-depth: tokens should be alnum+dash, but if an operator picks
  // an aggressive one we still want a valid URL.
  assert.equal(
    buildPostbackUrl('https://sparkpage.us', 'a/b c+d'),
    'https://sparkpage.us/api/webhooks/dataforseo/a%2Fb%20c%2Bd',
  );
});

// ── verifyWebhookToken ─────────────────────────────────────────────────────

test('verifyWebhookToken: equal strings → true', () => {
  assert.equal(verifyWebhookToken('hunter2-hunter2', 'hunter2-hunter2'), true);
});

test('verifyWebhookToken: different same-length strings → false', () => {
  assert.equal(verifyWebhookToken('hunter2-hunter2', 'HUNTER2-HUNTER2'), false);
});

test('verifyWebhookToken: different lengths → false (no throw)', () => {
  assert.equal(verifyWebhookToken('short', 'a-much-longer-secret'), false);
});

test('verifyWebhookToken: empty / null received → false', () => {
  assert.equal(verifyWebhookToken('', 'secret'), false);
  assert.equal(verifyWebhookToken(undefined, 'secret'), false);
  assert.equal(verifyWebhookToken(null, 'secret'), false);
});

test('verifyWebhookToken: empty expected → false', () => {
  assert.equal(verifyWebhookToken('anything', ''), false);
});

// ── parsePostback ──────────────────────────────────────────────────────────

test('parsePostback: success envelope → ready + null error', () => {
  const out = parsePostback({
    status_code: 20000,
    status_message: 'Ok.',
    tasks: [{ id: 'task-1', status_code: 20000, status_message: 'Ok.', result: [{ x: 1 }] }],
  });
  assert.deepEqual(out, { taskId: 'task-1', status: 'ready', errorMessage: null });
});

test('parsePostback: missing task-level status_code defaults to ready', () => {
  // DataForSEO sometimes omits status_code on the task entry for success.
  const out = parsePostback({
    tasks: [{ id: 'task-2', result: [] }],
  });
  assert.equal(out?.status, 'ready');
  assert.equal(out?.taskId, 'task-2');
});

test('parsePostback: 4xxxx → error with the supplied status_message', () => {
  const out = parsePostback({
    tasks: [{ id: 'task-3', status_code: 40400, status_message: 'Not Found.' }],
  });
  assert.deepEqual(out, { taskId: 'task-3', status: 'error', errorMessage: 'Not Found.' });
});

test('parsePostback: 5xxxx → error with fallback message when status_message absent', () => {
  const out = parsePostback({
    tasks: [{ id: 'task-4', status_code: 50000 }],
  });
  assert.equal(out?.status, 'error');
  assert.equal(out?.errorMessage, 'DataForSEO status 50000');
});

test('parsePostback: malformed envelope → null', () => {
  assert.equal(parsePostback(null), null);
  assert.equal(parsePostback({}), null);
  assert.equal(parsePostback({ tasks: [] }), null);
  assert.equal(parsePostback({ tasks: [{ status_code: 20000 }] }), null); // no id
  assert.equal(parsePostback('not an object'), null);
});
