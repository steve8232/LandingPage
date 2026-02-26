/**
 * Generator Part 2 — remaining 6 manifests.
 * Run: node v1/assets/_generateManifests2.cjs
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

const MANIFESTS = {
  'professional-consulting': manifest('professional-consulting',
    entry('professional-consulting','hero','hero-01', 3184292,'people-discuss-about-graphs-and-rates',1260,'fauxels','fauxels'),
    entry('professional-consulting','card','card-01', 5077039,'woman-in-white-long-sleeve-shirt',600,'Anna Shvets','shvetsa'),
    entry('professional-consulting','card','card-02', 380769,'macbook-air-flower-bouquet-and-magazines',600,'Georgie Cobbs','georgie-cobbs-281677'),
  ),
  'law-finance': manifest('law-finance',
    entry('law-finance','hero','hero-01', 5668858,'crop-lawyer-reading-documents',1260,'Sora Shimazaki','sora-shimazaki'),
    entry('law-finance','card','card-01', 618158,'person-signing-document-paper',600,'Pixabay','pixabay'),
    entry('law-finance','card','card-02', 534216,'person-using-laptop-computer-beside-aloe-vera',600,'Burst','burst'),
  ),
  'webinar-signup': manifest('webinar-signup',
    entry('webinar-signup','hero','hero-01', 3321793,'black-and-gray-microphone',1260,'Dmitry Demidov','dmitry-demidov-515774'),
    entry('webinar-signup','card','card-01', 4226140,'smiling-formal-male-with-laptop-chatting',600,'Andrea Piacquadio','olly'),
    entry('webinar-signup','card','card-02', 2774556,'people-at-theater',600,'Monica Silvestre','monica-silvestre-561586'),
  ),
  'ebook-download': manifest('ebook-download',
    entry('ebook-download','hero','hero-01', 159866,'ereader-on-table',1260,'Perfecto Capucine','perfecto-capucine-20504'),
    entry('ebook-download','card','card-01', 1340502,'white-ceramic-mug-on-table',600,'Adrienne Andersen','adrienne-andersen-567838'),
    entry('ebook-download','card','card-02', 904616,'assorted-books-on-book-shelves',600,'Element5 Digital','element5digital'),
  ),
  'coming-soon-minimal-dark': manifest('coming-soon-minimal-dark',
    entry('coming-soon-minimal-dark','hero','hero-01', 1629236,'close-up-photo-of-gray-concrete-road',1260,'Emiliano Arano','emiliano-arano'),
    entry('coming-soon-minimal-dark','card','card-01', 2088170,'orange-and-green-abstract-painting',600,'Gradienta','gradienta'),
    entry('coming-soon-minimal-dark','card','card-02', 2387793,'photo-of-abstract-painting',600,'Anni Roenkae','anniroenkae'),
  ),
  'coming-soon-vibrant-light': manifest('coming-soon-vibrant-light',
    entry('coming-soon-vibrant-light','hero','hero-01', 1918290,'person-holding-multicolored-lollipop',1260,'Alexander Grey','laughayette'),
    entry('coming-soon-vibrant-light','card','card-01', 2693212,'pink-and-purple-wallpaper',600,'Gradienta','gradienta'),
    entry('coming-soon-vibrant-light','card','card-02', 3109807,'photo-of-multicolored-abstract-painting',600,'Steve Johnson','steve-johnson-596532'),
  ),
};

for (const [styleId, data] of Object.entries(MANIFESTS)) {
  const fp = path.join(DIR, `${styleId}.demo.json`);
  fs.writeFileSync(fp, JSON.stringify(data, null, 2) + '\n');
  console.log(`  ✓ ${styleId}.demo.json`);
}
console.log(`\nPart 2 done — ${Object.keys(MANIFESTS).length} manifests written.`);

