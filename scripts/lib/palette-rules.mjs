/* The approved KOTIVA palette + alpha policy (brief §2.2), shared by the source-literal validator
   and the computed-style audit so both gates apply exactly the same rules. Controlled families are
   validated against the AUDITED PRE-MIGRATION baseline (docs/colour-migration/alpha-baseline.json). */
import fs from 'node:fs';
import path from 'node:path';
import { keyOf, normalised } from './colour-literals.mjs';

export const APPROVED = {
  '255,255,255': 'White #FFFFFF',
  '35,31,32': 'Logo black #231F20',
  '138,183,233': 'Cleansing #8AB7E9',
  '0,93,186': 'Hand Care #005DBA',
  '106,50,119': 'Hair #6A3277',
  '215,40,47': 'Skin Repair #D7282F',
  '211,157,216': 'Toner #D39DD8',
  '0,69,57': 'Cleansing deep #004539',
  '236,119,37': 'Sunscreen #EC7725',
  '192,206,219': 'Whitening #C0CEDB',
};

/* §2.2 fixed combinations (alpha 1 = the base colour itself). */
export const FIXED = {
  '255,255,255': [1, 0.78, 0.64, 0.18, 0.4, 0.04, 0.07],
  '35,31,32': [1, 0.72, 0.62, 0.12, 0.3, 0.97, 0.2],
  '138,183,233': [1, 0.18, 0.1, 0.25, 0.15, 0.6],
  '0,93,186': [1, 0.15, 0.4],
  '106,50,119': [1, 0.15],
  '215,40,47': [1, 0.15],
  '211,157,216': [1, 0.15],
  '0,69,57': [1, 0.15],
  '236,119,37': [1, 0.15],
  '192,206,219': [1, 0.4],
};
export const TABLE_ALPHAS = [...new Set(Object.values(FIXED).flat().filter((a) => a !== 1))];

const has = (list, a) => list.some((x) => Math.abs(x - a) < 5e-4);

export function loadPaletteRules(root) {
  const baseline = JSON.parse(fs.readFileSync(path.join(root, 'docs/colour-migration/alpha-baseline.json'), 'utf8'));
  /* Returns null when allowed, otherwise the reason. hit = { kind, raw, colour:{r,g,b,a}|null, shadow } */
  return function verdict(hit) {
    if (hit.kind === 'named') return `named colour "${hit.raw}" — replace with an approved token/literal`;
    if (hit.kind === 'system') return `system colour "${hit.raw}" outside a forced-colors rule`;
    if (!hit.colour) return `unparseable colour "${hit.raw}"`;
    const key = keyOf(hit.colour);
    const a = hit.colour.a;
    if (a === 0) return null; // fully transparent: introduces no colour
    if (key === '0,0,0') {
      if (hit.shadow && has(baseline.shadow.black, a)) return null; // retained existing shadow
      return 'black is allowed only in retained existing shadows at their audited alpha';
    }
    if (!APPROVED[key]) return `base colour ${normalised({ ...hit.colour, a: 1 })} is not in the KOTIVA palette`;
    if (has(FIXED[key], a)) return null;
    if (key === '35,31,32') {
      if (hit.shadow && has(baseline.shadow.ink, a)) return null; // existing-shadow family
      if (!hit.shadow && has(baseline.inkOverlayException.alphas, a)) return null; // documented overlay exception
    }
    if (key === '106,50,119' && has(baseline.editorialOverlay.alphas, a)) return null; // editorial-overlay family
    if (key === '255,255,255' && hit.shadow && has(baseline.whiteHighlightShadowException.alphas, a)) return null;
    if (key === '0,69,57' && (has(baseline.status.green, a) || has(TABLE_ALPHAS, a))) return null; // status family
    if (key === '215,40,47' && (has(baseline.status.red, a) || has(TABLE_ALPHAS, a))) return null; // status family
    return `alpha ${a} on ${APPROVED[key]} is not an approved combination or audited family alpha`;
  };
}
