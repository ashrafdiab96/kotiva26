#!/usr/bin/env node
/* ============================================================
   Screenshot + geometry capture for the KOTIVA port (visual regression).

   Ported from the reference (../website/legacy/scripts/screenshot-pages.mjs). For every page
   family (scripts/lib/pages.mjs) × {desktop 1440, mobile 390} × {light, dark}: a full-page
   screenshot plus a geometry snapshot of every element (position, size, font, visibility,
   image source, own text) and console errors / failed requests.

   Usage:
     KOTIVA_REF_URL=http://localhost:8000 KOTIVA_REF_STORE_URL=https://<store> \
       node scripts/screenshot-pages.mjs --label reference
     KOTIVA_THEME_URL=<salla theme preview URL> node scripts/screenshot-pages.mjs --label theme
     node scripts/compare-screenshots.mjs
   Output: scratch/visual/<label>/ (git-ignored).
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { CELLS, loadFamilies, newModeContext, settle } from './lib/pages.mjs';
import { ANSWERS } from '../tests/lib/routine.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? def : process.argv[i + 1];
};
const label = arg('label', 'theme');
const only = arg('only', null);
const outDir = path.resolve(ROOT, arg('out', 'scratch/visual'), label);
const { file, families } = loadFamilies(ROOT);
const trim = (u) => String(u || '').replace(/\/+$/, '');
const base = label === 'reference' ? trim(process.env.KOTIVA_REF_URL) : trim(process.env.KOTIVA_THEME_URL);
const storeBase = trim(process.env.KOTIVA_REF_STORE_URL || process.env.KOTIVA_THEME_URL);
if (!base) {
  console.error(`Set ${label === 'reference' ? 'KOTIVA_REF_URL' : 'KOTIVA_THEME_URL'} (see the header of this file).`);
  process.exit(2);
}
fs.mkdirSync(outDir, { recursive: true });

const urlFor = (family) => {
  const p = label === 'reference' ? family.reference : family.theme;
  return p.startsWith('store:') ? storeBase + p.slice(6) : base + p;
};

/* Complete the Routine Finder with the fixed answers, so the result page can be compared. */
async function runQuiz(page) {
  const pick = (step, value) => page.locator(`#step-${step} .quiz-option[data-value="${value}"]`).click();
  const next = (step) => page.locator(`#next-${step}`).click();
  for (const z of ANSWERS.zones) await pick(0, z);
  await next(0);
  await pick(1, ANSWERS.skinType); await next(1);
  await pick(2, ANSWERS.sensitive ? 'yes' : 'no'); await next(2);
  for (const c of ANSWERS.concerns) await pick(3, c);
  await next(3);
  await pick(4, ANSWERS.routineSize); await next(4);
  await pick(5, ANSWERS.experience); await next(5);
  await pick(6, ANSWERS.texture ?? '');
  await page.locator('#build-btn').click();
  await page.locator('#result-section.visible').waitFor();
}

const browser = await chromium.launch();
const loadReport = [];

async function capture(family, cell) {
  const context = await newModeContext(browser, cell);
  const page = await context.newPage();
  const errors = [];
  const failed = [];
  const url = urlFor(family);
  const origin = new URL(url).origin;
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', (err) => errors.push(String(err)));
  page.on('response', (res) => { if (res.status() >= 400 && res.url().startsWith(origin)) failed.push(`${res.status()} ${res.url().slice(origin.length)}`); });
  page.on('requestfailed', (req) => { if (req.url().startsWith(origin)) failed.push(`FAILED ${req.url().slice(origin.length)}`); });

  await page.goto(url, { waitUntil: 'networkidle' });
  if (family.quiz) await runQuiz(page);
  await settle(page);

  const geometry = await page.evaluate(() => {
    const rows = [];
    const round = (n) => Math.round(n * 2) / 2;
    let i = 0;
    for (const el of document.body.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      let own = '';
      for (const n of el.childNodes) if (n.nodeType === 3) own += n.textContent;
      rows.push({
        i: i++,
        tag: el.tagName.toLowerCase(),
        cls: typeof el.className === 'string' ? el.className : (el.className && el.className.baseVal) || '',
        inSalla: Boolean(el.closest('[class^="s-"], [class*=" s-"]')) || /^salla-/.test(el.tagName.toLowerCase()) || Boolean(el.parentElement && el.parentElement.closest('[data-testid^="store-"], salla-add-product-button, salla-quantity-input, salla-slider, salla-comments, salla-installment, salla-button')),
        x: round(r.left + window.scrollX),
        y: round(r.top + window.scrollY),
        w: round(r.width),
        h: round(r.height),
        font: `${cs.fontFamily}|${cs.fontSize}|${cs.fontWeight}|${cs.fontStyle}|${cs.lineHeight}|${cs.letterSpacing}|${cs.textTransform}`,
        color: `${cs.color}|${cs.backgroundColor}`,
        vis: `${cs.display}|${cs.visibility}|${cs.opacity}`,
        src: el.tagName === 'IMG' ? el.currentSrc.replace(location.origin, '') : '',
        text: own.replace(/\s+/g, ' ').trim().slice(0, 80),
      });
    }
    return {
      url: location.href,
      scrollHeight: document.documentElement.scrollHeight,
      scrollWidth: document.documentElement.scrollWidth,
      htmlMode: document.documentElement.dataset.mode || 'light',
      rows,
    };
  });

  const name = `${family.id}__${cell.id}`;
  fs.writeFileSync(path.join(outDir, `${name}.geometry.json`), JSON.stringify(geometry));
  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: true, animations: 'disabled' });
  loadReport.push({ page: family.id, cell: cell.id, url, consoleErrors: errors, failedRequests: [...new Set(failed)] });
  await context.close();
  process.stdout.write(`  captured ${name}\n`);
}

const jobs = [];
for (const f of families) if (!only || only.split(',').includes(f.id)) for (const c of CELLS) jobs.push([f, c]);
const POOL = 4;
let next = 0;
await Promise.all(Array.from({ length: POOL }, async () => {
  while (next < jobs.length) {
    const [f, c] = jobs[next++];
    try {
      await capture(f, c);
    } catch (e) {
      loadReport.push({ page: f.id, cell: c.id, captureError: String(e) });
      process.stdout.write(`  ERROR ${f.id}__${c.id}: ${e}\n`);
    }
  }
}));

loadReport.sort((a, b) => (a.page + a.cell).localeCompare(b.page + b.cell));
fs.writeFileSync(path.join(outDir, 'load-report.json'), JSON.stringify(loadReport, null, 2));
await browser.close();
const errs = loadReport.filter((r) => r.captureError || (r.consoleErrors && r.consoleErrors.length) || (r.failedRequests && r.failedRequests.length));
console.log(`\n${jobs.length} captures (${file}) -> ${path.relative(ROOT, outDir)}; ${errs.length} with console errors / failed requests / capture errors`);
