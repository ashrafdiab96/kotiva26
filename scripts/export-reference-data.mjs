#!/usr/bin/env node
/* ============================================================
   One-off export: the reference site's product knowledge → theme JSON.

   Salla owns price, stock, the product page URL and the merchant-editable
   description. Everything else the KOTIVA pages show about a product lives
   only in the reference site, so it is exported here, keyed by SKU:

     src/assets/kotiva-theme/data/catalog.json      (bundled into every page — keep small)
       per SKU: listing metadata (filter key, category, skin type, concern,
       featured/best-seller, order), ingredients, the reference image paths
       and the Salla product id/path.
     src/assets/kotiva-theme/data/product-copy.json (fetched by the product page only)
       per SKU: description, benefits, how to use, free-from, the PDP spec grid
       and the science accordion HTML — the fallback when a Salla description
       does not parse, and the only source of the science text.
     src/assets/kotiva-theme/data/ingredients.json
       the ingredient glossary (IngredientGlossary.php's output), products by SKU.

   Sources, all inside the reference checkout:
     legacy/js/data-lite.js + data-full.js   the catalog (exactly what ProductSeeder seeds)
     salla/kotiva-salla.js                    the Salla filter keys + "related" groups
     storage/app/salla-links.json             SKU → Salla product id / path
     resources/glossary/ingredients.json      curated glossary entries
     resources/routine/routine-model.json     product format + zones (ProductFacts.php)
     app/Support/ScienceRenderer.php          run as-is through scripts/render-science.php

   Usage:
     node scripts/export-reference-data.mjs [--ref ../website] [--php php]
   --php names a PHP >= 8.2 binary with mbstring (on this machine WSL's php lacks
   it; XAMPP's works: --php /mnt/c/xampp/php/php.exe).
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? def : process.argv[i + 1];
};
const REF = path.resolve(ROOT, arg('ref', '../website'));
const PHP = arg('php', 'php');
const OUT = path.join(ROOT, 'src/assets/kotiva-theme/data');
const read = (rel) => fs.readFileSync(path.join(REF, rel), 'utf8');

/* `const NAME = [ … ];` — the right-hand side is JSON (ProductSeeder::readJsArray does the same). */
function jsArray(rel, name) {
  const text = read(rel);
  const start = text.indexOf(`const ${name} = [`);
  if (start === -1) throw new Error(`${rel}: ${name} not found`);
  const open = text.indexOf('[', start);
  let depth = 0;
  let inStr = false;
  for (let i = open; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (ch === '\\') i++;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === '[') depth++;
    else if (ch === ']' && --depth === 0) return JSON.parse(text.slice(open, i + 1));
  }
  throw new Error(`${rel}: unterminated ${name}`);
}

/* The customizer's PRODUCTS literal is plain JS (single quotes) — evaluate just that literal. */
function customizerProducts() {
  const text = read('salla/kotiva-salla.js');
  const m = text.match(/const PRODUCTS = (\[[\s\S]*?\n {2}\])\.map/);
  if (!m) throw new Error('salla/kotiva-salla.js: PRODUCTS not found');
  return vm.runInNewContext(m[1]);
}

const normalise = (v) => String(v || '').toLowerCase().replace(/^kotiva\s+/i, '').replace(/\s+/g, ' ').trim();

const lite = jsArray('legacy/js/data-lite.js', 'KOTIVA_PRODUCTS');
const full = jsArray('legacy/js/data-full.js', 'KOTIVA_PRODUCTS_FULL');
const fullById = new Map(full.map((r) => [r.id, r]));
const rows = lite.map((r) => ({ ...r, ...(fullById.get(r.id) || {}) }));

const customizer = customizerProducts();
const customizerByName = new Map(customizer.map((c, i) => [normalise(c.name), { ...c, order: i + 1 }]));

const links = JSON.parse(read('storage/app/salla-links.json'));
const linkBySku = new Map(links.map((l) => [String(l.sku).toUpperCase(), l]));

const model = JSON.parse(read('resources/routine/routine-model.json'));
const modelByName = new Map(Object.values(model.products).map((p) => [p.name, p]));

