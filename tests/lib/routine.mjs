/* Load the theme's shipped Routine Finder engine and model exactly as a browser does:
   both are plain scripts that attach to window (src/assets/kotiva/js — verbatim copies of
   the reference, see scripts/sync-reference.mjs). */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export function loadRoutine() {
  const window = {};
  // self === window in a browser; the engine's UMD wrapper attaches to self.
  const context = vm.createContext({ window, self: window, console });
  for (const file of ['routine-model.js', 'routine-engine.js']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'src/assets/kotiva/js', file), 'utf8'), context, { filename: file });
  }
  return { model: window.KOTIVA_ROUTINE_MODEL, engine: window.KOTIVA_ENGINE };
}

export const catalog = () => JSON.parse(fs.readFileSync(path.join(ROOT, 'src/assets/kotiva-theme/data/catalog.json'), 'utf8')).products;

/* The fixed answer set the e2e test clicks through. */
export const ANSWERS = {
  zones: ['face'],
  skinType: 'oily',
  sensitive: false,
  concerns: ['acne', 'oil'],
  routineSize: 'full',
  experience: 'intermediate',
  texture: 'gel',
};

/* What the engine recommends for ANSWERS, as Salla links: Laravel id → SKU (KOT{id:3}) →
   the Salla product id (/p<id> in every Salla product URL). */
export function expectedRoutine() {
  const { model, engine } = loadRoutine();
  const result = engine.build(JSON.parse(JSON.stringify(ANSWERS)), model);
  const byId = new Map(catalog().map((p) => [p.id, p]));
  const steps = [...result.am, ...result.pm, ...result.anytime];
  const products = [];
  for (const s of steps) {
    const meta = byId.get(s.id);
    if (meta && !products.some((p) => p.id === meta.id)) products.push({ id: meta.id, sku: meta.sku, sallaId: meta.salla.id, name: s.name });
  }
  return { result, products };
}
