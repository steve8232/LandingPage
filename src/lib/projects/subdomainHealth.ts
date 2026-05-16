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
import type { ProjectRow, SubdomainStatus } from '@/lib/projects/types';

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
 * Bulk variant for the dashboard read path: mutates rows in place when a HEAD
 * probe shows the URL is actually live. Runs probes in parallel (capped at
 * the natural project-list size), so worst case adds one round-trip latency.
 */
export async function selfHealManyProjects(
  admin: AdminClient,
  rows: ProjectRow[]
): Promise<ProjectRow[]> {
  const errored = rows.filter(
    (r) => r.subdomain && r.subdomain_status === 'error'
  );
  if (errored.length === 0) return rows;

  const liveResults = await Promise.all(
    errored.map(async (r) => ({
      id: r.id,
      live: await verifySubdomainLive(buildPagesHost(r.subdomain as string)),
    }))
  );
  const liveIds = new Set(liveResults.filter((x) => x.live).map((x) => x.id));
  if (liveIds.size === 0) return rows;

  try {
    await admin
      .from('projects')
      .update({ subdomain_status: 'ready', subdomain_error: null })
      .in('id', Array.from(liveIds));
  } catch {
    // non-fatal: caller still gets fresh rows below via in-memory patch.
  }

  return rows.map((r) =>
    liveIds.has(r.id)
      ? { ...r, subdomain_status: 'ready', subdomain_error: null }
      : r
  );
}
