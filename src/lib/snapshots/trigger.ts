/**
 * Snapshot trigger — invoked from the deployments polling route when a
 * deployment transitions to status='ready'. Inserts a `page_snapshots` row
 * with status='pending' and queues a fire-and-forget POST to
 * `/api/internal/snapshot` inside the supplied `afterFn` (typically Next's
 * `after()` so the polling client isn't blocked waiting on Playwright).
 *
 * Idempotency: the table has a unique (deployment_id, device) constraint. A
 * second trigger for the same deployment/device collapses to a 23505 from
 * Postgres which we treat as "already queued — nothing to do".
 *
 * Pulled into its own module (out of the deployments route) so the branching
 * logic is exercised by unit tests without spinning up Next's request runtime.
 */

import type { createAdminClient } from '../supabase/admin';

export type AdminClient = ReturnType<typeof createAdminClient>;

export type TriggerResult =
  | 'queued'
  | 'skipped_no_url'
  | 'skipped_no_secret'
  | 'skipped_already_queued'
  | 'skipped_insert_error';

export interface TriggerSnapshotDeps {
  /** Defaults to `globalThis.fetch`. */
  fetchFn?: typeof fetch;
  /**
   * Schedules `cb` to run after the response is flushed. Pass Next's `after()`
   * in route handlers; pass `(cb) => cb()` in tests to await synchronously.
   */
  afterFn: (cb: () => Promise<void> | void) => void;
  /** Defaults to `process.env.INTERNAL_SNAPSHOT_SECRET`. */
  secret?: string | undefined;
}

export interface TriggerSnapshotInput {
  admin: AdminClient;
  projectId: string;
  deploymentId: string;
  /** Live URL of the deployment; null when not yet resolved by Vercel. */
  url: string | null;
  /** Request origin, used as the base for the internal endpoint URL. */
  appOrigin: string;
  device?: 'desktop' | 'tablet' | 'mobile';
}

export async function triggerSnapshot(
  input: TriggerSnapshotInput,
  deps: TriggerSnapshotDeps
): Promise<TriggerResult> {
  if (!input.url) return 'skipped_no_url';
  const secret = deps.secret ?? process.env.INTERNAL_SNAPSHOT_SECRET;
  if (!secret) return 'skipped_no_secret';

  const device = input.device ?? 'desktop';

  // Idempotent insert: on conflict (unique deployment_id+device) the DB
  // rejects with 23505 ('unique_violation'). Anything else is unexpected
  // but non-fatal — caller's polling loop will retry on the next tick.
  const insertResult = (await input.admin
    .from('page_snapshots')
    .insert({
      project_id: input.projectId,
      deployment_id: input.deploymentId,
      device,
      storage_path: '',
      status: 'pending',
    })
    .select('id')
    .single()) as {
      data: { id: string } | null;
      error: { code?: string; message?: string } | null;
    };

  if (insertResult.error) {
    if (insertResult.error.code === '23505') return 'skipped_already_queued';
    console.warn(
      '[snapshots/trigger] insert failed:',
      insertResult.error.message || 'unknown'
    );
    return 'skipped_insert_error';
  }
  if (!insertResult.data) return 'skipped_insert_error';

  const snapshotId = insertResult.data.id;
  const base = input.appOrigin.replace(/\/+$/, '');
  const endpoint = `${base}/api/internal/snapshot`;
  const fetchFn = deps.fetchFn ?? globalThis.fetch;
  const payload = JSON.stringify({
    snapshotId,
    projectId: input.projectId,
    deploymentId: input.deploymentId,
    url: input.url,
    device,
  });

  deps.afterFn(async () => {
    try {
      await fetchFn(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${secret}`,
        },
        body: payload,
      });
    } catch (err) {
      console.warn('[snapshots/trigger] fetch failed:', err);
    }
  });

  return 'queued';
}
