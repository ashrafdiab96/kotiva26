/* ============================================================
   Routine Finder end-to-end, against a live theme preview.

   Run (operator):  KOTIVA_ROUTINE_URL="<preview URL of the Routine Finder page>" pnpm test:e2e
   The URL is the page `salla theme preview` opens for the Salla page configured as the
   Routine Finder (Theme settings → KOTIVA pages), e.g. https://<store>/routine-finder/page-123.

   Completes the quiz with a fixed answer set (tests/lib/routine.mjs ANSWERS) and asserts that
   every product the engine recommends for those answers — computed here from the same
   shipped engine + model — is linked to its real Salla product page (/p<salla id>), and that
   "Shop These Products" carries the routine's SKUs (?routine=KOT…).
   ============================================================ */
import { test, expect } from '@playwright/test';
import { ANSWERS, expectedRoutine } from '../lib/routine.mjs';

const URL = process.env.KOTIVA_ROUTINE_URL;

test.skip(!URL, 'Set KOTIVA_ROUTINE_URL to the preview URL of the Routine Finder page.');

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`quiz → Salla product links (${viewport.width}px)`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));

    await page.goto(URL, { waitUntil: 'networkidle' });
    const { products } = expectedRoutine();
    expect(products.length).toBeGreaterThan(0);

    const pick = async (step, value) => {
      await page.locator(`#step-${step} .quiz-option[data-value="${value}"]`).click();
    };
    const next = async (step) => {
      await page.locator(`#next-${step}`).click();
      await expect(page.locator(`#step-${step + 1}`)).toHaveClass(/active/);
    };

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

    await expect(page.locator('#result-section')).toHaveClass(/visible/);
    const hrefs = await page.locator('#result-grid a.result-step').evaluateAll((as) => as.map((a) => a.href));
    for (const p of products) {
      expect(hrefs.some((h) => new RegExp(`/p${p.sallaId}(?:[/?#]|$)`).test(h)), `${p.sku} ${p.name} → /p${p.sallaId}`).toBe(true);
    }
    const cta = await page.locator('#shop-routine-cta').getAttribute('href');
    expect(cta).toContain(`?routine=${products.map((p) => p.sku).join(',')}`);
    expect(errors).toEqual([]);
  });
}
