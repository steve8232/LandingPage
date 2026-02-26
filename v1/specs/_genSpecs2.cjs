/**
 * Generator Part 2  remaining specs and writer.
 * Run: node v1/specs/_genSpecs2.cjs
 */
const fs = require('fs');
const p = require('path');
const { ALL } = require('./_genSpecsData');

function buildSpecObj(s){
  const demo = (suffix) => `demo-${s.sid}-${suffix}`;
  const fallback = (suffix) => `/v1/assets/placeholders/${s.pc}/${s.sid}-${suffix}.svg`;
  return {
    templateId: s.id,
    version: 'v1',
    category: s.cat,
    goal: s.goal,
    theme: s.th,
    sections: [
      { type: 'HeroSplit', props: { headline: s.h, subheadline: s.sh, ctaLabel: s.cl, ctaHref: '#contact', imageAsset: 'heroImageId' } },
      { type: 'SocialProofLogos', props: { heading: s.spH, logos: s.lg } },
      { type: 'ServiceList', props: { heading: s.svH, services: s.sv } },
      { type: 'TestimonialsCards', props: { heading: s.tmH, testimonials: s.tms } },
      { type: 'FinalCTA', props: { heading: s.fH, subheading: s.fS, ctaLabel: s.fC } },
    ],
    assets: {
      heroImageId: demo('hero-01'),
      supportImage1: demo('card-01'),
      supportImage2: demo('card-02'),
      fallbackHeroImageId: fallback('hero-01'),
      fallbackSupportImage1: fallback('card-01'),
      fallbackSupportImage2: fallback('card-02'),
      logo: '/v1/assets/placeholders/common/logo-placeholder.svg',
      avatar: '/v1/assets/placeholders/common/avatar-placeholder.svg',
    },
    form: s.fm,
    metadata: { name: s.mn, description: s.md, tags: s.tg },
  };
}

function writeSpec(s){
  const obj = buildSpecObj(s);
  const ts = `import { TemplateSpec } from './schema';\n\nconst spec: TemplateSpec = ${JSON.stringify(obj, null, 2)};\n\nexport default spec;\n`;
  fs.writeFileSync(p.join(__dirname, `${s.id}.ts`), ts);
  console.log(`  [32m[1m[0m ${s.id}.ts`);
}

for (const s of ALL) writeSpec(s);

// Update specs/index.ts registry
const imports = ALL.map((s) => `import ${camel(s.id)} from './${s.id}';`).join('\n');
const entries = ALL.map((s) => `  [${camel(s.id)}.templateId]: ${camel(s.id)},`).join('\n');
const idx = `/**\n * v1 Spec Registry (generated)\n */\n\nimport { TemplateSpec } from './schema';\n${imports}\n\nexport const v1Specs: Record<string, TemplateSpec> = {\n${entries}\n};\n\nexport function isV1Template(templateId: string): boolean {\n  return templateId in v1Specs;\n}\n\nexport function getV1Spec(templateId: string): TemplateSpec | undefined {\n  return v1Specs[templateId];\n}\n\nexport function getAllV1TemplateIds(): string[] {\n  return Object.keys(v1Specs);\n}\n`;
fs.writeFileSync(p.join(__dirname, 'index.ts'), idx);
console.log('\nUpdated v1/specs/index.ts');

function camel(id){
  return id.replace(/-([a-z])/g, (_,c)=>c.toUpperCase()).replace(/^v1/, 'v1');
}

