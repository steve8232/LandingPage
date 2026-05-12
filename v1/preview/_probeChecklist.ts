// Smoke test: for every v1-* template, assert the ChecklistSection's <img> src
// is a Pexels URL (i.e. resolved to a remote demo image, not a local fallback).
import { composeV1Template } from '../composer/composeV1Template';
import { getAllV1TemplateIds } from '../specs/index';

const PEXELS_RE = /src="(https:\/\/images\.pexels\.com\/photos\/\d+\/pexels-photo-\d+\.jpeg[^"]*)"[^>]*data-v1-asset-key="checklistImage"/;

async function main() {
  let pass = 0, fail = 0;
  for (const id of getAllV1TemplateIds()) {
    const res = await composeV1Template(id, undefined, { allowRemoteDemoImages: true });
    const m = res.html.match(PEXELS_RE);
    if (m) { console.log(`✔ ${id} → ${m[1].slice(0, 70)}…`); pass++; }
    else   { console.log(`✗ ${id} → no Pexels URL bound to checklistImage`); fail++; }
  }
  console.log(`\n${pass}/${pass + fail} templates pass`);
  if (fail) process.exit(1);
}
main();
