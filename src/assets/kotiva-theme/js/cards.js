/* ============================================================
   The KOTIVA product card (the reference's .product-card cell), built in JS for cards the
   server could not render: products from a Salla category/search/tag source, a product
   added in Salla after the catalog export, and "Complete your routine" on the PDP.
   Markup is identical to components/kotiva/listing.twig.
   ============================================================ */
const VAT_RATE = 0.15; // config('kotiva.vat_rate') in the reference

export const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* The VAT-exclusive price the reference prints on every card. Salla stores prices excluding
   VAT unless the merchant enabled tax-inclusive prices (store.settings.tax.taxable_prices_enabled). */
export function priceExclVat(live) {
  if (!live) return null;
  const raw = live.isOnSale && live.salePrice ? live.salePrice : (live.price || live.salePrice || live.regularPrice);
  if (!raw) return null;
  return window.KOTIVA_THEME && window.KOTIVA_THEME.taxInclusivePrices ? raw / (1 + VAT_RATE) : raw;
}
export const formatSar = (n) => `SAR ${Number(n).toFixed(2)}`;
export const VAT = VAT_RATE;

export function priceHtml(live) {
  const p = priceExclVat(live);
  return `${p == null ? 'SAR&nbsp;' : esc(formatSar(p))}<small>excl. VAT</small>`;
}

/* The add-to-cart control: Salla's own button for a product that can be bought, the
   reference's disabled "Sold out" button otherwise. */
export function addControlHtml(live, meta) {
  const soldOut = live ? live.isOutOfStock : false;
  const id = (live && live.id) || (meta && meta.salla && meta.salla.id) || 0;
  if (soldOut || !id) return `<button class="product-card-add-btn" type="button" disabled>${soldOut ? 'Sold out' : 'Add to cart'}</button>`;
  return `<salla-add-product-button class="kotiva-add" product-id="${esc(id)}" product-status="${esc((live && live.status) || 'sale')}" product-type="${esc((live && live.type) || 'product')}" width="wide" fill="outline">Add to cart</salla-add-product-button>`;
}

/* meta: catalog entry (may be null for a product KOTIVA has no metadata for);
   live: the Salla product (may be null when the store could not be reached). */
export function cardHtml(meta, live, { withAdd = true } = {}) {
  const S = window.KOTIVA_SALLA;
  const soldOut = live ? live.isOutOfStock : false;
  const sku = meta ? meta.sku : (live && live.sku) || '';
  const name = meta ? meta.displayName : String((live && live.name) || '').replace(/^Kotiva\s+/i, '');
  const href = meta ? S.productUrl(meta.sku, live) : (live && live.url) || '#';
  const image = (meta && meta.imageUrl) || (live && live.image) || '';
  const desc = meta ? `${meta.category} · ${meta.skinType}` : ((live && live.category) || '');
  return `<div class="product-card${soldOut ? ' is-sold-out' : ''}" data-tags="${esc(meta ? meta.filter : '')}" data-sku="${esc(sku)}" style="border:none;">
        <a class="product-card-link" href="${esc(href)}"${sku ? ` data-kotiva-sku="${esc(sku)}"` : ''}>
          <div class="product-card-img">
            <img class="loaded" src="${esc(image)}" alt="${esc(name)}" loading="lazy" />${soldOut ? '\n            <span class="product-card-flag">Sold out</span>' : ''}
          </div>
          <div class="product-card-body">
            <div class="product-card-name">${esc(name)}</div>
            <div class="product-card-desc">${esc(desc)}</div>
            <div class="product-card-price" data-kotiva-price>${priceHtml(live)}</div>
            <div class="product-card-footer">${meta && meta.concern ? `<span class="badge-concern">${esc(meta.concern)}</span>` : '<span></span>'}<span class="product-card-cta">${soldOut ? 'Sold out' : 'Discover'}</span></div>
          </div>
        </a>${withAdd ? `
        <div class="product-card-add">
          ${addControlHtml(live, meta)}
        </div>` : ''}
      </div>`;
}

/* Bring a server-rendered card up to date with the live product. */
export function hydrateCard(card, meta, live) {
  const S = window.KOTIVA_SALLA;
  const price = card.querySelector('[data-kotiva-price]');
  if (price) price.innerHTML = priceHtml(live);
  const link = card.querySelector('.product-card-link');
  if (link && meta) link.setAttribute('href', S.productUrl(meta.sku, live));
  const soldOut = Boolean(live && live.isOutOfStock);
  card.classList.toggle('is-sold-out', soldOut);
  const img = card.querySelector('.product-card-img');
  const flag = card.querySelector('.product-card-flag');
  if (soldOut && img && !flag) img.insertAdjacentHTML('beforeend', '<span class="product-card-flag">Sold out</span>');
  if (!soldOut && flag) flag.remove();
  const cta = card.querySelector('.product-card-cta');
  if (cta) cta.textContent = soldOut ? 'Sold out' : 'Discover';
  const add = card.querySelector('.product-card-add');
  if (add && live) {
    const btn = add.querySelector('salla-add-product-button');
    const sameId = btn && String(btn.getAttribute('product-id')) === String(live.id);
    if (soldOut || !sameId) add.innerHTML = addControlHtml(live, meta);
    else {
      btn.setAttribute('product-status', live.status);
      btn.setAttribute('product-type', live.type);
    }
  }
}
