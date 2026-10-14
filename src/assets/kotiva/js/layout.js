/* ============================================================
   KOTIVA™ — Layout JS v3.0
   - Nav scroll behaviour (transparent ↔ scrolled)
   - Light / Dark mode toggle (html[data-mode])
   - Hamburger, Carousel, Filters, Accordion
   NOTE: Nav + footer markup is static HTML on every page (K5) -
         this file no longer injects it. Three-theme system is
         section-level CSS only. html[data-mode] overrides ritual
         sections in dark mode. html[data-theme] stays "ritual"
         permanently.
   ============================================================ */

(function() {
  'use strict';

  /* ── ANTI-FOUC: apply saved mode before paint ── */
  (function() {
    var m = localStorage.getItem('kotiva-mode');
    if (m === 'dark') document.documentElement.dataset.mode = 'dark';
  })();

  /* ── FORM SUBMISSION (contact + newsletter) ──
     Posts to this application's own endpoints. This used to call an n8n
     webhook operated by the previous development partner — the handover
     README flagged it as outside the codebase and not guaranteed to keep
     running, so a submission could be lost with nothing to show for it.
     Both endpoints now store the submission before attempting to email it.

     The signature is unchanged on purpose: contact.html's form and the
     newsletter sign-ups on index.html and journal.html all call this one
     function, and none of them needed editing.
  ── */
  window.kotivaSubmitToInbox = function(payload) {
    var isNewsletter = payload && payload.type === 'newsletter';
    var url = isNewsletter ? '/newsletter' : '/contact';

    var body = isNewsletter
      ? { email: payload.email, source: payload.source || 'website' }
      : {
          name: payload.name,
          email: payload.email,
          enquiry_type: payload.enquiryType || null,
          message: payload.message
        };

    var meta = document.querySelector('meta[name="csrf-token"]');

    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': meta ? meta.getAttribute('content') : ''
      },
      credentials: 'same-origin',
      body: JSON.stringify(body)
    }).then(function(res) {
      return res.json().catch(function() { return {}; }).then(function(data) {
        if (!res.ok) {
          /* 422 carries per-field messages; surface the first one so the
             visitor is told what to fix rather than that "something" failed. */
          var first = data.errors && Object.keys(data.errors)[0];
          throw new Error(
            (first && data.errors[first][0]) ||
            data.message ||
            'Submission failed (' + res.status + ')'
          );
        }
        return data;
      });
    });
  };

  /* ── NAV SCROLL ── */
  /* K38: mark the nav link for the page you are actually on.
     There was no current-location cue anywhere — header or footer — so on any inner page the
     navigation told you where you could go but never where you were. Done in JS rather than as
     per-page markup because this is a 36-page static site with the nav duplicated in every file
     (plus twice more inside the two generators): a hand-maintained `active` class across 38
     emit points is a guarantee of drift, and the pages that drifted would be the ones nobody
     opened. One rule, derived from location, cannot disagree with itself.

     aria-current="page" is the part that matters for screen readers and is applied in BOTH the
     header and the footer; the visible treatment is header-only, because a footer is a dense
     link list where a highlight reads as clutter rather than as orientation. */
  function markCurrentNav() {
    var here = location.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '').replace(/\/$/, '') || '/';
    var exact = false;
    /* K39: the header CTA is included. Find My Routine is a button rather than a .nav-link, so
       a visitor standing ON the routine finder saw no current-state anywhere — the one page
       reached by the most prominent control in the header was the one page with no
       orientation. Found by walking every page family through the probe rather than by
       checking the pages that happen to be in the nav list. */
    document.querySelectorAll('.nav-link, .nav-right .btn, .nav-overlay .btn, .footer-links a, .footer a[href]').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (!href || href.charAt(0) === '#' || /^(https?:|mailto:|tel:)/.test(href)) return;
      var path;
      try { path = new URL(href, location.href).pathname; } catch (e) { return; }
      path = path.replace(/\/index\.html$/, '/').replace(/\.html$/, '').replace(/\/$/, '') || '/';
      /* Query strings are deliberately ignored: shop.html?filter=face is still the Shop page,
         and treating each filter as its own destination would light up nothing at all on /shop. */
      if (path !== here) return;
      a.setAttribute('aria-current', 'page');
      /* `exact` is set ONLY by a header match, not by any match. The footer links to pages the
         header does not carry (the glossary, privacy, terms), so setting it on a footer hit made
         the glossary look "handled" and short-circuited the section fallback below — the page
         then showed no header orientation at all, which is the exact gap the fallback exists to
         close. Found by checking the glossary rather than by reading the code. */
      if (a.classList.contains('nav-link')) { a.classList.add('is-current'); exact = true; }
      else if (a.classList.contains('btn')) { a.classList.add('is-current-cta'); exact = true; }
    });

    /* SECTION FALLBACK. Two whole page classes are not in the header at all and would otherwise
       show no orientation whatsoever: the 25 product detail pages, and the ingredient glossary.
       They are not top-level destinations and should not be — but a visitor deep in a product
       page still needs to know they are inside Shop. Marked with aria-current="true" rather than
       "page", which is the correct distinction: this is the section you are in, not the page you
       are on. Only runs when nothing matched exactly, so a real page match always wins. */
    if (exact) return;
    var section = null;
    if (/^\/product\//.test(here)) section = 'shop.html';
    else if (/\/ingredients$/.test(here)) section = 'science.html';
    if (!section) return;
    document.querySelectorAll('.nav-link').forEach(function (a) {
      if ((a.getAttribute('href') || '').indexOf(section) === -1) return;
      a.setAttribute('aria-current', 'true');
      a.classList.add('is-current-section');
    });
  }

  function initNav() {
    var nav = document.querySelector('.nav');
    if (!nav) return;

    var isEditorialHero = document.querySelector('.hero[data-theme="editorial"], .hero-banner, .shop-hero');
    var isTransparent = !!isEditorialHero;

    var lastScrollY = Math.max(0, window.scrollY);
    var HIDE_DELTA  = 8;   /* px down before hiding — absorbs micro-jitter */
    var SHOW_DELTA  = 5;   /* px up before showing  — slightly more responsive */
    var AT_TOP      = 80;  /* px — always show nav near top of page */

    function updateNav() {
      var scrollY  = Math.max(0, window.scrollY); /* clamp: handles iOS rubber-band negative values */
      var scrolled = scrollY > 60;

      /* ── transparency / scrolled state (unchanged) ── */
      if (isTransparent) {
        nav.classList.toggle('scrolled', scrolled);
        nav.classList.toggle('transparent', !scrolled);
      } else {
        nav.classList.add('scrolled');
        nav.classList.remove('transparent');
      }

      /* ── hide / show on direction ── */
      var delta     = scrollY - lastScrollY;
      var menuOpen  = !!document.querySelector('.nav-overlay.open');

      if (scrollY < AT_TOP || menuOpen) {
        /* Always visible at page top or when mobile menu is open */
        nav.classList.remove('nav-hidden');
      } else if (delta > HIDE_DELTA) {
        /* Scrolling down past threshold — hide */
        nav.classList.add('nav-hidden');
      } else if (delta < -SHOW_DELTA) {
        /* Any meaningful upward scroll — show immediately */
        nav.classList.remove('nav-hidden');
      }

      /* K32: mirror the nav's OWN state onto <html> so sticky elements below it can offset
         themselves correctly when it hides. DERIVED from nav.classList, never decided a second
         time here -- a duplicated condition is a condition that will disagree. Anything sticky
         under a hide-on-scroll header needs this: without it the element keeps reserving the
         header's height and leaves a dead band at the top of the viewport (shop's filter bar,
         the PDP image column). */
      document.documentElement.classList.toggle('nav-hidden', nav.classList.contains('nav-hidden'));

      lastScrollY = scrollY;
      updateNavLogo();
    }

    window.addEventListener('scroll', updateNav, { passive: true });
    updateNav();
  }

  function updateNavLogo() {
    var nav = document.querySelector('.nav');
    if (!nav) return;
    var isScrolled = nav.classList.contains('scrolled');
    var isDarkMode = document.documentElement.dataset.mode === 'dark';
    // Light logo whenever the nav sits on a dark surface:
    // transparent over a dark hero, OR dark mode (scrolled nav is dark too).
    var useLightLogo = !isScrolled || isDarkMode;
    var darkLogo = nav.querySelector('.logo-dark');
    var lightLogo = nav.querySelector('.logo-light');
    var logoText = nav.querySelector('.nav-logo-text');

    if (darkLogo && lightLogo) {
      darkLogo.style.display = useLightLogo ? 'none' : 'block';
      darkLogo.style.filter = 'none';
      darkLogo.style.height = isScrolled ? '28px' : '36px';
      lightLogo.style.display = useLightLogo ? 'block' : 'none';
      lightLogo.style.height = isScrolled ? '28px' : '36px';
    } else if (darkLogo) {
      // fallback: invert the dark SVG to white when on a dark surface
      darkLogo.style.display = 'block';
      darkLogo.style.filter = useLightLogo ? 'brightness(0) invert(1)' : 'none';
      darkLogo.style.height = isScrolled ? '28px' : '36px';
    }
    if (logoText) {
      logoText.className = 'nav-logo-text' + (useLightLogo ? ' light' : '');
    }
  }

  /* ── LIGHT / DARK MODE TOGGLE ── */
  function initThemeToggle() {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;

    function applyMode(mode) {
      if (mode === 'dark') {
        document.documentElement.dataset.mode = 'dark';
        btn.setAttribute('aria-label', 'Switch to light mode');
      } else {
        delete document.documentElement.dataset.mode;
        btn.setAttribute('aria-label', 'Switch to dark mode');
      }
      localStorage.setItem('kotiva-mode', mode);
      updateNavLogo();
    }

    btn.addEventListener('click', function() {
      var isDark = document.documentElement.dataset.mode === 'dark';
      applyMode(isDark ? 'light' : 'dark');
    });
  }

  /* ── HAMBURGER ── */
  function initHamburger() {
    var hamburger = document.querySelector('.nav-hamburger');
    var overlay = document.querySelector('.nav-overlay');
    if (!hamburger || !overlay) return;

    var focusable = overlay.querySelectorAll('a, button');

    function setMenu(open) {
      overlay.classList.toggle('open', open);
      hamburger.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
      hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.style.overflow = open ? 'hidden' : '';
      if (open && focusable.length) focusable[0].focus();
      else if (!open) hamburger.focus();
    }

    hamburger.addEventListener('click', function() {
      setMenu(!overlay.classList.contains('open'));
    });

    overlay.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() { setMenu(false); });
    });

    // Accessibility: Escape closes; Tab is trapped within the open overlay.
    document.addEventListener('keydown', function(e) {
      if (!overlay.classList.contains('open')) return;
      if (e.key === 'Escape') { setMenu(false); return; }
      if (e.key === 'Tab' && focusable.length) {
        var first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ── ROBUST LAZY IMAGE LOAD ──
     Native loading="lazy" does NOT fire when the document element behaves as
     a scroll container (overflow-x containment propagated from body). The
     result is images that never fetch — most aggressively in Safari/WebKit.
     This IO net force-loads each image just before it enters view (preserving
     the perf benefit of lazy), works on every engine, and includes a final
     safety sweep so no image is ever left unloaded. */
  function initLazyImages() {
    var imgs = document.querySelectorAll('img[loading="lazy"]');
    if (!imgs.length) return;

    function load(img) {
      if (img.dataset.kLoaded) return;
      img.dataset.kLoaded = '1';
      img.addEventListener('load', function() { img.classList.add('loaded'); }, { once: true });
      img.loading = 'eager';
      var s = img.getAttribute('src');
      if (s) { img.removeAttribute('src'); img.setAttribute('src', s); } // re-trigger fetch
    }

    if (!('IntersectionObserver' in window)) {
      imgs.forEach(load);
      return;
    }

    var io = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) { load(e.target); io.unobserve(e.target); }
      });
    }, { rootMargin: '800px 0px' });

    imgs.forEach(function(img) {
      if (img.complete && img.naturalWidth > 0) { img.classList.add('loaded'); }
      else { io.observe(img); }
    });

    /* Safety net: force any image still unloaded shortly after full page load. */
    window.addEventListener('load', function() {
      setTimeout(function() {
        imgs.forEach(function(img) {
          if (!img.complete || img.naturalWidth === 0) load(img);
        });
      }, 1200);
    });
  }

  /* ── CAROUSEL DRAG-TO-SCROLL ── */
  function initCarousels() {
    document.querySelectorAll('.carousel-wrap').forEach(function(wrap) {
      var isDown = false, startX = 0, scrollLeft = 0;
      wrap.addEventListener('mousedown', function(e) {
        isDown = true; wrap.style.cursor = 'grabbing';
        startX = e.pageX - wrap.offsetLeft; scrollLeft = wrap.scrollLeft;
      });
      wrap.addEventListener('mouseleave', function() { isDown = false; wrap.style.cursor = 'grab'; });
      wrap.addEventListener('mouseup', function() { isDown = false; wrap.style.cursor = 'grab'; });
      wrap.addEventListener('mousemove', function(e) {
        if (!isDown) return; e.preventDefault();
        var x = e.pageX - wrap.offsetLeft;
        wrap.scrollLeft = scrollLeft - (x - startX) * 1.5;
      });
      var touchStartX = 0, touchScrollLeft = 0;
      wrap.addEventListener('touchstart', function(e) {
        touchStartX = e.touches[0].pageX; touchScrollLeft = wrap.scrollLeft;
      }, { passive: true });
      wrap.addEventListener('touchmove', function(e) {
        wrap.scrollLeft = touchScrollLeft - (e.touches[0].pageX - touchStartX);
      }, { passive: true });
    });
  }

  /* ── FILTER PILLS ── */
  function updateGridOrphan(target) {
    var all = target.querySelectorAll('[data-tags]');
    all.forEach(function(item) { item.classList.remove('grid-orphan'); });
    var visible = Array.prototype.filter.call(all, function(item) {
      return item.style.display !== 'none';
    });
    if (visible.length % 2 === 1) {
      visible[visible.length - 1].classList.add('grid-orphan');
    }
  }

  function initFilters() {
    document.querySelectorAll('.filter-pills').forEach(function(container) {
      var pills = container.querySelectorAll('.filter-pill');
      var targetSelector = container.dataset.target;
      var target = targetSelector ? document.querySelector(targetSelector) : null;
      pills.forEach(function(p) { p.setAttribute('aria-pressed', p.classList.contains('active') ? 'true' : 'false'); });
      if (target) { updateGridOrphan(target); }
      pills.forEach(function(pill) {
        pill.addEventListener('click', function() {
          pills.forEach(function(p) { p.classList.remove('active'); p.setAttribute('aria-pressed', 'false'); });
          pill.classList.add('active');
          pill.setAttribute('aria-pressed', 'true');
          var filter = pill.dataset.filter;
          if (target) {
            target.querySelectorAll('[data-tags]').forEach(function(item) {
              var tags = item.dataset.tags ? item.dataset.tags.split(',') : [];
              item.style.display = (filter === 'all' || tags.includes(filter)) ? '' : 'none';
            });
            updateGridOrphan(target);
          }
        });
      });
    });
  }

  /* ── ROUTINE HANDOFF ──
     The Routine Finder's result CTA carries the recommendation through as
     shop.html?routine=<slug,slug,...> in routine order. Without this the
     shop discarded the personalised result at the exact moment of intent
     (K25 / S2-4). Matches on the card's own href, so it needs no product
     data on this page. */
  function initRoutineFilter() {
    var grid = document.getElementById('product-grid');
    if (!grid) return;
    var raw = new URLSearchParams(window.location.search).get('routine');
    if (!raw) return;
    var slugs = raw.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    if (!slugs.length) return;

    var shown = 0;
    grid.querySelectorAll('.product-card').forEach(function (card) {
      /* The card is a cell now, wrapping the product link next to an add-to-cart
         form, so the href sits on a child anchor rather than on the card itself.
         Reading the card's own href first keeps this working either way. */
      var link = card.getAttribute('href') ? card : card.querySelector('a[href]');
      var href = link ? (link.getAttribute('href') || '') : '';
      /* Product routes are extensionless now (/product/<slug>, not /product/<slug>.html),
         so the trailing \.html this used to require would never match and every card would
         hide — the handoff failing closed on the one page it exists to serve. Excluding
         ?# rather than . keeps a slug containing a dot from being truncated. */
      var m = href.match(/\/product\/([^/?#]+)/);
      var i = m ? slugs.indexOf(m[1]) : -1;
      if (i === -1) { card.style.display = 'none'; return; }
      card.style.display = '';
      card.style.order = String(i);          /* preserve routine order */
      shown++;
    });
    if (!shown) {                            /* nothing matched — fail open */
      grid.querySelectorAll('.product-card').forEach(function (c) { c.style.display = ''; c.style.order = ''; });
      return;
    }
    updateGridOrphan(grid);

    var notice = document.createElement('div');
    notice.className = 'routine-notice';
    notice.setAttribute('role', 'status');
    notice.innerHTML = 'Showing the ' + shown + ' products from your routine. ' +
      '<button type="button" class="routine-notice-clear">Show the full range</button>';
    grid.parentNode.insertBefore(notice, grid);
    notice.querySelector('.routine-notice-clear').addEventListener('click', function () {
      grid.querySelectorAll('.product-card').forEach(function (c) { c.style.display = ''; c.style.order = ''; });
      updateGridOrphan(grid);
      notice.remove();
      var u = new URL(window.location.href);
      u.searchParams.delete('routine');
      window.history.replaceState({}, '', u);
    });
  }

  /* ── ACCORDION ── */
  function initAccordions() {
    document.querySelectorAll('.accordion-trigger').forEach(function(trigger) {
      trigger.addEventListener('click', function() {
        var body = trigger.nextElementSibling;
        var isOpen = trigger.classList.contains('open');
        var parent = trigger.closest('.accordion-group') || trigger.closest('section');
        if (parent) {
          parent.querySelectorAll('.accordion-trigger.open').forEach(function(t) {
            t.classList.remove('open'); t.nextElementSibling.classList.remove('open');
          });
        }
        if (!isOpen) { trigger.classList.add('open'); body.classList.add('open'); }
      });
    });
  }

  /* ── CONCERN PILLS ── */
  window.initConcernPills = function() {
    document.querySelectorAll('.concern-pill').forEach(function(pill) {
      pill.addEventListener('click', function() { pill.classList.toggle('selected'); });
    });
  };

  /* ── STEP CARDS ── */
  window.initStepCards = function() {
    document.querySelectorAll('.step-card').forEach(function(card) {
      card.addEventListener('click', function() {
        var group = card.closest('.step-cards');
        if (group) group.querySelectorAll('.step-card').forEach(function(c) { c.classList.remove('selected'); });
        card.classList.add('selected');
      });
    });
  };

  /* ── INIT ── */
  document.addEventListener('DOMContentLoaded', function() {
    initNav();
    markCurrentNav();
    initThemeToggle();
    initHamburger();
    initCarousels();
    initFilters();
    initRoutineFilter();
    initAccordions();
    initLazyImages();
    if (typeof initConcernPills === 'function') initConcernPills();
    if (typeof initStepCards === 'function') initStepCards();
  });

})();
