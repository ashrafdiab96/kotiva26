/* ============================================================
   Give Salla's web-component buttons the reference's own classes.

   Salla's components render in the light DOM, so instead of re-declaring the reference's
   button styles against Salla's markup, the reference classes are put ON Salla's inner
   <button> (e.g. .product-card-add-btn, .btn .btn-primary) and the verbatim kotiva.css /
   shop.css style it — hover, disabled and dark mode included. Stencil injects component
   styles before the first <link> in <head>, so the KOTIVA stylesheets win the cascade.

   Stencil patches class lists rather than replacing them, so added classes survive its
   re-renders; a MutationObserver re-applies them if a component swaps its button anyway.
   ============================================================ */
const RULES = [];

function applyAll(root) {
  RULES.forEach(({ host, inner, classes }) => {
    root.querySelectorAll(`${host} ${inner}`).forEach((el) => {
      classes.forEach((c) => { if (!el.classList.contains(c)) el.classList.add(c); });
    });
  });
}

let observer = null;
let pending = false;

/* host: CSS selector of the component in context ('.product-card-add salla-add-product-button');
   inner: the element to tag inside it ('button'); classes: reference classes to add. */
export function adopt(host, inner, classes) {
  RULES.push({ host, inner, classes: [].concat(classes) });
  applyAll(document);
  if (observer) return;
  observer = new MutationObserver(() => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; applyAll(document); });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
