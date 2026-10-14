/* ============================================================
   KOTIVA™ — Premium Animation System v3.0
   Cinematic warmth. Deliberate motion. No generic bounces.
   ============================================================ */
(function () {
  'use strict';

  /* ── SCROLL PROGRESS BAR ── */
  function initScrollProgress() {
    var bar = document.createElement('div');
    bar.className = 'scroll-progress-bar';
    document.body.appendChild(bar);
    window.addEventListener('scroll', function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
    }, { passive: true });
  }

  /* ── CUSTOM CURSOR (desktop only) ── */
  function initCursor() {
    if (window.matchMedia('(hover: none)').matches) return;
    var ring = document.createElement('div');
    ring.className = 'k-cursor';
    var dot = document.createElement('div');
    dot.className = 'k-cursor-dot';
    document.body.appendChild(ring);
    document.body.appendChild(dot);

    var mx = -100, my = -100, rx = -100, ry = -100;
    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + (mx - 2) + 'px,' + (my - 2) + 'px)';
    });
    (function lerp() {
      rx += (mx - rx) * 0.10;
      ry += (my - ry) * 0.10;
      ring.style.transform = 'translate(' + (rx - 18) + 'px,' + (ry - 18) + 'px)';
      requestAnimationFrame(lerp);
    })();

    var targets = 'a, button, .product-card, .category-card, .bs-card, .ingredient-card, .testimonial-card';
    document.querySelectorAll(targets).forEach(function (el) {
      el.addEventListener('mouseenter', function () { ring.classList.add('k-cursor--hover'); });
      el.addEventListener('mouseleave', function () { ring.classList.remove('k-cursor--hover'); });
    });
  }

  /* ── HERO ENTRANCE SEQUENCE ── */
  function initHeroEntrance() {
    var hero = document.querySelector('.hero');
    if (!hero) return;
    /* K11 soften (2026-07-05): .hero-tagline and .hero-title are the LCP-critical
       text — they paint immediately and are never JS-hidden. Only secondary
       elements get the entrance stagger, with compressed delays. */
    var els = [
      hero.querySelector('.hero-script-accent'),
      hero.querySelector('.hero-sub'),
      hero.querySelector('.hero-ctas'),
      hero.querySelector('.hero-scroll')
    ];
    var delays = [120, 240, 360, 480];

    els.forEach(function (el, i) {
      if (!el) return;
      el.style.cssText += ';opacity:0;transform:translateY(28px);transition:opacity 0.7s cubic-bezier(0.22,1,0.36,1) ' + delays[i] + 'ms,transform 0.7s cubic-bezier(0.22,1,0.36,1) ' + delays[i] + 'ms';
    });
    /* Small tick to ensure initial state paints before transition fires */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        els.forEach(function (el) {
          if (!el) return;
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        });
      });
    });
  }

  /* ── SCROLL REVEAL (improved easing + variants) ── */
  function initReveal() {
    var els = document.querySelectorAll(
      '.reveal, .reveal-fade, .reveal-left, .reveal-right, .reveal-scale, .reveal-clip'
    );
    if (!els.length) return;

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function revealAll() { els.forEach(function (el) { el.classList.add('visible'); }); }

    /* No IntersectionObserver or reduced motion -> show everything immediately. */
    if (reduce || !('IntersectionObserver' in window)) { revealAll(); return; }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.04, rootMargin: '0px 0px -20px 0px' });

    els.forEach(function (el) { io.observe(el); });

    /* Safari/WebKit fix: IO doesn't reliably fire for in-viewport elements on
       the initial observe() call. Flush them manually on the next frame so
       above-fold content is never left invisible. */
    requestAnimationFrame(function () {
      els.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < window.innerHeight) {
          el.classList.add('visible');
          io.unobserve(el);
        }
      });
    });

    /* Fail-safe (DEC-109: degrade to visible, never blank): if any element is
       still hidden, force it visible. Two anchors:
       1. DOMContentLoaded + 800ms — caps the invisible window regardless of
          connection speed (window.load on a slow 3G connection fires 3-4s
          after navigation, making the old 2500ms fail-safe fire at 6+ seconds).
       2. window.load + 800ms — backup for any elements added after DOMContentLoaded. */
    setTimeout(revealAll, 800);
    window.addEventListener('load', function () {
      setTimeout(revealAll, 800);
    });
  }

  /* ── STAGGER CHILDREN ── */
  function initStaggerChildren() {
    document.querySelectorAll('[data-stagger]').forEach(function (parent) {
      var base = parseInt(parent.dataset.stagger) || 80;
      Array.from(parent.children).forEach(function (child, i) {
        child.classList.add('reveal');
        child.style.transitionDelay = (i * base) + 'ms';
      });
    });
  }

  /* ── PARALLAX ENGINE ── */
  function initParallax() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var heroImg = document.querySelector('.hero-bg img');
    var parallaxEls = document.querySelectorAll('[data-parallax]');
    if (!heroImg && !parallaxEls.length) return;

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var sy = window.scrollY;

        if (heroImg) {
          heroImg.style.transform = 'scale(1.08) translateY(' + (sy * 0.32) + 'px)';
        }

        parallaxEls.forEach(function (el) {
          var speed = parseFloat(el.dataset.parallax) || 0.12;
          var rect = el.getBoundingClientRect();
          var center = sy + rect.top + rect.height / 2;
          var offset = (sy + window.innerHeight / 2 - center) * speed;
          /* Compose with any base transform (e.g. a mirrored image's scaleX(-1)) instead of
             overwriting it -- read once and cached on the element so we are not re-parsing
             computed style every scroll frame. */
          if (el.dataset.parallaxBase === undefined) {
            el.dataset.parallaxBase = el.style.transform || '';
          }
          el.style.transform = el.dataset.parallaxBase + ' translateY(' + offset + 'px)';
        });

        ticking = false;
      });
    }, { passive: true });
  }

  /* ── 3D CARD TILT ── */
  function initCardTilt() {
    if (window.matchMedia('(hover: none)').matches) return;

    document.querySelectorAll('.product-card, .bs-card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var x = ((e.clientX - r.left) / r.width - 0.5) * 10;
        var y = ((e.clientY - r.top) / r.height - 0.5) * -10;
        card.style.transition = 'box-shadow 0.2s ease';
        card.style.transform = 'translateY(-5px) perspective(800px) rotateX(' + y + 'deg) rotateY(' + x + 'deg)';
      });
      card.addEventListener('mouseleave', function () {
        card.style.transition = 'transform 0.55s cubic-bezier(0.22,1,0.36,1), box-shadow 0.55s ease';
        card.style.transform = '';
      });
    });
  }

  /* ── MAGNETIC BUTTONS ── */
  function initMagneticButtons() {
    if (window.matchMedia('(hover: none)').matches) return;

    document.querySelectorAll('.btn-gold').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * 0.22;
        var dy = (e.clientY - (r.top + r.height / 2)) * 0.22;
        btn.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transition = 'transform 0.5s cubic-bezier(0.22,1,0.36,1)';
        btn.style.transform = '';
        setTimeout(function () { btn.style.transition = ''; }, 500);
      });
    });
  }

  /* ── COUNT-UP NUMBERS ── */
  function initCountUp() {
    var counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseInt(el.dataset.count);
        var suffix = el.dataset.suffix || '';
        var start = performance.now();
        var duration = 1000;
        (function tick(now) {
          var p = Math.min((now - start) / duration, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(eased * target) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        })(start);
        io.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { io.observe(el); });
  }

  /* ── MOMENTUM SCROLL (best sellers) ── */
  function initMomentumScroll() {
    document.querySelectorAll('.bestsellers-scroll').forEach(function (wrap) {
      var isDown = false, startX = 0, scrollLeft = 0, vel = 0, lastX = 0, rafId = null;

      wrap.addEventListener('mousedown', function (e) {
        isDown = true;
        startX = e.pageX - wrap.offsetLeft;
        scrollLeft = wrap.scrollLeft;
        lastX = e.pageX;
        vel = 0;
        cancelAnimationFrame(rafId);
        wrap.style.cursor = 'grabbing';
        wrap.style.userSelect = 'none';
      });

      window.addEventListener('mouseup', function () {
        if (!isDown) return;
        isDown = false;
        wrap.style.cursor = 'grab';
        wrap.style.userSelect = '';
        (function momentum() {
          vel *= 0.93;
          wrap.scrollLeft -= vel;
          if (Math.abs(vel) > 0.5) rafId = requestAnimationFrame(momentum);
        })();
      });

      wrap.addEventListener('mousemove', function (e) {
        if (!isDown) return;
        e.preventDefault();
        var x = e.pageX - wrap.offsetLeft;
        vel = (e.pageX - lastX) * 1.5;
        lastX = e.pageX;
        wrap.scrollLeft = scrollLeft - (x - startX) * 1.2;
      });
    });
  }

  /* ── PRODUCT SLIDER (best sellers) ──
     Arrows move one card; one dot per slide (card or the "more products" end card) jumps to it.
     Each arrow is disabled at its end, and the dot of the card nearest the left edge is active. */
  function initRailArrows() {
    document.querySelectorAll('.bestsellers-section').forEach(function (section) {
      var wrap = section.querySelector('.bestsellers-scroll');
      var buttons = section.querySelectorAll('.bs-arrow');
      var dotsBox = section.querySelector('.bs-dots');
      if (!wrap) return;
      var slides = Array.prototype.slice.call(wrap.querySelectorAll('.bs-card, .bs-end'));
      var dots = [];

      function maxScroll() { return wrap.scrollWidth - wrap.clientWidth; }

      // Scroll position that brings a slide to the rail's left padding edge.
      function offsetOf(slide) {
        var pad = parseFloat(getComputedStyle(wrap).paddingLeft) || 0;
        var left = slide.getBoundingClientRect().left - wrap.getBoundingClientRect().left + wrap.scrollLeft - pad;
        return Math.max(0, Math.min(left, maxScroll()));
      }

      function currentIndex() {
        if (wrap.scrollLeft >= maxScroll() - 2) return slides.length - 1;
        var best = 0, bestDist = Infinity;
        slides.forEach(function (s, i) {
          var d = Math.abs(offsetOf(s) - wrap.scrollLeft);
          if (d < bestDist) { bestDist = d; best = i; }
        });
        return best;
      }

      function goTo(i) {
        i = Math.max(0, Math.min(i, slides.length - 1));
        wrap.scrollTo({ left: offsetOf(slides[i]), behavior: 'smooth' });
      }

      if (dotsBox) {
        slides.forEach(function (s, i) {
          var dot = document.createElement('button');
          dot.type = 'button';
          dot.className = 'bs-dot';
          dot.setAttribute('aria-label', 'Go to slide ' + (i + 1) + ' of ' + slides.length);
          dot.addEventListener('click', function () { goTo(i); });
          dotsBox.appendChild(dot);
          dots.push(dot);
        });
      }

      function update() {
        var idx = currentIndex();
        dots.forEach(function (d, i) {
          d.classList.toggle('is-active', i === idx);
          if (i === idx) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
        });
        buttons.forEach(function (btn) {
          var dir = Number(btn.getAttribute('data-rail-dir'));
          btn.disabled = dir < 0 ? wrap.scrollLeft <= 2 : wrap.scrollLeft >= maxScroll() - 2;
        });
      }

      buttons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          goTo(currentIndex() + Number(btn.getAttribute('data-rail-dir')));
        });
      });

      var raf = null;
      wrap.addEventListener('scroll', function () {
        if (raf) return;
        raf = requestAnimationFrame(function () { raf = null; update(); });
      }, { passive: true });
      window.addEventListener('resize', update);
      window.addEventListener('load', update);
      update();
    });
  }

  /* ── PIN-SCRUB PRODUCT RAIL ──
     Vertical scroll drives horizontal product motion. This is NOT scroll-jacking: no wheel
     event is ever read, captured or preventDefault()'d. The mechanism is a tall wrapper
     (.pin-rail-wrapper) whose inner content is `position: sticky`, and a scroll listener that
     reads the ALREADY-HAPPENING native scroll position to compute a 0-1 progress value and
     apply it as a horizontal transform. The user's wheel/trackpad/touch input is never touched
     -- they are scrolling the page exactly as they would anywhere else; the page's own layout
     is what turns that vertical motion into a horizontal one for the length of this section,
     then hands back to normal flow once the wrapper's extra height is exhausted.

     GEOMETRY (round 5 correction): progress 0 centres the FIRST card in the sticky viewport,
     progress 1 centres the LAST card -- derived from measured card/track/viewport widths, not
     fixed margins, so it holds at any desktop width. The scroll budget (how tall the wrapper
     is) is itself derived from the measured centre-to-centre travel distance via SCRUB_RATIO,
     not a guessed vh value, for the same reason. */
  function initPinRail() {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    /* Desktop/pointer-precise only. Touch already has a first-class equivalent -- swiping the
       rail directly -- which is more natural on a touchscreen than a vertical-scroll proxy for
       a horizontal gesture would be, so mobile deliberately keeps the plain swipeable rail
       rather than receiving a degraded version of this effect. */
    var eligible = window.matchMedia('(min-width: 900px)').matches &&
      window.matchMedia('(pointer: fine)').matches;
    if (!eligible) return;

    var wrapper = document.querySelector('.pin-rail-wrapper');
    var sticky = wrapper && wrapper.querySelector('.pin-rail-sticky');
    var track = wrapper && wrapper.querySelector('.bestsellers-track');
    var bg = document.querySelector('.bestsellers-bg');
    var progressEl = wrapper && wrapper.querySelector('.pin-rail-progress');
    var dots = [];
    if (!wrapper || !sticky || !track) return;

    var cards = Array.prototype.slice.call(track.children);
    /* Below a certain card count there is no meaningful distance to scrub -- the pinned
       treatment would just be a tall, pointless dead-scroll zone, worse than the plain rail
       it would replace. Bail before engaging, not after. */
    if (cards.length < 2) return;

    /* K31: the progress dots are BUILT from the track's real item count, never authored in the
       markup. They were six hardcoded spans against six cards; restoring the seventh best-seller
       and adding the terminus panel took the track to eight, and positions 7-8 would have lit
       nothing at all -- a silent desync with no error, visible only to whoever happened to scrub
       to the end. A count that must equal a DOM list's length should be read from that list. */
    dots = cards.map(function () {
      var d = document.createElement('span');
      if (progressEl) progressEl.appendChild(d);
      return d;
    });
    if (dots[0]) dots[0].classList.add('is-active');

    var SCRUB_RATIO = 1.0; /* px of vertical scroll per px of horizontal travel -- a pacing/feel
                               choice tuned by live testing, not a geometric fact. */

    var wrapperTop = 0, wrapperHeight = 0;
    var cardCenters = [], translateStart = 0, translateEnd = 0, translateRange = 0, stickyWidth = 0;

    function measure() {
      /* The track sits inside .bestsellers-scroll, which carries its own left padding
         (var(--container-pad), measured live at 51.2px on this build) -- card centres
         computed purely from cumulative card widths were off by exactly that amount
         (measured live: card 0 landed 50px right of sticky-centre at progress 0, not 0px).
         Reset the transform and read the track's REAL on-screen offset from the sticky
         container directly, rather than trying to keep a second, indirect account (padding,
         margins, any future layout change to .bestsellers-scroll) in sync by hand. */
      var prevTransform = track.style.transform;
      track.style.transform = 'none';
      var baseOffset = track.getBoundingClientRect().left - sticky.getBoundingClientRect().left;
      track.style.transform = prevTransform;

      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      var cum = baseOffset;
      cardCenters = cards.map(function (card) {
        var w = card.offsetWidth; /* layout width -- unaffected by the transform we apply,
                                      unlike getBoundingClientRect, which would create a
                                      circular read-after-write dependency on our own output. */
        var center = cum + w / 2;
        cum += w + gap;
        return center;
      });
      stickyWidth = sticky.clientWidth;
      translateStart = stickyWidth / 2 - cardCenters[0];
      translateEnd = stickyWidth / 2 - cardCenters[cardCenters.length - 1];
      translateRange = translateStart - translateEnd;

      var desiredScrollRange = Math.max(1, translateRange) * SCRUB_RATIO;
      wrapper.style.setProperty('--pin-rail-vh', (desiredScrollRange + window.innerHeight) + 'px');

      /* Read geometry back out only after the height custom property above has been applied --
         it is what gives the wrapper its extra height, so reading before would capture stale
         (unexpanded) numbers. */
      wrapperTop = wrapper.getBoundingClientRect().top + window.scrollY;
      wrapperHeight = wrapper.offsetHeight;
    }

    wrapper.classList.add('pin-active');
    /* .bestsellers-section carries overflow:hidden to clip its absolutely-positioned
       background image -- but ANY ancestor with non-visible overflow breaks position:sticky
       for a descendant (the sticky element resolves against that ancestor's clipping box
       instead of the viewport, which is indistinguishable from sticky simply not working:
       verified live, sticky's own rect reported top:-718px instead of staying pinned at 0).
       The background is `inset:0` so it does not depend on the clip to stay section-sized --
       safe to lift only while this section is in pin-active mode. */
    var section = wrapper.closest('.bestsellers-section');
    if (section) section.style.overflow = 'visible';

    measure();
    window.addEventListener('resize', measure);
    /* Web fonts / lazy images can still shift layout after the first measurement settles. */
    window.addEventListener('load', function () { setTimeout(measure, 300); });

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var scrollRange = wrapperHeight - window.innerHeight;
        var progress = scrollRange > 0
          ? Math.min(1, Math.max(0, (window.scrollY - wrapperTop) / scrollRange))
          : 0;
        var currentTranslate = translateStart - progress * translateRange;
        track.style.transform = 'translateX(' + currentTranslate.toFixed(2) + 'px)';

        /* Entry "settle" -- the chapter arriving, not snapping in. Ramps once over the first
           8% of progress and stays resolved; deliberately not mirrored on exit (the geometry
           itself -- the last card resolving to centre -- is the exit cue; a second fade timed
           against a DIFFERENT trigger, the sticky release, risked visibly desyncing from it). */
        var entry = Math.min(1, progress / 0.08);
        sticky.style.opacity = (0.90 + entry * 0.10).toFixed(3);
        sticky.style.transform = 'scale(' + (0.98 + entry * 0.02).toFixed(4) + ')';

        /* Background drifts at a fraction of the foreground's rate -- a depth cue between the
           product layer and the environment behind it, not a flat backdrop the cards slide
           over. */
        if (bg) bg.style.transform = 'translateX(' + (progress * -48).toFixed(1) + 'px)';

        /* Per-card depth + typographic emphasis. Distance is computed analytically from the
           measured centres against the CURRENT translate, not read back from the DOM, so this
           never depends on a transform this same frame already wrote. */
        var stickyCenterInTrack = stickyWidth / 2 - currentTranslate;
        var activeIndex = 0, bestDist = Infinity;
        cards.forEach(function (card, i) {
          var dist = Math.abs(cardCenters[i] - stickyCenterInTrack);
          var norm = Math.min(1, dist / (stickyWidth * 0.55));
          var focus = 1 - norm;
          /* The CARD's own scale stays modest (this is the receding/depth cue, not the primary
             size signal -- enlarging the whole card/plinth to make the product look bigger was
             explicitly the wrong lever). */
          card.style.transform = 'scale(' + (1 - norm * 0.12).toFixed(3) + ') translateY(' + (norm * 10).toFixed(1) + 'px)';
          card.style.opacity = (1 - norm * 0.55).toFixed(3);

          /* The PRODUCT IMAGE gets its own, independent, much larger focus boost -- reviewed
             against the rendered UI, not just the geometry: at rest the pre-cropped hero image
             (assets/products/hero/*.webp, ~83% silhouette fill) already reads bigger than the
             old thumbnail-padded version, and the focused card boosts on top of that, allowed
             to overflow its own card padding (.bs-card-img: overflow:visible in pin-active) so
             the hero product visibly exceeds its plinth rather than just filling it. Composed
             with --imgBaseS, the residual per-SKU correction (read once, not every frame). */
          var img = card.querySelector('.bs-card-img img');
          if (img) {
            if (img.dataset.baseS === undefined) {
              img.dataset.baseS = getComputedStyle(img).getPropertyValue('--s') || '1';
            }
            var baseS = parseFloat(img.dataset.baseS) || 1;
            var imgScale = baseS * (1 + focus * 0.34);
            img.style.transform = 'scale(' + imgScale.toFixed(3) + ')';
          }

          var nameEl = card.querySelector('.bs-card-name');
          var priceEl = card.querySelector('.bs-card-price');
          if (nameEl) nameEl.style.transform = 'scale(' + (1 + focus * 0.06).toFixed(3) + ')';
          /* K31: the price rides the same focus ramp the retired numeral used to. Floor is 0.78
             rather than 0, because this is now real commercial information on an off-focus card,
             not decoration — it has to stay readable across the whole rail, not only at centre. */
          if (priceEl) priceEl.style.opacity = (0.78 + focus * 0.22).toFixed(3);

          if (dist < bestDist) { bestDist = dist; activeIndex = i; }
        });
        dots.forEach(function (d, i) { d.classList.toggle('is-active', i === activeIndex); });
        /* K31: the card the rail brings to centre also reveals its "Discover" affordance. The
           rail was already deciding which product deserves attention and spending that decision
           on scale and opacity alone — it told the visitor which product was important and
           nothing about what to do with it. Additive only: the whole card is a link regardless,
           and its aria-label carries name + price, so this is never the sole route in. */
        cards.forEach(function (card, i) { card.classList.toggle('is-focal', i === activeIndex); });

        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* Accessibility fix, verified necessary live (not assumed): focusing a card whose
       transform currently places it outside the sticky viewport does NOT reliably trigger
       the browser's normal focus-scroll-into-view behaviour -- tested in this session,
       programmatic focus on an off-progress card produced zero scroll change. A sighted
       keyboard user tabbing through would land on a control with an invisible focus ring and
       no way to tell where they are. Fix: on focus, scroll the page to the position that
       would place THIS card in view, using the same progress math the scroll handler uses in
       reverse, rather than trusting default browser behaviour that this session already
       measured as unreliable for this specific sticky+transform combination. */
    cards.forEach(function (card, i) {
      card.addEventListener('focus', function () {
        var targetProgress = cards.length > 1 ? i / (cards.length - 1) : 0;
        var scrollRange = wrapperHeight - window.innerHeight;
        if (scrollRange <= 0) return;
        var targetY = wrapperTop + targetProgress * scrollRange;
        /* Only move if genuinely out of the comfortable band -- avoids fighting a user who
           tabs through several cards in a row that are already close together on-screen. */
        if (Math.abs(window.scrollY - targetY) > 60) {
          window.scrollTo({ top: targetY, behavior: 'smooth' });
        }
      });
    });
  }

  /* ── LOGO SWAP (scroll state) ── */
  function initLogoSwap() {
    var nav = document.querySelector('.nav');
    if (!nav) return;
    var hero = document.querySelector('.hero, .hero-banner, .shop-hero');
    if (!hero) return;
    var io = new IntersectionObserver(function () {
      if (typeof updateNavLogo === 'function') updateNavLogo();
    }, { threshold: 0 });
    io.observe(hero);
  }

  /* ── INGREDIENT CARD HOVER ── */
  function initIngredientHover() {
    document.querySelectorAll('.ingredient-card').forEach(function (card) {
      card.addEventListener('mouseenter', function () {
        card.style.transition = 'transform 0.4s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s ease, border-color 0.3s ease';
        card.style.transform = 'translateY(-6px)';
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  }

  /* ── THEME TRANSITION (smooth bg change) ── */
  window.animateThemeTransition = function () {
    document.documentElement.style.transition = 'background 0.4s ease, color 0.3s ease';
    setTimeout(function () { document.documentElement.style.transition = ''; }, 500);
  };

  /* ── INIT ── */
  function main() {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    initScrollProgress();
    if (!reduce) initHeroEntrance();
    initStaggerChildren();
    initReveal();
    initParallax();
    /* initPinRail() disabled: the mouse wheel now scrolls the page, and the rail is moved
       with the arrow buttons (initRailArrows), drag, or touch swipe instead. */
    initRailArrows();
    if (!reduce) initCountUp();
    if (!reduce) initMomentumScroll();
    initIngredientHover();
    initLogoSwap();
    if (!reduce) {
      requestAnimationFrame(function () {
        setTimeout(function () {
          initCardTilt();
          initMagneticButtons();
          initCursor();
        }, 200);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }

})();
