import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for SparkPage end-to-end smoke tests.
 *
 * Notes:
 *   • `webServer` boots `next dev` with E2E_MOCK_AUTH=1 so server components
 *     can bypass Supabase auth and render with fixture data. The hatch is
 *     also guarded by NODE_ENV !== 'production' inside the page itself.
 *   • Only chromium runs locally — fast smoke check, not a full matrix.
 *   • Unit tests still live in `src/**` and run via `tsx --test`; Playwright
 *     only picks up `e2e/**` so the two suites can coexist.
 */

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npx next dev --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      E2E_MOCK_AUTH: '1',
      NODE_ENV: 'development',
    },
  },
});
