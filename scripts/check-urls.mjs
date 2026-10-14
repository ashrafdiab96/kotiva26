#!/usr/bin/env node
/* The brief's hostname gate: no KOTIVA site/store hostname and no localhost anywhere in src/
   (equivalent to `grep -rn "klyvosystems.com\|kotiva.co\|localhost" src` returning nothing).
   Every URL in the theme comes from Salla (store.url, link(), |asset) or Theme settings. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PATTERN = /klyvosystems\.com|kotiva\.co\b|localhost/i;
const TEXT = /\.(twig|js|mjs|css|scss|json|svg|txt|html)$/i;
const hits = [];

(function walk(dir) {
  for (const ent of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = path.posix.join(dir, ent.name);
    if (ent.isDirectory()) walk(rel);
    else if (TEXT.test(ent.name)) {
      fs.readFileSync(path.join(ROOT, rel), 'utf8').split('\n').forEach((line, i) => {
        if (PATTERN.test(line)) hits.push(`${rel}:${i + 1}  ${line.trim().slice(0, 140)}`);
      });
    }
  }
}('src'));

if (hits.length) {
  console.error(`FAIL — ${hits.length} hard-coded host(s) in src/:\n  ${hits.join('\n  ')}`);
  process.exit(1);
}
console.log('PASS — no klyvosystems.com / kotiva.co / localhost in src/.');
