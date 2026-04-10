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

    // Filter item animations on tab changes
    var tabPanes = container.querySelectorAll('.w-tab-pane');
    if (!tabPanes.length) {
      tabPanes = document.querySelectorAll('.w-tab-pane');
    }

    var observer = null;
    if (tabPanes.length) {
      observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          var pane = mutation.target;
          if (!(pane instanceof HTMLElement)) return;

          if (pane.classList.contains('w--tab-active')) {
            setTimeout(function () {
              animatePaneFilters(pane);
              if (MBC.core.webflow) MBC.core.webflow.refreshIX();
              if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh(true);
            }, 20);
          } else {
            setPaneFiltersInactive(pane);
          }
        });
      });

      tabPanes.forEach(function (pane) {
        observer.observe(pane, { attributes: true, attributeFilter: ['class'] });

        if (pane.classList.contains('w--tab-active')) {
          if (isFirstLoad) {
            showPaneFiltersImmediately(pane);
          } else {
            animatePaneFilters(pane);
          }
        } else {
          setPaneFiltersInactive(pane);
        }
      });
    }

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

    // Initial tab state
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var activePane = container.querySelector('.w-tab-pane.w--tab-active') ||
                         document.querySelector('.w-tab-pane.w--tab-active');
        if (activePane) {
          if (isFirstLoad) {
            showPaneFiltersImmediately(activePane);
          } else {
            animatePaneFilters(activePane);
          }
        }

        setTimeout(function () {
          if (MBC.core.webflow) MBC.core.webflow.refreshIX();
          if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh(true);
        }, 80);
      });
    });

    cleanups.push(function () {
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
    webflowTier: 'full',
    mount: mount,
    unmount: unmount
  };

  MBC.pages.projects = moduleDef;

  if (MBC.core && MBC.core.registry) {
    MBC.core.registry.register('projects', moduleDef);
  }
})();
