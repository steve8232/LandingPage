import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildChatDescription,
  chatAnswersToKeyword,
  chatAnswersToOverrides,
  formatChatHours,
  splitLocation,
  type ChatAnswers,
} from './normalize';

function base(overrides: Partial<ChatAnswers> = {}): ChatAnswers {
  return {
    templateId: 'v1-plumber',
    businessName: 'Aqua Pro Plumbing',
    location: 'Chicago, Illinois',
    phone: '(312) 555-0100',
    services: 'Drain cleaning, water heaters, leak detection',
    serviceArea: 'Within 30 miles of Chicago',
    yearsInBusiness: 12,
    hoursPreset: 'standard',
    customHours: '',
    ...overrides,
  };
}

test('splitLocation — comma-separated city/state', () => {
  assert.deepEqual(splitLocation('Chicago, Illinois'), { city: 'Chicago', state: 'Illinois' });
  assert.deepEqual(splitLocation('  Chicago ,  Illinois  '), { city: 'Chicago', state: 'Illinois' });
});

test('splitLocation — no comma', () => {
  assert.deepEqual(splitLocation('Chicago'), { city: 'Chicago', state: '' });
});

test('splitLocation — empty', () => {
  assert.deepEqual(splitLocation(''), { city: '', state: '' });
});

test('formatChatHours — standard preset', () => {
  assert.equal(formatChatHours({ hoursPreset: 'standard', customHours: '' }), 'Mon–Fri, 9 AM – 5 PM');
});

test('formatChatHours — 24/7 preset', () => {
  assert.equal(formatChatHours({ hoursPreset: 'twentyfour-seven', customHours: '' }), 'Open 24/7');
});

test('formatChatHours — custom uses the typed value', () => {
  assert.equal(formatChatHours({ hoursPreset: 'custom', customHours: 'Tue–Sun, noon–10 PM' }), 'Tue–Sun, noon–10 PM');
});

test('formatChatHours — custom with empty string yields empty', () => {
  assert.equal(formatChatHours({ hoursPreset: 'custom', customHours: '' }), '');
});

test('chatAnswersToKeyword — name + location', () => {
  assert.equal(chatAnswersToKeyword(base()), 'Aqua Pro Plumbing Chicago, Illinois');
});

test('chatAnswersToKeyword — name only', () => {
  assert.equal(chatAnswersToKeyword({ businessName: 'Aqua Pro', location: '' }), 'Aqua Pro');
});

test('chatAnswersToKeyword — empty name yields empty', () => {
  assert.equal(chatAnswersToKeyword({ businessName: '   ', location: 'Chicago' }), '');
});

test('buildChatDescription — full answer set', () => {
  const out = buildChatDescription(base());
  assert.match(out, /Aqua Pro Plumbing provides Drain cleaning, water heaters, leak detection to Within 30 miles of Chicago\./);
  assert.match(out, /12\+ years of experience\./);
  assert.match(out, /Hours: Mon–Fri, 9 AM – 5 PM\./);
});

test('buildChatDescription — no services falls back to name + area', () => {
  const out = buildChatDescription(base({ services: '', yearsInBusiness: null, hoursPreset: 'custom', customHours: '' }));
  assert.equal(out, 'Aqua Pro Plumbing serves Within 30 miles of Chicago.');
});

test('buildChatDescription — minimal (name only)', () => {
  const out = buildChatDescription(base({
    services: '', serviceArea: '', yearsInBusiness: null, hoursPreset: 'custom', customHours: '',
  }));
  assert.equal(out, 'Aqua Pro Plumbing.');
});

test('chatAnswersToOverrides — populates meta correctly', () => {
  const out = chatAnswersToOverrides(base());
  assert.ok(out.meta);
  assert.equal(out.meta!.businessName, 'Aqua Pro Plumbing');
  assert.equal(out.meta!.businessPhone, '(312) 555-0100');
  assert.equal(out.meta!.pageTitle, 'Aqua Pro Plumbing');
  assert.ok((out.meta!.metaDescription || '').includes('Drain cleaning'));
});

test('chatAnswersToOverrides — empty name yields empty overrides', () => {
  const out = chatAnswersToOverrides(base({
    businessName: '', phone: '', services: '', serviceArea: '',
    yearsInBusiness: null, hoursPreset: 'custom', customHours: '',
  }));
  assert.deepEqual(out, {});
});

test('chatAnswersToOverrides — phone only', () => {
  const out = chatAnswersToOverrides(base({
    businessName: '', services: '', serviceArea: '',
    yearsInBusiness: null, hoursPreset: 'custom', customHours: '',
  }));
  assert.equal(out.meta?.businessPhone, '(312) 555-0100');
  assert.equal(out.meta?.businessName, undefined);
});
