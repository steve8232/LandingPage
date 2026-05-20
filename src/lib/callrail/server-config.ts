/**
 * Server-only access to the CallRail credentials. A single global API key
 * (CALLRAIL_API_KEY) covers every Company in the account — same posture as
 * AUDIENCELAB_API_KEY. CALLRAIL_ACCOUNT_ID is optional; when missing we
 * resolve it once via /v3/a.json and cache the result in module memory.
 *
 * Never import from a client component.
 */

import { resolvePrimaryAccountId } from './client';

/** Thrown when CALLRAIL_API_KEY is unset. Routes should translate to 503. */
export class CallRailNotConfiguredError extends Error {
  constructor() {
    super('CALLRAIL_API_KEY is not configured on the server.');
    this.name = 'CallRailNotConfiguredError';
  }
}

export function getCallRailApiKey(): string {
  const key = process.env.CALLRAIL_API_KEY?.trim();
  if (!key) throw new CallRailNotConfiguredError();
  return key;
}

/** True iff CALLRAIL_API_KEY is set. Use to gate UI affordances. */
export function isCallRailConfigured(): boolean {
  return !!process.env.CALLRAIL_API_KEY?.trim();
}

// Module-memory cache for the resolved account id. Safe per-Lambda; cold
// starts will re-resolve, which is one extra GET against CallRail.
let cachedAccountId: string | null = null;

export async function getCallRailAccountId(): Promise<string> {
  const fromEnv = process.env.CALLRAIL_ACCOUNT_ID?.trim();
  if (fromEnv) return fromEnv;
  if (cachedAccountId) return cachedAccountId;
  cachedAccountId = await resolvePrimaryAccountId(getCallRailApiKey());
  return cachedAccountId;
}
