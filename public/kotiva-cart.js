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

/***/ "./src/assets/kotiva-theme/js/cart.js"
/*!********************************************!*\
  !*** ./src/assets/kotiva-theme/js/cart.js ***!
  \********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _salla_adopt__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./salla-adopt */ \"./src/assets/kotiva-theme/js/salla-adopt.js\");\n/* ============================================================\n   KOTIVA cart (components/kotiva/cart.twig) on Salla's cart API.\n\n   • Proceed to Checkout → salla.cart.submit() (Salla's hosted checkout), after the same\n     option-form validity check Raed's cart.js made.\n   • Remove → salla.cart.deleteItem().\n   • Quantity → Salla's stepper posts itself (salla.form.onChange on the item form).\n   • Every cart update repaints the line totals and the summary in the reference's\n     \"SAR 0.00\" format, VAT-exclusive subtotal first (cart/index.blade.php).\n   ============================================================ */\n\nconst VAT_RATE = 0.15;\nconst root = document.querySelector('[data-kotiva-cart]');\nconst sar = n => `SAR ${Number(n || 0).toLocaleString('en-US', {\n  minimumFractionDigits: 2,\n  maximumFractionDigits: 2\n})}`;\nconst num = v => v && typeof v === 'object' ? Number(v.amount ?? v.value ?? 0) : Number(v || 0);\n(0,_salla_adopt__WEBPACK_IMPORTED_MODULE_0__.adopt)('#cart-submit', 'button', ['btn', 'btn-primary']);\nfunction paint(summary) {\n  if (!root || !summary) return;\n  const taxInclusive = Boolean(window.KOTIVA_THEME && window.KOTIVA_THEME.taxInclusivePrices);\n  const tax = summary.tax_amount != null ? num(summary.tax_amount) : null;\n  const sub = num(summary.sub_total);\n  const set = (sel, text) => root.querySelectorAll(sel).forEach(el => {\n    el.textContent = text;\n  });\n  set('[data-cart-subtotal]', sar(taxInclusive && tax != null ? sub - tax : sub));\n  if (tax != null) set('[data-cart-vat]', sar(tax));else if (!taxInclusive) set('[data-cart-vat]', sar(sub * VAT_RATE));\n  set('[data-cart-total]', sar(num(summary.total)));\n  const discount = num(summary.discount);\n  root.querySelectorAll('[data-cart-discount-row]').forEach(row => {\n    row.hidden = !(discount > 0);\n  });\n  set('[data-cart-discount]', `− ${sar(discount)}`);\n  (summary.items || []).forEach(item => {\n    const form = document.getElementById(`item-${item.id}`);\n    if (!form) return;\n    const unit = form.querySelector('[data-cart-item-unit]');\n    if (unit) unit.textContent = sar(num(item.price));\n    const total = form.querySelector('[data-cart-item-total]');\n    if (total) total.textContent = item.is_available === false ? 'Sold out' : sar(num(item.total_special_price || item.total));\n  });\n}\nfunction bind() {\n  const salla = window.salla;\n  salla.cart.event.onUpdated(summary => {\n    if (summary && !summary.count) {\n      window.location.reload();\n      return;\n    } // last item gone: empty state\n    paint(summary);\n  });\n\n  // First paint in the reference format (the server printed Salla's own money format).\n  try {\n    Promise.resolve(salla.cart.details(null, [])).then(res => paint(res && res.data && (res.data.cart || res.data))).catch(() => {});\n  } catch (e) {/* keep the server figures */}\n  document.addEventListener('click', e => {\n    const remove = e.target.closest('[data-cart-remove]');\n    if (remove) {\n      e.preventDefault();\n      const id = remove.getAttribute('data-cart-remove');\n      remove.disabled = true;\n      salla.cart.deleteItem(id).then(() => {\n        const form = document.getElementById(`item-${id}`);\n        if (form) form.remove();\n      }).catch(() => {\n        remove.disabled = false;\n      });\n      return;\n    }\n    const submit = e.target.closest('#cart-submit');\n    if (!submit) return;\n    // Required product options must be filled before Salla's checkout takes over.\n    let valid = true;\n    document.querySelectorAll('form[id^=\"item-\"]').forEach(form => {\n      valid = valid && form.reportValidity();\n    });\n    if (!valid) {\n      e.preventDefault();\n      salla.notify.error(salla.lang.get('common.messages.required_fields'));\n      return;\n    }\n    const stop = () => {\n      if (typeof submit.stop === 'function') submit.stop();\n    };\n    salla.event.once('login::open', stop);\n    salla.event.once('cart::submit.failed', stop);\n    if (typeof submit.load === 'function') submit.load();\n    salla.cart.submit();\n  });\n}\nif (root && root.querySelector('.cart-layout')) {\n  if (window.salla && typeof window.salla.onReady === 'function') window.salla.onReady(bind);else document.addEventListener('DOMContentLoaded', () => window.salla && window.salla.onReady(bind));\n}\n\n//# sourceURL=webpack://theme-raed/./src/assets/kotiva-theme/js/cart.js?\n}");

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
/******/ 	let __webpack_exports__ = __webpack_require__("./src/assets/kotiva-theme/js/cart.js");
/******/ 	
/******/ })()
;