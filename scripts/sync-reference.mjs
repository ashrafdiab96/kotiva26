#!/usr/bin/env node
/* ============================================================
   Copy the KOTIVA reference assets into the theme, verbatim.

   The reference site (../website, Laravel) is the single source of truth for
   look and behaviour. Its CSS, JS, fonts and images are copied byte-for-byte
   into src/assets/kotiva/ — nothing here edits them. Theme-specific glue
   lives in separate files (src/assets/kotiva/bridge/), never in these copies.

   Usage:
     node scripts/sync-reference.mjs            copy (default ref: ../website)
     node scripts/sync-reference.mjs --check    verify the copies still match
     node scripts/sync-reference.mjs --ref /path/to/website

   --check exits 1 when a copy differs from the reference or is missing, so a
   hand edit to a "verbatim" file is caught rather than silently shipped.
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? def : process.argv[i + 1];
};
const REF = path.resolve(ROOT, arg('ref', '../website'));
const CHECK = process.argv.includes('--check');
const DEST = path.join(ROOT, 'src/assets/kotiva');

/* [source relative to REF/public, destination relative to src/assets/kotiva].
   Only what a rendered reference page actually loads — superseded versions
   (-v1, _candidates) stay behind. */
const FILES = [
  // Design system + behaviour
  'css/kotiva.css',
  'css/shop.css',
  'js/layout.js',
  'js/animations.js',
  'js/routine-engine.js',
  'js/routine-model.js',
  'js/data-lite.js',
  // Self-hosted fonts (fixes the customizer's cross-origin font failure)
  'fonts/FuturaNowVar-Roman.woff2',
  'fonts/Manus.woff2',
  'fonts/MyriadPro-Regular.woff2',
  'fonts/Montserrat-VariableFont_wght_25.woff2',
  // Brand marks
  'assets/kotiva-logo.svg',
  'assets/kotiva-logo-white.svg',
  'assets/favicon.svg',
  'assets/favicon-48.png',
  'assets/apple-touch-icon.png',
  'assets/kotiva-company-profile.pdf',
  // Page imagery
  'assets/about-hero-portrait-v2.webp',
  'assets/about-journey.webp',
  'assets/hero-warm-skincare.webp',
  'assets/home-bestsellers-bg-v2.webp',
  'assets/home-doctor-approved-v5.webp',
  'assets/home-routine-ritual-v2.webp',
  'assets/science-actives.webp',
  'assets/science-philosophy.webp',
  'assets/shop-hero-flatlay-v2.webp',
  'assets/categories/cat-body-v3.webp',
  'assets/categories/cat-face-v3.webp',
  'assets/categories/cat-hair-v3.webp',
  'assets/categories/cat-serums-v3.webp',
  'assets/categories/cat-spf-v3.webp',
  'assets/categories/cat-treatments-v4.webp',
  ...[1, 2, 3, 4, 5, 6].map((n) => `assets/ritual/ritual-0${n}-v2.webp`),
  ...[1, 2, 3, 4, 5, 6].map((n) => `assets/journal/journal-0${n}-v2.webp`),
  // Home hero campaign artwork (defaults; replaceable from theme settings)
  'img/hero/1.jpeg',
  'img/hero/2.jpeg',
  'img/hero/3.jpeg',
  'img/hero/4.jpeg',
  // Routine Finder step imagery (defaults; replaceable from theme settings)
  ...['oily', 'dry', 'combination', 'balanced'].map((s) => `img/quiz/skin-${s}.webp`),
  ...['acne', 'oil', 'pigmentation', 'hydration', 'barrier', 'scars', 'ageing', 'sun'].map((c) => `img/quiz/concern-${c}.webp`),
];

/* Product imagery: the listing cards and home rail use the reference's own
   cut-outs (the Salla customizer did the same), falling back to product.image. */
function productFiles() {
  const dir = path.join(REF, 'public/assets/products');
  const out = [];
  for (const n of fs.readdirSync(dir)) if (/^kot\d{3}-.+\.webp$/.test(n) || n === 'placeholder.webp') out.push(`assets/products/${n}`);
  for (const n of fs.readdirSync(path.join(dir, 'hero'))) if (n.endsWith('.webp')) out.push(`assets/products/hero/${n}`);
  return out.sort();
}

const sha = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

if (!fs.existsSync(path.join(REF, 'public/css/kotiva.css'))) {
  console.error(`Reference not found at ${REF} (expected public/css/kotiva.css). Pass --ref.`);
  process.exit(2);
}

const all = [...FILES, ...productFiles()];
const problems = [];
let copied = 0;
for (const rel of all) {
  const src = path.join(REF, 'public', rel);
  const dst = path.join(DEST, rel);
  if (!fs.existsSync(src)) { problems.push(`missing in reference: public/${rel}`); continue; }
  if (CHECK) {
    if (!fs.existsSync(dst)) problems.push(`not copied: src/assets/kotiva/${rel}`);
    else if (sha(src) !== sha(dst)) problems.push(`differs from reference: src/assets/kotiva/${rel}`);
    continue;
  }
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  copied++;
}

if (problems.length) {
  console.error(`FAIL — ${problems.length} problem(s):\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log(CHECK ? `PASS — ${all.length} reference files match byte-for-byte.` : `Copied ${copied} files into src/assets/kotiva/.`);
