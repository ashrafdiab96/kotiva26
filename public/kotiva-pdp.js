/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/assets/kotiva-theme/js/cards.js"
/*!*********************************************!*\
  !*** ./src/assets/kotiva-theme/js/cards.js ***!
  \*********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   VAT: () => (/* binding */ VAT),\n/* harmony export */   addControlHtml: () => (/* binding */ addControlHtml),\n/* harmony export */   cardHtml: () => (/* binding */ cardHtml),\n/* harmony export */   esc: () => (/* binding */ esc),\n/* harmony export */   formatSar: () => (/* binding */ formatSar),\n/* harmony export */   hydrateCard: () => (/* binding */ hydrateCard),\n/* harmony export */   priceExclVat: () => (/* binding */ priceExclVat),\n/* harmony export */   priceHtml: () => (/* binding */ priceHtml)\n/* harmony export */ });\n/* ============================================================\n   The KOTIVA product card (the reference's .product-card cell), built in JS for cards the\n   server could not render: products from a Salla category/search/tag source, a product\n   added in Salla after the catalog export, and \"Complete your routine\" on the PDP.\n   Markup is identical to components/kotiva/listing.twig.\n   ============================================================ */\nconst VAT_RATE = 0.15; // config('kotiva.vat_rate') in the reference\n\nconst esc = s => String(s == null ? '' : s).replace(/[&<>\"]/g, c => ({\n  '&': '&amp;',\n  '<': '&lt;',\n  '>': '&gt;',\n  '\"': '&quot;'\n})[c]);\n\n/* The VAT-exclusive price the reference prints on every card. Salla stores prices excluding\n   VAT unless the merchant enabled tax-inclusive prices (store.settings.tax.taxable_prices_enabled). */\nfunction priceExclVat(live) {\n  if (!live) return null;\n  const raw = live.isOnSale && live.salePrice ? live.salePrice : live.price || live.salePrice || live.regularPrice;\n  if (!raw) return null;\n  return window.KOTIVA_THEME && window.KOTIVA_THEME.taxInclusivePrices ? raw / (1 + VAT_RATE) : raw;\n}\nconst formatSar = n => `SAR ${Number(n).toFixed(2)}`;\nconst VAT = VAT_RATE;\nfunction priceHtml(live) {\n  const p = priceExclVat(live);\n  return `${p == null ? 'SAR&nbsp;' : esc(formatSar(p))}<small>excl. VAT</small>`;\n}\n\n/* The add-to-cart control: Salla's own button for a product that can be bought, the\n   reference's disabled \"Sold out\" button otherwise. */\nfunction addControlHtml(live, meta) {\n  const soldOut = live ? live.isOutOfStock : false;\n  const id = live && live.id || meta && meta.salla && meta.salla.id || 0;\n  if (soldOut || !id) return `<button class=\"product-card-add-btn\" type=\"button\" disabled>${soldOut ? 'Sold out' : 'Add to cart'}</button>`;\n  return `<salla-add-product-button class=\"kotiva-add\" product-id=\"${esc(id)}\" product-status=\"${esc(live && live.status || 'sale')}\" product-type=\"${esc(live && live.type || 'product')}\" width=\"wide\" fill=\"outline\">Add to cart</salla-add-product-button>`;\n}\n\n/* meta: catalog entry (may be null for a product KOTIVA has no metadata for);\n   live: the Salla product (may be null when the store could not be reached). */\nfunction cardHtml(meta, live, {\n  withAdd = true\n} = {}) {\n  const S = window.KOTIVA_SALLA;\n  const soldOut = live ? live.isOutOfStock : false;\n  const sku = meta ? meta.sku : live && live.sku || '';\n  const name = meta ? meta.displayName : String(live && live.name || '').replace(/^Kotiva\\s+/i, '');\n  const href = meta ? S.productUrl(meta.sku, live) : live && live.url || '#';\n  const image = meta && meta.imageUrl || live && live.image || '';\n  const desc = meta ? `${meta.category} · ${meta.skinType}` : live && live.category || '';\n  return `<div class=\"product-card${soldOut ? ' is-sold-out' : ''}\" data-tags=\"${esc(meta ? meta.filter : '')}\" data-sku=\"${esc(sku)}\" style=\"border:none;\">\n        <a class=\"product-card-link\" href=\"${esc(href)}\"${sku ? ` data-kotiva-sku=\"${esc(sku)}\"` : ''}>\n          <div class=\"product-card-img\">\n            <img class=\"loaded\" src=\"${esc(image)}\" alt=\"${esc(name)}\" loading=\"lazy\" />${soldOut ? '\\n            <span class=\"product-card-flag\">Sold out</span>' : ''}\n          </div>\n          <div class=\"product-card-body\">\n            <div class=\"product-card-name\">${esc(name)}</div>\n            <div class=\"product-card-desc\">${esc(desc)}</div>\n            <div class=\"product-card-price\" data-kotiva-price>${priceHtml(live)}</div>\n            <div class=\"product-card-footer\">${meta && meta.concern ? `<span class=\"badge-concern\">${esc(meta.concern)}</span>` : '<span></span>'}<span class=\"product-card-cta\">${soldOut ? 'Sold out' : 'Discover'}</span></div>\n          </div>\n        </a>${withAdd ? `\n        <div class=\"product-card-add\">\n          ${addControlHtml(live, meta)}\n        </div>` : ''}\n      </div>`;\n}\n\n/* Bring a server-rendered card up to date with the live product. */\nfunction hydrateCard(card, meta, live) {\n  const S = window.KOTIVA_SALLA;\n  const price = card.querySelector('[data-kotiva-price]');\n  if (price) price.innerHTML = priceHtml(live);\n  const link = card.querySelector('.product-card-link');\n  if (link && meta) link.setAttribute('href', S.productUrl(meta.sku, live));\n  const soldOut = Boolean(live && live.isOutOfStock);\n  card.classList.toggle('is-sold-out', soldOut);\n  const img = card.querySelector('.product-card-img');\n  const flag = card.querySelector('.product-card-flag');\n  if (soldOut && img && !flag) img.insertAdjacentHTML('beforeend', '<span class=\"product-card-flag\">Sold out</span>');\n  if (!soldOut && flag) flag.remove();\n  const cta = card.querySelector('.product-card-cta');\n  if (cta) cta.textContent = soldOut ? 'Sold out' : 'Discover';\n  const add = card.querySelector('.product-card-add');\n  if (add && live) {\n    const btn = add.querySelector('salla-add-product-button');\n    const sameId = btn && String(btn.getAttribute('product-id')) === String(live.id);\n    if (soldOut || !sameId) add.innerHTML = addControlHtml(live, meta);else {\n      btn.setAttribute('product-status', live.status);\n      btn.setAttribute('product-type', live.type);\n    }\n  }\n}\n\n//# sourceURL=webpack://theme-raed/./src/assets/kotiva-theme/js/cards.js?\n}");

