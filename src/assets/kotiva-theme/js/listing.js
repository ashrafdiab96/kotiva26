/* ============================================================
   KOTIVA collection page behaviour (pages/product/index.twig).

   Ports the reference listing (shop/index.blade.php + layout.js filters + its routine
   handoff) and the Salla customizer's V6 catalog logic:
     • filter pills (ten Salla keys) with live counts      ?filter=<key>
     • sort row: Featured / price ↑ / price ↓ / name / newest   ?sort=<key>
     • "Load more": 15 shown, +10 per click
     • ?routine=KOT001,KOT005: only those SKUs, in that order, with the reference's
       dismissible "Showing the N products from your routine" notice
     • empty state
   Filter, sort and routine live in the query string, so a refresh restores the view.
   ============================================================ */
import { cardHtml, hydrateCard, priceExclVat } from './cards';
import { adopt } from './salla-adopt';

const INITIAL_VISIBLE = 15;
const LOAD_MORE_STEP = 10;
const SORTS = ['featured', 'price_asc', 'price_desc', 'name_asc', 'newest'];
/* Accept the customizer's spellings too, so its old links keep working. */
const SORT_ALIASES = { 'price-asc': 'price_asc', 'price-desc': 'price_desc', name: 'name_asc' };

const S = window.KOTIVA_SALLA;
const grid = document.getElementById('product-grid');

