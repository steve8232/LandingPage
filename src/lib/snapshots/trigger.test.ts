/**
 * Tests for the snapshot trigger helper. Run with:
 *
 *   npx tsx --test src/lib/snapshots/trigger.test.ts
 *
 * Mocks the admin client's insert chain and the fetch call so the helper's
 * branching logic is exercised without touching Supabase or the network.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { triggerSnapshot, type AdminClient } from './trigger.ts';

interface InsertResponse {
  data: { id: string } | null;
  error: { code?: string; message?: string } | null;
}

interface MockAdminOptions {
  insertResponse: InsertResponse;
}

function makeAdmin(opts: MockAdminOptions): {
  admin: AdminClient;
  inserts: Array<Record<string, unknown>>;
} {
  const inserts: Array<Record<string, unknown>> = [];
  const admin = {
    from(table: string) {
      assert.equal(table, 'page_snapshots');
      return {
        insert(row: Record<string, unknown>) {
          inserts.push(row);
          return {
            select() {
              return {
                single: async () => opts.insertResponse,
              };
            },
          };
        },
      };
    },
  } as unknown as AdminClient;
  return { admin, inserts };
}

interface FetchCall { url: string; init?: RequestInit }

function makeAfter(): {
  afterFn: (cb: () => Promise<void> | void) => void;
  flush: () => Promise<void>;
} {
  const queued: Array<() => Promise<void> | void> = [];
  return {
    afterFn: (cb) => { queued.push(cb); },
    flush: async () => {
      while (queued.length) {
        const cb = queued.shift()!;
        await cb();
      }
    },
  };
}

test('triggerSnapshot: skipped_no_url when url is null', async () => {
  const { admin, inserts } = makeAdmin({
    insertResponse: { data: { id: 'snap-1' }, error: null },
  });
  const { afterFn } = makeAfter();
  const result = await triggerSnapshot(
    {
      admin,
      projectId: 'p1',
      deploymentId: 'd1',
      url: null,
      appOrigin: 'https://app.example',
    },
    { afterFn, secret: 'sek' }
  );
  assert.equal(result, 'skipped_no_url');
  assert.equal(inserts.length, 0);
});

test('triggerSnapshot: skipped_no_secret when secret is undefined', async () => {
  const { admin, inserts } = makeAdmin({
    insertResponse: { data: { id: 'snap-1' }, error: null },
  });
  const { afterFn } = makeAfter();
  const result = await triggerSnapshot(
    {
      admin,
      projectId: 'p1',
      deploymentId: 'd1',
      url: 'https://live.example',
      appOrigin: 'https://app.example',
    },
    { afterFn, secret: undefined }
  );
  assert.equal(result, 'skipped_no_secret');
  assert.equal(inserts.length, 0);
});

test('triggerSnapshot: skipped_already_queued on 23505 unique violation', async () => {
  const { admin, inserts } = makeAdmin({
    insertResponse: { data: null, error: { code: '23505', message: 'dup' } },
  });
  const { afterFn, flush } = makeAfter();
  const fetchCalls: FetchCall[] = [];
  const fetchFn = (async (input: RequestInfo | URL, init?: RequestInit) => {
    fetchCalls.push({ url: String(input), init });
    return new Response(null, { status: 202 });
  }) as typeof fetch;

  const result = await triggerSnapshot(
    {
      admin,
      projectId: 'p1',
      deploymentId: 'd1',
      url: 'https://live.example',
      appOrigin: 'https://app.example',
    },
    { afterFn, secret: 'sek', fetchFn }
  );
  assert.equal(result, 'skipped_already_queued');
  assert.equal(inserts.length, 1);
  await flush();
  assert.equal(fetchCalls.length, 0);
});

test('triggerSnapshot: skipped_insert_error on other DB errors', async () => {
  const { admin } = makeAdmin({
    insertResponse: { data: null, error: { code: '42P01', message: 'no such table' } },
  });
  const { afterFn, flush } = makeAfter();
  const fetchCalls: FetchCall[] = [];
  const fetchFn = (async () => new Response(null, { status: 202 })) as typeof fetch;

  const result = await triggerSnapshot(
    {
      admin,
      projectId: 'p1',
      deploymentId: 'd1',
      url: 'https://live.example',
      appOrigin: 'https://app.example',
    },
    { afterFn, secret: 'sek', fetchFn }
  );
  assert.equal(result, 'skipped_insert_error');
  await flush();
  assert.equal(fetchCalls.length, 0);
});

test('triggerSnapshot: queued inserts pending row and fires fetch via afterFn', async () => {
  const { admin, inserts } = makeAdmin({
    insertResponse: { data: { id: 'snap-1' }, error: null },
  });
  const { afterFn, flush } = makeAfter();
  const fetchCalls: FetchCall[] = [];
  const fetchFn = (async (input: RequestInfo | URL, init?: RequestInit) => {
    fetchCalls.push({ url: String(input), init });
    return new Response(null, { status: 202 });
  }) as typeof fetch;

  const result = await triggerSnapshot(
    {
      admin,
      projectId: 'p1',
      deploymentId: 'd1',
      url: 'https://live.example',
      appOrigin: 'https://app.example/',
    },
    { afterFn, secret: 'sek', fetchFn }
  );
  assert.equal(result, 'queued');
  assert.equal(inserts.length, 1);
  assert.equal(inserts[0].project_id, 'p1');
  assert.equal(inserts[0].deployment_id, 'd1');
  assert.equal(inserts[0].device, 'desktop');
  assert.equal(inserts[0].status, 'pending');

  // fetch is deferred until afterFn fires
  assert.equal(fetchCalls.length, 0);
  await flush();
  assert.equal(fetchCalls.length, 1);
  assert.equal(fetchCalls[0].url, 'https://app.example/api/internal/snapshot');
  assert.equal(fetchCalls[0].init?.method, 'POST');
  const headers = fetchCalls[0].init?.headers as Record<string, string>;
  assert.equal(headers.authorization, 'Bearer sek');
  assert.equal(headers['content-type'], 'application/json');
  const body = JSON.parse(String(fetchCalls[0].init?.body));
  assert.deepEqual(body, {
    snapshotId: 'snap-1',
    projectId: 'p1',
    deploymentId: 'd1',
    url: 'https://live.example',
    device: 'desktop',
  });
});

test('triggerSnapshot: propagates non-default device to insert row and fetch body', async () => {
  const { admin, inserts } = makeAdmin({
    insertResponse: { data: { id: 'snap-m' }, error: null },
  });
  const { afterFn, flush } = makeAfter();
  const fetchCalls: FetchCall[] = [];
  const fetchFn = (async (input: RequestInfo | URL, init?: RequestInit) => {
    fetchCalls.push({ url: String(input), init });
    return new Response(null, { status: 202 });
  }) as typeof fetch;

  const result = await triggerSnapshot(
    {
      admin,
      projectId: 'p1',
      deploymentId: 'd1',
      url: 'https://live.example',
      appOrigin: 'https://app.example',
      device: 'mobile',
    },
    { afterFn, secret: 'sek', fetchFn }
  );
  assert.equal(result, 'queued');
  assert.equal(inserts[0].device, 'mobile');
  await flush();
  const body = JSON.parse(String(fetchCalls[0].init?.body));
  assert.equal(body.device, 'mobile');
  assert.equal(body.snapshotId, 'snap-m');
});
