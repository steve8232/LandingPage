import { test } from 'node:test';
import assert from 'node:assert/strict';

import { formatPhoneDisplay, normalizePhoneToTen } from './format.ts';

test('normalizePhoneToTen: strips formatting', () => {
  assert.equal(normalizePhoneToTen('(312) 555-0100'), '3125550100');
  assert.equal(normalizePhoneToTen('312.555.0100'), '3125550100');
  assert.equal(normalizePhoneToTen('312-555-0100'), '3125550100');
});

test('normalizePhoneToTen: drops leading 1 country code', () => {
  assert.equal(normalizePhoneToTen('+1 (312) 555-0100'), '3125550100');
  assert.equal(normalizePhoneToTen('13125550100'), '3125550100');
});

test('normalizePhoneToTen: returns partial for partial input', () => {
  assert.equal(normalizePhoneToTen('312'), '312');
  assert.equal(normalizePhoneToTen(''), '');
});

test('normalizePhoneToTen: caps at 10 digits', () => {
  assert.equal(normalizePhoneToTen('31255501009999'), '3125550100');
});

test('formatPhoneDisplay: progressively formats as digits arrive', () => {
  assert.equal(formatPhoneDisplay(''), '');
  assert.equal(formatPhoneDisplay('3'), '(3');
  assert.equal(formatPhoneDisplay('312'), '(312');
  assert.equal(formatPhoneDisplay('3125'), '(312) 5');
  assert.equal(formatPhoneDisplay('312555'), '(312) 555');
  assert.equal(formatPhoneDisplay('3125550'), '(312) 555-0');
  assert.equal(formatPhoneDisplay('3125550100'), '(312) 555-0100');
});

test('formatPhoneDisplay: idempotent on already-formatted input', () => {
  assert.equal(formatPhoneDisplay('(312) 555-0100'), '(312) 555-0100');
});

test('formatPhoneDisplay: ignores extra digits past 10', () => {
  assert.equal(formatPhoneDisplay('31255501009999'), '(312) 555-0100');
});
