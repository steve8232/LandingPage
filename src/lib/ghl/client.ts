/**
 * Minimal typed wrapper around the GoHighLevel V2 REST API.
 *
 * Auth: a single agency-level Private Integration Token (PIT) shared
 * across all SparkPage accounts. Server-only; never imported from the
 * client. The PIT carries the scopes needed for agency operations
 * (locations.write, users.write, oauth.write) plus the contact /
 * custom-field scopes used in Phase B.
 *
 * Docs:
 *   https://highlevel.stoplight.io/docs/integrations/  (V2)
 *   https://marketplace.gohighlevel.com/docs/ghl/
 *
 * Phase A surface (this file) covers provisioning only:
 *   - createLocation: POST /locations/ with snapshotId.
 *   - inviteLocationAdmin: POST /users/ to attach the project owner.
 */

const GHL_API = 'https://services.leadconnectorhq.com';
const GHL_VERSION = '2021-07-28';

/**
 * Snapshot id loaded on every newly-provisioned sub-account. Read from
 * GHL_SNAPSHOT_ID; returns null when unset so callers skip the snapshot
 * argument and GHL creates a bare sub-account.
 */
export function readSnapshotId(): string | null {
  return process.env.GHL_SNAPSHOT_ID || null;
}

export function readAgencyToken(): string {
  const token = process.env.GHL_AGENCY_PIT;
  if (!token) {
    throw new Error('[ghl/client] Missing GHL_AGENCY_PIT env var');
  }
  return token;
}

export function readCompanyId(): string {
  const id = process.env.GHL_COMPANY_ID;
  if (!id) {
    throw new Error('[ghl/client] Missing GHL_COMPANY_ID env var');
  }
  return id;
}

export function isGhlConfigured(): boolean {
  return Boolean(process.env.GHL_AGENCY_PIT && process.env.GHL_COMPANY_ID);
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    const msg = data?.message || data?.error?.message || data?.error;
    if (typeof msg === 'string') return msg;
    if (Array.isArray(data?.message)) return data.message.join('; ');
    return `GHL API ${res.status}`;
  } catch {
    return `GHL API ${res.status}`;
  }
}

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Version: GHL_VERSION,
  };
}

// ── locations ─────────────────────────────────────────────────────────────────

export interface CreateLocationInput {
  /** Sub-account display name — typically the SparkPage project title. */
  name: string;
  /** Admin email on the new sub-account; we use the project owner's email. */
  email: string;
  /** Optional snapshot to load on creation. Falls back to bare sub-account on 404. */
  snapshotId?: string;
  /** Optional contact phone for the sub-account record. */
  phone?: string;
  /** Address fields — GHL requires these to be non-empty; we pass safe defaults. */
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  timezone?: string;
}

export interface CreateLocationResponse {
  id: string;
  name?: string;
}

/**
 * Create a new sub-account (location) under the agency identified by
 * GHL_COMPANY_ID. On HTTP 404 from a stale snapshotId we retry once
 * without the snapshot so the publish never strands on a deleted
 * snapshot.
 */
export async function createLocation(
  input: CreateLocationInput
): Promise<CreateLocationResponse> {
  const token = readAgencyToken();
  const companyId = readCompanyId();

  const body: Record<string, unknown> = {
    companyId,
    name: input.name,
    email: input.email,
    phone: input.phone,
    address: input.address ?? '123 Main St',
    city: input.city ?? 'Anytown',
    state: input.state ?? 'NY',
    country: input.country ?? 'US',
    postalCode: input.postalCode ?? '10001',
    timezone: input.timezone ?? 'America/New_York',
  };
  if (input.snapshotId) body.snapshotId = input.snapshotId;

  let res = await fetch(`${GHL_API}/locations/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });

  if (res.status === 404 && input.snapshotId) {
    delete body.snapshotId;
    res = await fetch(`${GHL_API}/locations/`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(body),
    });
  }

  if (!res.ok) {
    throw new Error(`createLocation failed: ${await parseError(res)}`);
  }
  const data = (await res.json()) as { id?: string; location?: { id?: string; name?: string }; name?: string };
  const id = data?.id || data?.location?.id;
  if (!id) {
    throw new Error('createLocation: response missing location id');
  }
  return { id, name: data?.name || data?.location?.name };
}

// ── users ─────────────────────────────────────────────────────────────────────

export interface InviteLocationAdminInput {
  locationId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  /**
   * Optional plaintext password forwarded to GHL. When set, GHL skips the
   * "set your password" email so the user can sign in with this credential
   * immediately. Must satisfy GHL's password policy (>=8 chars, mixed
   * case, number, symbol) or the API returns 4xx.
   */
  password?: string;
}

export interface InviteLocationAdminResponse {
  id: string;
}

/**
 * Create a user under the agency and attach them to a single location as
 * an admin. When `password` is omitted, GHL emails the user a "set your
 * password" link automatically; when supplied, that password becomes the
 * sign-in credential and no email is sent.
 */
export async function inviteLocationAdmin(
  input: InviteLocationAdminInput
): Promise<InviteLocationAdminResponse> {
  const token = readAgencyToken();
  const companyId = readCompanyId();

  const body: Record<string, unknown> = {
    companyId,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone,
    type: 'account',
    role: 'admin',
    locationIds: [input.locationId],
    permissions: {
      campaignsEnabled: true,
      contactsEnabled: true,
      workflowsEnabled: true,
      triggersEnabled: true,
      funnelsEnabled: true,
      websitesEnabled: true,
      opportunitiesEnabled: true,
      dashboardStatsEnabled: true,
      bulkRequestsEnabled: true,
      appointmentsEnabled: true,
      reviewsEnabled: true,
      onlineListingsEnabled: true,
      phoneCallEnabled: true,
      conversationsEnabled: true,
      assignedDataOnly: false,
      adwordsReportingEnabled: false,
      membershipEnabled: true,
      facebookAdsReportingEnabled: false,
      attributionsReportingEnabled: false,
      settingsEnabled: true,
      tagsEnabled: true,
      leadValueEnabled: true,
      marketingEnabled: true,
    },
  };
  if (input.password) body.password = input.password;

  const res = await fetch(`${GHL_API}/users/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`inviteLocationAdmin failed: ${await parseError(res)}`);
  }
  const data = (await res.json()) as { id?: string; user?: { id?: string } };
  const id = data?.id || data?.user?.id;
  if (!id) {
    throw new Error('inviteLocationAdmin: response missing user id');
  }
  return { id };
}
