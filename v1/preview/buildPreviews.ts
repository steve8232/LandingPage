#!/usr/bin/env npx tsx
/**
 * build:previews script
 *
 * Enumerates every registered v1 template spec, composes it into a
 * self-contained HTML document, and writes the output to:
 *   /dist/previews/{templateId}/index.html
 *
 * Run from project root:
 *   npx tsx v1/preview/buildPreviews.ts
 *
 * Architecture decision: this is a standalone Node script (not a Next.js
 * route) so it can be executed in CI or locally without starting the dev
 * server.  It reuses the exact same composer that the runtime adapter uses,
 * guaranteeing preview ↔ runtime parity.
 */

import fs from 'fs';
import path from 'path';
import { getAllV1TemplateIds, getV1Spec } from '../specs/index';
import { composeV1Template } from '../composer/composeV1Template';

const DIST_DIR = path.resolve(process.cwd(), 'dist/previews');

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function writeIndex(templateIds: string[]): void {
  const entries = templateIds.map((id) => {
    const spec = getV1Spec(id);
    return {
      id,
      name: spec?.metadata?.name ?? id,
      description: spec?.metadata?.description ?? '',
      category: spec?.category ?? '',
      goal: spec?.goal ?? '',
    };
  });

  const listItems = entries
    .map((e) => {
      const name = escapeHtml(e.name);
      const id = escapeHtml(e.id);
      const description = e.description ? escapeHtml(e.description) : '';
      const metaLine = [
        e.category && `Category: ${escapeHtml(String(e.category))}`,
        e.goal && `Goal: ${escapeHtml(String(e.goal))}`,
      ]
        .filter(Boolean)
        .join(' · ');

      return `      <li style="margin-bottom: 1.5rem;">
        <h2 style="margin: 0 0 0.25rem; font-size: 1rem; font-weight: 600;">
          ${name}
          <span style="font-weight: 400; color: #666;">(${id})</span>
        </h2>
        ${description ? `<p style="margin: 0 0 0.25rem; font-size: 0.9rem; color: #444;">${description}</p>` : ''}
        ${metaLine ? `<p style="margin: 0 0 0.25rem; font-size: 0.8rem; color: #666;">${metaLine}</p>` : ''}
        <p style="margin: 0; font-size: 0.9rem;">
          <a href="./${id}/index.html" target="_blank" rel="noopener noreferrer">Open preview</a>
        </p>
      </li>`;
    })
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>v1 Template Previews</title>
    <style>
      body {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        margin: 0;
        padding: 1.5rem;
        background: #fafafa;
        color: #111827;
      }
      h1 {
        margin: 0 0 1rem;
        font-size: 1.5rem;
      }
      ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      a {
        color: #2563eb;
        text-decoration: none;
      }
      a:hover {
        text-decoration: underline;
      }
    </style>
  </head>
  <body>
    <h1>v1 Template Previews</h1>
    <p style="margin: 0 0 1rem; font-size: 0.9rem; color: #4b5563;">
      Generated from registered v1 TemplateSpecs. Each link opens the composed preview
      at <code>dist/previews/&lt;templateId&gt;/index.html</code>.
    </p>
    <ul>
${listItems}
    </ul>
  </body>
</html>`;

  const outFile = path.join(DIST_DIR, 'index.html');
  fs.writeFileSync(outFile, html, 'utf-8');
  console.log(`\n[build:previews] Wrote index → ${path.relative(process.cwd(), outFile)}`);
}

function main(): void {
  const templateIds = getAllV1TemplateIds();

  if (templateIds.length === 0) {
    console.log('[build:previews] No v1 specs registered. Nothing to build.');
    return;
  }

  console.log(`[build:previews] Building previews for ${templateIds.length} v1 template(s)…`);

  ensureDir(DIST_DIR);

  let succeeded = 0;
  let failed = 0;

  for (const id of templateIds) {
    try {
      const { html } = composeV1Template(id);
      const outDir = path.join(DIST_DIR, id);
      ensureDir(outDir);
      const outFile = path.join(outDir, 'index.html');
      fs.writeFileSync(outFile, html, 'utf-8');
      console.log(`  ✓ ${id} → ${path.relative(process.cwd(), outFile)}`);
      succeeded++;
    } catch (err) {
      console.error(`  ✗ ${id}:`, err instanceof Error ? err.message : err);
      failed++;
    }
  }

	  // After individual previews are written, generate a simple index page
	  // listing links to all preview HTML files.
	  writeIndex(templateIds);

  console.log(
    `\n[build:previews] Done. ${succeeded} succeeded, ${failed} failed.`
  );

  if (failed > 0) {
    process.exit(1);
  }
}

main();

