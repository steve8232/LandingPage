/**
 * Snapshot capture — headless Chromium → full-page PNG buffer.
 *
 * Used by /api/internal/snapshot once a deployment transitions to
 * status='ready'. The PNG is uploaded to the `snapshots` Supabase Storage
 * bucket and referenced by `public.page_snapshots.storage_path` so the
 * dashboard can overlay heatmap dots on a frozen image of the page as it
 * existed at deploy time.
 *
 * Two runtimes:
 *   • Vercel / AWS Lambda  → @sparticuz/chromium + playwright-core
 *   • Local dev (macOS)    → the `playwright` devDependency, which already
 *                            ships a bundled Chromium binary
 *
 * Both paths return a PNG Buffer + the captured viewport dimensions.
 */

export interface CaptureOptions {
  url: string;
  /** Logical viewport width. Heatmap dashboard scales the overlay to match. */
  width?: number;
  /** Logical viewport height. Full-page mode extends downward as needed. */
  height?: number;
  /** Hard cap on Playwright navigation in ms. Defaults to 25s. */
  navigationTimeoutMs?: number;
}

export interface CaptureResult {
  png: Buffer;
  widthPx: number;
  heightPx: number;
}

const DEFAULT_WIDTH = 1440;
const DEFAULT_HEIGHT = 900;
const DEFAULT_NAV_TIMEOUT_MS = 25_000;

function isServerless(): boolean {
  // VERCEL is set in Vercel build + runtime; AWS_LAMBDA_FUNCTION_NAME catches
  // any other Lambda host. Either way we need the sparticuz binary.
  return Boolean(process.env.VERCEL) || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
}

/**
 * Launches headless Chromium and returns the configured browser instance.
 * Caller is responsible for calling `browser.close()`.
 */
async function launchBrowser() {
  if (isServerless()) {
    // Dynamic imports so dev bundlers don't try to bundle the Lambda binary.
    // Both packages are listed in `serverExternalPackages` in next.config.ts.
    const chromiumMod = await import('@sparticuz/chromium');
    const chromium = chromiumMod.default ?? chromiumMod;
    const pw = await import('playwright-core');
    const executablePath = await chromium.executablePath();
    return pw.chromium.launch({
      args: chromium.args,
      executablePath,
      headless: true,
    });
  }

  // Local dev: playwright (devDependency) bundles its own browser discovery.
  // The runtime require keeps this branch out of the Vercel build's static
  // analysis so a missing dev-only dep doesn't fail prod compilation.
  const pwName = 'playwright';
  const pw = (await import(/* webpackIgnore: true */ pwName)) as typeof import('playwright');
  return pw.chromium.launch({ headless: true });
}

/**
 * Navigate to `url`, wait for the page to settle, and capture a full-page PNG.
 * Throws on navigation failure; caller should catch and mark the snapshot row
 * as `status='error'` with the message.
 */
export async function capturePageSnapshot(opts: CaptureOptions): Promise<CaptureResult> {
  const width = Math.max(320, Math.min(opts.width ?? DEFAULT_WIDTH, 2560));
  const height = Math.max(320, Math.min(opts.height ?? DEFAULT_HEIGHT, 4000));
  const navTimeout = opts.navigationTimeoutMs ?? DEFAULT_NAV_TIMEOUT_MS;

  const browser = await launchBrowser();
  try {
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1,
      // Self-flag so the published-page tracker can opt out of recording its
      // own deploy-time visit. /h.js checks navigator.userAgent for this token.
      userAgent:
        'Mozilla/5.0 (compatible; SparkPageSnapshot/1.0; +https://sparkpage.us)',
    });
    const page = await context.newPage();
    await page.goto(opts.url, {
      waitUntil: 'networkidle',
      timeout: navTimeout,
    });
    // Small settle to let CSS animations and font swaps finish painting.
    await page.waitForTimeout(500);

    const png = (await page.screenshot({
      fullPage: true,
      type: 'png',
    })) as Buffer;

    // Final layout dimensions — fullPage capture grows beyond the initial
    // viewport so we read the actual document size for the DB row.
    const dims = await page.evaluate(() => ({
      w: Math.max(document.documentElement.scrollWidth, window.innerWidth),
      h: Math.max(document.documentElement.scrollHeight, window.innerHeight),
    }));

    await context.close();
    return { png, widthPx: dims.w, heightPx: dims.h };
  } finally {
    await browser.close().catch(() => {
      // Closing a crashed browser can throw; nothing to do.
    });
  }
}
