/* ============================================================
   KOTIVA™ — Routine Engine test harness
   Run: node tests/routine-engine.test.mjs   (pnpm test)

   Exists because of three defects found in the previous engine
   (2026-08-11 audit), each of which passed every existing check:
     1. 14 of 25 products were unreachable by ANY answer combination
     2. the Experience question was collected and never read
     3. two overlapping acid products were stacked in one routine

   Each is now an asserted invariant, not a remembered caution
   (CLAUDE.md §6 self-improving loop, DEC-160).
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { loadRoutine, ROOT } from './lib/routine.mjs';

/* Ported from the reference (../website/resources/routine/test-routine-engine.mjs). The only
   change is the loading: the reference read routine-model.json + public/js/routine-engine.js;
   this runs the files the THEME ships (src/assets/kotiva/js/routine-model.js — generated
   from that JSON — and routine-engine.js), loaded the way a browser loads them. */
const { model, engine } = loadRoutine();

let failures = 0, checks = 0;
const fail = (name, msg) => { failures++; console.error(`  ✗ ${name}: ${msg}`); };
const ok = (name) => { checks++; console.log(`  ✓ ${name}`); };

/* ---- the full answer matrix ---- */
const ZONES = [['face'], ['body'], ['hair'], ['face', 'body'], ['face', 'body', 'hair']];
const TYPES = ['oily', 'dry', 'combination', 'balanced'];
const SENS = [false, true];
const CONCERNS = model.concerns.options.map(o => o.id);
const SIZES = ['simple', 'essentials', 'full'];
const EXP = ['beginner', 'intermediate', 'advanced'];
const TEX = [null, 'foam', 'gel', 'cream', 'micellar water'];

function* matrix() {
  for (const zones of ZONES)
    for (const skinType of TYPES)
      for (const sensitive of SENS)
        for (const c of CONCERNS)
          for (const routineSize of SIZES)
            for (const experience of EXP)
              yield { zones, skinType, sensitive, concerns: [c], routineSize, experience, texture: null };
}
const all = [...matrix()];
const steps = r => [...r.am, ...r.pm, ...r.anytime];
const run = a => engine.build(a, model);

console.log(`\nKOTIVA routine engine — ${all.length} answer combinations\n`);

/* 1. COVERAGE — every product reachable, or explicitly locked with a reason */
{
  const seen = new Set();
  for (const a of all) {
    const r = run(a);
    steps(r).forEach(s => seen.add(s.id));
    r.addons.forEach(s => seen.add(s.id));
  }
  // multi-concern + texture passes, to reach products needing a combination
  for (const zones of ZONES) for (const sensitive of SENS) for (const texture of TEX) {
    const r = run({ zones, skinType: 'oily', sensitive, concerns: CONCERNS, routineSize: 'full', experience: 'advanced', texture });
    steps(r).forEach(s => seen.add(s.id)); r.addons.forEach(s => seen.add(s.id));
  }
  for (const c of CONCERNS) for (const texture of TEX) for (const skinType of TYPES) {
    const r = run({ zones: ['face', 'body', 'hair'], skinType, sensitive: false, concerns: [c], routineSize: 'full', experience: 'advanced', texture });
    steps(r).forEach(s => seen.add(s.id)); r.addons.forEach(s => seen.add(s.id));
  }
  const ids = Object.keys(model.products).map(Number);
  // A product may be unreachable ONLY if the model declares that deliberately.
  const declared = ids.filter(id => model.products[id].routineExcluded === true);
  const missing = ids.filter(id => !seen.has(id) && !model.products[id].routineExcluded);
  const wrongly = declared.filter(id => seen.has(id));
  if (missing.length) {
    fail('coverage', `unreachable products: ${missing.map(i => `${i} (${model.products[i].name})`).join(', ')}`);
  } else if (wrongly.length) {
    fail('coverage', `declared routineExcluded but still recommended: ${wrongly.join(', ')}`);
  } else {
    ok(`coverage — ${ids.length - declared.length} of ${ids.length} products reachable; ${declared.length} deliberately excluded (${declared.join(', ')})`);
  }
}

