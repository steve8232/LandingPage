#!/usr/bin/env npx tsx
/**
 * build:gallery script
 *
 * Loads each v1 preview HTML from /dist/previews/{templateId}/index.html,
 * opens it in a headless Chromium browser via Playwright, sets the viewport
 * to 1440×900, waits for assets to load, takes a full-page screenshot,
 * and writes the PNG to /gallery/{templateId}.png.
 *
 * Prerequisites:
 *   1. Run `npm run build:previews` first to generate the HTML files.
 *   2. Playwright + Chromium must be installed:
 *        npm install -D playwright
 *        npx playwright install chromium
 *
 * Run from project root:
 *   npx tsx v1/preview/buildGallery.ts
 *
 * Architecture decision: screenshots are taken from the static HTML files
 * (not from a running server) using file:// URLs.  This keeps the script
 * self-contained and CI-friendly — no dev server required.
 */

import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { getAllV1TemplateIds } from '../specs/index';

const PREVIEWS_DIR = path.resolve(process.cwd(), 'dist/previews');
const GALLERY_DIR = path.resolve(process.cwd(), 'gallery');

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function main(): Promise<void> {
  const templateIds = getAllV1TemplateIds();

  if (templateIds.length === 0) {
    console.log('[build:gallery] No v1 specs registered. Nothing to screenshot.');
    return;
  }

  // Verify preview HTML files exist
  const missing = templateIds.filter(
    (id) => !fs.existsSync(path.join(PREVIEWS_DIR, id, 'index.html'))
  );
  if (missing.length > 0) {
    console.error(
      `[build:gallery] Missing preview HTML for: ${missing.join(', ')}\n` +
        '  Run "npm run build:previews" first.'
    );
    process.exit(1);
  }

  console.log(
    `[build:gallery] Generating thumbnails for ${templateIds.length} template(s)…`
  );

  ensureDir(GALLERY_DIR);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });

  let succeeded = 0;
  let failed = 0;

  for (const id of templateIds) {
    try {
      const htmlPath = path.join(PREVIEWS_DIR, id, 'index.html');
      const fileUrl = `file://${htmlPath}`;

      const page = await context.newPage();
      await page.goto(fileUrl, { waitUntil: 'networkidle' });

      // Small delay to ensure CSS custom properties are fully applied
      await page.waitForTimeout(500);

      const outFile = path.join(GALLERY_DIR, `${id}.png`);
      await page.screenshot({
        path: outFile,
        fullPage: true,
      });

      await page.close();

      const sizeKb = Math.round(fs.statSync(outFile).size / 1024);
      console.log(
        `  ✓ ${id} → ${path.relative(process.cwd(), outFile)} (${sizeKb} KB)`
      );
      succeeded++;
    } catch (err) {
      console.error(
        `  ✗ ${id}:`,
        err instanceof Error ? err.message : err
      );
      failed++;
    }
  }

  await browser.close();

  console.log(
    `\n[build:gallery] Done. ${succeeded} succeeded, ${failed} failed.`
  );

  if (failed > 0) {
    process.exit(1);
  }
}

main();

