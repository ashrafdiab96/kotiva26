/* ============================================================
   KOTIVA × Salla — core bridge (every page, loaded after layout.js + animations.js)

   The reference's layout.js / animations.js run unchanged. This file supplies only what
   the Laravel host used to provide and Salla does not:

     1. asset URLs for the verbatim data-lite.js (page-relative image paths break on Salla's
        /<slug>/page-<id> URLs and CDN-hosted assets);
     2. kotivaSubmitToInbox() — layout.js posts to the retired Laravel /contact and
        /newsletter routes; Salla has no form API, so this posts to the endpoint configured
        in Theme settings, or falls back to the visitor's email app (docs/DECISIONS.md T-07);
     3. the product catalog: KOTIVA metadata by SKU (generated from the reference) joined to
        live Salla products (salla.product.fetch), cached for the session;
     4. current-page marking — layout.js's markCurrentNav() skips absolute URLs, and every
        Salla link is absolute, so the same rules are applied here from the page key;
     5. the cart badge's empty state, and product links refreshed from the live store.
   (The /?filter= and /?routine= forwarding from the store root is inline in pages/index.twig,
   so it happens before the home page paints.)
   ============================================================ */
import catalogData from '../data/catalog.json';

const THEME = window.KOTIVA_THEME || {};
const baseOf = (probe, file) => String(probe || '').replace(/[?#].*$/, '').replace(new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'), '');
const ASSET_BASE = baseOf(THEME.assetProbe, 'css/kotiva.css');
const DATA_BASE = baseOf(THEME.dataProbe, 'catalog.json');
const assetUrl = (rel) => (!rel || /^(https?:)?\/\//.test(rel) ? rel : ASSET_BASE + String(rel).replace(/^\/+/, ''));

/* ── 1. CATALOG (static, from the reference) ───────────────────────────── */
const PRODUCTS = catalogData.products.map((p) => ({
  ...p,
  imageUrl: assetUrl(p.image),
  heroImageUrl: assetUrl(p.heroImage),
}));
const BY_SKU = new Map(PRODUCTS.map((p) => [p.sku, p]));
const BY_ID = new Map(PRODUCTS.map((p) => [p.id, p]));
const normaliseName = (v) => String(v || '').toLowerCase().replace(/^kotiva\s+/i, '').replace(/\s+/g, ' ').trim();
const BY_NAME = new Map(PRODUCTS.map((p) => [normaliseName(p.name), p]));

/* The listing's ten filter keys, in the Salla theme's order (Salla::FILTERS). */
const FILTERS = [
  ['all', 'All'], ['cleanser', 'Cleanser'], ['toner', 'Toner'], ['lip-care', 'Lip Care'],
  ['spf', 'SPF'], ['body', 'Body'], ['hand-care', 'Hand Care'], ['treatment', 'Treatment'],
  ['serums', 'Serums'], ['hair', 'Hair'],
];
/* Keys the old site used, mapped as Salla::LEGACY_FILTERS did (D-35 item 1). */
const LEGACY_FILTERS = { face: 'cleanser', treatments: 'treatment', sunscreen: 'spf' };
function filterKey(value) {
  if (value == null) return null;
  let key = String(value).toLowerCase().trim();
  key = LEGACY_FILTERS[key] || key;
  return FILTERS.some(([k]) => k === key) ? key : null;
}
/* Upper-cased, de-duplicated, [A-Z0-9_-] only — Salla::normaliseSkus(). */
function normaliseSkus(list) {
  const out = [];
  (list || []).forEach((sku) => {
    const s = String(sku || '').toUpperCase().trim();
    if (s && /^[A-Z0-9_-]{1,64}$/.test(s) && out.indexOf(s) === -1) out.push(s);
  });
  return out;
}

const joinStore = (path) => String(THEME.storeUrl || '/').replace(/\/+$/, '') + path;

/* ── 2. LIVE SALLA PRODUCTS ─────────────────────────────────────────────── */
const CACHE_KEY = 'kotiva:salla:products:v1';
let livePromise = null;

function waitForSalla(timeout = 10000) {
  return new Promise((resolve) => {
    const started = Date.now();
    (function poll() {
      if (window.salla && window.salla.product && typeof window.salla.product.fetch === 'function') return resolve(true);
      if (Date.now() - started > timeout) return resolve(false);
      setTimeout(poll, 100);
    })();
  });
}

function unwrap(response) {
  const data = response && (response.data || (response.response && response.response.data));
  return Array.isArray(data) ? data : Array.isArray(response) ? response : [];
}
const money = (v) => {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return Number(v.replace(/[^0-9.]/g, '')) || 0;
  if (typeof v === 'object') return Number(v.amount ?? v.value ?? v.price ?? 0) || 0;
  return 0;
};

/* The fields the KOTIVA pages need from a Salla product, keyed by SKU (or by name for a
   product whose SKU was left empty in Salla — the reference customizer matched on name). */
function toLive(p) {
  const meta = BY_SKU.get(String(p.sku || '').toUpperCase()) || BY_NAME.get(normaliseName(p.name));
  if (!meta) return null;
  return {
    sku: meta.sku,
    id: Number(p.id) || 0,
    name: String(p.name || meta.name),
    url: String(p.url || (p.urls && p.urls.customer) || ''),
    image: String((p.image && p.image.url) || p.thumbnail || ''),
    price: money(p.price),
    salePrice: money(p.sale_price),
    regularPrice: money(p.regular_price),
    isOnSale: Boolean(p.is_on_sale),
    isOutOfStock: Boolean(p.is_out_of_stock) || p.status === 'out' || p.status === 'out-and-notify',
    status: String(p.status || (p.is_out_of_stock ? 'out' : 'sale')),
    type: String(p.type || 'product'),
  };
}

async function fetchSource(payload) {
  try {
    return unwrap(await window.salla.product.fetch(payload));
  } catch (e) {
    console.warn('KOTIVA: salla.product.fetch failed', payload, e);
    return [];
  }
}

async function fetchLiveFresh() {
  if (!(await waitForSalla())) return new Map();
  const found = new Map();
  const add = (rows) => rows.map(toLive).filter(Boolean).forEach((p) => { if (!found.has(p.sku)) found.set(p.sku, p); });
  // 32 is Salla's per-page cap; the catalog is 25 SKUs.
  add(await fetchSource({ source: 'latest', limit: 32 }));
  for (let page = 2; page <= 4 && found.size < PRODUCTS.length; page++) {
    const rows = await fetchSource({ source: 'latest', limit: 32, page });
    if (!rows.length) break;
    add(rows);
  }
  // Anything still missing (a capped "latest" source) is looked up by name.
  const missing = PRODUCTS.filter((p) => !found.has(p.sku));
  for (let i = 0; i < missing.length; i += 5) {
    const batch = missing.slice(i, i + 5);
    const rows = await Promise.all(batch.map((m) => fetchSource({ source: 'search', source_value: m.displayName, limit: 5 })));
    rows.forEach(add);
  }
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify([...found.values()])); } catch (e) { /* storage blocked */ }
  return found;
}

/* Session-cached: the catalog changes rarely, and every KOTIVA page that links to a product
   would otherwise refetch it. `fresh` bypasses the cache (the listing, where price and stock
   must be current). */
function liveProducts({ fresh = false } = {}) {
  if (!fresh && !livePromise) {
    try {
      const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
      if (Array.isArray(cached) && cached.length) livePromise = Promise.resolve(new Map(cached.map((p) => [p.sku, p])));
    } catch (e) { /* ignore */ }
  }
  if (fresh || !livePromise) livePromise = fetchLiveFresh();
  return livePromise;
}

/* A product's Salla URL: the live one when known, else the path exported from the reference's
   salla-links.json joined to this store's own URL, else the listing. */
function productUrl(sku, live) {
  const meta = BY_SKU.get(sku);
  if (live && live.url) return live.url;
  if (meta && meta.salla && meta.salla.path) return joinStore(meta.salla.path);
  return THEME.listingUrl || THEME.storeUrl || '/';
}

/* ── 3. FORMS ──────────────────────────────────────────────────────────── */
function mailtoFallback(payload) {
  const to = THEME.storeEmail;
  if (!to) return Promise.reject(new Error('Sorry — this form is not connected yet. Please try again later.'));
  const isNewsletter = payload && payload.type === 'newsletter';
  const subject = isNewsletter ? 'Newsletter sign-up' : `Website enquiry${payload.enquiryType ? ' — ' + payload.enquiryType : ''}`;
  const body = isNewsletter
    ? `Please add ${payload.email} to the KOTIVA newsletter.`
    : `${payload.message || ''}\n\n— ${payload.name || ''} <${payload.email || ''}>`;
  window.location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return Promise.resolve({ mailto: true });
}

/* Same signature and payload as layout.js's version, so contact and newsletter pages are
   ported unchanged. */
window.kotivaSubmitToInbox = function (payload) {
  const isNewsletter = payload && payload.type === 'newsletter';
  const endpoint = isNewsletter ? THEME.newsletterEndpoint : THEME.contactEndpoint;
  if (!endpoint) return mailtoFallback(payload || {});
  const body = isNewsletter
    ? { email: payload.email, source: payload.source || 'website' }
    : { name: payload.name, email: payload.email, enquiry_type: payload.enquiryType || null, message: payload.message };
  return fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  }).then((res) => res.json().catch(() => ({})).then((data) => {
    if (!res.ok) {
      const first = data.errors && Object.keys(data.errors)[0];
      throw new Error((first && [].concat(data.errors[first])[0]) || data.message || `Submission failed (${res.status})`);
    }
    return data;
  }));
};

