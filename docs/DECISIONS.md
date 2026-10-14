# KOTIVA theme — decisions

Judgement calls made while porting the KOTIVA reference site (`../website`, Laravel) to this Salla
Twilight theme. Newest at the bottom. Each entry says what was chosen, why, and what the operator
or client may need to confirm. "T-" numbers are this repo's; "D-" numbers refer to
`../website/docs/DECISIONS.md`.

## T-01 — Working tree: the 130 "modified" files are line endings only

At the start of the port, `git status` showed 130 modified files on `master`. `git diff
--ignore-cr-at-eol` is empty: every change is CRLF↔LF from checking the repo out on a Windows
drive (`/mnt/d`). Nothing was reverted or normalised. Work happens on `feat/kotiva-theme`. Before
committing, the operator should either set `git config core.autocrlf input` or commit the
normalisation separately, so the first KOTIVA commit is not buried under 19,000 whitespace lines.

## T-02 — Reference assets are copied by a script, verbatim, and verified by hash

`scripts/sync-reference.mjs` copies `kotiva.css`, `shop.css`, `layout.js`, `animations.js`,
`routine-engine.js`, `routine-model.js`, `data-lite.js`, the four fonts and every image a
rendered reference page loads into `src/assets/kotiva/`. It copies only what a page actually
loads; superseded versions (`-v1`, `_candidates/`) stay behind. `--check` compares SHA-256 against
the reference and fails on any drift, so a hand edit to a "verbatim" file cannot ship unnoticed.
Theme glue (URL rewriting, Salla data adapters, form handlers) lives in separate files under
`src/assets/kotiva-theme/` and never inside the copies.

`shop.css` is copied as well as `kotiva.css`. The brief names only `kotiva.css`, but the reference
layout loads both, and the nav cart icon, sort row, stock states and cart page are styled in
`shop.css`. Leaving it out would break "pixel-identical".

## T-03 — The palette gate: ported unchanged, plus a recorded reference debt

`scripts/validate-palette.mjs` is the reference gate with its rules, parser and audited alpha
baseline copied unchanged (`scripts/lib/palette-rules.mjs`, `scripts/lib/colour-literals.mjs`,
`docs/colour-migration/alpha-baseline.json`). Only the scan scope (`scripts/lib/scan-files.mjs`)
is new. It covers every Twig view, the verbatim copies, the theme's own KOTIVA code, the built
`public/kotiva*` output and `scripts/`. Twig is parsed as HTML and SCSS as CSS.

