/* Page matrix for the visual-regression capture (scripts/screenshot-pages.mjs).

   Each page family has a path on the REFERENCE (the Laravel site, or — for the shop pages,
   which already live on Salla — the live store running the customizer) and a path on the
   THEME preview. Salla page URLs carry ids (/about/page-123) and product URLs carry
   product ids, so the theme paths are read from scripts/visual-pages.json, which the
   operator fills in once (copy visual-pages.example.json). CELLS, newModeContext() and
   settle() are the reference's own (../website/legacy/scripts/lib/pages.mjs), unchanged. */
import fs from 'node:fs';
import path from 'node:path';

export const CELLS = [
  { id: 'desktop-light', viewport: { width: 1440, height: 900 }, mode: 'light' },
  { id: 'desktop-dark', viewport: { width: 1440, height: 900 }, mode: 'dark' },
  { id: 'm390-light', viewport: { width: 390, height: 844 }, mode: 'light' },
  { id: 'm390-dark', viewport: { width: 390, height: 844 }, mode: 'dark' },
];

export function loadFamilies(root) {
  const file = ['scripts/visual-pages.json', 'scripts/visual-pages.example.json']
    .map((f) => path.join(root, f)).find((f) => fs.existsSync(f));
  const config = JSON.parse(fs.readFileSync(file, 'utf8'));
  return { file: path.relative(root, file), families: config.families };
}

/* Persist the site's own mode key before any script runs, exactly as a returning visitor would. */
export async function newModeContext(browser, cell, extra = {}) {
  const context = await browser.newContext({
    viewport: cell.viewport,
    reducedMotion: 'reduce',
    colorScheme: 'light',
    ...extra,
  });
  await context.addInitScript((mode) => {
    try { localStorage.setItem('kotiva-mode', mode); } catch (e) { /* storage blocked */ }
  }, cell.mode);
  return context;
}

/* Scroll the whole document so lazy images load and reveal classes settle, then return to top. */
export async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    const step = Math.max(300, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise((r) => setTimeout(r, 120));
    await Promise.all([...document.images].map((img) => (img.complete ? null : img.decode().catch(() => null))));
    window.scrollTo(0, 0);
    // CSS transitions still run under reduced motion: the nav (0.3s colours, 0.35s transform) and
    // [data-theme] sections (0.6s background) must finish before anything is read or captured.
    await new Promise((r) => setTimeout(r, 900));
  });
  await page.waitForLoadState('networkidle').catch(() => {});
}
