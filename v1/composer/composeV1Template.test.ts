import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPlaceholderChip, interpolateTokens } from './composeV1Template';

// ── isPlaceholderChip ─────────────────────────────────────────────────────────

test('isPlaceholderChip — matches [Your Neighborhood]', () => {
  assert.equal(isPlaceholderChip('[Your Neighborhood]'), true);
});

test('isPlaceholderChip — matches [Your Zip]', () => {
  assert.equal(isPlaceholderChip('[Your Zip]'), true);
});

test('isPlaceholderChip — matches [your neighborhood] case-insensitive', () => {
  assert.equal(isPlaceholderChip('[your neighborhood]'), true);
});

test('isPlaceholderChip — accepts surrounding whitespace', () => {
  assert.equal(isPlaceholderChip('  [Your Zip]  '), true);
});

test('isPlaceholderChip — rejects real neighborhood names', () => {
  assert.equal(isPlaceholderChip('Lakemont'), false);
  assert.equal(isPlaceholderChip('Aspen Bluff'), false);
});

test('isPlaceholderChip — rejects token placeholders like [City]', () => {
  assert.equal(isPlaceholderChip('[City]'), false);
  assert.equal(isPlaceholderChip('[Neighborhood]'), false);
});

test('isPlaceholderChip — rejects non-strings', () => {
  assert.equal(isPlaceholderChip(undefined), false);
  assert.equal(isPlaceholderChip(null), false);
  assert.equal(isPlaceholderChip(42), false);
  assert.equal(isPlaceholderChip({}), false);
});

// ── interpolateTokens ─────────────────────────────────────────────────────────

test('interpolateTokens — replaces [City] with the supplied city', () => {
  const out = interpolateTokens('Backed by [City] families.', { city: 'Austin' });
  assert.equal(out, 'Backed by Austin families.');
});

test('interpolateTokens — replaces multiple tokens in the same string', () => {
  const out = interpolateTokens(
    'Backed by [City] families and [Neighborhood] neighbors.',
    { city: 'Austin', neighborhood: 'Lakemont' },
  );
  assert.equal(out, 'Backed by Austin families and Lakemont neighbors.');
});

test('interpolateTokens — collapses dangling commas when a token is empty', () => {
  const out = interpolateTokens('358 Oakridge Ln, [City] Metro, 90521', { city: '' });
  // Empty [City] leaves "358 Oakridge Ln,  Metro, 90521" → cleaned up.
  assert.equal(out, '358 Oakridge Ln, Metro, 90521');
});

test('interpolateTokens — empty [County] removes the word without leaving double spaces', () => {
  const out = interpolateTokens(
    'We cover [City] and surrounding [County] — just ask.',
    { city: 'Austin', county: '' },
  );
  assert.equal(out, 'We cover Austin and surrounding — just ask.');
});

test('interpolateTokens — leaves untouched copy intact', () => {
  const out = interpolateTokens('Free quotes via address.', { city: 'Austin' });
  assert.equal(out, 'Free quotes via address.');
});

test('interpolateTokens — strips space-before-punctuation', () => {
  const out = interpolateTokens('Hello [City] !', { city: '' });
  assert.equal(out, 'Hello!');
});

test('interpolateTokens — replaces [Neighborhood] with the first area chip', () => {
  const out = interpolateTokens(
    "Don't see your [Neighborhood]? We cover [City].",
    { city: 'Austin', neighborhood: 'Lakemont' },
  );
  assert.equal(out, "Don't see your Lakemont? We cover Austin.");
});
