/* ============================================================
   KOTIVA product page behaviour (components/kotiva/pdp.twig).

   1. Salla's add-to-cart wears the reference's .btn .btn-primary (salla-adopt.js).
   2. Copy from Salla: product.description is parsed with the Salla customizer's own parser
      (../website/salla/kotiva-salla.js parseDescription(), ported unchanged below) and, when
      it yields copy, replaces the server-rendered reference copy piece by piece. So the
      merchant can edit the text in Salla and the page follows; a description that does not
      follow the format leaves the reference copy in place.
   3. "Complete your routine": live prices and stock, in-stock first (ProductController::show()).
   ============================================================ */
import { adopt } from './salla-adopt';
import { esc, priceHtml } from './cards';

const S = window.KOTIVA_SALLA;
const root = document.querySelector('[data-kotiva-pdp]');

adopt('.pdp-buy salla-add-product-button', 'button', ['btn', 'btn-primary']);

/* ── Description → text with the line breaks the parser relies on ──────────
   The customizer read a rendered element's innerText; a <template> has no rendering, so the
   block-level breaks innerText would produce are restored by hand. */
function descriptionText() {
  const tpl = document.getElementById('kotiva-pdp-description');
  if (!tpl) return '';
  const html = tpl.innerHTML
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|ul|ol|tr|section|article)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n');
  const box = document.createElement('div');
  box.innerHTML = html;
  return (box.textContent || '').replace(/ /g, ' ');
}

/* Parse Salla's flat description into the Laravel PDP structure:
   intro paragraph, spec grid, Key Benefits, How to use, Key ingredients.
   — verbatim from kotiva-salla.js, except that it takes the text instead of the element. */
function parseDescription(text) {
  const raw = (text || '').replace(/\r/g,'').replace(/[ \t]+/g,' ').trim();
  if (!raw) return null;
  const labels = ['Volume','Skin type','Concern','Benefits','How to use','Key ingredients'];
  // 'Volume:' style fields use a colon; 'Benefits' / 'How to use' / 'Key ingredients' are headings on their own line.
  const re = new RegExp(`(?:^|\\n)\\s*(${labels.join('|')})\\s*:?\\s*(?=\\S|$)`, 'ig');
  const hits = []; let m;
  while ((m = re.exec(raw))) hits.push({ label: m[1].toLowerCase(), index: m.index, end: m.index + m[0].length });
  const out = { intro: raw.slice(0, hits.length ? hits[0].index : raw.length), volume:'', skin:'', concern:'', benefits:[], howTo:'', ingredients:[] };
  const listOf = (t) => t.split(/\n+|•|·|(?<=[a-z\)])\s{2,}/).map((x) => x.replace(/^[-–•\s]+/,'').trim()).filter((x) => x.length > 2);
  hits.forEach((hit, i) => {
    const text = raw.slice(hit.end, hits[i+1] ? hits[i+1].index : raw.length).trim();
    if (hit.label === 'volume') out.volume = text.split('\n')[0].trim();
    else if (hit.label === 'skin type') out.skin = text.split('\n')[0].trim();
    else if (hit.label === 'concern') out.concern = text.split('\n')[0].trim();
    else if (hit.label === 'benefits') out.benefits = listOf(text);
    else if (hit.label === 'how to use') out.howTo = text.replace(/\s+/g,' ').trim();
    else if (hit.label === 'key ingredients') out.ingredients = listOf(text);
  });
  out.intro = out.intro.replace(/\s+/g,' ').trim();
  return out;
}

function setFact(key, label, value) {
  if (!value) return;
  const grid = root.querySelector('.pdp-facts');
  if (!grid) return;
  const fact = grid.querySelector(`[data-fact="${key}"] .pdp-fact-value`);
  if (fact) fact.textContent = value;
}

