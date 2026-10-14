/* ============================================================
   KOTIVA™ — Routine Engine v1
   Pure, deterministic, explainable. No DOM, no globals beyond the
   export. Runs identically in the browser and in Node (tests).

   build(answers, products, model) -> { am, pm, anytime, addons, notes }

   Every rule that is DEM's editorial judgement rather than a KOTIVA
   assertion is marked `ratify: true` in data/routine-model.json and is
   listed in the client ratification sheet. The engine reads rules from
   the model — it does not encode them in branches. That is deliberate:
   the previous engine's `else if` chain silently made one concern
   outrank sensitivity.
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.KOTIVA_ENGINE = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* Slot plans per zone. Order IS the application order (model.stepOrder).
     `min` marks the steps that survive a "Simple" routine. */
  var PLANS = {
    face: {
      am: [
        { step: 'cleanser',   min: true  },
        { step: 'toner',      min: false },
        { step: 'treatment',  min: false, needsConcern: true },
        { step: 'moisturizer',min: true  },
        { step: 'spf',        min: true  }
      ],
      pm: [
        { step: 'makeup-removal', min: false },
        { step: 'cleanser',       min: true  },
        { step: 'toner',          min: false },
        { step: 'treatment',      min: false, needsConcern: true },
        { step: 'moisturizer',    min: true  }
      ]
    },
    body: {
      any: [
        { step: 'cleanser',          min: true,  zone: 'body' },
        { step: 'intimate-cleanser', min: false },
        { step: 'hand-care',         min: false },
        { step: 'deodorant',         min: false },
        { step: 'intimate-care',     min: false },
        { step: 'treatment',         min: false }
      ]
    },
    hair: {
      any: [
        { step: 'hair-cleanser',  min: true },
        { step: 'hair-treatment', min: true }
      ]
    }
  };

  /* Which product `step` values can fill a plan slot. */
  var FILLS = {
    'cleanser':       ['cleanser'],
    'makeup-removal': ['makeup-removal'],
    'toner':          ['toner'],
    'treatment':      ['serum', 'spot-treatment'],
    'moisturizer':    ['moisturizer', 'moisturizer+spf'],
    'spf':            ['spf', 'moisturizer+spf'],
    'hand-care':         ['hand-care'],
    'deodorant':         ['deodorant'],
    'intimate-cleanser': ['intimate-cleanser'],
    'intimate-care':     ['intimate-care'],
    'hair-cleanser':  ['hair-cleanser'],
    'hair-treatment': ['hair-treatment']
  };

  var SIZE_EXTRA = { simple: 0, essentials: 1, full: 9 };

  function inSlot(p, slot) {
    if (slot === 'any') return true;
    if (p.slot === 'both' || p.slot === 'any' || p.slot === 'either') return true;
    return p.slot === slot;
  }

  /* ---- exclusions -------------------------------------------------
     Returns a reason string when the product must not be offered, else null.
     Order matters only for which reason is reported. */
  function excluded(p, a) {
    if (p.unprompted === false) {
      // Locked products need an explicit contextual unlock.
      if (p.step === 'intimate-care' || p.step === 'intimate-cleanser') {
        var wantsBody = a.zones.indexOf('body') !== -1;
        if (!(wantsBody && a.concerns.indexOf('pigmentation') !== -1)) return 'intimate-isolation';
      } else if (p.step === 'lip') {
        return 'addon-only';
      } else if (p.id === 15) {
        if (a.concerns.indexOf('barrier') === -1 && !a.sensitive) return 'post-procedure-context';
      } else if (p.id === 10) {
        if (a.concerns.indexOf('sun') === -1) return 'occasion-only';
      }
    }
    if (a.sensitive && p.sensitivitySafe === false) return 'sensitivity';
    // Tolerance gate: beginners are not shown multi-acid products.
    if (a.experience === 'beginner' && (p.acids || []).length >= 2) return 'actives-experience';
    return null;
  }

  function score(p, a, slotName) {
    var s = 0, why = [];
    for (var i = 0; i < a.concerns.length; i++) {
      if ((p.concerns || []).indexOf(a.concerns[i]) !== -1) {
        var w = (a.concerns.length - i) * 2;      // rank 1 weighs most
        s += w;
        why.push(i === 0 ? 'concern-primary' : 'concern');
      }
    }
    /* The client's own concern ORDER carries emphasis: product 2 is framed
       acne-led, product 6 oil-led, though both list the same two concerns.
       Reward alignment of primaries so the range's own framing decides,
       rather than an arbitrary id tie-break. */
    if (a.concerns.length && (p.concerns || [])[0] === a.concerns[0]) {
      s += 2; why.push('primary-aligned');
    }
    var types = p.skinTypes || [];
    if (a.skinType && types.indexOf(a.skinType) !== -1) { s += 3; why.push('skin-type'); }
    else if (types.length === 0) { s += 1; }
    if (a.sensitive && p.sensitivitySafe === true) { s += 3; why.push('sensitive-safe'); }
    if (a.texture && slotName === 'cleanser' && p.format === a.texture) { s += 2; why.push('texture'); }
    if (p.slotProv === 'client-stated' && (p.slot === 'am' || p.slot === 'pm')) s += 1;
    return { score: s, why: why };
  }

  function conflicts(p, chosen) {
    var acids = p.acids || [];
    if (!acids.length) return false;
    for (var i = 0; i < chosen.length; i++) {
      var other = chosen[i].acids || [];
      for (var j = 0; j < acids.length; j++) {
        if (other.indexOf(acids[j]) !== -1) return true;   // acid-stacking rule
      }
    }
    return false;
  }

  function reasonText(why, p, a) {
    var out = [];
    if (why.indexOf('concern-primary') !== -1) out.push('Targets your main concern');
    else if (why.indexOf('concern') !== -1) out.push('Targets a concern you selected');
    if (why.indexOf('skin-type') !== -1) out.push('Suited to ' + a.skinType + ' skin');
    if (why.indexOf('sensitive-safe') !== -1) out.push('KOTIVA states it is suitable for sensitive skin');
    if (why.indexOf('texture') !== -1) out.push('Matches your preferred texture');
    if (!out.length) out.push('Completes this step of the routine');
    return out.join(' · ');
  }

  function pick(slot, pool, a, chosen, slotName) {
    var allowed = FILLS[slot.step] || [slot.step];
    var best = null;
    for (var i = 0; i < pool.length; i++) {
      var p = pool[i];
      if (allowed.indexOf(p.step) === -1) continue;
      if (slot.zone && (p.zone || []).indexOf(slot.zone) === -1) continue;
      if (!inSlot(p, slotName)) continue;
      if (chosen.indexOf(p) !== -1) continue;
      if (conflicts(p, chosen)) continue;
      /* A concern-driven slot is left EMPTY rather than filled with a product
         that answers none of what the user actually asked about. Without this,
         a sensitive user asking about acne is handed a scar gel purely because
         it is the only sensitivity-safe candidate left standing. */
      if (slot.needsConcern) {
        var hit = (p.concerns || []).some(function (c) { return a.concerns.indexOf(c) !== -1; });
        if (!hit) continue;
      }
      var r = score(p, a, slot.step);
      if (!best || r.score > best.score || (r.score === best.score && p.id < best.p.id)) {
        best = { p: p, score: r.score, why: r.why };
      }
    }
    return best;
  }

  function frequencyFor(p, a) {
    if (a.sensitive && p.frequencyReduced) return p.frequencyReduced;
    return p.frequency;      // null stays null — never invented
  }

  function buildRoutine(planKey, zoneKey, pool, a, sizeExtra) {
    var plan = PLANS[zoneKey] && PLANS[zoneKey][planKey];
    if (!plan) return [];
    var chosen = [], steps = [], optionalBudget = sizeExtra;
    for (var i = 0; i < plan.length; i++) {
      var slot = plan[i];
      if (!slot.min && optionalBudget <= 0) continue;
      var best = pick(slot, pool, a, chosen, planKey === 'any' ? 'any' : planKey);
      if (!best) continue;
      if (!slot.min) optionalBudget--;
      chosen.push(best.p);
      steps.push({
        id: best.p.id,
        step: slot.step,
        name: best.p.name,
        reason: reasonText(best.why, best.p, a),
        frequency: frequencyFor(best.p, a),
        cautions: best.p.cautions || [],
        /* Context-gated products carry KOTIVA's own positioning so the result
           never silently rebrands e.g. a post-procedure cream as a daily one. */
        positioning: best.p.positioning || null
      });
    }
    return steps;
  }

  function build(answers, model) {
    var a = {
      zones:      (answers.zones && answers.zones.length) ? answers.zones : ['face'],
      skinType:   answers.skinType || null,
      sensitive:  !!answers.sensitive,
      concerns:   answers.concerns || [],
      routineSize: answers.routineSize || 'essentials',
      experience: answers.experience || 'intermediate',
      texture:    answers.texture || null
    };

    var products = [];
    Object.keys(model.products).forEach(function (id) {
      var p = Object.assign({ id: parseInt(id, 10) }, model.products[id]);
      products.push(p);
    });

    var notes = [], pool = [];
    products.forEach(function (p) {
      var zoneHit = (p.zone || []).some(function (z) {
        return a.zones.indexOf(z) !== -1 || (z === 'intimate' && a.zones.indexOf('body') !== -1);
      });
      if (!zoneHit) return;
      var ex = excluded(p, a);
      if (ex) { notes.push({ id: p.id, excluded: ex }); return; }
      pool.push(p);
    });

    var extra = SIZE_EXTRA[a.routineSize] != null ? SIZE_EXTRA[a.routineSize] : 1;
    var out = { am: [], pm: [], anytime: [], addons: [], notes: notes };

    if (a.zones.indexOf('face') !== -1) {
      out.am = buildRoutine('am', 'face', pool, a, extra);
      out.pm = buildRoutine('pm', 'face', pool, a, extra);
    }
    if (a.zones.indexOf('body') !== -1) {
      out.anytime = out.anytime.concat(buildRoutine('any', 'body', pool, a, extra + 2));
    }
    if (a.zones.indexOf('hair') !== -1) {
      out.anytime = out.anytime.concat(buildRoutine('any', 'hair', pool, a, extra + 2));
    }

    /* Add-ons: client-relevant products that are deliberately never auto-inserted
       into a core routine, offered explicitly instead. */
    products.forEach(function (p) {
      if (p.unprompted !== false) return;
      /* Product 8 is deliberately NOT offered to everyone: KOTIVA positions it
         for post-filler recovery, and surfacing it unprompted would imply a
         cosmetic procedure the quiz never asked about. */
      if (p.id === 10 && a.concerns.indexOf('sun') !== -1) {
        out.addons.push({ id: p.id, name: p.name, note: 'For use after sun exposure.' });
      }
    });

    /* Unmet concerns — say so rather than silently returning less.
       A concern the user selected that no recommended product addresses is
       explained, with the reason drawn from why its candidates were dropped. */
    var used = steps_(out).map(function (s) { return s.id; });
    out.gaps = [];
    a.concerns.forEach(function (c) {
      var answered = used.some(function (id) {
        return (model.products[id].concerns || []).indexOf(c) !== -1;
      });
      if (answered) return;
      var why = null;
      products.forEach(function (p) {
        if ((p.concerns || []).indexOf(c) === -1) return;
        var ex = notes.filter(function (n) { return n.id === p.id; })[0];
        if (ex && !why) why = ex.excluded;
      });
      out.gaps.push({ concern: c, reason: why || 'no-product' });
    });

    return out;
  }

  function steps_(r) { return [].concat(r.am, r.pm, r.anytime); }

  return { build: build, PLANS: PLANS, FILLS: FILLS };
}));
