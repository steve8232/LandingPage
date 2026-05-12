#!/usr/bin/env node
/**
 * One-shot audit: walk every v1/assets/manifests/*.demo.json, collect every
 * entry tagged role:'checklist' (and any id matching /checklist/), HEAD-check
 * its URL, and report HTTP status. Used to find dead Pexels IDs.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const dir = path.join(__dirname, '..', 'v1', 'assets', 'manifests');
const entries = [];
for (const f of fs.readdirSync(dir).sort()) {
  if (!f.endsWith('.demo.json')) continue;
  const m = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  for (const [id, v] of Object.entries(m)) {
    entries.push({ niche: f.replace('.demo.json', ''), id, role: v.role, url: v.url });
  }
}

function head(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'HEAD', timeout: 8000 }, (res) => {
      resolve(res.statusCode);
      res.resume();
    });
    req.on('timeout', () => { req.destroy(); resolve('TIMEOUT'); });
    req.on('error', () => resolve('ERR'));
    req.end();
  });
}

(async () => {
  console.log(`Auditing ${entries.length} manifest entries…\n`);
  const failures = [];
  for (const e of entries) {
    const status = await head(e.url);
    if (status !== 200) {
      failures.push({ ...e, status });
      console.log(`✗ [${status}] ${e.niche.padEnd(20)} ${e.role.padEnd(15)} ${e.id}`);
    }
  }
  console.log(`\n${failures.length}/${entries.length} broken`);
})();
