import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildBusinessAddress,
  buildChatDescription,
  buildServiceAreasSectionsOverride,
  chatAnswersToKeyword,
  chatAnswersToOverrides,
  formatChatHours,
  parseAreaChips,
  splitLocation,
  type ChatAnswers,
} from './normalize';
import type { TemplateSpec } from '../../../v1/specs/schema';

function fakeSpec(types: string[]): TemplateSpec {
  return {
    templateId: 'v1-fake',
    name: 'Fake',
    niche: 'fake',
    sections: types.map((type) => ({ type, props: {} })),
    form: [],
    assets: {},
  } as unknown as TemplateSpec;
}

function base(overrides: Partial<ChatAnswers> = {}): ChatAnswers {
  return {
    templateId: 'v1-plumber',
    businessName: 'Aqua Pro Plumbing',
    location: 'Chicago, Illinois',
    streetAddress: '',
    displayAddress: true,
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
    businessName: '', location: '', phone: '', services: '', serviceArea: '',
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

test('parseAreaChips — comma-separated list', () => {
  assert.deepEqual(
    parseAreaChips('Lakemont, Aspen Bluff, Brookhaven'),
    ['Lakemont', 'Aspen Bluff', 'Brookhaven'],
  );
});

test('parseAreaChips — newline-separated list', () => {
  assert.deepEqual(parseAreaChips('Lakemont\nAspen Bluff'), ['Lakemont', 'Aspen Bluff']);
});

test('parseAreaChips — single blurb returns empty', () => {
  assert.deepEqual(parseAreaChips('Within 30 miles of Chicago'), []);
});

test('parseAreaChips — empty / whitespace returns empty', () => {
  assert.deepEqual(parseAreaChips(''), []);
  assert.deepEqual(parseAreaChips('   '), []);
});

test('parseAreaChips — caps at 16 chips', () => {
  const input = Array.from({ length: 25 }, (_, i) => `Area${i}`).join(', ');
  assert.equal(parseAreaChips(input).length, 16);
});

test('buildServiceAreasSectionsOverride — emits _omit when input is freeform', () => {
  const spec = fakeSpec(['HeroLeadForm', 'ServiceAreas', 'Footer']);
  const sections = buildServiceAreasSectionsOverride(spec, 'Within 30 miles of Chicago');
  assert.ok(sections);
  assert.equal(sections!.length, 3);
  assert.equal(sections![0], null);
  assert.deepEqual(sections![1], { _omit: true });
  assert.equal(sections![2], null);
});

test('buildServiceAreasSectionsOverride — emits areas when input is chip-able', () => {
  const spec = fakeSpec(['HeroLeadForm', 'ServiceAreas']);
  const sections = buildServiceAreasSectionsOverride(spec, 'Lakemont, Aspen Bluff, Brookhaven');
  assert.deepEqual(sections![1], { areas: ['Lakemont', 'Aspen Bluff', 'Brookhaven'] });
});

test('buildServiceAreasSectionsOverride — returns undefined when spec lacks ServiceAreas', () => {
  const spec = fakeSpec(['HeroLeadForm', 'Footer']);
  const sections = buildServiceAreasSectionsOverride(spec, 'Lakemont, Aspen Bluff');
  assert.equal(sections, undefined);
});

test('chatAnswersToOverrides with spec — hides ServiceAreas on freeform input', () => {
  const spec = fakeSpec(['HeroLeadForm', 'ServiceAreas', 'Footer']);
  const out = chatAnswersToOverrides(base(), spec);
  assert.ok(out.sections);
  assert.equal(out.sections!.length, 3);
  assert.deepEqual(out.sections![1], { _omit: true });
  assert.equal(out.meta?.serviceAreaText, 'Within 30 miles of Chicago');
});

test('chatAnswersToOverrides with spec — chip-able input renders areas', () => {
  const spec = fakeSpec(['ServiceAreas']);
  const out = chatAnswersToOverrides(base({ serviceArea: 'Lakemont, Aspen Bluff, Brookhaven' }), spec);
  assert.deepEqual(out.sections![0], { areas: ['Lakemont', 'Aspen Bluff', 'Brookhaven'] });
  assert.equal(out.meta?.serviceAreaText, 'Lakemont, Aspen Bluff, Brookhaven');
});

test('chatAnswersToOverrides with spec — empty serviceArea still omits the section', () => {
  const spec = fakeSpec(['HeroLeadForm', 'ServiceAreas']);
  const out = chatAnswersToOverrides(base({ serviceArea: '' }), spec);
  assert.deepEqual(out.sections![1], { _omit: true });
  assert.equal(out.meta?.serviceAreaText, undefined);
});

test('chatAnswersToOverrides without spec — does not write sections', () => {
  const out = chatAnswersToOverrides(base());
  assert.equal(out.sections, undefined);
  assert.equal(out.meta?.serviceAreaText, 'Within 30 miles of Chicago');
});

test('buildBusinessAddress — joins street + location with a comma', () => {
  assert.equal(
    buildBusinessAddress('123 Main St', 'Chicago, Illinois'),
    '123 Main St, Chicago, Illinois',
  );
});

test('buildBusinessAddress — street only', () => {
  assert.equal(buildBusinessAddress('123 Main St', ''), '123 Main St');
});

test('buildBusinessAddress — location only', () => {
  assert.equal(buildBusinessAddress('', 'Chicago, IL'), 'Chicago, IL');
});

test('buildBusinessAddress — both empty yields empty', () => {
  assert.equal(buildBusinessAddress('', ''), '');
  assert.equal(buildBusinessAddress('   ', '   '), '');
});

test('chatAnswersToOverrides — persists street + location as businessAddress', () => {
  const out = chatAnswersToOverrides(base({ streetAddress: '123 Main St' }));
  assert.equal(out.meta?.businessAddress, '123 Main St, Chicago, Illinois');
});

test('chatAnswersToOverrides — displayAddress=false is persisted', () => {
  const out = chatAnswersToOverrides(base({ streetAddress: '123 Main St', displayAddress: false }));
  assert.equal(out.meta?.displayAddress, false);
});

test('chatAnswersToOverrides — displayAddress=true is implicit (not persisted)', () => {
  const out = chatAnswersToOverrides(base({ streetAddress: '123 Main St', displayAddress: true }));
  assert.equal(out.meta?.displayAddress, undefined);
});

test('chatAnswersToOverrides — persists city + state split from location', () => {
  const out = chatAnswersToOverrides(base({ location: 'Austin, TX' }));
  assert.equal(out.meta?.city, 'Austin');
  assert.equal(out.meta?.state, 'TX');
});

test('chatAnswersToOverrides — single-token location persists city only', () => {
  const out = chatAnswersToOverrides(base({ location: 'Austin' }));
  assert.equal(out.meta?.city, 'Austin');
  assert.equal(out.meta?.state, undefined);
});

test('chatAnswersToOverrides — empty location persists neither city nor state', () => {
  const out = chatAnswersToOverrides(base({ location: '' }));
  assert.equal(out.meta?.city, undefined);
  assert.equal(out.meta?.state, undefined);
});
