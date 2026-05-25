import { test, expect, type Route } from '@playwright/test';

/**
 * Smoke test for /dashboard/projects/[id]/heatmap.
 *
 * The Next.js dev server is started with E2E_MOCK_AUTH=1 (see
 * playwright.config.ts) so the page server component bypasses Supabase and
 * renders with fixture project + deployments. The heatmap data API is mocked
 * per-test via page.route() so we never touch a real database.
 */

const PROJECT_ID = '11111111-1111-1111-1111-111111111111';
const HEATMAP_API = `**/api/projects/${PROJECT_ID}/heatmap*`;

interface MockOverrides {
  totals?: Partial<{
    sessions: number;
    click: number;
    rage_click: number;
    dead_click: number;
    scroll: number;
  }>;
  truncated?: boolean;
  snapshotReady?: boolean;
}

function mockHeatmapResponse(overrides: MockOverrides = {}) {
  return {
    device: 'desktop' as const,
    range: { from: new Date(Date.now() - 30 * 86_400_000).toISOString(), to: new Date().toISOString() },
    deployment: {
      id: '00000000-0000-0000-0000-000000000001',
      url: 'https://e2e-mock.example.com',
      createdAt: new Date().toISOString(),
    },
    snapshot: overrides.snapshotReady === false
      ? { url: null, widthPx: 1440, heightPx: 900, status: 'pending' as const }
      : {
          // 1x1 transparent PNG keeps the <img> happy without a real file.
          url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgAAIAAAUAAeImBZsAAAAASUVORK5CYII=',
          widthPx: 1440,
          heightPx: 900,
          status: 'ready' as const,
        },
    totals: {
      sessions: 42,
      click: 128,
      rage_click: 3,
      dead_click: 7,
      scroll: 256,
      ...overrides.totals,
    },
    bins: {
      click: [[0.5, 0.5, 5], [0.25, 0.75, 2]],
      rage_click: [[0.1, 0.1, 1]],
      dead_click: [[0.9, 0.9, 1]],
    },
    scrollDepth: [42, 40, 38, 35, 30, 24, 18, 12, 6, 3, 1],
    truncated: overrides.truncated ?? false,
  };
}

async function stubHeatmap(route: Route, overrides: MockOverrides = {}) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(mockHeatmapResponse(overrides)),
  });
}

test.describe('Heatmap viewer', () => {
  test('renders project header, sibling tabs, and stats from mocked API', async ({ page }) => {
    await page.route(HEATMAP_API, (route) => stubHeatmap(route));

    await page.goto(`/dashboard/projects/${PROJECT_ID}/heatmap`);

    // Breadcrumb / heading from the mock project fixture.
    await expect(page.getByRole('heading', { name: 'E2E Mock Project' })).toBeVisible();

    // Sibling-nav tab strip from ProjectTabs.tsx.
    const tablist = page.getByRole('tablist', { name: 'Project views' });
    await expect(tablist).toBeVisible();
    await expect(tablist.getByRole('tab', { name: 'Editor' })).toBeVisible();
    const heatmapTab = tablist.getByRole('tab', { name: 'Heatmap' });
    await expect(heatmapTab).toBeVisible();
    await expect(heatmapTab).toHaveAttribute('aria-selected', 'true');

    // Stats strip populated from the mock totals. Scope to the parent div of
    // each label so the assertion doesn't collide with the scroll-depth chart
    // (which renders counts that may overlap with totals numerically).
    const sessionsItem = page.locator('div').filter({ hasText: /^Sessions/ }).first();
    await expect(sessionsItem).toContainText('42');
    const clicksItem = page.locator('div').filter({ hasText: /^Clicks/ }).first();
    await expect(clicksItem).toContainText('128');

    // Snapshot image + heatmap canvas are both rendered.
    const snapshotImg = page.getByAltText('Page snapshot');
    await expect(snapshotImg).toBeVisible();
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('shows truncated badge when API reports truncation', async ({ page }) => {
    await page.route(HEATMAP_API, (route) => stubHeatmap(route, { truncated: true }));
    await page.goto(`/dashboard/projects/${PROJECT_ID}/heatmap`);
    await expect(page.getByText(/truncated.*50k/i)).toBeVisible();
  });

  test('shows pending state when no ready snapshot is available', async ({ page }) => {
    await page.route(HEATMAP_API, (route) => stubHeatmap(route, { snapshotReady: false }));
    await page.goto(`/dashboard/projects/${PROJECT_ID}/heatmap`);
    await expect(page.getByText(/snapshot capture in progress/i)).toBeVisible();
  });

  test('device toggle re-fetches with device=mobile', async ({ page }) => {
    const seen: string[] = [];
    await page.route(HEATMAP_API, (route) => {
      seen.push(new URL(route.request().url()).searchParams.get('device') ?? '');
      return stubHeatmap(route);
    });

    await page.goto(`/dashboard/projects/${PROJECT_ID}/heatmap`);
    await page.getByRole('button', { name: 'Mobile' }).click();

    // Initial load was desktop; toggle should add a mobile request.
    await expect.poll(() => seen.includes('mobile')).toBeTruthy();
    expect(seen).toContain('desktop');
  });
});