/***/ },

/***/ "./src/assets/kotiva-theme/js/pdp.js"
/*!*******************************************!*\
  !*** ./src/assets/kotiva-theme/js/pdp.js ***!
  \*******************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _salla_adopt__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./salla-adopt */ \"./src/assets/kotiva-theme/js/salla-adopt.js\");\n/* harmony import */ var _cards__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./cards */ \"./src/assets/kotiva-theme/js/cards.js\");\n/* ============================================================\n   KOTIVA product page behaviour (components/kotiva/pdp.twig).\n\n   1. Salla's add-to-cart wears the reference's .btn .btn-primary (salla-adopt.js).\n   2. Copy from Salla: product.description is parsed with the Salla customizer's own parser\n      (../website/salla/kotiva-salla.js parseDescription(), ported unchanged below) and, when\n      it yields copy, replaces the server-rendered reference copy piece by piece. So the\n      merchant can edit the text in Salla and the page follows; a description that does not\n      follow the format leaves the reference copy in place.\n   3. \"Complete your routine\": live prices and stock, in-stock first (ProductController::show()).\n   ============================================================ */\n\n\nconst S = window.KOTIVA_SALLA;\nconst root = document.querySelector('[data-kotiva-pdp]');\n(0,_salla_adopt__WEBPACK_IMPORTED_MODULE_0__.adopt)('.pdp-buy salla-add-product-button', 'button', ['btn', 'btn-primary']);\n\n/* ── Description → text with the line breaks the parser relies on ──────────\n   The customizer read a rendered element's innerText; a <template> has no rendering, so the\n   block-level breaks innerText would produce are restored by hand. */\nfunction descriptionText() {\n  const tpl = document.getElementById('kotiva-pdp-description');\n  if (!tpl) return '';\n  const html = tpl.innerHTML.replace(/<br\\s*\\/?>/gi, '\\n').replace(/<\\/(p|div|li|h[1-6]|ul|ol|tr|section|article)>/gi, '\\n').replace(/<li[^>]*>/gi, '\\n');\n  const box = document.createElement('div');\n  box.innerHTML = html;\n  return (box.textContent || '').replace(/ /g, ' ');\n}\n\n/* Parse Salla's flat description into the Laravel PDP structure:\n   intro paragraph, spec grid, Key Benefits, How to use, Key ingredients.\n   — verbatim from kotiva-salla.js, except that it takes the text instead of the element. */\nfunction parseDescription(text) {\n  const raw = (text || '').replace(/\\r/g, '').replace(/[ \\t]+/g, ' ').trim();\n  if (!raw) return null;\n  const labels = ['Volume', 'Skin type', 'Concern', 'Benefits', 'How to use', 'Key ingredients'];\n  // 'Volume:' style fields use a colon; 'Benefits' / 'How to use' / 'Key ingredients' are headings on their own line.\n  const re = new RegExp(`(?:^|\\\\n)\\\\s*(${labels.join('|')})\\\\s*:?\\\\s*(?=\\\\S|$)`, 'ig');\n  const hits = [];\n  let m;\n  while (m = re.exec(raw)) hits.push({\n    label: m[1].toLowerCase(),\n    index: m.index,\n    end: m.index + m[0].length\n  });\n  const out = {\n    intro: raw.slice(0, hits.length ? hits[0].index : raw.length),\n    volume: '',\n    skin: '',\n    concern: '',\n    benefits: [],\n    howTo: '',\n    ingredients: []\n  };\n  const listOf = t => t.split(/\\n+|•|·|(?<=[a-z\\)])\\s{2,}/).map(x => x.replace(/^[-–•\\s]+/, '').trim()).filter(x => x.length > 2);\n  hits.forEach((hit, i) => {\n    const text = raw.slice(hit.end, hits[i + 1] ? hits[i + 1].index : raw.length).trim();\n    if (hit.label === 'volume') out.volume = text.split('\\n')[0].trim();else if (hit.label === 'skin type') out.skin = text.split('\\n')[0].trim();else if (hit.label === 'concern') out.concern = text.split('\\n')[0].trim();else if (hit.label === 'benefits') out.benefits = listOf(text);else if (hit.label === 'how to use') out.howTo = text.replace(/\\s+/g, ' ').trim();else if (hit.label === 'key ingredients') out.ingredients = listOf(text);\n  });\n  out.intro = out.intro.replace(/\\s+/g, ' ').trim();\n  return out;\n}\nfunction setFact(key, label, value) {\n  if (!value) return;\n  const grid = root.querySelector('.pdp-facts');\n  if (!grid) return;\n  const fact = grid.querySelector(`[data-fact=\"${key}\"] .pdp-fact-value`);\n  if (fact) fact.textContent = value;\n}\nfunction applySallaCopy() {\n  if (!root) return;\n  const parsed = parseDescription(descriptionText());\n  // The customizer's rule: use the parse only when it produced editorial copy.\n  if (!parsed || !(parsed.intro || parsed.benefits.length || parsed.howTo)) return;\n  const copy = root.querySelector('[data-kotiva-copy]');\n  if (parsed.intro) copy.querySelector('.pdp-description').textContent = parsed.intro;\n  if (parsed.benefits.length) {\n    let list = copy.querySelector('.pdp-benefits-list');\n    if (!list) {\n      copy.querySelector('.pdp-how-to').insertAdjacentHTML('beforebegin', '<div class=\"pdp-benefits\" style=\"margin-bottom:8px;\"><p class=\"t-eyebrow\" style=\"margin-bottom:12px; color:var(--fg-dim);\">Key Benefits</p><ul class=\"pdp-benefits-list\"></ul></div>');\n      list = copy.querySelector('.pdp-benefits-list');\n    }\n    list.innerHTML = parsed.benefits.map(b => `<li>${(0,_cards__WEBPACK_IMPORTED_MODULE_1__.esc)(b)}</li>`).join('');\n  }\n  if (parsed.ingredients.length) {\n    let pills = copy.querySelector('.pdp-ingredients-list');\n    if (!pills) {\n      copy.querySelector('.pdp-how-to').insertAdjacentHTML('beforebegin', '<div style=\"margin-bottom:8px;\"><p class=\"t-eyebrow\" style=\"margin-bottom:12px; color:var(--fg-dim);\">Key Ingredients</p><div class=\"pdp-ingredients-list\"></div></div>');\n      pills = copy.querySelector('.pdp-ingredients-list');\n    }\n    pills.innerHTML = parsed.ingredients.map(i => `<span class=\"pdp-ingredient-pill\">${(0,_cards__WEBPACK_IMPORTED_MODULE_1__.esc)(i)}</span>`).join('');\n  }\n  if (parsed.howTo) copy.querySelector('.pdp-how-text').textContent = parsed.howTo;\n  if (parsed.skin) {\n    root.querySelector('[data-kotiva-field=\"skin\"]').textContent = parsed.skin;\n    setFact('skin', 'Skin type', parsed.skin);\n  }\n  if (parsed.concern) {\n    root.querySelector('[data-kotiva-field=\"claim\"]').textContent = parsed.concern;\n    setFact('target', 'Targets', parsed.concern);\n  }\n  if (parsed.volume) {\n    const line = root.querySelector('[data-kotiva-field=\"category-line\"]');\n    line.textContent = `${line.dataset.category} · ${parsed.volume}`;\n    setFact('size', 'Size', parsed.volume);\n  }\n}\n\n/* ── Complete your routine ─────────────────────────────────────────── */\nfunction relatedCardHtml(meta, live) {\n  const soldOut = Boolean(live && live.isOutOfStock);\n  return `<a class=\"product-card${soldOut ? ' is-sold-out' : ''}\" href=\"${(0,_cards__WEBPACK_IMPORTED_MODULE_1__.esc)(S.productUrl(meta.sku, live))}\" data-kotiva-sku=\"${(0,_cards__WEBPACK_IMPORTED_MODULE_1__.esc)(meta.sku)}\" data-sku=\"${(0,_cards__WEBPACK_IMPORTED_MODULE_1__.esc)(meta.sku)}\" style=\"border:none;\">\n          <div class=\"product-card-img\">\n            <img class=\"loaded\" src=\"${(0,_cards__WEBPACK_IMPORTED_MODULE_1__.esc)(meta.imageUrl)}\" alt=\"${(0,_cards__WEBPACK_IMPORTED_MODULE_1__.esc)(meta.displayName)}\" loading=\"lazy\">${soldOut ? '<span class=\"product-card-flag\">Sold out</span>' : ''}\n          </div>\n          <div class=\"product-card-body\">\n            <div class=\"product-card-name\">${(0,_cards__WEBPACK_IMPORTED_MODULE_1__.esc)(meta.displayName)}</div>\n            <div class=\"product-card-desc\">${(0,_cards__WEBPACK_IMPORTED_MODULE_1__.esc)(meta.category)} &middot; ${(0,_cards__WEBPACK_IMPORTED_MODULE_1__.esc)(meta.skinType)}</div>\n            <div class=\"product-card-price\" data-kotiva-price>${(0,_cards__WEBPACK_IMPORTED_MODULE_1__.priceHtml)(live)}</div>\n            <div class=\"product-card-footer\"><span class=\"badge-concern\">${(0,_cards__WEBPACK_IMPORTED_MODULE_1__.esc)(meta.concern)}</span><span class=\"product-card-cta\">${soldOut ? 'Sold out' : 'Discover'}</span></div>\n          </div>\n        </a>`;\n}\nfunction hydrateRelated() {\n  const section = document.querySelector('[data-kotiva-related]');\n  if (!section || !S) return;\n  const skus = section.dataset.kotivaRelated.split(',').filter(Boolean);\n  const grid = section.querySelector('.related-grid');\n  S.liveProducts().then(live => {\n    if (!live.size) return; // store unreachable: keep the server render\n    const rows = skus.map(sku => ({\n      meta: S.bySku(sku),\n      live: live.get(sku)\n    })).filter(r => r.meta && r.live) // only products still sold on Salla\n    .sort((a, b) => Number(a.live.isOutOfStock) - Number(b.live.isOutOfStock) || a.meta.id - b.meta.id).slice(0, 4);\n    if (!rows.length) {\n      section.remove();\n      return;\n    }\n    grid.innerHTML = rows.map(r => relatedCardHtml(r.meta, r.live)).join('\\n');\n  });\n}\napplySallaCopy();\nhydrateRelated();\n\n//# sourceURL=webpack://theme-raed/./src/assets/kotiva-theme/js/pdp.js?\n}");

