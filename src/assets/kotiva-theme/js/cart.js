/* ============================================================
   KOTIVA cart (components/kotiva/cart.twig) on Salla's cart API.

   • Proceed to Checkout → salla.cart.submit() (Salla's hosted checkout), after the same
     option-form validity check Raed's cart.js made.
   • Remove → salla.cart.deleteItem().
   • Quantity → Salla's stepper posts itself (salla.form.onChange on the item form).
   • Every cart update repaints the line totals and the summary in the reference's
     "SAR 0.00" format, VAT-exclusive subtotal first (cart/index.blade.php).
   ============================================================ */
import { adopt } from './salla-adopt';

const VAT_RATE = 0.15;
const root = document.querySelector('[data-kotiva-cart]');
const sar = (n) => `SAR ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const num = (v) => (v && typeof v === 'object' ? Number(v.amount ?? v.value ?? 0) : Number(v || 0));

adopt('#cart-submit', 'button', ['btn', 'btn-primary']);

function paint(summary) {
  if (!root || !summary) return;
  const taxInclusive = Boolean(window.KOTIVA_THEME && window.KOTIVA_THEME.taxInclusivePrices);
  const tax = summary.tax_amount != null ? num(summary.tax_amount) : null;
  const sub = num(summary.sub_total);
  const set = (sel, text) => root.querySelectorAll(sel).forEach((el) => { el.textContent = text; });
  set('[data-cart-subtotal]', sar(taxInclusive && tax != null ? sub - tax : sub));
  if (tax != null) set('[data-cart-vat]', sar(tax));
  else if (!taxInclusive) set('[data-cart-vat]', sar(sub * VAT_RATE));
  set('[data-cart-total]', sar(num(summary.total)));
  const discount = num(summary.discount);
  root.querySelectorAll('[data-cart-discount-row]').forEach((row) => { row.hidden = !(discount > 0); });
  set('[data-cart-discount]', `− ${sar(discount)}`);
  (summary.items || []).forEach((item) => {
    const form = document.getElementById(`item-${item.id}`);
    if (!form) return;
    const unit = form.querySelector('[data-cart-item-unit]');
    if (unit) unit.textContent = sar(num(item.price));
    const total = form.querySelector('[data-cart-item-total]');
    if (total) total.textContent = item.is_available === false ? 'Sold out' : sar(num(item.total_special_price || item.total));
  });
}

function bind() {
  const salla = window.salla;
  salla.cart.event.onUpdated((summary) => {
    if (summary && !summary.count) { window.location.reload(); return; } // last item gone: empty state
    paint(summary);
  });

  // First paint in the reference format (the server printed Salla's own money format).
  try {
    Promise.resolve(salla.cart.details(null, [])).then((res) => paint(res && res.data && (res.data.cart || res.data))).catch(() => {});
  } catch (e) { /* keep the server figures */ }

  document.addEventListener('click', (e) => {
    const remove = e.target.closest('[data-cart-remove]');
    if (remove) {
      e.preventDefault();
      const id = remove.getAttribute('data-cart-remove');
      remove.disabled = true;
      salla.cart.deleteItem(id)
        .then(() => { const form = document.getElementById(`item-${id}`); if (form) form.remove(); })
        .catch(() => { remove.disabled = false; });
      return;
    }
    const submit = e.target.closest('#cart-submit');
    if (!submit) return;
    // Required product options must be filled before Salla's checkout takes over.
    let valid = true;
    document.querySelectorAll('form[id^="item-"]').forEach((form) => { valid = valid && form.reportValidity(); });
    if (!valid) {
      e.preventDefault();
      salla.notify.error(salla.lang.get('common.messages.required_fields'));
      return;
    }
    const stop = () => { if (typeof submit.stop === 'function') submit.stop(); };
    salla.event.once('login::open', stop);
    salla.event.once('cart::submit.failed', stop);
    if (typeof submit.load === 'function') submit.load();
    salla.cart.submit();
  });
}

if (root && root.querySelector('.cart-layout')) {
  if (window.salla && typeof window.salla.onReady === 'function') window.salla.onReady(bind);
  else document.addEventListener('DOMContentLoaded', () => window.salla && window.salla.onReady(bind));
}