// ProductSeeder::HOME_RAIL_ORDER
const HOME_RAIL_ORDER = ['micellar-water', 'glow-up-water-essence-toner', 'uv-balance-spf50', 'acne-cleansing-gel', 'anti-hair-loss-ampoules', 'sun-protection-spf50', 'acne-control'];
// ProductFacts::ZONE_LABELS
const ZONE_LABELS = { face: 'Face', body: 'Body', hair: 'Hair & scalp', lips: 'Lips', intimate: 'Intimate area' };

const problems = [];
const products = rows.map((r, index) => {
  const sku = String(r.kot).toUpperCase();
  const c = customizerByName.get(normalise(r.name));
  if (!c) problems.push(`${sku} "${r.name}": no entry in salla/kotiva-salla.js PRODUCTS`);
  const link = linkBySku.get(sku);
  if (!link) problems.push(`${sku}: not in storage/app/salla-links.json`);
  if (`KOT${String(r.id).padStart(3, '0')}` !== sku) problems.push(`${sku}: id ${r.id} breaks the id N <=> KOT{N:3} rule`);
  const m = modelByName.get(r.name) || {};
  const zones = (m.zone || []).map((z) => ZONE_LABELS[z]).filter(Boolean);
  const facts = [
    { key: 'format', label: 'Format', value: String(m.format || '') },
    { key: 'zone', label: 'Use on', value: zones.join(' & ') },
    { key: 'skin', label: 'Skin type', value: String(r.skinType || '') },
    { key: 'target', label: 'Targets', value: String(r.concern || '') },
    { key: 'size', label: 'Size', value: String(r.volume || '') },
  ].filter((f) => f.value.trim() !== '');
  const heroRel = `assets/products/hero/${sku.toLowerCase()}.webp`;
  const rail = HOME_RAIL_ORDER.indexOf(r.slug);
  return {
    sku,
    id: r.id,
    slug: r.slug,
    name: r.name,
    displayName: r.name.replace(/^Kotiva\s+/i, ''),
    category: r.category,
    filter: c ? c.filter : null,
    relatedCategory: c ? c.relatedCategory : null,
    filterTags: r.filterTags || [],
    skinType: r.skinType || '',
    concern: r.concern || '',
    action: r.action || '',
    volume: r.volume || '',
    featured: Boolean(c ? c.featured : r.featured),
    bestSeller: Boolean(r.bestSeller),
    order: c ? c.order : index + 1,
    sortOrder: rail === -1 ? 100 + index : rail + 1,
    image: r.image || null,
    heroImage: fs.existsSync(path.join(REF, 'public', heroRel)) ? heroRel : (r.image || null),
    description: r.description || '',
    benefits: r.benefits || [],
    howToUse: r.howToUse || '',
    ingredients: r.ingredients || [],
    freeFrom: r.freeFrom || [],
    facts,
    science: r.science || '',
    salla: link ? { id: Number(link.salla_product_id), path: link.salla_path } : null,
  };
});

if (problems.length) {
  console.error(`FAIL — ${problems.length} mapping problem(s):\n  ${problems.join('\n  ')}`);
  process.exit(1);
}

/* "Complete your routine": same category, by id (ProductController::show(); the in-stock-first
   ordering needs live stock, so the PDP script applies it). */
for (const p of products) p.related = products.filter((o) => o.category === p.category && o.sku !== p.sku).sort((a, b) => a.id - b.id).map((o) => o.sku);

/* Science HTML through the reference's own renderer (with its no-loss assertion). */
const scienceInput = JSON.stringify({
  ref: path.relative(process.cwd(), REF) || '.',
  items: Object.fromEntries(products.map((p) => [p.sku, { name: p.name, science: p.science }])),
});
let scienceHtml;
try {
  scienceHtml = JSON.parse(execFileSync(PHP, [path.relative(process.cwd(), path.join(ROOT, 'scripts/render-science.php'))], { input: scienceInput, maxBuffer: 64 * 1024 * 1024 }).toString('utf8'));
} catch (e) {
  console.error(`FAIL — science rendering via "${PHP}" failed. Pass --php with a PHP >= 8.2 that has mbstring.\n${e.stderr || e.message}`);
  process.exit(1);
}
for (const p of products) {
  p.scienceHtml = scienceHtml[p.sku] || '';
  delete p.science;
}

