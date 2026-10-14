#!/usr/bin/env node
/* ============================================================
   KOTIVA palette validator — the AUTHORITATIVE colour gate.

   Ported from the reference site (../website/legacy/scripts/validate-palette.mjs).
   The rules (scripts/lib/palette-rules.mjs), the colour parser
   (scripts/lib/colour-literals.mjs) and the audited alpha baseline
   (docs/colour-migration/alpha-baseline.json) are copied unchanged; only the
   scan scope (scripts/lib/scan-files.mjs) is rewritten for the theme layout.

   Fails unless every colour literal in scope is one of the ten approved KOTIVA
   colours at an approved alpha. Also asserts every --script declaration in
   kotiva.css (source and built copy) is #D7282F.

   Reference debt: the reference site does not pass its own gate (it could not run there —
   ../website/docs/DECISIONS.md D-35). Its kotiva.css, shop.css and the inline <style> blocks
   of its Blade views carry literals the rules reject, and those are ported verbatim. Each
   rejected literal is recorded once, with how many times the reference uses it, in
   docs/colour-migration/reference-debt.json (--record-reference-debt reads ../website).
   The theme may then use each such literal at most that many times, and only in PORTED
   files (the verbatim copies under src/assets/kotiva and public/kotiva, and src/views), plus
   once more in kotiva-salla.css, which restyles Salla's components to match the reference
   rule that uses the literal. The theme's JS and scripts get no allowance at all, and a
   literal the reference never used fails everywhere.

   Run: node scripts/validate-palette.mjs [--include-raed]
        node scripts/validate-palette.mjs --record-reference-debt [--ref ../website]
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractColours, normalised } from './lib/colour-literals.mjs';
import { scanFiles, parserExt } from './lib/scan-files.mjs';
import { loadPaletteRules } from './lib/palette-rules.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const includeRaed = process.argv.includes('--include-raed');
const recordDebt = process.argv.includes('--record-reference-debt');
const refArg = process.argv.indexOf('--ref');
const REF = path.resolve(ROOT, refArg === -1 ? '../website' : process.argv[refArg + 1]);
const DEBT_FILE = path.join(ROOT, 'docs/colour-migration/reference-debt.json');
/* Files that are ports of reference files, and which pool they draw from. The source tree and
   the built output are separate pools: each may carry the reference's literals once over. */
const pool = (rel) => (/^public\/kotiva\//.test(rel) ? 'public'
  : /^(src\/assets\/kotiva\/|src\/views\/)/.test(rel) ? 'src'
  /* kotiva-salla.css restyles Salla's components to match a reference rule; it may repeat
     that rule's literal (one more pool, same counts) — nothing the reference never used. */
  : /^src\/assets\/kotiva-theme\/css\//.test(rel) ? 'bridge'
  : /^public\/kotiva-theme\/css\//.test(rel) ? 'bridge-public' : null);
const debtKey = (hit) => (hit.colour ? normalised(hit.colour) : String(hit.raw).toLowerCase());
const debt = !recordDebt && fs.existsSync(DEBT_FILE) ? JSON.parse(fs.readFileSync(DEBT_FILE, 'utf8')).entries : {};
const debtUsed = new Map();
let tolerated = 0;
const verdict = loadPaletteRules(ROOT);

const failures = [];
let total = 0;
const seen = new Map();
const files = scanFiles(ROOT, { includeRaed });
for (const rel of files) {
  const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  for (const hit of extractColours(text, parserExt(rel))) {
    total++;
    const v = verdict(hit);
    const norm = hit.colour ? normalised(hit.colour) : hit.raw;
    seen.set(norm, (seen.get(norm) || 0) + 1);
    if (!v) continue;
    const p = pool(rel);
    if (p) {
      const k = debtKey(hit);
      const used = debtUsed.get(`${p}|${k}`) || 0;
      if (used < (debt[k] ? debt[k].count : 0)) { debtUsed.set(`${p}|${k}`, used + 1); tolerated++; continue; }
    }
    failures.push(`${rel}:${hit.line}  ${hit.raw}${hit.comment ? ' (in comment)' : ''}  — ${v}`);
  }
}

// Every --script declaration must be KOTIVA red, in the source copy and the built copy.
const scriptChecks = [];
for (const rel of ['src/assets/kotiva/css/kotiva.css', 'public/kotiva/css/kotiva.css']) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) {
    if (rel.startsWith('src/')) failures.push(`${rel}: missing (run node scripts/sync-reference.mjs)`);
    continue;
  }
  const css = fs.readFileSync(abs, 'utf8');
  const decls = [...css.matchAll(/--script\s*:\s*([^;]+);/g)].map((m) => m[1].trim());
  if (!decls.length) failures.push(`${rel}: no --script declarations found (scan broken?)`);
  for (const v of decls) if (v.toUpperCase() !== '#D7282F') failures.push(`${rel}: --script declared as ${v}, must be #D7282F`);
  scriptChecks.push(...decls);
}

if (recordDebt) {
  /* Every reference file the theme ports. */
  const refFiles = ['public/css/kotiva.css', 'public/css/shop.css'];
  for (const dir of ['public/js']) for (const n of fs.readdirSync(path.join(REF, dir))) if (n.endsWith('.js')) refFiles.push(`${dir}/${n}`);
  const views = (dir) => fs.readdirSync(path.join(REF, dir)).filter((n) => n.endsWith('.blade.php')).map((n) => `${dir}/${n}`);
  refFiles.push(...views('resources/views/pages'), 'resources/views/layouts/app.blade.php', 'resources/views/product/show.blade.php',
    'resources/views/shop/index.blade.php', 'resources/views/cart/index.blade.php');
  const entries = {};
  for (const rel of refFiles) {
    const text = fs.readFileSync(path.join(REF, rel), 'utf8');
    const ext = rel.endsWith('.blade.php') ? '.html' : path.extname(rel);
    for (const hit of extractColours(text, ext)) {
      const v = verdict(hit);
      if (!v) continue;
      const k = debtKey(hit);
      entries[k] = entries[k] || { count: 0, reason: v, files: [] };
      entries[k].count++;
      if (!entries[k].files.includes(rel)) entries[k].files.push(rel);
    }
  }
  fs.writeFileSync(DEBT_FILE, JSON.stringify({
    _note: 'Colour literals the palette rules reject that ALREADY exist in the reference site (../website) files this theme ports verbatim. Keyed by normalised colour; count = uses in the reference. Tolerated only in ported files, at most count times per pool (src, public). Recorded by node scripts/validate-palette.mjs --record-reference-debt.',
    entries: Object.fromEntries(Object.entries(entries).sort()),
  }, null, 2) + '\n');
  console.log(`Recorded ${Object.keys(entries).length} distinct reference-debt literal(s) (${Object.values(entries).reduce((a, e) => a + e.count, 0)} uses) from ${refFiles.length} reference files to ${path.relative(ROOT, DEBT_FILE)}.`);
  process.exit(0);
}

console.log('KOTIVA palette validator — scripts/validate-palette.mjs' + (includeRaed ? ' (including Raed styles)' : ''));
console.log(`  scanned ${files.length} files, ${total} colour literals; ${seen.size} distinct normalised values; ${scriptChecks.length} --script declarations; ${tolerated} reference-debt literal use(s) tolerated in ported files`);
if (failures.length) {
  console.error(`\nFAIL — ${failures.length} palette violation(s):`);
  for (const f of failures) console.error(`  FAIL ${f}`);
  process.exit(1);
}
console.log('\nPASS — every colour literal is an approved KOTIVA base colour with an approved alpha.');
