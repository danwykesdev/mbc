(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.features = MBC.features || {};

  function isProjectsFilterItem(el) {
    return !!(el && ((el.classList && el.classList.contains('filters__item')) || (el.closest && el.closest('.filters__item'))));
  }

  function getNavItems() {
    return Array.from(document.querySelectorAll('[data-load-items="nav-item"], [data-load-item="nav"], [data-load-items="nav"]'));
  }

  function getRevealItems(container, excludeSelector, scrollOnly) {
    if (!container || !container.querySelectorAll) return [];

    var selector = scrollOnly
      ? '[data-load-items="reveal"][data-reveal-scroll="true"]'
      : '[data-load-items="reveal"]:not([data-reveal-scroll="true"])';

    return Array.from(container.querySelectorAll(selector)).filter(function (el) {
      if (isProjectsFilterItem(el)) return false;
      if (excludeSelector && el.closest && el.closest(excludeSelector)) return false;
      return true;
    });
  }

  function resetHoverStates(scope) {
    var root = scope || document;

    root.querySelectorAll('[data-hover], [data-underline-link]').forEach(function (el) {
      el.style.opacity = '';
      el.style.visibility = '';
      el.style.willChange = '';
      el.style.backfaceVisibility = '';

      if (el.style.transform === 'translateZ(0)' || el.style.transform === 'translate3d(0px, 0px, 0px)') {
        el.style.transform = '';
      }
    });
  }

  function initRevealOnScroll(container) {
    if (typeof gsap === 'undefined' || typeof IntersectionObserver === 'undefined') return null;

    var options = arguments[1] || {};
    var forceScrollExcludeSelector = options.forceScrollExcludeSelector || null;

    var items = getRevealItems(container, null, true);

    if (forceScrollExcludeSelector) {
      items = items.concat(getRevealItems(container, forceScrollExcludeSelector, false));
    }

    items = items.filter(function (el, index, arr) {
      return arr.indexOf(el) === index;
    });

    if (!items.length) return null;

    var observer = new IntersectionObserver(function (entries, activeObserver) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;

        var el = entry.target;
        if (el.dataset.revealPlayed === 'true') {
          activeObserver.unobserve(el);
          return;
        }

        el.dataset.revealPlayed = 'true';

        gsap.to(el, {
          autoAlpha: 1,
          x: 0,
          duration: 0.35,
          ease: 'power2.out',
          clearProps: 'transform,opacity,visibility'
        });

        activeObserver.unobserve(el);
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -8% 0px'
    });

    items.forEach(function (el) {
      if (el.dataset.revealInitialized === 'true') return;
      el.dataset.revealInitialized = 'true';
      gsap.set(el, { autoAlpha: 0, x: -14 });
      observer.observe(el);
    });

    return function cleanup() {
      observer.disconnect();
    };
  }

  function initSlideInAnimations(container) {
    if (typeof gsap === 'undefined' || typeof IntersectionObserver === 'undefined' || !container) return null;

    var items = Array.from(container.querySelectorAll('[data-load-items="slide"]'));
    if (!items.length) return null;

    var observer = new IntersectionObserver(function (entries, activeObserver) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;

        var el = entry.target;
        if (el.dataset.slidePlayed === 'true') {
          activeObserver.unobserve(el);
          return;
        }

        el.dataset.slidePlayed = 'true';

        gsap.to(el, {
          autoAlpha: 1,
          x: 0,
          duration: 0.6,
          ease: 'power2.out',
          clearProps: 'transform,opacity,visibility'
        });

        activeObserver.unobserve(el);
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -10% 0px'
    });

    items.forEach(function (el) {
      if (el.dataset.slideInitialized === 'true') return;
      el.dataset.slideInitialized = 'true';
      gsap.set(el, { autoAlpha: 0, x: -14 });
      observer.observe(el);
    });

    return function cleanup() {
      observer.disconnect();
    };
  }

  function init(container) {
    if (!container || typeof gsap === 'undefined') return null;

    var options = arguments[1] || {};
    var introExcludeSelector = options.introExcludeSelector || null;
    var disableIntroReveals = !!options.disableIntroReveals;

    var revealItems = disableIntroReveals ? [] : getRevealItems(container, introExcludeSelector, false);
    if (revealItems.length) {
      gsap.set(revealItems, { autoAlpha: 0, x: -14 });
    }

    resetHoverStates(container);

    var cleanups = [];
    var revealCleanup = initRevealOnScroll(container, options);
    var slideCleanup = initSlideInAnimations(container);

    if (typeof revealCleanup === 'function') {
      cleanups.push(revealCleanup);
    }

    if (typeof slideCleanup === 'function') {
      cleanups.push(slideCleanup);
    }

    return function cleanup() {
      cleanups.forEach(function (fn) {
        try {
          fn();
        } catch (_) {}
      });
    };
  }

  function playIntro(container, options) {
    if (!container || typeof gsap === 'undefined') return null;

    options = options || {};

    var includeNav = options.includeNav !== false;
    var excludeSelector = options.excludeSelector || null;
    var isFirstLoad = !!options.isFirstLoad;
    var navItems = includeNav ? getNavItems() : [];
    var revealItems = getRevealItems(container, excludeSelector, false);

    if (!navItems.length && !revealItems.length) return null;

    var tl = gsap.timeline({
      defaults: {
        ease: 'power2.out',
        overwrite: 'auto'
      }
    });

    if (navItems.length) {
      gsap.set(navItems, { autoAlpha: 0, x: -14 });
      tl.to(navItems, {
        autoAlpha: 1,
        x: 0,
        duration: 0.32,
        stagger: 0.08,
        clearProps: 'transform,opacity,visibility'
      }, 0);
    }

    if (revealItems.length) {
      gsap.set(revealItems, { autoAlpha: 0, x: -14 });
      tl.to(revealItems, {
        autoAlpha: 1,
        x: 0,
        duration: 0.5,
        stagger: 0.05,
        clearProps: 'transform,opacity,visibility'
      }, navItems.length ? 0.08 : isFirstLoad ? 0.1 : 0);
    }

    return tl;
  }

  MBC.features.loadAnimations = {
    init: init,
    playIntro: playIntro,
    resetHoverStates: resetHoverStates
  };
})();
