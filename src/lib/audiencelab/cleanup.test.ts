/**
 * Tests for the AudienceLab cleanup helpers. Run with:
 *
 *   npx tsx --test src/lib/audiencelab/cleanup.test.ts
 *
 * Pure logic — every dependency (Supabase admin client + AudienceLab
 * deletePixel) is stubbed, so no env vars or network are required.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyCleanup,
  findCleanupCandidates,
  type AdminClient,
  type DeletePixelFn,
} from './cleanup.ts';

interface ProjectRow {
  id: string;
  title: string | null;
  custom_domain: string | null;
  custom_domain_status: string | null;
  audiencelab_pixel_id: string | null;
  audiencelab_pixel_website_url: string | null;
}

interface UpdateCall { id: string; patch: Record<string, unknown> }

interface MockAdminOptions {
  rows: ProjectRow[];
  /** Forces the SELECT branch to surface a DB error. */
  selectError?: { message: string };
  /** Forces the UPDATE branch to surface a DB error for the given project ids. */
  updateErrorFor?: Set<string>;
}

function makeAdmin(opts: MockAdminOptions): { admin: AdminClient; updates: UpdateCall[] } {
  const updates: UpdateCall[] = [];
  const admin = {
    from(table: string) {
      assert.equal(table, 'projects');
      return {
        select() {
          return {
            not(col: string, op: string, val: unknown) {
              assert.equal(col, 'audiencelab_pixel_id');
              assert.equal(op, 'is');
              assert.equal(val, null);
              if (opts.selectError) {
                return Promise.resolve({ data: null, error: opts.selectError });
              }
              const data = opts.rows.filter((r) => r.audiencelab_pixel_id !== null);
              return Promise.resolve({ data, error: null });
            },
          };
        },
        update(patch: Record<string, unknown>) {
          return {
            eq(col: string, val: string) {
              assert.equal(col, 'id');
              updates.push({ id: val, patch });
              const error = opts.updateErrorFor?.has(val)
                ? { message: `forced update failure for ${val}` }
                : null;
              return Promise.resolve({ error });
            },
          };
        },
      };
    },
  } as unknown as AdminClient;
  return { admin, updates };
}

const NULL_TRIPLE = {
  audiencelab_pixel_id: null,
  audiencelab_install_url: null,
  audiencelab_pixel_website_url: null,
};

const ROWS: ProjectRow[] = [
  // 0: skipped — never had a pixel.
  { id: 'p0', title: 'no pixel', custom_domain: null, custom_domain_status: null, audiencelab_pixel_id: null, audiencelab_pixel_website_url: null },
  // 1: legacy — no ready custom domain.
  { id: 'p1', title: 'inert',    custom_domain: null, custom_domain_status: null, audiencelab_pixel_id: 'pxl_1', audiencelab_pixel_website_url: 'https://x.pages.sparkpage.us' },
  // 2: legacy — custom_domain set but not ready yet.
  { id: 'p2', title: 'pending',  custom_domain: 'a.com', custom_domain_status: 'pending', audiencelab_pixel_id: 'pxl_2', audiencelab_pixel_website_url: 'https://x.pages.sparkpage.us' },
  // 3: legacy — ready domain but stored URL is NULL (pre-migration row).
  { id: 'p3', title: 'pre-mig',  custom_domain: 'b.com', custom_domain_status: 'ready',   audiencelab_pixel_id: 'pxl_3', audiencelab_pixel_website_url: null },
  // 4: legacy — ready domain but stored URL points at a different domain.
  { id: 'p4', title: 'switched', custom_domain: 'c.com', custom_domain_status: 'ready',   audiencelab_pixel_id: 'pxl_4', audiencelab_pixel_website_url: 'https://old.com' },
  // 5: healthy — ready domain matches stored URL.
  { id: 'p5', title: 'healthy',  custom_domain: 'd.com', custom_domain_status: 'ready',   audiencelab_pixel_id: 'pxl_5', audiencelab_pixel_website_url: 'https://d.com' },
];

test('findCleanupCandidates: classifies the four legacy shapes and skips healthy rows', async () => {
  const { admin } = makeAdmin({ rows: ROWS });
  const { scanned, candidates } = await findCleanupCandidates(admin);

  assert.equal(scanned, 5, 'scan only counts rows with a pixel');
  const byId = new Map(candidates.map((c) => [c.projectId, c] as const));
  assert.equal(byId.size, 4, 'four legacy rows; healthy + no-pixel skipped');

  assert.equal(byId.get('p1')?.reason, 'no_ready_custom_domain');
  assert.equal(byId.get('p1')?.expectedUrl, null);
  assert.equal(byId.get('p2')?.reason, 'no_ready_custom_domain');
  assert.equal(byId.get('p3')?.reason, 'website_url_mismatch');
  assert.equal(byId.get('p3')?.expectedUrl, 'https://b.com');
  assert.equal(byId.get('p3')?.currentWebsiteUrl, null);
  assert.equal(byId.get('p4')?.reason, 'website_url_mismatch');
  assert.equal(byId.get('p4')?.expectedUrl, 'https://c.com');
  assert.equal(byId.get('p4')?.currentWebsiteUrl, 'https://old.com');
  assert.equal(byId.get('p5'), undefined);
  assert.equal(byId.get('p0'), undefined);
});

