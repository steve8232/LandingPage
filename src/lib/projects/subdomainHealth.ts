/**
 * Self-heal helpers for `projects.subdomain_status`. The Vercel domain/alias
 * APIs can return transient errors even when the resulting state is correct,
 * which leaves the DB row stuck in `'error'`. Before the dashboard / editor
 * shows that to the user, we verify reality with a cheap HEAD request and
 * silently flip the row back to `'ready'` when the URL actually works.
 *
 * Server-only. Capped at one HEAD per call site; failures are non-fatal.
 */

import type { createAdminClient } from '@/lib/supabase/admin';
import { buildPagesHost } from '@/lib/projects/subdomain';
import type { ProjectRow, SubdomainStatus, CustomDomainStatus } from '@/lib/projects/types';

type AdminClient = ReturnType<typeof createAdminClient>;

const VERIFY_TIMEOUT_MS = 1500;

/**
 * Make a HEAD request to `https://<host>`. Returns true on any 2xx/3xx (the
 * page is reachable and Vercel is serving content for the alias). Returns
 * false on 4xx/5xx, network errors, or timeout.
 */
export async function verifySubdomainLive(host: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);
  try {
    const res = await fetch(`https://${host}`, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      cache: 'no-store',
    });
    return res.status >= 200 && res.status < 400;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * If the row is currently `'error'` AND the URL is reachable, flip the DB to
 * `'ready'` and clear `subdomain_error`. Returns the (possibly updated) status
 * so callers can patch their in-memory copy without a second read.
 *
 * No-op when:
 *   - subdomain is null,
 *   - status is not 'error',
 *   - the HEAD probe fails.
 */
export async function selfHealSubdomainStatus(
  admin: AdminClient,
  projectId: string,
  subdomain: string | null,
  status: SubdomainStatus | null
): Promise<SubdomainStatus | null> {
  if (!subdomain || status !== 'error') return status;
  const live = await verifySubdomainLive(buildPagesHost(subdomain));
  if (!live) return status;
  try {
    await admin
      .from('projects')
      .update({ subdomain_status: 'ready', subdomain_error: null })
      .eq('id', projectId);
    return 'ready';
  } catch {
    return status;
  }
}

/**
 * Custom-domain analogue of selfHealSubdomainStatus. The Vercel verify /
 * config endpoints occasionally return transient errors for a domain that is
 * actually live (TXT race, /v9 misconfigured=true with the cert still issuing,
 * etc.), which leaves the row stuck in `'error'`. A single HEAD probe against
 * the real domain is the cheapest source of truth.
 */
export async function selfHealCustomDomainStatus(
  admin: AdminClient,
  projectId: string,
  customDomain: string | null,
  status: CustomDomainStatus | null
): Promise<CustomDomainStatus | null> {
  if (!customDomain || status !== 'error') return status;
  const live = await verifySubdomainLive(customDomain);
  if (!live) return status;
  try {
    await admin
      .from('projects')
      .update({
        custom_domain_status: 'ready',
        custom_domain_error: null,
        custom_domain_error_code: null,
      })
      .eq('id', projectId);
    return 'ready';
  } catch {
    return status;
  }
}

/**
 * Bulk variant for the dashboard read path: mutates rows in place when a HEAD
 * probe shows the URL is actually live. Runs probes in parallel (capped at
 * the natural project-list size), so worst case adds one round-trip latency.
 * Heals both `subdomain_status` and `custom_domain_status`; the two are
 * independent so a row can be patched on either, both, or neither side.
 */
export async function selfHealManyProjects(
  admin: AdminClient,
  rows: ProjectRow[]
): Promise<ProjectRow[]> {
  const subErrored = rows.filter(
    (r) => r.subdomain && r.subdomain_status === 'error'
  );
  const cdErrored = rows.filter(
    (r) => r.custom_domain && r.custom_domain_status === 'error'
  );
  if (subErrored.length === 0 && cdErrored.length === 0) return rows;

  const [subResults, cdResults] = await Promise.all([
    Promise.all(
      subErrored.map(async (r) => ({
        id: r.id,
        live: await verifySubdomainLive(buildPagesHost(r.subdomain as string)),
      }))
    ),
    Promise.all(
      cdErrored.map(async (r) => ({
        id: r.id,
        live: await verifySubdomainLive(r.custom_domain as string),
      }))
    ),
  ]);
  const subLiveIds = new Set(subResults.filter((x) => x.live).map((x) => x.id));
  const cdLiveIds = new Set(cdResults.filter((x) => x.live).map((x) => x.id));
  if (subLiveIds.size === 0 && cdLiveIds.size === 0) return rows;

  // Two updates because the SET clause differs per column set. Both are
  // best-effort; in-memory patch below still reflects the heal even if the
  // write races with a concurrent recheck.
  if (subLiveIds.size > 0) {
    try {
      await admin
        .from('projects')
        .update({ subdomain_status: 'ready', subdomain_error: null })
        .in('id', Array.from(subLiveIds));
    } catch {
      // non-fatal
    }
  }
  if (cdLiveIds.size > 0) {
    try {
      await admin
        .from('projects')
        .update({
          custom_domain_status: 'ready',
          custom_domain_error: null,
          custom_domain_error_code: null,
        })
        .in('id', Array.from(cdLiveIds));
    } catch {
      // non-fatal
    }
  }

  return rows.map((r) => {
    let next = r;
    if (subLiveIds.has(r.id)) {
      next = { ...next, subdomain_status: 'ready' satisfies SubdomainStatus, subdomain_error: null };
    }
    if (cdLiveIds.has(r.id)) {
      next = {
        ...next,
        custom_domain_status: 'ready' satisfies CustomDomainStatus,
        custom_domain_error: null,
        custom_domain_error_code: null,
      };
    }
    return next;
  });
}
