(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.pages = MBC.pages || {};

  // Filter item animation helpers (projects-specific)
  function setPaneFiltersInactive(pane) {
    var items = pane.querySelectorAll('.filters__item');
    if (!items.length) return;
    gsap.killTweensOf(items);
    gsap.set(items, { autoAlpha: 0, x: -14 });
  }

  function showPaneFiltersImmediately(pane) {
    var items = pane.querySelectorAll('.filters__item');
    if (!items.length) return;
    gsap.killTweensOf(items);
    gsap.set(items, { autoAlpha: 1, x: 0, clearProps: 'transform,opacity,visibility' });
  }

  function animatePaneFilters(pane) {
    var items = pane.querySelectorAll('.filters__item');
    if (!items.length) return;

    gsap.killTweensOf(items);
    gsap.fromTo(items, {
      autoAlpha: 0,
      x: -14
    }, {
      autoAlpha: 1,
      x: 0,
      duration: 0.45,
      ease: 'power2.out',
      stagger: 0.03,
      overwrite: 'auto',
      clearProps: 'transform,opacity,visibility'
    });
  }

  function applyProjectsCardBottomInset(container) {
    var wrap = container.querySelector('[data-horizontal-scroll-wrap]');
    if (!wrap) return;

    var track = container.querySelector('[data-horizontal-track]');
    var panels = gsap.utils.toArray('[data-horizontal-scroll-panel]', wrap);

    wrap.style.paddingBottom = '40px';

    if (track) {
      track.style.alignItems = 'flex-end';
    }

    panels.forEach(function (panel) {
      panel.style.alignSelf = 'flex-end';
    });
  }

  async function mount(ctx) {
    var container = ctx.container;
    var cleanups = [];
    var horizontalScrollCleanup = null;
    var staggerHoverCleanup = null;
    var traceAsync = MBC.core && MBC.core.utils && MBC.core.utils.traceAsync
      ? MBC.core.utils.traceAsync
      : function (label, promiseFactory) { return Promise.resolve().then(promiseFactory); };
    var traceSync = MBC.core && MBC.core.utils && MBC.core.utils.traceSync
      ? MBC.core.utils.traceSync
      : function (_, fn) { return fn(); };

    function bindHorizontalScroll(label) {
      if (!MBC.features.horizontalScroll || typeof MBC.features.horizontalScroll.init !== 'function') {
        return;
      }

      if (typeof horizontalScrollCleanup === 'function') {
        try { horizontalScrollCleanup(); } catch (_) {}
        horizontalScrollCleanup = null;
      }

      var nextCleanup = traceSync(label || 'projects horizontalScroll.init', function () {
        return MBC.features.horizontalScroll.init(container);
      });

      if (typeof nextCleanup === 'function') {
        horizontalScrollCleanup = nextCleanup;
      }
    }

    function bindStaggerHover(label) {
      if (!MBC.features.staggerHover || typeof MBC.features.staggerHover.init !== 'function') {
        return;
      }

      if (typeof staggerHoverCleanup === 'function') {
        try { staggerHoverCleanup(); } catch (_) {}
        staggerHoverCleanup = null;
      }

      var nextCleanup = traceSync(label || 'projects staggerHover.init', function () {
        return MBC.features.staggerHover.init(container);
      });

      if (typeof nextCleanup === 'function') {
        staggerHoverCleanup = nextCleanup;
      }
    }

    // Set nav state
    if (MBC.features.nav) {
      MBC.features.nav.setState({ theme: 'dark', bg: 'solid', blur: true });
    }

    // Finsweet list component
    if (MBC.features.finsweet) {
      await traceAsync('projects finsweet.list init', function () {
        return MBC.features.finsweet.init(container, { modules: ['list'] });
      });
    }

    applyProjectsCardBottomInset(container);

    bindHorizontalScroll('projects horizontalScroll.init final');
    bindStaggerHover('projects staggerHover.init final');

    // Set initial filter state immediately (before any observers)
    var tabPanes = container.querySelectorAll('.w-tab-pane');
    if (!tabPanes.length) {
      tabPanes = document.querySelectorAll('.w-tab-pane');
    }

    // Set initial filter visibility — do this sync, no observer yet
    tabPanes.forEach(function (pane) {
      if (pane.classList.contains('w--tab-active')) {
        showPaneFiltersImmediately(pane);
      } else {
        setPaneFiltersInactive(pane);
      }
    });

    // Defer MutationObserver setup — Webflow reinit (strong tier) fires
    // readystatechange which can toggle tab classes, causing the observer
    // to animate filters out then back in. We wait for settleAfterMount to complete.
    var observer = null;
    var observerTimeout = setTimeout(function () {
      if (!tabPanes.length) return;

      observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          var pane = mutation.target;
          if (!(pane instanceof HTMLElement)) return;

          if (pane.classList.contains('w--tab-active')) {
            setTimeout(function () {
              animatePaneFilters(pane);
              applyProjectsCardBottomInset(container);
              bindHorizontalScroll('projects horizontalScroll.init tab change');
              bindStaggerHover('projects staggerHover.init tab change');
              if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh(true);
            }, 20);
          } else {
            setPaneFiltersInactive(pane);
          }
        });
      });

      tabPanes.forEach(function (pane) {
        observer.observe(pane, { attributes: true, attributeFilter: ['class'] });
      });
    }, 400); // wait for strong reinit + settleAfterMount to finish

    var reflowTimeout = setTimeout(function () {
      applyProjectsCardBottomInset(container);
      bindHorizontalScroll('projects horizontalScroll.init delayed');
    }, 520);

    // Search close button
    var searchClose = container.querySelector('#searchClose') || document.querySelector('#searchClose');
    var searchInput = container.querySelector('#Search') || document.querySelector('#Search');
    var onSearchClear = null;

    if (searchClose && searchInput) {
      onSearchClear = function () {
        searchInput.value = '';
        searchInput.placeholder = 'Search';
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      };
      searchClose.addEventListener('click', onSearchClear);
    }

    cleanups.push(function () {
      clearTimeout(observerTimeout);
      clearTimeout(reflowTimeout);
      if (observer) observer.disconnect();
      if (onSearchClear && searchClose) {
        searchClose.removeEventListener('click', onSearchClear);
      }
    });

    return function cleanup() {
      if (typeof horizontalScrollCleanup === 'function') {
        try { horizontalScrollCleanup(); } catch (_) {}
        horizontalScrollCleanup = null;
      }

      if (typeof staggerHoverCleanup === 'function') {
        try { staggerHoverCleanup(); } catch (_) {}
        staggerHoverCleanup = null;
      }

      cleanups.forEach(function (fn) {
        if (typeof fn === 'function') {
          try { fn(); } catch (_) {}
        }
      });
    };
  }

  function unmount() {}

  var moduleDef = {
    webflowTier: 'light',
    mount: mount,
    unmount: unmount
  };

  MBC.pages.projects = moduleDef;

  if (MBC.core && MBC.core.registry) {
    MBC.core.registry.register('projects', moduleDef);
  }
})();