function applySallaCopy() {
  if (!root) return;
  const parsed = parseDescription(descriptionText());
  // The customizer's rule: use the parse only when it produced editorial copy.
  if (!parsed || !(parsed.intro || parsed.benefits.length || parsed.howTo)) return;
  const copy = root.querySelector('[data-kotiva-copy]');
  if (parsed.intro) copy.querySelector('.pdp-description').textContent = parsed.intro;
  if (parsed.benefits.length) {
    let list = copy.querySelector('.pdp-benefits-list');
    if (!list) {
      copy.querySelector('.pdp-how-to').insertAdjacentHTML('beforebegin', '<div class="pdp-benefits" style="margin-bottom:8px;"><p class="t-eyebrow" style="margin-bottom:12px; color:var(--fg-dim);">Key Benefits</p><ul class="pdp-benefits-list"></ul></div>');
      list = copy.querySelector('.pdp-benefits-list');
    }
    list.innerHTML = parsed.benefits.map((b) => `<li>${esc(b)}</li>`).join('');
  }
  if (parsed.ingredients.length) {
    let pills = copy.querySelector('.pdp-ingredients-list');
    if (!pills) {
      copy.querySelector('.pdp-how-to').insertAdjacentHTML('beforebegin', '<div style="margin-bottom:8px;"><p class="t-eyebrow" style="margin-bottom:12px; color:var(--fg-dim);">Key Ingredients</p><div class="pdp-ingredients-list"></div></div>');
      pills = copy.querySelector('.pdp-ingredients-list');
    }
    pills.innerHTML = parsed.ingredients.map((i) => `<span class="pdp-ingredient-pill">${esc(i)}</span>`).join('');
  }
  if (parsed.howTo) copy.querySelector('.pdp-how-text').textContent = parsed.howTo;
  if (parsed.skin) {
    root.querySelector('[data-kotiva-field="skin"]').textContent = parsed.skin;
    setFact('skin', 'Skin type', parsed.skin);
  }
  if (parsed.concern) {
    root.querySelector('[data-kotiva-field="claim"]').textContent = parsed.concern;
    setFact('target', 'Targets', parsed.concern);
  }
  if (parsed.volume) {
    const line = root.querySelector('[data-kotiva-field="category-line"]');
    line.textContent = `${line.dataset.category} · ${parsed.volume}`;
    setFact('size', 'Size', parsed.volume);
  }
}

/* ── Complete your routine ─────────────────────────────────────────── */
function relatedCardHtml(meta, live) {
  const soldOut = Boolean(live && live.isOutOfStock);
  return `<a class="product-card${soldOut ? ' is-sold-out' : ''}" href="${esc(S.productUrl(meta.sku, live))}" data-kotiva-sku="${esc(meta.sku)}" data-sku="${esc(meta.sku)}" style="border:none;">
          <div class="product-card-img">
            <img class="loaded" src="${esc(meta.imageUrl)}" alt="${esc(meta.displayName)}" loading="lazy">${soldOut ? '<span class="product-card-flag">Sold out</span>' : ''}
          </div>
          <div class="product-card-body">
            <div class="product-card-name">${esc(meta.displayName)}</div>
            <div class="product-card-desc">${esc(meta.category)} &middot; ${esc(meta.skinType)}</div>
            <div class="product-card-price" data-kotiva-price>${priceHtml(live)}</div>
            <div class="product-card-footer"><span class="badge-concern">${esc(meta.concern)}</span><span class="product-card-cta">${soldOut ? 'Sold out' : 'Discover'}</span></div>
          </div>
        </a>`;
}

function hydrateRelated() {
  const section = document.querySelector('[data-kotiva-related]');
  if (!section || !S) return;
  const skus = section.dataset.kotivaRelated.split(',').filter(Boolean);
  const grid = section.querySelector('.related-grid');
  S.liveProducts().then((live) => {
    if (!live.size) return; // store unreachable: keep the server render
    const rows = skus.map((sku) => ({ meta: S.bySku(sku), live: live.get(sku) }))
      .filter((r) => r.meta && r.live) // only products still sold on Salla
      .sort((a, b) => Number(a.live.isOutOfStock) - Number(b.live.isOutOfStock) || a.meta.id - b.meta.id)
      .slice(0, 4);
    if (!rows.length) { section.remove(); return; }
    grid.innerHTML = rows.map((r) => relatedCardHtml(r.meta, r.live)).join('\n');
  });
}

applySallaCopy();
hydrateRelated();