/* Glossary — IngredientGlossary::entries(), with SKUs instead of resolved URLs. */
const norm = (v) => String(v).replace(/\s+/gu, ' ').trim().toLowerCase();
const curated = JSON.parse(read('resources/glossary/ingredients.json'));
const glossary = curated
  .map((entry) => {
    const aliases = (entry.aliases || []).map(norm);
    const matched = products
      .filter((p) => p.ingredients.some((i) => aliases.includes(norm(i))))
      .sort((a, b) => a.id - b.id)
      .map((p) => ({ sku: p.sku, slug: p.slug, name: p.displayName }));
    if (!matched.length) return null;
    return { slug: entry.slug, name: entry.name, also: entry.also || '', category: entry.category, summary: entry.summary, products: matched };
  })
  .filter(Boolean)
  .sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));

fs.mkdirSync(OUT, { recursive: true });
const banner = 'Generated by scripts/export-reference-data.mjs from the KOTIVA reference site. Do not edit by hand; re-run the export.';
const COPY_FIELDS = ['description', 'benefits', 'howToUse', 'freeFrom', 'facts', 'scienceHtml'];
const copy = Object.fromEntries(products.map((p) => [p.sku, Object.fromEntries(COPY_FIELDS.map((f) => [f, p[f]]))]));
const meta = products.map((p) => Object.fromEntries(Object.entries(p).filter(([k]) => !COPY_FIELDS.includes(k))));
fs.writeFileSync(path.join(OUT, 'catalog.json'), JSON.stringify({ _note: banner, products: meta }, null, 1) + '\n');
fs.writeFileSync(path.join(OUT, 'product-copy.json'), JSON.stringify({ _note: banner, products: copy }) + '\n');
fs.writeFileSync(path.join(OUT, 'ingredients.json'), JSON.stringify({ _note: banner, entries: glossary }, null, 1) + '\n');

/* The same data as Twig, so pages can render server-side (no JS flash, crawlable):
   src/views/components/kotiva/data.twig sets kotiva_catalog / kotiva_glossary and
   then includes the view named by kotiva_view, which inherits both. Usage:
     {% include 'components.kotiva.data' with {kotiva_view: 'components.kotiva.home.bestsellers'} %}
   Strings are single-quoted: Twig interpolates #{…} inside double quotes. */
const twig = (v) => {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') return `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  if (Array.isArray(v)) return `[${v.map(twig).join(', ')}]`;
  return `{${Object.entries(v).map(([k, x]) => `'${k}': ${twig(x)}`).join(', ')}}`;
};
const twigDir = path.join(ROOT, 'src/views/components/kotiva');
// Keyed by SKU so templates can look a product up directly: kotiva_catalog['KOT001'].
fs.mkdirSync(twigDir, { recursive: true });
// Product copy for the PDP's server render (the reference copy; Salla's own description,
// when it parses, replaces it client-side — see pdp.js).
fs.writeFileSync(path.join(twigDir, 'copy.twig'), [
  `{# ${banner} #}`,
  `{% set kotiva_copy = ${twig(copy)} %}`,
  `{% include kotiva_copy_view %}`,
  '',
].join('\n'));
fs.writeFileSync(path.join(twigDir, 'data.twig'), [
  `{# ${banner} #}`,
  `{% set kotiva_catalog = ${twig(Object.fromEntries(meta.map((p) => [p.sku, p])))} %}`,
  `{% set kotiva_glossary = ${twig(glossary)} %}`,
  // Listing pill counts per Salla filter key (Twig cannot count inside a for loop's scope).
  `{% set kotiva_filter_counts = ${twig(meta.reduce((acc, p) => { acc.all = (acc.all || 0) + 1; acc[p.filter] = (acc[p.filter] || 0) + 1; return acc; }, {}))} %}`,
  // The home rail: best sellers by sort_order then id (PageController::home()).
  `{% set kotiva_bestsellers = ${twig(meta.filter((p) => p.bestSeller).sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id).map((p) => p.sku))} %}`,
  `{% include kotiva_view %}`,
  '',
].join('\n'));
console.log(`Exported ${products.length} products (${products.filter((p) => p.scienceHtml).length} with science) and ${glossary.length} glossary entries to ${path.relative(ROOT, OUT)}/.`);