/* 2. NO DEAD INPUTS — varying each dimension must change some output */
{
  const base = { zones: ['face'], skinType: 'oily', sensitive: false, concerns: ['acne'], routineSize: 'full', experience: 'advanced', texture: null };
  const sig = a => JSON.stringify(run(a));
  const dims = {
    skinType:    TYPES.map(v => ({ ...base, skinType: v })),
    sensitive:   SENS.map(v => ({ ...base, sensitive: v })),
    concerns:    CONCERNS.map(v => ({ ...base, concerns: [v] })),
    routineSize: SIZES.map(v => ({ ...base, routineSize: v })),
    experience:  EXP.map(v => ({ ...base, experience: v, concerns: ['acne'] })),
    zones:       ZONES.map(v => ({ ...base, zones: v })),
    texture:     TEX.map(v => ({ ...base, texture: v }))
  };
  for (const [dim, variants] of Object.entries(dims)) {
    const outs = new Set(variants.map(sig));
    if (outs.size < 2) fail('dead-input', `'${dim}' never changes the routine — it must not be asked`);
    else ok(`input '${dim}' changes the output (${outs.size} distinct results)`);
  }
}

/* 3. NO ACID STACKING within a single routine */
{
  let bad = null;
  for (const a of all) {
    const r = run(a);
    for (const half of [r.am, r.pm, r.anytime]) {
      const used = [];
      for (const s of half) {
        const acids = model.products[s.id].acids || [];
        if (acids.some(x => used.includes(x))) { bad = { a, half }; break; }
        used.push(...acids);
      }
      if (bad) break;
    }
    if (bad) break;
  }
  bad ? fail('acid-stacking', `two acid products in one routine: ${JSON.stringify(bad.a)} -> ${bad.half.map(s => s.name).join(' + ')}`)
      : ok('no acid-active stacking in any routine');
}

/* 4. SPF NEVER IN THE EVENING (client-stated: "before sun exposure") */
{
  let bad = null;
  for (const a of all) {
    const r = run(a);
    const s = r.pm.find(x => ['spf', 'moisturizer+spf'].includes(model.products[x.id].step));
    if (s) { bad = { a, s }; break; }
  }
  bad ? fail('spf-am-only', `${bad.s.name} placed in the evening routine`) : ok('SPF appears only in the morning routine');
}

/* 5. PM-ONLY PRODUCTS NEVER IN THE MORNING (client-stated slots) */
{
  let bad = null;
  for (const a of all) {
    const r = run(a);
    const s = r.am.find(x => model.products[x.id].slot === 'pm');
    if (s) { bad = { a, s }; break; }
  }
  bad ? fail('slot-honoured', `${bad.s.name} is client-stated PM but appeared in the morning`)
      : ok('client-stated evening-only products never appear in the morning');
}

/* 6. INTIMATE PRODUCTS ARE NEVER SURFACED BY A FACIAL SENSITIVITY MATCH */
{
  let bad = null;
  for (const a of all) {
    if (a.zones.includes('body') && a.concerns.includes('pigmentation')) continue; // the only legitimate route
    const r = run(a);
    const s = [...steps(r), ...r.addons].find(x => model.products[x.id].step === 'intimate');
    if (s) { bad = { a, s }; break; }
  }
  bad ? fail('intimate-isolation', `${bad.s.name} surfaced for ${JSON.stringify(bad.a)}`)
      : ok('intimate-area products never surfaced without an explicit body+pigmentation selection');
}

/* 7. FREQUENCY IS NEVER INVENTED */
{
  let bad = null;
  for (const a of all) {
    for (const s of steps(run(a))) {
      const p = model.products[s.id];
      if (p.frequency === null && s.frequency != null && s.frequency !== p.frequencyReduced) { bad = { a, s }; break; }
    }
    if (bad) break;
  }
  bad ? fail('no-invented-frequency', `${bad.s.name} shows a frequency KOTIVA never stated`)
      : ok('no frequency is shown for products where KOTIVA stated none');
}