**The reference itself does not pass its own gate.** 22 literals the rules reject (20 distinct
values) already exist in the reference: in `kotiva.css` (4), `shop.css` (10) and the inline
`<style>` blocks of `home.blade.php` (5, e.g. the hero's `#F4EFEC`) and `product/show.blade.php`
(2). The reference never noticed because its gate could not run (D-35, "pre-existing failures").
Those files are ported verbatim, so `node scripts/validate-palette.mjs --record-reference-debt`
records each rejected literal with its reference use count in
`docs/colour-migration/reference-debt.json`. The theme may use each such literal at most that
many times per pool: the source tree (`src/assets/kotiva`, `src/views`), the built copies
(`public/kotiva`), and `kotiva-salla.css` when it restyles a Salla component after the reference
rule that uses the literal (in practice it now uses none, see T-06). The theme's own JS and
scripts get no allowance. A literal the reference never used fails everywhere. **Client/designer
to confirm** whether those literals should be fixed upstream; if they are, re-sync and re-record.

**Raed's own styles are outside the default scope.** Raed's SCSS (`src/assets/styles/`) and its
compiled `public/app.css` style Salla's web components and the customer pages. They carry Raed's
colours (67 literals in the SCSS, plus Tailwind's palette in the output).
`node scripts/validate-palette.mjs --include-raed` reports them. See T-06 for how Salla's
components are brought onto the brand colour.

## T-04 — The shop listing lives at `/latest-products`; the store root is the KOTIVA home

Salla has no "all products" URL (`/products` returns 403). Its nearest equivalent,
`/latest-products`, renders `pages/product/index.twig` with `page.slug = product.index.latest`.
That page is the KOTIVA collection, and every "Shop" link points there (`link('latest-products')`).
The store root renders the KOTIVA home.

The retired Laravel site and the customizer linked the listing as `<store>/?filter=…` and
`<store>/?routine=…` (`Salla::listingUrl()`). `pages/index.twig` forwards both to
`/latest-products` with the query intact, from an inline `<head>` script, so old links,
bookmarks and the Routine Finder handoff land on the right view before anything paints. Twig
cannot read the query string (Salla documents no request variable), so the forwarding has to be
client-side.

## T-05 — Salla pages are matched by id (or a marker), not by slug

Salla gives every merchant page `page.slug = "page-single"`, with a URL built from its title
(`/<title-slug>/page-<id>`). The brief's `include 'pages/kotiva/' ~ page.slug` therefore cannot
work. `pages/page-single.twig` recognises a KOTIVA page by, in order:

1. its id matching the Theme setting **KOTIVA pages → <Page>** (`kotiva_page_<key>`, page id or
   URL);
2. its body being the marker `kotiva:<slug>`, e.g. `kotiva:routine-finder`;
3. a URL segment equal to the slug. A page titled "Routine Finder" lives at
   `/routine-finder/page-…`. This is a fallback only, because Salla's slugging of titles is
   unverified.

Links use the same setting. A numeric value becomes `link('redirect/pages/<id>')`, Salla's
stable redirect, and a URL is used as is. An unconfigured page links to the store home, never
to a dead URL. Includes use Salla's dot notation (`pages.kotiva.<slug>`), with optional
`<slug>-pre-scripts` / `<slug>-scripts` partials standing in for the reference's
`@push('pre_scripts')` / `@push('scripts')`.

**Operator:** create the seven pages and paste each id into Theme settings (README → Salla pages).

## T-06 — CSS layering: Raed's globals confined to Raed's pages

The order is Raed's `app.css`, then the verbatim `kotiva.css` and `shop.css`, then
`kotiva-salla.css`. Raed's stylesheet would otherwise restyle KOTIVA markup in ways the
reference never had:

- Tailwind preflight makes every `<svg>` a block and forces `img { height: auto }`.
- Raed's reset sizes `h1`–`h3` and removes the `a:focus` outline, an accessibility regression.
- Raed's form layer forces `font-size: 16px !important` on inputs.
- Raed ships a second `.btn`.

So:

- **Preflight is off globally** (`tailwind.config.js corePlugins.preflight: false`). A verbatim
  copy (`02-generic/_raed-preflight.scss`) plus Raed's reset, form and button layers apply only
  under `.kotiva-raed`. The Raed pages kept in the theme set `body.kotiva-raed`: customer area,
  loyalty, brands, testimonials, thank-you and non-KOTIVA Salla pages. The product-option
  partials sit in a `.kotiva-raed` wrapper.
- `@tailwindcss/forms` uses the `class` strategy; Raed's inputs carry `.form-input`.
- **Tailwind scans only Raed's surviving views.** Otherwise it would emit utilities for KOTIVA
  class names (`container`, `hidden`, `mt-16`, …).
- `scripts/check-class-collisions.mjs` fails on any class used in KOTIVA markup that `app.css`
  styles outside `.kotiva-raed`, except the reviewed list in the script. It passes.
- **Salla's buttons wear the reference's own classes.** `salla-adopt.js` adds
  `.product-card-add-btn` (listing) and `.btn .btn-primary` (PDP, cart checkout) to the inner
  `<button>` of Salla's light-DOM components. The verbatim CSS then styles them exactly,
  including hover, disabled and dark mode. Stencil injects component styles before the first
  `<link>` in `<head>`, so the KOTIVA sheets win the cascade. This replaced an earlier copy of
  those rules in `kotiva-salla.css`, which would have duplicated values (and one reference-debt
  literal).
- `--color-primary` is fixed to `#005DBA`. Salla's own components (toasts, modals, badges) take
  the brand blue whatever the merchant's colour setting is. The `color` feature is dropped from
  `twilight.json`.

Removed with the Raed header: `main-menu.js`, the mmenu mobile menu and the "more" menu. Their
element waits in `app.js` polled forever, so they are no longer started. `app.js` no longer
assumes a `<salla-cart-summary>` exists (T-16).

## T-07 — Contact and newsletter forms: configured endpoint, email fallback

Salla has no newsletter or contact-form API or component (`salla-contacts` only displays
contact details). The Laravel `/contact` and `/newsletter` routes and the old n8n webhook are
retired. `layout.js` (verbatim) still defines `kotivaSubmitToInbox()` against `/contact` and
`/newsletter`, so `kotiva-core.js`, which loads after it, replaces that one function with the
same signature and payload. Every form on the home, journal and contact pages is ported
unchanged. The replacement:

- POSTs JSON to **Theme settings → Forms → Newsletter / Contact form endpoint** when set
  (Formspree, a Mailchimp/Klaviyo form action, a Make/Zapier webhook, …);
- otherwise opens the visitor's email app, addressed to the store email (`store.contacts.email`)
  and pre-filled, so a submission is never silently lost;
- otherwise (no store email either) shows the page's existing error message.

**Client to decide** which email tool receives sign-ups, then paste its endpoint.

## T-08 — Listing: server-rendered from the SKU map, reconciled with Salla

The listing markup is the reference's `shop/index.blade.php`: the editorial purple hero, sticky
filter pills, the sort row and the 3-column cell grid of `.product-card`s. Behaviour is the Salla
customizer V6:

- ten Salla filter keys with counts;
- client-side sort;
- **Load more**: 15 shown, +10 per click;
- the empty state ("No products found in this category.");
- `?routine=` with the reference's notice.

- **SKU map is live; Salla tags and categories are not used.** Each product's KOTIVA metadata
  (filter key, category, skin type, concern, featured, order) comes from
  `catalog.json`/`data.twig`. It is generated from the reference's `data-lite.js`, the
  customizer's PRODUCTS (filter + related group), `salla-links.json` (SKU → Salla id/path) and
  `routine-model.json`. Matching is by Salla `sku` (`salla.product.fetch` returns it), falling
  back to the product name exactly as the customizer did. Salla tags or categories could take
  over later; today the merchant has not set them up for KOTIVA's taxonomy, and the brief's
  "prefer them if set" would make the grid depend on unseen admin data.
- **Server render first.** Twig renders all 25 cards from the map, with real Salla URLs and ids,
  so the page is complete and crawlable without JS. `kotiva-listing.js` then fetches the live
  store (`latest`, 32 per page, then a name search for anything missing) and fills prices and
  stock. It removes products no longer on Salla, adds any catalog product that was not rendered,
  and recomputes the counts. If the store cannot be reached, the server render stays (fails
  open).
- **Price.** The card shows the VAT-exclusive price, as the reference did. Salla prices are
  exclusive unless the merchant enabled tax-inclusive prices; in that case the price is divided
  by 1.15. The VAT rate is the reference's 15% (`config('kotiva.vat_rate')`), a constant.
- **Out of stock** renders the reference's muted card: `.is-sold-out`, the "Sold out" flag, a
  "Sold out" call to action and a disabled pill.
- **Other Salla listings** (categories, tags, offers, search) use the same hero, sort row and
  card, fed from that source; the filter row is dropped there.
- `layout.js`'s own routine handoff still matches the retired `/product/<slug>` URLs, finds
  none and "fails open". The listing script starts after it, so the listing's own view stands.

## T-09 — Product page

- **Copy.** `product.description` is parsed with the customizer's own parser, ported unchanged
  except that it takes text instead of an element. When it yields copy, it replaces the
  server-rendered reference copy piece by piece (intro, benefits, ingredients, how to use, and
  skin type / concern / size in the spec grid). Otherwise the reference copy stays. The merchant
  can therefore edit the text in Salla. **The science accordion has no Salla field.** It comes
  from the reference's `ScienceRenderer.php`, run as-is by the export script, so its no-loss
  guarantee holds.
- **Gallery.** Salla's images go in a `<salla-slider>` on the reference's sticky black panel,
  with several images per product (Amendment 5). It shows controls and pagination only when
  there is more than one image. "NN / 25" comes from the SKU map.
- **Buy box.** Salla's form (`salla.form.onSubmit('cart.addItem')`), `<salla-quantity-input>` as
  the reference's pill, and `<salla-add-product-button>` as `.btn .btn-primary`, all on one row.
  Quick-buy and Apple Pay are not rendered on the page (checkout still offers them); wishlist and
  social share are not rendered. The notify-me flow is kept for out-of-stock products whose
  merchant enabled it. Product options use Raed's partial.
- **Stock.** "In stock", "Only N left" at 5 or fewer (the reference's `low_stock_threshold`), or
  "Sold out".
- **Instalments.** `<salla-installment>` sits 22px below the buy row.
- **Reviews.** `<salla-comments>` goes after the Doctor Approved box, behind the `show_reviews`
  setting. This is Amendment 6's placement: "after the main product information, benefits,
  usage instructions, and science section".
- **Complete your routine.** Same category, in-stock first, then by id, capped at 4
  (`ProductController::show()`). The cards have no add-to-cart, as in the reference. Products no
  longer on Salla drop out.
- **JSON-LD and meta.** Salla emits its own product structured data and SEO tags; the
  reference's are not duplicated (T-14).

## T-10 — Cart

The layout is the reference's: items list, summary card, "Proceed to Checkout", "Continue
Shopping" and the COD note. It runs on Salla's cart APIs: quantity via
`salla.form.onChange('cart.updateItem')`, removal via `salla.cart.deleteItem()`, and checkout via
`salla.cart.submit()`, which is Salla's hosted checkout, untouched. The summary reads `sub_total`,
`tax_amount`, `discount` and `total`, and every cart event repaints it in the reference's
"SAR 0.00" format. **Differences from the reference:**

- quantity is Salla's stepper, which saves on change, so there is no "Update" button;
- a discount row appears only when Salla applies one;
- Salla's coupon field shows when the merchant enables coupons;
- Salla offer widgets render only when offers exist.

## T-11 — Journal on Salla's blog

The reference journal is six "Coming soon" teasers from `data-lite.js`; no article exists. That
is the KOTIVA journal's empty state, and `/blog` renders it unchanged while the store has no
posts. When the client publishes Salla blog posts, they replace the teasers in the same layout
(feature plus grid), each linked as "Read article →". A post's first tag is its topic, so the
filter works when posts are tagged Ingredients / Routines / Dermatology / Education / Brand.
Article pages reuse the reference's long-form layout (the legal pages' hero and column) instead
of inventing one. The three feature images (all six, in fact) ship as theme assets.

## T-12 — Routine Finder

- `routine-engine.js` and `routine-model.js` are verbatim; `sync-reference.mjs --check` proves it.
  The reference's engine test is ported (`pnpm test`; 18/18 pass on the shipped files).
- The one Laravel dependency, `fetch('/api/products')`, is replaced by `kotiva-routine.js`. It
  builds the same `window.KOTIVA.products` / `getById()` before the engine loads: first from the
  SKU map with the exported Salla paths (id N ⇔ KOT{N:3}, asserted by the export), then from the
  live catalog (`salla.product.fetch`, cached in `sessionStorage` by `kotiva-core.js`). Products
  that left the store drop out, and a miss falls back to the store, as in the reference.
- "Shop These Products" builds `<store>/?routine=<SKUs>`, which forwards to the listing (T-04).
- **Step images are 12 settings, not 7.** Only two of the seven steps have images: four skin
  types and eight concerns. Hair thinning has no image in the reference either. The controller
  changed in one line only: concern images come from `window.KOTIVA_QUIZ_IMAGES` (those settings)
  instead of `/img/quiz/concern-<id>.webp`.
- **New dev dependency: `@playwright/test` 1.56.1.** The brief requires a Playwright test;
  `@playwright/test` also supplies the browser driver for the ported screenshot scripts, so no
  separate `playwright` package is added. It is written to `package.json` but **not installed
  here**: `node_modules` was created by Windows pnpm 12 (store `C:\pnpm-store`), and this
  environment's pnpm 9 refuses to touch it. **Operator:** run `pnpm install` on Windows (updates
  `pnpm-lock.yaml`), then `pnpm exec playwright install chromium`.

## T-13 — Home

Twelve home components (`components/home/kotiva-*.twig`) are registered in `twilight.json` with
`is_default: true`, in the reference order. A fresh install shows the reference home, and the
merchant can still reorder or hide sections in the theme editor. Raed's own home components and
their JS were removed. Hero artwork is four image settings (two slides × desktop/mobile),
defaulting to the original files. The best-sellers rail shows no price, exactly as the reference
(commerce off, D-35 item 9). The category tiles' product counts are the reference's literals
("16 products", …).

## T-14 — SEO, robots.txt, llms.txt

Salla renders `<title>`, meta description, canonical, Open Graph and product JSON-LD from its own
SEO fields through the `head` hooks. Repeating the reference's tags would duplicate them, so the
reference's titles and descriptions are listed in the README for the operator to paste into each
page's / product's SEO fields. Salla exposes neither `robots.txt` nor `llms.txt` to themes, and
there is no theme setting that could serve them. The reference's `llms.txt` content should be
re-hosted by the client if still wanted.

## T-15 — Right-to-left

`<html dir>` follows `theme.is_rtl`, and `data-dir` mirrors it. KOTIVA is an English, LTR design,
and `kotiva.css` has no RTL rules. Under RTL, flex and grid rows mirror, but absolutely
positioned details (gallery number, hero arrows, card flags) do not. **This could not be
checked visually here** (no preview). It is listed for the operator's RTL pass (Phase 6), and the
compromise is to keep the store's default language English.

## T-16 — Header cart count

The reference header's cart is a plain link with an (unused) `.nav-cart-badge`. The theme keeps
that markup and fills the badge from `cart.items_count`. Raed's `app.js` updates `[data-cart-count]`
on every cart event, and `kotiva-core.js` toggles the badge's empty state. `<salla-cart-summary>`
would have drawn Salla's own icon and badge. `app.js`'s add-to-cart animation now tolerates its
absence.

## T-17 — Footer

The footer is the reference's four columns and bottom bar. Salla's `copyright` hook and payment
badges are not rendered, because the reference has neither. If Salla's terms require its
attribution, add `{% hook copyright %}` to the bottom bar. Social icons stay "Coming soon" marks
until a URL is set; a set URL turns that icon into a link, as the reference's own markup comment
prescribes.

## T-18 — Theme size

The four campaign JPEGs are 2.5–6 MB each, 17 MB of the 26 MB of copied assets. They are shipped
as the setting defaults because the brief requires the original artwork. If Salla rejects the
theme for size, upload them through the `hero_*` settings and remove them from
`scripts/sync-reference.mjs`.

## T-19 — Verification status

Done here:

- `pnpm run production` (webpack, compiled with warnings only: Sass `@import` deprecations and
  asset-size hints, all pre-existing in Raed);
- `scripts/sync-reference.mjs --check`;
- `scripts/validate-palette.mjs`;
- `scripts/check-class-collisions.mjs`;
- `scripts/check-urls.mjs`;
- `node --check` on every JS file;
- `pnpm test` (routine engine).

**Not done here:** anything that needs a running store (no Salla login), the Laravel reference
(its MySQL is not running) or browsers (Playwright's are not installed). That covers the e2e
test, screenshot capture and comparison, console-error sweeps, RTL and the 390px pass. The README
gives the operator the exact commands.

## T-20 — Home is fixed-order

`pages/index.twig` includes the twelve `components/home/kotiva-*.twig` sections directly, in the
reference order, instead of rendering `{% component home %}`. The home must match the reference,
and the editor-managed list let a store's saved component layout drift from it. The sections read
`theme.settings` only, never a `component` variable, so they render the same when included. The
`twilight.json` component entries stay, so the editor still lists them, but reordering or hiding
them there has no effect on the storefront. Editor-managed home sections are deferred. This
supersedes the "reorder or hide" sentence of T-13.
