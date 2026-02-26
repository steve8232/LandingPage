/**
 * Generator — creates all 12 demo manifest JSON files.
 * Run: node v1/assets/_generateManifests.cjs
 */
const fs = require('fs');
const path = require('path');
const DIR = path.resolve(__dirname, 'manifests');

const pxUrl = (id, w, h) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}&h=${h || ''}&dpr=1`;
const pxPage = (id, slug) =>
  `https://www.pexels.com/photo/${slug}-${id}/`;
const LIC = 'Pexels License — free to use, no attribution required, commercial use OK';
const NOTE = 'Pexels License. Demo reference only; do not redistribute as a stock pack.';

function entry(styleId, role, suffix, pxId, slug, w, photographer, profileSlug) {
  return {
    id: `demo-${styleId}-${suffix}`,
    role,
    url: pxUrl(pxId, w, role === 'hero' ? 750 : ''),
    source_page_url: pxPage(pxId, slug),
    provider: 'pexels',
    license_summary: LIC,
    attribution_text: `Photo by ${photographer} on Pexels`,
    attribution_url: `https://www.pexels.com/@${profileSlug}`,
    notes: NOTE,
  };
}

function manifest(styleId, h, c1, c2) {
  const obj = {};
  [h, c1, c2].forEach((e) => { obj[e.id] = e; });
  return obj;
}

// ── Image data per style ───────────────────────────────────────────────────
const MANIFESTS = {
  'saas-modern-light': manifest('saas-modern-light',
    entry('saas-modern-light','hero','hero-01', 546819,'javascript-code-across-monitor',1260,'Luis Gomes','luis-gomes-166272'),
    entry('saas-modern-light','card','card-01', 3183150,'photo-of-people-using-laptops',600,'Canva Studio','canvastudio'),
    entry('saas-modern-light','card','card-02', 590022,'person-writing-on-notebook',600,'Lukas','goumbik'),
  ),
  'saas-dark-purple': manifest('saas-dark-purple',
    entry('saas-dark-purple','hero','hero-01', 1181671,'woman-sitting-while-operating-macbook-pro',1260,'Christina Morillo','divinitylrl'),
    entry('saas-dark-purple','card','card-01', 1714208,'person-using-laptop-computer',600,'Burst','burst'),
    entry('saas-dark-purple','card','card-02', 577585,'turned-on-gray-laptop-computer',600,'Lukas Blazek','goumbik'),
  ),
  'ecommerce-clean-warm': manifest('ecommerce-clean-warm',
    entry('ecommerce-clean-warm','hero','hero-01', 5632399,'woman-holding-shopping-bags',1260,'Karolina Grabowska','karolina-grabowska'),
    entry('ecommerce-clean-warm','card','card-01', 3373736,'flatlay-photography-of-cosmetics',600,'Element5 Digital','element5digital'),
    entry('ecommerce-clean-warm','card','card-02', 4464482,'person-holding-white-box',600,'Ketut Subiyanto','ketut-subiyanto'),
  ),
  'ecommerce-bold-red': manifest('ecommerce-bold-red',
    entry('ecommerce-bold-red','hero','hero-01', 5709661,'crop-woman-with-shopping-bags',1260,'Karolina Grabowska','karolina-grabowska'),
    entry('ecommerce-bold-red','card','card-01', 1152077,'women-s-white-and-black-button-up-collared-shirt',600,'Artem Beliaikin','belart84'),
    entry('ecommerce-bold-red','card','card-02', 1488463,'person-holding-black-leather-handbag',600,'Ivan Babydov','ivan-babydov'),
  ),
  'local-services-trust': manifest('local-services-trust',
    entry('local-services-trust','hero','hero-01', 6419128,'plumber-installs-pipe-fittings',1260,'Anıl Karakaya','anilkarakaya'),
    entry('local-services-trust','card','card-01', 257736,'electrician-fixing-an-opened-switchboard',600,'Pixabay','pixabay'),
    entry('local-services-trust','card','card-02', 3243,'pen-calendar-to-do-checklist',600,'Breakingpic','breakingpic'),
  ),
  'eco-friendly-services': manifest('eco-friendly-services',
    entry('eco-friendly-services','hero','hero-01', 1301856,'selective-focus-photography-of-green-plant',1260,'Min An','minan1398'),
    entry('eco-friendly-services','card','card-01', 4108715,'crop-woman-with-mop-and-bucket-in-house',600,'Karolina Grabowska','karolina-grabowska'),
    entry('eco-friendly-services','card','card-02', 1072824,'green-succulent-plants-on-brown-pot',600,'Designecologist','designecologist'),
  ),
};

for (const [styleId, data] of Object.entries(MANIFESTS)) {
  const fp = path.join(DIR, `${styleId}.demo.json`);
  fs.writeFileSync(fp, JSON.stringify(data, null, 2) + '\n');
  console.log(`  ✓ ${styleId}.demo.json`);
}
console.log(`\nPart 1 done — ${Object.keys(MANIFESTS).length} manifests written.`);