if (grid && S) {
  adopt('.product-card-add salla-add-product-button', 'button', 'product-card-add-btn');
  const mode = grid.dataset.kotivaListing; // 'collection' | 'source'
  const empty = document.querySelector('.kotiva-listing-empty');
  const more = document.getElementById('kotiva-load-more');
  const params = new URLSearchParams(window.location.search);

  const state = {
    filter: S.filterKey(params.get('filter')) || 'all',
    sort: (() => { const s = params.get('sort'); const k = SORT_ALIASES[s] || s; return SORTS.indexOf(k) === -1 ? 'featured' : k; })(),
    routine: S.normaliseSkus((params.get('routine') || '').split(',')),
    limit: INITIAL_VISIBLE,
  };

  /* items: [{ card, meta, live, sku }] — one per card in the grid. */
  let items = [...grid.querySelectorAll('.product-card')].map((card) => {
    const meta = S.bySku(card.dataset.sku);
    return { card, meta, live: null, sku: card.dataset.sku };
  });

  const nameOf = (it) => String((it.meta && it.meta.displayName) || (it.live && it.live.name) || '').toLowerCase();
  const orderOf = (it) => (it.meta ? it.meta.order : 999);
  const priceOf = (it) => {
    const p = priceExclVat(it.live);
    return p == null ? Number.POSITIVE_INFINITY : p;
  };

  function sorted(list) {
    const out = list.slice();
    if (state.sort === 'price_asc') return out.sort((a, b) => priceOf(a) - priceOf(b));
    if (state.sort === 'price_desc') return out.sort((a, b) => (priceOf(b) === Infinity ? -1 : priceOf(b)) - (priceOf(a) === Infinity ? -1 : priceOf(a)));
    if (state.sort === 'name_asc') return out.sort((a, b) => nameOf(a).localeCompare(nameOf(b)));
    if (state.sort === 'newest') return out.sort((a, b) => orderOf(b) - orderOf(a));
    return out.sort((a, b) => {
      const f = Number(Boolean(b.meta && b.meta.featured)) - Number(Boolean(a.meta && a.meta.featured));
      return f || orderOf(a) - orderOf(b);
    });
  }

  /* layout.js's updateGridOrphan(): an odd last card spans the 2-up mobile grid. */
  function markOrphan(visible) {
    items.forEach((it) => it.card.classList.remove('grid-orphan'));
    if (visible.length % 2 === 1) visible[visible.length - 1].card.classList.add('grid-orphan');
  }

  function routineNotice(shown) {
    let notice = document.querySelector('.routine-notice');
    if (!shown) { if (notice) notice.remove(); return; }
    if (!notice) {
      notice = document.createElement('div');
      notice.className = 'routine-notice';
      notice.setAttribute('role', 'status');
      grid.parentNode.insertBefore(notice, grid);
    }
    notice.innerHTML = `Showing the ${shown} products from your routine. <button type="button" class="routine-notice-clear">Show the full range</button>`;
    notice.querySelector('.routine-notice-clear').addEventListener('click', () => {
      state.routine = [];
      writeUrl();
      render();
    });
  }

  function render() {
    let visible;
    let total;
    if (state.routine.length) {
      // Routine order wins; Load more and the filter do not apply to a routine.
      visible = state.routine.map((sku) => items.find((it) => it.sku === sku)).filter(Boolean);
      if (!visible.length) { state.routine = []; return render(); } // nothing matched — fail open
      total = visible.length;
    } else {
      const filtered = items.filter((it) => state.filter === 'all' || (it.meta && it.meta.filter === state.filter));
      const ordered = sorted(filtered);
      total = ordered.length;
      visible = ordered.slice(0, state.limit);
    }
    const shown = new Set(visible.map((it) => it.card));
    items.forEach((it) => { it.card.style.display = shown.has(it.card) ? '' : 'none'; });
    visible.forEach((it) => grid.appendChild(it.card)); // DOM order = display order (keeps keyboard order honest)
    markOrphan(visible);
    routineNotice(state.routine.length ? visible.length : 0);
    if (empty) empty.hidden = visible.length > 0;
    if (more) {
      const remaining = state.routine.length ? 0 : Math.max(0, total - state.limit);
      more.hidden = remaining === 0;
      more.textContent = `Load more (${remaining})`;
    }
    document.querySelectorAll('.filter-pill[data-filter]').forEach((p) => {
      const on = p.dataset.filter === state.filter;
      p.classList.toggle('active', on);
      p.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    document.querySelectorAll('.shop-sort-pill[data-sort]').forEach((a) => {
      const on = a.dataset.sort === state.sort;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      a.setAttribute('href', `?${queryFor({ sort: a.dataset.sort })}`);
    });
  }

  function queryFor(overrides = {}) {
    const s = { ...state, ...overrides };
    const q = new URLSearchParams();
    if (s.filter && s.filter !== 'all') q.set('filter', s.filter);
    if (s.sort && s.sort !== 'featured') q.set('sort', s.sort);
    if (s.routine && s.routine.length) q.set('routine', s.routine.join(','));
    return q.toString().replace(/%2C/g, ',');
  }
  function writeUrl() {
    const q = queryFor();
    window.history.replaceState({}, '', window.location.pathname + (q ? `?${q}` : ''));
  }

  function updateCounts() {
    const counts = { all: items.length };
    items.forEach((it) => { if (it.meta) counts[it.meta.filter] = (counts[it.meta.filter] || 0) + 1; });
    document.querySelectorAll('.filter-pill[data-filter]').forEach((p) => {
      p.textContent = `${p.dataset.label} (${counts[p.dataset.filter] || 0})`;
    });
    document.querySelectorAll('[data-kotiva-count]').forEach((el) => { el.textContent = String(items.length); });
  }

  document.addEventListener('click', (e) => {
    const pill = e.target.closest('.filter-pill[data-filter]');
    if (pill) {
      state.filter = pill.dataset.filter;
      state.routine = [];
      state.limit = INITIAL_VISIBLE;
      writeUrl();
      render();
      return;
    }
    const sort = e.target.closest('.shop-sort-pill[data-sort]');
    if (sort) {
      e.preventDefault();
      state.sort = sort.dataset.sort;
      writeUrl();
      render();
      return;
    }
    if (e.target.closest('#kotiva-load-more')) {
      state.limit += LOAD_MORE_STEP;
      render();
    }
  });

  /* ── Reconcile with the live store ─────────────────────────────── */
  async function liveForSource() {
    const THEME = window.KOTIVA_THEME || {};
    const slug = grid.dataset.source;
    const value = grid.dataset.sourceValue;
    const payload = slug === 'product.index.search' ? { source: 'search', source_value: THEME.searchQuery || '' }
      : slug === 'product.index.offers' ? { source: 'offers' }
        : slug === 'product.index.tag' ? { source: 'tags', source_value: [value] }
          : { source: 'categories', source_value: [value] };
    const rows = [];
    for (let page = 1; page <= 4; page++) {
      try {
        const res = await window.salla.product.fetch({ ...payload, limit: 32, page });
        const data = (res && res.data) || [];
        rows.push(...data);
        if (data.length < 32) break;
      } catch (err) { console.warn('KOTIVA: listing source fetch failed', payload, err); break; }
    }
    return rows;
  }

  function toLiveRow(p) {
    // Same shape as core.js's live products, for products from any source.
    const money = (v) => (typeof v === 'number' ? v : Number(String((v && (v.amount ?? v)) || '').replace(/[^0-9.]/g, '')) || 0);
    const meta = S.bySku(p.sku) || S.byName(p.name);
    return {
      sku: meta ? meta.sku : String(p.sku || ''),
      id: Number(p.id) || 0,
      name: String(p.name || ''),
      url: String(p.url || ''),
      image: String((p.image && p.image.url) || p.thumbnail || ''),
      price: money(p.price), salePrice: money(p.sale_price), regularPrice: money(p.regular_price),
      isOnSale: Boolean(p.is_on_sale),
      isOutOfStock: Boolean(p.is_out_of_stock) || p.status === 'out' || p.status === 'out-and-notify',
      status: String(p.status || 'sale'), type: String(p.type || 'product'),
      category: p.category && p.category.name ? String(p.category.name) : '',
      meta,
    };
  }

  async function reconcile() {
    if (mode === 'collection') {
      const live = await S.liveProducts({ fresh: true });
      if (!live.size) return; // store unreachable: keep the server-rendered catalog
      // Products no longer sold on Salla leave the grid…
      items = items.filter((it) => {
        if (live.has(it.sku)) return true;
        it.card.remove();
        return false;
      });
      items.forEach((it) => { it.live = live.get(it.sku); hydrateCard(it.card, it.meta, it.live); });
      // …and catalog products the server did not render (none today) are added.
      live.forEach((p, sku) => {
        if (items.some((it) => it.sku === sku)) return;
        const meta = S.bySku(sku);
        grid.insertAdjacentHTML('beforeend', cardHtml(meta, p));
        items.push({ card: grid.lastElementChild, meta, live: p, sku });
      });
    } else {
      const rows = (await liveForSource()).map(toLiveRow);
      grid.innerHTML = rows.map((p) => cardHtml(p.meta, p)).join('');
      items = [...grid.querySelectorAll('.product-card')].map((card, i) => ({ card, meta: rows[i].meta, live: rows[i], sku: rows[i].sku || `#${rows[i].id}` }));
    }
    updateCounts();
    render();
  }

  function start() {
    render();
    // Bring a deep-linked pill into view on the single-row mobile scroller (reference K32).
    const activePill = document.querySelector(`.filter-pill[data-filter="${state.filter}"]`);
    if (state.filter !== 'all' && activePill && activePill.scrollIntoView) activePill.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'instant' });
    reconcile();
  }
  /* After layout.js's own DOMContentLoaded work: its initRoutineFilter() matches the retired
     /product/<slug> URLs, finds none here, and "fails open" by un-hiding every #product-grid
     card. Starting after it means this file's view is the one that stands. */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
}
