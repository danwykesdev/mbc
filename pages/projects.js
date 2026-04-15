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

  function isNativeInteractiveElement(el) {
    return !!(el && (el.closest && el.closest('input, select, textarea, button, label, a')));
  }

  function findProjectsFilterInput(scope) {
    if (!scope || !scope.querySelector) return null;
    return scope.querySelector('input[fs-list-field], input[fs-list-value], select[fs-list-field], textarea[fs-list-field]');
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

    if (MBC.features.nav) {
      MBC.features.nav.setState({ theme: 'dark', bg: 'solid', blur: true });
    }

    var onFilterItemClick = function (event) {
      var target = event.target;
      if (!(target instanceof Element)) return;

      var item = target.closest('.filters__item');
      if (!item || !container.contains(item)) return;
      if (isNativeInteractiveElement(target)) return;

      var input = findProjectsFilterInput(item);
      if (!input || input.disabled) return;
      if (input.type === 'radio' && input.checked) return;

      if (typeof input.click === 'function') {
        input.click();
        return;
      }

      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    };

    container.addEventListener('click', onFilterItemClick);
    cleanups.push(function () {
      container.removeEventListener('click', onFilterItemClick);
    });

    if (MBC.features.finsweet && typeof MBC.features.finsweet.inspect === 'function') {
      traceSync('projects finsweet inspect before init', function () {
        MBC.features.finsweet.inspect(container, 'projects before init');
      });
    }

    if (MBC.features.finsweet && typeof MBC.features.finsweet.init === 'function') {
      var finsweetModules = typeof MBC.features.finsweet.detectModules === 'function'
        ? MBC.features.finsweet.detectModules(container).filter(function (moduleName) {
            return moduleName !== 'slider';
          })
        : ['list', 'filter'];

      if (finsweetModules.length) {
        traceAsync('projects finsweet init', function () {
          return MBC.features.finsweet.init(container, { modules: finsweetModules, label: 'projects' });
        }).then(function () {
          if (MBC.features.finsweet && typeof MBC.features.finsweet.inspect === 'function') {
            traceSync('projects finsweet inspect after init', function () {
              MBC.features.finsweet.inspect(container, 'projects after init');
            });
          }
          applyProjectsCardBottomInset(container);
          bindHorizontalScroll('projects horizontalScroll.init after finsweet');
          bindStaggerHover('projects staggerHover.init after finsweet');
          if (MBC.core && MBC.core.webflow) {
            MBC.core.webflow.refreshIX();
          }
          if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh(true);
          }
        }).catch(function () {});
      }
    }

    applyProjectsCardBottomInset(container);
    bindHorizontalScroll('projects horizontalScroll.init final');
    bindStaggerHover('projects staggerHover.init final');

    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.refresh(true);
    }

    var tabPanes = container.querySelectorAll('.w-tab-pane');
    if (!tabPanes.length) {
      tabPanes = document.querySelectorAll('.w-tab-pane');
    }
    var paneActiveState = new WeakMap();

    tabPanes.forEach(function (pane) {
      var isActive = pane.classList.contains('w--tab-active');
      paneActiveState.set(pane, isActive);

      if (isActive) {
        showPaneFiltersImmediately(pane);
      } else {
        setPaneFiltersInactive(pane);
      }
    });

    var observer = null;
    var observerTimeout = setTimeout(function () {
      if (!tabPanes.length) return;

      observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          var pane = mutation.target;
          if (!(pane instanceof HTMLElement)) return;

          var isActive = pane.classList.contains('w--tab-active');
          var wasActive = paneActiveState.has(pane) ? paneActiveState.get(pane) : null;

          if (wasActive === isActive) {
            return;
          }

          paneActiveState.set(pane, isActive);

          if (isActive) {
            setTimeout(function () {
              animatePaneFilters(pane);
              applyProjectsCardBottomInset(container);
              bindHorizontalScroll('projects horizontalScroll.init tab change');
              bindStaggerHover('projects staggerHover.init tab change');
              if (MBC.core && MBC.core.webflow) {
                MBC.core.webflow.refreshIX();
              }
              if (typeof ScrollTrigger !== 'undefined') {
                ScrollTrigger.refresh(true);
              }
            }, 20);
          } else {
            setPaneFiltersInactive(pane);
          }
        });
      });

      tabPanes.forEach(function (pane) {
        observer.observe(pane, { attributes: true, attributeFilter: ['class'] });
      });
    }, 400);

    var reflowTimeout = setTimeout(function () {
      applyProjectsCardBottomInset(container);
      bindHorizontalScroll('projects horizontalScroll.init delayed');
      bindStaggerHover('projects staggerHover.init delayed');
      if (MBC.features.horizontalScroll && typeof MBC.features.horizontalScroll.reflow === 'function') {
        MBC.features.horizontalScroll.reflow();
      }
    }, 520);

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
