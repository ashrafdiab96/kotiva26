/* Palette-gate scan scope for the Salla theme.

   KOTIVA-owned files — every Twig view, the verbatim reference copies, the
   theme's own KOTIVA code, and their built output — are always scanned.
   Raed's inherited SCSS and its compiled app.css are scanned only with
   --include-raed: they style Salla's own components and the customer pages,
   carry Raed's colours, and are tracked as a known exception in
   docs/DECISIONS.md rather than silently excluded.

   Twig is scanned as HTML (attributes, <style> blocks); SCSS as CSS. */
import fs from 'node:fs';
import path from 'node:path';

const TEXT = /\.(css|scss|m?js|svg|json|txt|twig|html)$/i;

export function scanFiles(root, { includeRaed = false } = {}) {
  const out = [];
  const walk = (dir, filter) => {
    const abs = path.join(root, dir);
    if (!fs.existsSync(abs)) return;
    for (const ent of fs.readdirSync(abs, { withFileTypes: true })) {
      const rel = path.posix.join(dir, ent.name);
      if (ent.isDirectory()) walk(rel, filter);
      else if (filter(ent.name, rel)) out.push(rel);
    }
  };
  walk('src/views', (n) => n.endsWith('.twig'));
  walk('src/assets/kotiva', (n) => TEXT.test(n));
  walk('src/assets/kotiva-theme', (n) => TEXT.test(n));
  walk('public/kotiva', (n) => TEXT.test(n));
  walk('public', (n, rel) => /^public\/kotiva-[\w-]+\.(css|js)$/.test(rel));
  walk('scripts', (n) => /\.m?js$/.test(n));
  if (includeRaed) {
    walk('src/assets/styles', (n) => n.endsWith('.scss'));
    walk('public', (n, rel) => rel === 'public/app.css');
  }
  return [...new Set(out)].sort();
}

/* The extension the colour parser should treat a file as. */
export function parserExt(rel) {
  const ext = path.extname(rel).toLowerCase();
  if (ext === '.twig') return '.html';
  if (ext === '.scss') return '.css';
  return ext;
}
