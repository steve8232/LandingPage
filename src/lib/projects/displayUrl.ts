/**
 * Pure helper that resolves which URL to surface for a project in list views
 * (e.g. /dashboard "Pages" list). Precedence:
 *
 *   1. Live custom domain (customDomainStatus === 'ready')
 *   2. Live SparkPage subdomain (subdomainStatus === 'ready')
 *   3. Latest *.vercel.app deployment URL (status === 'ready')
 *   4. Nothing — the project is still a Draft.
 *
 * When the custom domain is primary AND the SparkPage subdomain is also live,
 * the latter surfaces as a muted "also at …" secondary line so the legacy
 * URL stays discoverable. When a custom domain is attached but not yet live,
 * the caller renders a small pending pill (descriptor returned in `pending`)
 * so the user sees that DNS / verification is still in flight.
 *
 * Kept side-effect free and dependency-free so it can be unit-tested directly
 * with node:test (see ./displayUrl.test.ts).
 */
import type {
  CustomDomainStatus,
  SubdomainStatus,
} from './types';
import type { DeploymentStatus } from '../vercel/types';

export type CustomDomainPending =
  | { kind: 'verifying'; label: 'Verifying…' }
  | { kind: 'dns'; label: 'DNS pending' }
  | { kind: 'error'; label: 'Domain error' };

export interface DisplayUrlProjectInput {
  subdomain: string | null;
  subdomainStatus: SubdomainStatus | null;
  customDomain: string | null;
  customDomainStatus: CustomDomainStatus | null;
}

export interface DisplayUrlDeploymentInput {
  status: DeploymentStatus;
  url: string | null;
}

export interface ProjectDisplayUrls {
  /** URL the user clicks. null when the project has no live URL at all. */
  primaryUrl: string | null;
  /**
   * Stable host backing `primaryUrl` (custom domain or SparkPage subdomain).
   * null when only the immutable *.vercel.app fallback is available — the
   * caller should derive a label by stripping the protocol off `primaryUrl`.
   */
  primaryHost: string | null;
  /** True when `primaryHost` is the user's custom domain (not a subdomain). */
  primaryIsCustomDomain: boolean;
  /**
   * Secondary "also at <subdomain>.pages.sparkpage.us" hint. Only set when
   * the custom domain is primary AND the SparkPage subdomain is also live,
   * so the row never shows redundant duplicates.
   */
  secondaryHost: string | null;
  /**
   * Pending pill descriptor for an attached-but-not-yet-live custom domain.
   * `null` when the custom domain is live, errored after being cleared, or
   * never set.
   */
  pending: CustomDomainPending | null;
}

function pendingFor(status: CustomDomainStatus | null): CustomDomainPending | null {
  if (!status || status === 'ready') return null;
  switch (status) {
    case 'error':
      return { kind: 'error', label: 'Domain error' };
    case 'pending_dns':
      return { kind: 'dns', label: 'DNS pending' };
    case 'pending_verification':
    default:
      return { kind: 'verifying', label: 'Verifying…' };
  }
}

export function resolveProjectDisplayUrls(
  project: DisplayUrlProjectInput,
  deployment: DisplayUrlDeploymentInput | null | undefined,
  parentDomain: string,
): ProjectDisplayUrls {
  const customReady =
    !!project.customDomain && project.customDomainStatus === 'ready';
  const subdomainReady =
    !!project.subdomain && project.subdomainStatus === 'ready';

  const customHost = customReady ? (project.customDomain as string) : null;
  const subdomainHost = subdomainReady
    ? `${project.subdomain}.${parentDomain}`
    : null;

  const primaryHost: string | null = customHost ?? subdomainHost;
  const fallbackVercelUrl =
    deployment && deployment.status === 'ready' && deployment.url
      ? deployment.url
      : null;
  const primaryUrl = primaryHost
    ? `https://${primaryHost}`
    : fallbackVercelUrl;

  // Only surface the secondary subdomain hint when the custom domain itself
  // is primary; otherwise the subdomain *is* primary and there's nothing to
  // demote.
  const secondaryHost = customReady && subdomainReady ? subdomainHost : null;

  // Pending pill only applies to attached custom domains. When the project
  // has no custom domain set at all, there's nothing in flight to report.
  const pending = project.customDomain ? pendingFor(project.customDomainStatus) : null;

  return {
    primaryUrl,
    primaryHost,
    primaryIsCustomDomain: !!customHost,
    secondaryHost,
    pending,
  };
}
