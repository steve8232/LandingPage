import type { V1ContentOverrides } from '../../../v1/composer/composeV1Template';
import type { ExtractedBusinessInfo } from '@/lib/firecrawl/extractBusinessInfo';

/**
 * Persisted between the extract and generate halves of the unified
 * onboarding pipeline — see supabase/migrations/0022_project_onboarding_state.sql.
 * Holds the AI's first-pass draft so the /confirm page can present it for
 * the user to edit before the heavy generation phase runs.
 */
export interface OnboardingState {
  source: 'url' | 'describe';
  /** Original URL (URL lane only). */
  url?: string;
  /** Firecrawl scrape side-channel (URL lane only). */
  scrape?: {
    screenshotUrl?: string;
    metadata?: Record<string, unknown>;
  };
  /** Editable AI extraction — the /confirm page rewrites this on submit. */
  draft: ExtractedBusinessInfo;
  /** Verbatim user description (Describe lane only). */
  description?: string;
}

/**
 * Row shape for `public.projects` (see supabase/migrations/0001_init.sql).
 * `overrides` is stored as jsonb; we treat it as V1ContentOverrides here for
 * the editor round-trip. New columns added to the SQL schema must be mirrored
 * here.
 */
export type SubdomainStatus = 'pending' | 'ready' | 'error';
export type CustomDomainStatus =
  | 'pending_verification'
  | 'pending_dns'
  | 'ready'
  | 'error';

/**
 * How the project was created — see supabase/migrations/0016_creation_method.sql
 * (manual/research/chat) and 0019_creation_method_url.sql (url).
 */
export type CreationMethod = 'manual' | 'research' | 'chat' | 'url';

/**
 * Async-pipeline state — see supabase/migrations/0020_project_build_status.sql
 * and 0022_project_onboarding_state.sql.
 *  - 'ready'             : project is fully built and usable.
 *  - 'building'          : background pipeline is running scrape/extract or
 *                          the post-confirm generate phase; /building polls.
 *  - 'awaiting_confirm'  : extract phase finished; waiting on the user to
 *                          confirm/edit the draft on /confirm before the
 *                          heavy generate phase kicks off.
 *  - 'failed'            : background pipeline threw; build_error holds it.
 */
export type BuildStatus = 'building' | 'ready' | 'failed' | 'awaiting_confirm';

export interface ProjectRow {
  id: string;
  user_id: string;
  template_id: string;
  title: string;
  slug: string;
  overrides: V1ContentOverrides;
  subdomain: string | null;
  subdomain_status: SubdomainStatus | null;
  subdomain_error: string | null;
  custom_domain: string | null;
  custom_domain_status: CustomDomainStatus | null;
  custom_domain_error: string | null;
  custom_domain_error_code: string | null;
  custom_domain_apex: boolean;
  audiencelab_pixel_id: string | null;
  audiencelab_install_url: string | null;
  ghl_location_id: string | null;
  ghl_user_id: string | null;
  ghl_provisioned_at: string | null;
  ghl_field_map: Record<string, string>;
  callrail_company_id: string | null;
  callrail_company_name: string | null;
  callrail_webhook_signing_key: string | null;
  business_phone: string | null;
  callrail_tracker_id: string | null;
  callrail_tracking_phone: string | null;
  callrail_script_url: string | null;
  creation_method: CreationMethod;
  build_status: BuildStatus;
  build_stage: string | null;
  build_error: string | null;
  onboarding_state: OnboardingState | null;
  created_at: string;
  updated_at: string;
}

/** Public-facing project payload returned by the API routes. */
export interface ProjectDTO {
  id: string;
  templateId: string;
  title: string;
  slug: string;
  overrides: V1ContentOverrides;
  subdomain: string | null;
  subdomainStatus: SubdomainStatus | null;
  subdomainError: string | null;
  customDomain: string | null;
  customDomainStatus: CustomDomainStatus | null;
  customDomainError: string | null;
  customDomainErrorCode: string | null;
  customDomainApex: boolean;
  audiencelabPixelId: string | null;
  audiencelabInstallUrl: string | null;
  ghlLocationId: string | null;
  ghlProvisionedAt: string | null;
  callrailCompanyId: string | null;
  callrailCompanyName: string | null;
  businessPhone: string | null;
  callrailTrackerId: string | null;
  callrailTrackingPhone: string | null;
  callrailScriptUrl: string | null;
  creationMethod: CreationMethod;
  buildStatus: BuildStatus;
  buildStage: string | null;
  buildError: string | null;
  onboardingState: OnboardingState | null;
  createdAt: string;
  updatedAt: string;
}

export function rowToDTO(row: ProjectRow): ProjectDTO {
  return {
    id: row.id,
    templateId: row.template_id,
    title: row.title,
    slug: row.slug,
    overrides: (row.overrides || {}) as V1ContentOverrides,
    subdomain: row.subdomain ?? null,
    subdomainStatus: row.subdomain_status ?? null,
    subdomainError: row.subdomain_error ?? null,
    customDomain: row.custom_domain ?? null,
    customDomainStatus: row.custom_domain_status ?? null,
    customDomainError: row.custom_domain_error ?? null,
    customDomainErrorCode: row.custom_domain_error_code ?? null,
    customDomainApex: row.custom_domain_apex ?? false,
    audiencelabPixelId: row.audiencelab_pixel_id ?? null,
    audiencelabInstallUrl: row.audiencelab_install_url ?? null,
    ghlLocationId: row.ghl_location_id ?? null,
    ghlProvisionedAt: row.ghl_provisioned_at ?? null,
    callrailCompanyId: row.callrail_company_id ?? null,
    callrailCompanyName: row.callrail_company_name ?? null,
    businessPhone: row.business_phone ?? null,
    callrailTrackerId: row.callrail_tracker_id ?? null,
    callrailTrackingPhone: row.callrail_tracking_phone ?? null,
    callrailScriptUrl: row.callrail_script_url ?? null,
    creationMethod: (row.creation_method ?? 'manual') as CreationMethod,
    buildStatus: (row.build_status ?? 'ready') as BuildStatus,
    buildStage: row.build_stage ?? null,
    buildError: row.build_error ?? null,
    onboardingState: row.onboarding_state ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Column list shared by `/api/projects` queries — keep in sync with ProjectRow.
 * `callrail_webhook_signing_key` is intentionally omitted: it's a secret and
 * lives only in server-side reads (see remoteStorage helpers).
 */
export const PROJECT_COLS =
  'id, user_id, template_id, title, slug, overrides, subdomain, subdomain_status, subdomain_error, custom_domain, custom_domain_status, custom_domain_error, custom_domain_error_code, custom_domain_apex, audiencelab_pixel_id, audiencelab_install_url, ghl_location_id, ghl_user_id, ghl_provisioned_at, ghl_field_map, callrail_company_id, callrail_company_name, business_phone, callrail_tracker_id, callrail_tracking_phone, callrail_script_url, creation_method, build_status, build_stage, build_error, onboarding_state, created_at, updated_at';

/**
 * Slug from a free-form title plus a short random suffix so two projects with
 * the same title don't collide on the (user_id, slug) unique index.
 */
export function makeSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'sparkpage';
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}