/* ── 4. data-lite.js image paths ───────────────────────────────────────── */
function rebaseDataLite() {
  const K = window.KOTIVA;
  if (!K || K.__kotivaRebased) return;
  ['products', 'articles', 'journal'].forEach((key) => {
    (K[key] || []).forEach((row) => { if (row && row.image && !/^(https?:)?\/\//.test(row.image)) row.image = assetUrl(row.image); });
  });
  K.__kotivaRebased = true;
}
rebaseDataLite();

/* ── 5. CURRENT PAGE (aria-current), cart badge, query contract ────────── */
function currentKey() {
  const explicit = document.body && document.body.dataset.kotivaPage;
  if (explicit) return { key: explicit.replace(/-/g, '_'), exact: true };
  const slug = String(THEME.pageSlug || '');
  if (slug === 'index') return { key: 'home', exact: true };
  if (slug === 'product.index.latest') return { key: 'shop', exact: true };
  if (slug.indexOf('product.index') === 0) return { key: 'shop', exact: false };
  if (slug === 'product.single') return { key: 'shop', exact: false };
  if (slug.indexOf('blog') === 0) return { key: 'journal', exact: slug === 'blog.index' };
  return null;
}

/* Mirrors layout.js markCurrentNav(): an exact match gets aria-current="page" (header + footer)
   and the visible header state; a section match (product pages → Shop, the glossary →
   Science) gets aria-current="true" + .is-current-section on the header link only. */
function markCurrentNav() {
  const cur = currentKey();
  if (!cur) return;
  const sectionOf = { ingredients: 'science' };
  const exactLinks = document.querySelectorAll(`[data-kotiva-nav="${cur.key}"]`);
  let headerHit = false;
  if (cur.exact) {
    exactLinks.forEach((a) => {
      a.setAttribute('aria-current', 'page');
      if (a.classList.contains('nav-link')) { a.classList.add('is-current'); headerHit = true; }
      else if (a.classList.contains('btn')) { a.classList.add('is-current-cta'); headerHit = true; }
    });
  }
  if (headerHit) return;
  const section = cur.exact ? sectionOf[cur.key] : cur.key;
  if (!section) return;
  document.querySelectorAll(`.nav-link[data-kotiva-nav="${section}"]`).forEach((a) => {
    a.setAttribute('aria-current', 'true');
    a.classList.add('is-current-section');
  });
}

function bindCartBadge() {
  const paint = (count) => document.querySelectorAll('.nav-cart-badge').forEach((el) => {
    el.classList.toggle('is-empty', !(Number(count) > 0));
  });
  const hook = () => {
    try { window.salla.cart.event.onUpdated((summary) => paint(summary && summary.count)); } catch (e) { /* no cart events */ }
  };
  if (window.salla && typeof window.salla.onReady === 'function') window.salla.onReady(hook);
  else document.addEventListener('DOMContentLoaded', () => window.salla && window.salla.onReady && window.salla.onReady(hook));
}


/* Server-rendered product links ([data-kotiva-sku]) carry the Salla path exported from the
   reference. If the merchant re-creates a product its URL changes; the live store wins. */
function refreshProductLinks() {
  const links = document.querySelectorAll('a[data-kotiva-sku]');
  if (!links.length) return;
  liveProducts().then((live) => links.forEach((a) => {
    const p = live.get(a.getAttribute('data-kotiva-sku'));
    if (p && p.url) a.setAttribute('href', p.url);
  }));
}

function onReady() {
  markCurrentNav();
  refreshProductLinks();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady);
else onReady();
bindCartBadge();

window.KOTIVA_SALLA = {
  products: PRODUCTS,
  bySku: (sku) => BY_SKU.get(String(sku || '').toUpperCase()) || null,
  byId: (id) => BY_ID.get(Number(id)) || null,
  byName: (name) => BY_NAME.get(normaliseName(name)) || null,
  filters: FILTERS,
  filterKey,
  normaliseSkus,
  liveProducts,
  productUrl,
  assetUrl,
  dataUrl: (file) => DATA_BASE + file,
  rebaseDataLite,
};