test('findCleanupCandidates: surfaces SELECT errors as thrown Error', async () => {
  const { admin } = makeAdmin({ rows: [], selectError: { message: 'rls denied' } });
  await assert.rejects(
    () => findCleanupCandidates(admin),
    (err: unknown) => {
      assert.ok(err instanceof Error);
      assert.match((err as Error).message, /findCleanupCandidates: rls denied/);
      return true;
    },
  );
});

test('applyCleanup: deletes, nulls the triple, and tallies the summary', async () => {
  const { admin, updates } = makeAdmin({ rows: ROWS });
  const { candidates } = await findCleanupCandidates(admin);
  const calls: string[] = [];
  const deletePixelFn: DeletePixelFn = async (pixelId) => {
    calls.push(pixelId);
    return { deleted: true, notFound: false };
  };

  const res = await applyCleanup(admin, candidates, deletePixelFn);

  assert.equal(res.deleted, 4);
  assert.equal(res.notFound, 0);
  assert.equal(res.failed, 0);
  assert.equal(res.nulled, 4);
  assert.deepEqual(calls.sort(), ['pxl_1', 'pxl_2', 'pxl_3', 'pxl_4']);
  assert.equal(updates.length, 4);
  for (const u of updates) assert.deepEqual(u.patch, NULL_TRIPLE);
  assert.ok(res.outcomes.every((o) => o.outcome === 'deleted'));
});

test('applyCleanup: 404 from AudienceLab is folded into notFound + still nulls DB', async () => {
  const { admin, updates } = makeAdmin({ rows: ROWS });
  const { candidates } = await findCleanupCandidates(admin);
  const deletePixelFn: DeletePixelFn = async () => ({ deleted: false, notFound: true });

  const res = await applyCleanup(admin, candidates, deletePixelFn);

  assert.equal(res.deleted, 0);
  assert.equal(res.notFound, 4);
  assert.equal(res.nulled, 4, '404 still triggers the DB null-out (re-runnable)');
  assert.equal(updates.length, 4);
  assert.ok(res.outcomes.every((o) => o.outcome === 'notFound'));
});

test('applyCleanup: AudienceLab throw -> outcome=failed, DB row untouched', async () => {
  const { admin, updates } = makeAdmin({ rows: ROWS });
  const { candidates } = await findCleanupCandidates(admin);
  const deletePixelFn: DeletePixelFn = async (pixelId) => {
    if (pixelId === 'pxl_2') throw new Error('AudienceLab 503: vendor down');
    return { deleted: true, notFound: false };
  };

  const res = await applyCleanup(admin, candidates, deletePixelFn);

  assert.equal(res.failed, 1);
  assert.equal(res.deleted, 3);
  assert.equal(res.nulled, 3, 'failed row leaves DB alone so the next run retries');
  assert.equal(updates.length, 3);
  assert.ok(!updates.some((u) => u.id === 'p2'), 'p2 DB row was not updated');

  const failed = res.outcomes.find((o) => o.pixelId === 'pxl_2');
  assert.equal(failed?.outcome, 'failed');
  assert.match(failed?.message ?? '', /vendor down/);
});

test('applyCleanup: AudienceLab ok but DB update fails -> outcome=db_failed', async () => {
  const { admin, updates } = makeAdmin({
    rows: ROWS,
    updateErrorFor: new Set(['p3']),
  });
  const { candidates } = await findCleanupCandidates(admin);
  const deletePixelFn: DeletePixelFn = async () => ({ deleted: true, notFound: false });

  const res = await applyCleanup(admin, candidates, deletePixelFn);

  assert.equal(res.deleted, 4, 'all four AudienceLab DELETEs succeeded');
  assert.equal(res.failed, 0);
  assert.equal(res.nulled, 3, 'only three local rows were actually nulled');
  assert.equal(updates.length, 4, 'we still attempted the UPDATE for p3');

  const dbFailed = res.outcomes.find((o) => o.pixelId === 'pxl_3');
  assert.equal(dbFailed?.outcome, 'db_failed');
  assert.match(dbFailed?.message ?? '', /forced update failure for p3/);
});

test('applyCleanup: outcomes preserve input order so callers can zip with candidates', async () => {
  const { admin } = makeAdmin({ rows: ROWS });
  const { candidates } = await findCleanupCandidates(admin);
  const deletePixelFn: DeletePixelFn = async () => ({ deleted: true, notFound: false });

  const res = await applyCleanup(admin, candidates, deletePixelFn);

  assert.equal(res.outcomes.length, candidates.length);
  for (let i = 0; i < candidates.length; i++) {
    assert.equal(res.outcomes[i].pixelId, candidates[i].pixelId);
    assert.equal(res.outcomes[i].projectId, candidates[i].projectId);
  }
});

test('applyCleanup: empty input -> empty result, no calls', async () => {
  const { admin, updates } = makeAdmin({ rows: ROWS });
  let calls = 0;
  const deletePixelFn: DeletePixelFn = async () => { calls++; return { deleted: true, notFound: false }; };

  const res = await applyCleanup(admin, [], deletePixelFn);

  assert.equal(calls, 0);
  assert.equal(updates.length, 0);
  assert.deepEqual(res, { outcomes: [], deleted: 0, notFound: 0, failed: 0, nulled: 0 });
});
