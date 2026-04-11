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

  async function mount(ctx) {
    var container = ctx.container;
    var isFirstLoad = ctx.isFirstLoad;
    var cleanups = [];

    // Set nav state
    if (MBC.features.nav) {
      MBC.features.nav.setState({ theme: 'dark', bg: 'solid', blur: true });
    }

    // Horizontal scroll
    if (MBC.features.horizontalScroll) {
      var hsCleanup = MBC.features.horizontalScroll.init(container);
      if (typeof hsCleanup === 'function') {
        cleanups.push(hsCleanup);
      }
    }

    // Finsweet list component
    if (MBC.features.finsweet) {
      await MBC.features.finsweet.init(container, { modules: ['list'] });
    }

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
              if (MBC.core.webflow) MBC.core.webflow.refreshIX();
              if (MBC.features.horizontalScroll && typeof MBC.features.horizontalScroll.reflow === 'function') {
                MBC.features.horizontalScroll.reflow();
              }
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
      if (MBC.features.horizontalScroll && typeof MBC.features.horizontalScroll.reflow === 'function') {
        MBC.features.horizontalScroll.reflow();
      }
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
      cleanups.forEach(function (fn) {
        if (typeof fn === 'function') {
          try { fn(); } catch (_) {}
        }
      });
    };
  }

  function unmount() {}

  var moduleDef = {
    webflowTier: 'strong',
    mount: mount,
    unmount: unmount
  };

  MBC.pages.projects = moduleDef;

  if (MBC.core && MBC.core.registry) {
    MBC.core.registry.register('projects', moduleDef);
  }
})();
