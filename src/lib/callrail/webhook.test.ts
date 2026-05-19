/**
 * node:test specs for CallRail webhook signature verification + the
 * normalizers. Run with the project's existing recipe:
 *
 *   node --test --experimental-transform-types src/lib/callrail/webhook.test.ts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { verifyCallRailWebhook } from './webhook.ts';
import {
  normalizeCallFromWebhook,
  normalizeCallsFromApi,
  formatDuration,
  callOutcomeLabel,
} from './calls.ts';

// ── Signature verification ────────────────────────────────────────────────

// Exact vector from https://apidocs.callrail.com/ "Security" section.
// Verbatim test vector from https://apidocs.callrail.com/ "Security"
// section. The two phantom `\n` sequences shown in the rendered docs are
// HTML line-wrap artifacts — they're not part of the bytes CallRail HMACs.
// Verified empirically: only this exact string produces the published
// signature UZAHbUdfm3GqL7qzilGozGzWV64=.
const TEST_BODY = '{"answered":false,"business_phone_number":"","call_type":"voicemail","company_id":155920786,"company_name":"Boost Marketing","company_time_zone":"America/Los_Angeles","created_at":"2018-02-19T13:41:00.252-05:00","customer_city":"Rochester","customer_country":"US","customer_name":"Kaylah Mills","customer_phone_number":"+12148654559","customer_state":"PA","device_type":"","direction":"inbound","duration":"13","first_call":false,"formatted_call_type":"Voicemail","formatted_customer_location":"Rochester, PA","formatted_business_phone_number":"","formatted_customer_name":"Kaylah Mills","prior_calls":16,"formatted_customer_name_or_phone_number":"Kaylah Mills","formatted_customer_phone_number":"214-865-4559","formatted_duration":"13s","formatted_tracking_phone_number":"404-555-8514","formatted_tracking_source":"Google Paid","formatted_value":"--","good_lead_call_id":715587840,"good_lead_call_time":"2016-06-17T10:23:33.363-04:00","id":766970532,"lead_status":"previously_marked_good_lead","note":"","recording":"https://app.callrail.com/calls/766970532/recording/redirect?access_key=aaaaccccddddeeee","recording_duration":8,"source_name":"Google AdWords","start_time":"2018-02-19T13:41:00.236-05:00","tags":[],"total_calls":17,"tracking_phone_number":"+14045558514","transcription":"","value":"","voicemail":true,"tracker_id":354024023,"keywords":"","medium":"","referring_url":"","landing_page_url":"","last_requested_url":"","referrer_domain":"","conversational_transcript":"","utm_source":"google","utm_medium":"cpc","utm_term":"","utm_content":"","utm_campaign":"Google AdWords","utma":"","utmb":"","utmc":"","utmv":"","utmz":"","ga":"","gclid":"","integration_data":[{"integration":"Webhooks","data":null}],"keywords_spotted":"","recording_player":"https://app.callrail.com/calls/766970532/recording?access_key=aaaabbbbccccdddd","speaker_percent":"","call_highlights":[],"callercity":"Rochester","callercountry":"US","callername":"Kaylah Mills","callernum":"+12148654559","callerstate":"PA","callsource":"google_paid","campaign":"","custom":"","datetime":"2018-02-19 18:41:00","destinationnum":"","ip":"","kissmetrics_id":"","landingpage":"","referrer":"","referrermedium":"","score":1,"tag":"","trackingnum":"+14045558514","timestamp":"2018-02-19T13:41:00.236-05:00"}';
const TEST_KEY = '072e77e426f92738a72fe23c4d1953b4';
const TEST_SIG = 'UZAHbUdfm3GqL7qzilGozGzWV64=';

test('verifyCallRailWebhook: official docs test vector matches', () => {
  assert.equal(
    verifyCallRailWebhook({ rawBody: TEST_BODY, signatureHeader: TEST_SIG, signingKey: TEST_KEY }),
    true,
  );
});

test('verifyCallRailWebhook: wrong key rejects', () => {
  assert.equal(
    verifyCallRailWebhook({ rawBody: TEST_BODY, signatureHeader: TEST_SIG, signingKey: 'WRONG_KEY' }),
    false,
  );
});

test('verifyCallRailWebhook: tampered body rejects', () => {
  assert.equal(
    verifyCallRailWebhook({ rawBody: TEST_BODY + ' ', signatureHeader: TEST_SIG, signingKey: TEST_KEY }),
    false,
  );
});

test('verifyCallRailWebhook: missing header rejects', () => {
  assert.equal(
    verifyCallRailWebhook({ rawBody: TEST_BODY, signatureHeader: null, signingKey: TEST_KEY }),
    false,
  );
});

test('verifyCallRailWebhook: empty signing key rejects', () => {
  assert.equal(
    verifyCallRailWebhook({ rawBody: TEST_BODY, signatureHeader: TEST_SIG, signingKey: '' }),
    false,
  );
});

// ── Normalizers ────────────────────────────────────────────────────────────

test('normalizeCallFromWebhook: parses the docs test vector', () => {
  const body = JSON.parse(TEST_BODY) as Record<string, unknown>;
  const dto = normalizeCallFromWebhook(body, 'proj-1');
  assert.ok(dto, 'should produce a DTO');
  assert.equal(dto.id, '766970532');
  assert.equal(dto.direction, 'inbound');
  assert.equal(dto.duration, 13);
  assert.equal(dto.voicemail, true, 'call_type=voicemail flips voicemail');
  assert.equal(dto.answered, false);
  assert.equal(dto.customerName, 'Kaylah Mills');
  assert.equal(dto.customerCity, 'Rochester');
  assert.equal(dto.customerState, 'PA');
  assert.equal(dto.trackingPhone, '+14045558514');
  assert.equal(dto.source, 'Google AdWords');
  assert.equal(dto.recordingUrl, 'https://app.callrail.com/calls/766970532/recording?access_key=aaaabbbbccccdddd');
});

test('normalizeCallsFromApi: drops calls with no id', () => {
  const calls = normalizeCallsFromApi(
    [
      { id: 'CAL1', start_time: '2024-01-01T00:00:00Z', direction: 'inbound', duration: 42 } as never,
      { id: '', start_time: '2024-01-01T00:00:00Z' } as never,
    ],
    'proj-1',
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0].id, 'CAL1');
  assert.equal(calls[0].duration, 42);
});

test('formatDuration formats minute:seconds', () => {
  assert.equal(formatDuration(0), '—');
  assert.equal(formatDuration(7), '0:07');
  assert.equal(formatDuration(134), '2:14');
});

test('callOutcomeLabel: voicemail > answered > missed', () => {
  assert.equal(callOutcomeLabel({ voicemail: true, answered: true } as never), 'Voicemail');
  assert.equal(callOutcomeLabel({ voicemail: false, answered: true } as never), 'Answered');
  assert.equal(callOutcomeLabel({ voicemail: false, answered: false } as never), 'Missed');
});