/* 8. EVERY ROUTINE IS COHERENT — cleanser first, SPF last, no duplicate step */
{
  let bad = null;
  for (const a of all) {
    if (!a.zones.includes('face')) continue;
    const r = run(a);
    for (const [label, half] of [['am', r.am], ['pm', r.pm]]) {
      if (!half.length) continue;
      if (!['cleanser', 'makeup-removal'].includes(half[0].step)) { bad = `${label} does not start with a cleanser`; break; }
      const stepNames = half.map(s => s.step);
      if (new Set(stepNames).size !== stepNames.length) { bad = `${label} has a duplicated step: ${stepNames.join(',')}`; break; }
      if (label === 'am' && half.length > 2 && half[half.length - 1].step !== 'spf') { bad = `am does not end with SPF: ${stepNames.join(',')}`; break; }
    }
    if (bad) { bad += ` — ${JSON.stringify(a)}`; break; }
  }
  bad ? fail('routine-coherence', bad) : ok('every face routine starts with a cleanser, ends AM on SPF, no duplicate steps');
}

/* 9. NO PRODUCT APPEARS TWICE IN ONE DAY UNLESS KOTIVA SAYS TWICE DAILY */
{
  let bad = null;
  for (const a of all) {
    const r = run(a);
    const amIds = r.am.map(s => s.id);
    for (const s of r.pm) {
      const p = model.products[s.id];
      if (amIds.includes(s.id) && !['both', 'any'].includes(p.slot)) { bad = { a, s }; break; }
    }
    if (bad) break;
  }
  bad ? fail('twice-daily', `${bad.s.name} used morning AND evening but KOTIVA does not state twice-daily use`)
      : ok('products used twice a day are only those KOTIVA states may be');
}

/* 10. A TREATMENT STEP ALWAYS ANSWERS SOMETHING THE USER ASKED FOR */
{
  let bad = null;
  for (const a of all) {
    const r = run(a);
    for (const half of [r.am, r.pm]) {
      const t = half.find(s => s.step === 'treatment');
      if (!t) continue;
      const hit = (model.products[t.id].concerns || []).some(c => a.concerns.includes(c));
      if (!hit) { bad = { a, t }; break; }
    }
    if (bad) break;
  }
  bad ? fail('treatment-relevance', `${bad.t.name} filled a treatment slot but answers none of ${JSON.stringify(bad.a.concerns)}`)
      : ok('treatment steps always answer a concern the user selected');
}

/* 11. CONTEXT-GATED PRODUCTS CARRY KOTIVA'S OWN POSITIONING */
{
  let bad = null;
  for (const a of all) {
    for (const s of steps(run(a))) {
      const p = model.products[s.id];
      if (p.unprompted === false && !s.positioning) { bad = s; break; }
    }
    if (bad) break;
  }
  bad ? fail('positioning', `${bad.name} is context-gated but shown without KOTIVA's positioning`)
      : ok('context-gated products always carry KOTIVA\'s own positioning text');
}

/* 12. RATIFICATION LEDGER IS COMPLETE — every dem-inferred field is declared.
   Provenance lives only in the AUTHORED model (the reference's routine-model.json); the
   generated runtime file the theme ships strips it. So this check reads the reference
   checkout when it is present, and says so when it is not. */
{
  const authored = path.resolve(ROOT, '../website/resources/routine/routine-model.json');
  if (!fs.existsSync(authored)) {
    console.log('  – ratification ledger: skipped (reference checkout not found at ../website)');
  } else {
    const src = JSON.parse(fs.readFileSync(authored, 'utf8'));
    const inferred = [];
    for (const [id, p] of Object.entries(src.products)) {
      for (const [k, v] of Object.entries(p)) {
        if (typeof v === 'string' && v === 'dem-inferred') inferred.push(`${id}.${k}`);
      }
    }
    const rules = src.conflictRules.filter(r => r.provenance === 'dem-inferred');
    if (!inferred.length && !rules.length) fail('ratification', 'no inferred fields declared — provenance tracking is not working');
    else ok(`ratification ledger: ${inferred.length} inferred product fields + ${rules.length} inferred rules declared`);
  }
}

console.log(`\n${failures ? '✗ FAILED' : '✓ PASSED'} — ${checks} checks, ${failures} failures\n`);
process.exit(failures ? 1 : 0);
