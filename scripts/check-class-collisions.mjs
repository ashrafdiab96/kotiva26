#!/usr/bin/env node
/* ============================================================
   Class-collision gate: does Raed's compiled app.css style any class KOTIVA markup uses?

   KOTIVA pages load Raed's app.css first (Salla components and the customer area need it),
   then the verbatim kotiva.css. kotiva.css wins wherever it declares a property, but a Raed
   rule can still set a property kotiva.css leaves alone (e.g. Tailwind's .container
   width:100%) and shift the layout away from the reference.

   This lists every class used in KOTIVA templates/scripts that also appears in an app.css
   selector NOT confined to .kotiva-raed (Raed's own pages). Known, reviewed overlaps live in
   ALLOWED with the reason; anything else fails.

   Run after `pnpm run production`: node scripts/check-class-collisions.mjs
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* Reviewed overlaps: class → why it is harmless. */
const ALLOWED = {
  container: 'Tailwind .container adds width:100% and max-widths; kotiva.css (loaded later) sets max-width/padding/margin, and width:100% equals the block default the reference relies on.',
  'sr-only': 'Same visually-hidden pattern in both.',
  'swiper-slide': 'Salla integration hook on the PDP gallery slides (salla-slider needs it); not reference markup.',
  's-blocks-wrapper': 'Salla hook container kept on the PDP for apps; not reference markup.',
  'cart-options': 'Salla product-option forms in the cart keep Raed\'s hook class (inside .kotiva-raed).',
  relative: 'Raed cart-options hook class kept for Salla option forms; Tailwind .relative only sets position:relative.',
  visible: 'animations.js adds .visible to revealed elements; Tailwind .visible only sets visibility:visible, the default.',
  'cart-item': 'Raed rule only adds a transition on its own cart markup; reviewed harmless (no layout property kotiva/shop.css leaves unset).',
};

/* Raed-owned templates are excluded: they are meant to use Raed's classes. */
const RAED_VIEWS = [
  'src/views/layouts/customer.twig', 'src/views/pages/customer', 'src/views/pages/loyalty.twig',
  'src/views/pages/brands', 'src/views/pages/testimonials.twig', 'src/views/pages/partials',
  'src/views/pages/thank-you.twig', 'src/views/components/home',
];

function walk(dir, out = []) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return out;
  for (const ent of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.posix.join(dir, ent.name);
    if (RAED_VIEWS.some((r) => rel === r || rel.startsWith(r + '/'))) continue;
    if (ent.isDirectory()) walk(rel, out);
    else out.push(rel);
  }
  return out;
}

const used = new Map(); // class -> first file
const addClasses = (str, file) => {
  for (const c of str.split(/\s+/)) {
    if (!c || /[{}%~(]/.test(c) || !/^[A-Za-z_][\w-]*$/.test(c)) continue;
    if (!used.has(c)) used.set(c, file);
  }
};
for (const file of [...walk('src/views').filter((f) => f.endsWith('.twig')), ...walk('src/assets/kotiva-theme/js').filter((f) => f.endsWith('.js')), ...walk('src/assets/kotiva/js').filter((f) => f.endsWith('.js'))]) {
  const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
  for (const m of text.matchAll(/class(?:Name)?\s*=\s*(["'])([^"']*)\1/g)) addClasses(m[2].replace(/\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}/g, ' '), file);
  for (const m of text.matchAll(/classList\.(?:add|toggle|remove)\(\s*['"]([\w-]+)['"]/g)) addClasses(m[1], file);
}

const cssPath = path.join(ROOT, 'public/app.css');
if (!fs.existsSync(cssPath)) {
  console.error('public/app.css not found — run `pnpm run production` first.');
  process.exit(2);
}
const css = fs.readFileSync(cssPath, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const offenders = new Map(); // class -> selectors
for (const m of css.matchAll(/([^{}@;]+)\{/g)) {
  for (const sel of m[1].split(',').map((s) => s.trim()).filter(Boolean)) {
    if (/^(from|to|\d+%)$/.test(sel) || sel.startsWith('.kotiva-raed')) continue;
    const classes = [...sel.matchAll(/\.((?:\\.|[\w-])+)/g)].map((cm) => cm[1].replace(/\\(.)/g, '$1'));
    // A selector that also requires a class KOTIVA markup never uses (.main-menu .btn,
    // .lazy__bg.loaded) cannot match a KOTIVA element — only fully-matchable selectors count.
    if (classes.some((cls) => !used.has(cls))) continue;
    for (const cls of classes) {
      if (used.has(cls) && !ALLOWED[cls]) {
        if (!offenders.has(cls)) offenders.set(cls, new Set());
        offenders.get(cls).add(sel);
      }
    }
  }
}

console.log(`KOTIVA class-collision gate — ${used.size} classes in KOTIVA markup checked against public/app.css`);
if (offenders.size) {
  console.error(`\nFAIL — ${offenders.size} class(es) also styled by Raed outside .kotiva-raed:`);
  for (const [cls, sels] of offenders) console.error(`  .${cls}  (used in ${used.get(cls)})\n      ${[...sels].slice(0, 4).join('\n      ')}`);
  process.exit(1);
}
console.log('PASS — no unreviewed overlap.');
