/**
 * CallRail post-call webhook signature verification.
 *
 * From the docs (https://apidocs.callrail.com/, "Security" section):
 *   signature = Base64(HMAC-SHA1(signing_key, request_payload))
 *
 * Each CallRail company has its own signing key (visible on the Webhooks
 * config page); the user pastes it into SparkPage when binding a project, and
 * we store it in `projects.callrail_webhook_signing_key`.
 *
 * The exact bytes that go into the HMAC are the *raw* request body — not the
 * parsed JSON re-serialised. The route handler reads `await req.text()` and
 * passes that string here.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

export interface VerifyCallRailWebhookInput {
  /** The exact request body bytes as received. */
  rawBody: string;
  /** Value of the `Signature` request header. */
  signatureHeader: string | null;
  /** The per-company signing token from CallRail's webhook config page. */
  signingKey: string;
}

/**
 * Returns true iff the header matches HMAC-SHA1(signingKey, rawBody) in
 * base64. Returns false on any malformed input rather than throwing — the
 * route handler maps a false to a 401.
 */
export function verifyCallRailWebhook(input: VerifyCallRailWebhookInput): boolean {
  const { rawBody, signatureHeader, signingKey } = input;
  if (!signatureHeader || !signingKey) return false;

  // The docs explicitly use base64 (Base64.strict_encode64 in Ruby — i.e.
  // no embedded newlines). createHmac.digest('base64') matches that exactly.
  const expected = createHmac('sha1', signingKey).update(rawBody, 'utf8').digest('base64');

  // Compare in constant time. Buffers must be equal length or
  // timingSafeEqual throws — so we explicitly check the length first.
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signatureHeader, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
