/* ============================================================
   Routine Finder catalog bridge — replaces the reference's fetch('/api/products').

   Defines window.KOTIVA.products / window.KOTIVA.getById(id) exactly as the reference page
   did ({id, sku, slug, name, image, url, filter_tags}, keyed by the Laravel product id that
   routine-model.js uses), before the model, engine and controller load.
     1. Immediately: from the SKU map, with each product's exported Salla path.
     2. Once kotiva-core.js has the live Salla catalog: only products Salla still sells, with
        Salla's own URL and image. A product that left the store returns null, and the
        controller's link falls back to the store — the reference's behaviour.
   ============================================================ */
import catalogData from '../data/catalog.json';

(function () {
  const store = String(window.SALLA_STORE_URL || '').replace(/\/+$/, '');
  const probe = String((window.KOTIVA_THEME && window.KOTIVA_THEME.assetProbe) || '').replace(/[?#].*$/, '');
  const assetBase = probe.replace(/css\/kotiva\.css$/, '');
  let byId = {};

  window.KOTIVA = window.KOTIVA || {};
  window.KOTIVA.products = [];
  window.KOTIVA.getById = function (id) { return byId[id] || null; };

  function publish(rows) {
    window.KOTIVA.products = rows;
    byId = {};
    rows.forEach((p) => { byId[p.id] = p; });
  }

  const row = (meta, live) => ({
    id: meta.id,
    sku: meta.sku,
    slug: meta.slug,
    name: meta.name,
    image: (live && live.image) || (assetBase + meta.image),
    url: (live && live.url) || (meta.salla && meta.salla.path ? store + meta.salla.path : store),
    filter_tags: meta.filterTags,
  });

  publish(catalogData.products.map((meta) => row(meta, null)));

  function upgrade() {
    const S = window.KOTIVA_SALLA;
    if (!S) return;
    S.liveProducts().then((live) => {
      if (!live.size) return; // store unreachable: keep the exported paths
      publish(catalogData.products.filter((meta) => live.has(meta.sku)).map((meta) => row(meta, live.get(meta.sku))));
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', upgrade);
  else upgrade();
}());