/***/ },

/***/ "./src/assets/kotiva-theme/js/salla-adopt.js"
/*!***************************************************!*\
  !*** ./src/assets/kotiva-theme/js/salla-adopt.js ***!
  \***************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   adopt: () => (/* binding */ adopt)\n/* harmony export */ });\n/* ============================================================\n   Give Salla's web-component buttons the reference's own classes.\n\n   Salla's components render in the light DOM, so instead of re-declaring the reference's\n   button styles against Salla's markup, the reference classes are put ON Salla's inner\n   <button> (e.g. .product-card-add-btn, .btn .btn-primary) and the verbatim kotiva.css /\n   shop.css style it — hover, disabled and dark mode included. Stencil injects component\n   styles before the first <link> in <head>, so the KOTIVA stylesheets win the cascade.\n\n   Stencil patches class lists rather than replacing them, so added classes survive its\n   re-renders; a MutationObserver re-applies them if a component swaps its button anyway.\n   ============================================================ */\nconst RULES = [];\nfunction applyAll(root) {\n  RULES.forEach(({\n    host,\n    inner,\n    classes\n  }) => {\n    root.querySelectorAll(`${host} ${inner}`).forEach(el => {\n      classes.forEach(c => {\n        if (!el.classList.contains(c)) el.classList.add(c);\n      });\n    });\n  });\n}\nlet observer = null;\nlet pending = false;\n\n/* host: CSS selector of the component in context ('.product-card-add salla-add-product-button');\n   inner: the element to tag inside it ('button'); classes: reference classes to add. */\nfunction adopt(host, inner, classes) {\n  RULES.push({\n    host,\n    inner,\n    classes: [].concat(classes)\n  });\n  applyAll(document);\n  if (observer) return;\n  observer = new MutationObserver(() => {\n    if (pending) return;\n    pending = true;\n    requestAnimationFrame(() => {\n      pending = false;\n      applyAll(document);\n    });\n  });\n  observer.observe(document.body, {\n    childList: true,\n    subtree: true\n  });\n}\n\n//# sourceURL=webpack://theme-raed/./src/assets/kotiva-theme/js/salla-adopt.js?\n}");

/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	const __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		const cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		const module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		if (!(moduleId in __webpack_modules__)) {
/******/ 			delete __webpack_module_cache__[moduleId];
/******/ 			const e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter/value functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			if(Array.isArray(definition)) {
/******/ 				var i = 0;
/******/ 				while(i < definition.length) {
/******/ 					var key = definition[i++];
/******/ 					var binding = definition[i++];
/******/ 					if(!__webpack_require__.o(exports, key)) {
/******/ 						if(binding === 0) {
/******/ 							Object.defineProperty(exports, key, { enumerable: true, value: definition[i++] });
/******/ 						} else {
/******/ 							Object.defineProperty(exports, key, { enumerable: true, get: binding });
/******/ 						}
/******/ 					} else if(binding === 0) { i++; }
/******/ 				}
/******/ 			} else {
/******/ 				for(var key in definition) {
/******/ 					if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 						Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 					}
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	let __webpack_exports__ = __webpack_require__("./src/assets/kotiva-theme/js/pdp.js");
/******/ 	
/******/ })()
;