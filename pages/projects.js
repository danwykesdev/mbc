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

  function isNativeFormControl(el) {
    return !!(el && (el.closest && el.closest('input, select, textarea, button, label')));
  }

  function findProjectsFilterInput(scope) {
    if (!scope || !scope.querySelector) return null;
    return scope.querySelector('input[fs-list-field], input[fs-list-value], select[fs-list-field], textarea[fs-list-field]');
  }

  function triggerProjectsFilterInput(input) {
    if (!input || input.disabled) return;

    var tagName = input.tagName;
    var type = (input.type || '').toLowerCase();

    if (tagName === 'INPUT' && type === 'checkbox') {
      input.checked = !input.checked;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }

    if (tagName === 'INPUT' && type === 'radio') {
      if (input.checked) return;
      input.checked = true;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }

    if (typeof input.click === 'function') {
      input.click();
      return;
    }

    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function queryOne(container, selector, fallbackGlobal) {
    var el = container && container.querySelector ? container.querySelector(selector) : null;
    if (!el && fallbackGlobal) el = document.querySelector(selector);
    return el;
  }

  function countProjectsDynItems(root) {
    if (!root || typeof root.querySelectorAll !== 'function') {
      return 0;
    }

    try {
      return root.querySelectorAll('.w-dyn-item').length;
    } catch (_) {
      return 0;
    }
  }

  function isInvalidProjectsListRoot(node) {
    if (!node || !(node instanceof Element)) {
      return true;
    }

    return !!(
      node.closest('.cms__filters') ||
      node.closest('[fs-list-element="filters"]') ||
      node.closest('form')
    );
  }

  function resolveProjectsListRoot(container) {
    var candidates = Array.from(container.querySelectorAll('[fs-list-element="list"]')).filter(function (node) {
      return !isInvalidProjectsListRoot(node);
    });

    if (!candidates.length) {
      candidates = Array.from(container.querySelectorAll('[fs-list-element="list"]'));
    }

    if (!candidates.length) {
      return null;
    }

    candidates.sort(function (left, right) {
      var leftIsMain = left.getAttribute('fs-list-instance') === 'main' ? 1 : 0;
      var rightIsMain = right.getAttribute('fs-list-instance') === 'main' ? 1 : 0;

      if (leftIsMain !== rightIsMain) {
        return rightIsMain - leftIsMain;
      }

      return countProjectsDynItems(right) - countProjectsDynItems(left);
    });

    return candidates[0];
  }

  function normalizeProjectsListRoot(container) {
    var listRoot = resolveProjectsListRoot(container);
    var allListRoots = Array.from(container.querySelectorAll('[fs-list-element="list"]'));

    allListRoots.forEach(function (node) {
      if (node === listRoot) {
        return;
      }

      node.removeAttribute('fs-list-element');
      if (node.hasAttribute('fs-list-instance')) {
        node.removeAttribute('fs-list-instance');
      }
    });

    if (listRoot) {
      listRoot.setAttribute('fs-list-element', 'list');
      listRoot.setAttribute('fs-list-instance', listRoot.getAttribute('fs-list-instance') || 'main');
    }

    return listRoot;
  }

  function syncProjectsMainListInstance(container, listRoot) {
    var list = listRoot || resolveProjectsListRoot(container);
    if (!list) return null;

    var instanceName = list.getAttribute('fs-list-instance') || 'main';
    var filtersForm = queryOne(container, '[fs-list-element="filters"]');
    var scrollAnchor = queryOne(container, '[fs-list-element="scroll-anchor"], [fs-list-element="scroll-anchor-filter"]');

    if (filtersForm) {
      filtersForm.setAttribute('fs-list-instance', instanceName);
    }

    if (scrollAnchor) {
      scrollAnchor.setAttribute('fs-list-instance', instanceName);
    }

    return {
      instanceName: instanceName,
      hasFiltersForm: !!filtersForm,
      hasScrollAnchor: !!scrollAnchor
    };
  }



  function detectProjectsFinsweetModules(container) {
    if (!MBC.features.finsweet || typeof MBC.features.finsweet.detectModules !== 'function') {
      return ['list', 'filter'];
    }

    var allowed = { list: true, filter: true, tabs: true };
    var modules = [];

    MBC.features.finsweet.detectModules(container).forEach(function (moduleName) {
      if (allowed[moduleName] && modules.indexOf(moduleName) === -1) {
        modules.push(moduleName);
      }
    });

    if (!modules.length) {
      MBC.features.finsweet.detectModules(document).forEach(function (moduleName) {
        if (allowed[moduleName] && modules.indexOf(moduleName) === -1) {
          modules.push(moduleName);
        }
      });
    }

    return modules.length ? modules : ['list', 'filter'];
  }

  function logProjectsDiagnostics(container, label) {
    var utils = MBC.core && MBC.core.utils;
    var selectorMap = {
      listElements: '[fs-list-element]',
      filterElements: '[fs-filter-element]',
      filterInputs: 'input[fs-list-field], input[fs-list-value], select[fs-list-field], textarea[fs-list-field]',
      filterItems: '.filters__item',
      paginationNext: '[data-pagination-next], [fs-list-element="pagination-next"]',
      paginationPrev: '[data-pagination-prev], [fs-list-element="pagination-previous"]',
      customPaginationNext: '[data-pagination="next"]',
      customPaginationPrev: '[data-pagination="prev"]',
      searchInputs: '#Search'
    };

    if (utils && typeof utils.logSelectorSummary === 'function') {
      return utils.logSelectorSummary('projects ' + (label || ''), container, selectorMap);
    }

    return null;
  }

  var PROJECTS_ROUTE_DEBUG_SELECTORS = {
    listElements: '[fs-list-element]',
    listItems: '[fs-list-element="item"]',
    filterElements: '[fs-filter-element]',
    filterInputs: 'input[fs-list-field], input[fs-list-value], select[fs-list-field], textarea[fs-list-field]',
    filters: '.filters__item',
    paginationNext: '[data-pagination-next], [fs-list-element="pagination-next"]',
    paginationPrev: '[data-pagination-prev], [fs-list-element="pagination-previous"]',
    dynLists: '.w-dyn-list',
    dynItems: '.w-dyn-item',
    paginationButtons: '.w-pagination-next, .w-pagination-previous'
  };

  function logProjectsRouteState(routeDebug, label, container, meta) {
    if (typeof routeDebug !== 'function') {
      return null;
    }

    return routeDebug(label, container, {
      phase: meta && meta.phase ? meta.phase : null,
      namespace: 'projects',
      selectors: PROJECTS_ROUTE_DEBUG_SELECTORS
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

  var activeProjectsMountToken = null;
  var activeProjectsMountContainer = null;

  async function mount(ctx) {
    var container = ctx.container;
    var mountToken = typeof ctx.token === 'number' ? ctx.token : null;

    if (
      mountToken !== null &&
      activeProjectsMountToken === mountToken &&
      activeProjectsMountContainer === container
    ) {
      return function cleanup() { };
    }

    activeProjectsMountToken = mountToken;
    activeProjectsMountContainer = container;

    var cleanups = [];
    var horizontalScrollCleanup = null;
    var staggerHoverCleanup = null;
    var didInitialBindings = false;
    var isUnmounted = false;
    var projectsListReady = false;
    var restartInFlight = null;
    var queuedRestartReason = '';
    var traceAsync = MBC.core && MBC.core.utils && MBC.core.utils.traceAsync
      ? MBC.core.utils.traceAsync
      : function (label, promiseFactory) { return Promise.resolve().then(promiseFactory); };
    var traceSync = MBC.core && MBC.core.utils && MBC.core.utils.traceSync
      ? MBC.core.utils.traceSync
      : function (_, fn) { return fn(); };
    var routeDebug = MBC.core && MBC.core.utils && typeof MBC.core.utils.logRouteState === 'function'
      ? MBC.core.utils.logRouteState
      : null;

    function bindHorizontalScroll(label) {
      if (!MBC.features.horizontalScroll || typeof MBC.features.horizontalScroll.init !== 'function') {
        return;
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
        try { staggerHoverCleanup(); } catch (_) { }
        staggerHoverCleanup = null;
      }

      var nextCleanup = traceSync(label || 'projects staggerHover.init', function () {
        return MBC.features.staggerHover.init(container);
      });

      if (typeof nextCleanup === 'function') {
        staggerHoverCleanup = nextCleanup;
      }
    }

    function refreshProjectsBindings(reason) {
      if (isUnmounted) {
        return;
      }

      didInitialBindings = true;
      applyProjectsCardBottomInset(container);
      bindHorizontalScroll('projects horizontalScroll.init ' + reason);
      bindStaggerHover('projects staggerHover.init ' + reason);

      if (MBC.core && MBC.core.webflow) {
        MBC.core.webflow.refreshIX();
      }

      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh(true);

        // Add a delayed refresh to handle SPA transitions where the old Barba container
        // temporarily pushes the new container down, causing wrong ScrollTrigger start positions.
        setTimeout(function() {
          if (!isUnmounted && typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh(true);
          }
        }, 500);
      }

      if (MBC.features.horizontalScroll && typeof MBC.features.horizontalScroll.reflow === 'function') {
        setTimeout(function () {
          if (isUnmounted) return;
          MBC.features.horizontalScroll.reflow();
        }, 60);
      }

      logProjectsRouteState(routeDebug, 'projects after bindings ' + reason, container, {
        phase: 'projects-after-bindings'
      });
    }

    function isProjectsListModuleReady() {
      var fs = window.FinsweetAttributes;
      var list = fs && fs.modules ? fs.modules.list : null;
      return !!(list && typeof list.restart === 'function');
    }

    function runProjectsListRestart(reason) {
      return traceAsync('projects finsweet restart ' + reason, function () {
        return MBC.features.finsweet.restart(container, { modules: ['list'] });
      }).then(function () {
        if (MBC.features.finsweet && typeof MBC.features.finsweet.inspect === 'function') {
          traceSync('projects finsweet inspect ' + reason, function () {
            MBC.features.finsweet.inspect(container, 'projects ' + reason);
          });
        }
        logProjectsDiagnostics(container, reason);
        refreshProjectsBindings(reason);
      }).catch(function () { });
    }

    function restartProjectsList(reason) {
      if (!MBC.features.finsweet || typeof MBC.features.finsweet.restart !== 'function') {
        return Promise.resolve();
      }

      if (isUnmounted) {
        return Promise.resolve();
      }

      var restartReason = String(reason || 'update');

      if (!projectsListReady || !isProjectsListModuleReady()) {
        queuedRestartReason = restartReason;
        return Promise.resolve();
      }

      if (restartInFlight) {
        queuedRestartReason = restartReason;
        return restartInFlight;
      }

      restartInFlight = runProjectsListRestart(restartReason).finally(function () {
        restartInFlight = null;

        if (isUnmounted || !queuedRestartReason) {
          queuedRestartReason = '';
          return;
        }

        var followUpReason = queuedRestartReason;
        queuedRestartReason = '';
        restartProjectsList(followUpReason + ' queued');
      });

      return restartInFlight;
    }



    if (MBC.features.nav) {
      MBC.features.nav.setState({ theme: 'dark', bg: 'solid', blur: true });
    }

    // Prevent Webflow tab links from scrolling to top.
    // Webflow's native tabs JS internally scrolls when switching panes, and the <a> href
    // contains an anchor (#w-tabs-0-data-w-pane-0) that the browser follows.
    // We use capture phase to fire BEFORE Webflow and save/restore scroll position.
    var tabLinks = container.querySelectorAll('.w-tab-link');
    Array.from(tabLinks).forEach(function(link) {
      link.setAttribute('data-barba-prevent', '');
    });

    var onTabLinkClick = function(event) {
      var link = event.target.closest('.w-tab-link');
      if (!link || !container.contains(link)) return;

      // Save scroll position before Webflow or browser moves it
      var lenis = MBC.core.state.lenis || window.lenis;
      var savedY = lenis ? lenis.scroll : (window.scrollY || window.pageYOffset);

      // Restore after Webflow's tab switch completes
      requestAnimationFrame(function() {
        if (lenis) {
          lenis.scrollTo(savedY, { immediate: true });
        } else {
          window.scrollTo(0, savedY);
        }
        // Double-restore in case Webflow's async tab switch fires late
        requestAnimationFrame(function() {
          if (lenis) {
            lenis.scrollTo(savedY, { immediate: true });
          } else {
            window.scrollTo(0, savedY);
          }
        });
      });
    };
    // Use capture phase so this fires BEFORE Webflow's tab handler
    container.addEventListener('click', onTabLinkClick, true);
    cleanups.push(function() {
      container.removeEventListener('click', onTabLinkClick, true);
    });
    // var onProjectsClick = function (event) {
    //   var target = event.target;
    //   if (!(target instanceof Element)) return;
    //
    //   if (projectsListLoadMode === 'pagination') {
    //     var paginationTrigger = target.closest('[data-pagination="next"], [data-pagination="prev"]');
    //     if (paginationTrigger && container.contains(paginationTrigger)) {
    //       var direction = paginationTrigger.getAttribute('data-pagination');
    //       var paginationTarget = direction === 'prev'
    //         ? queryOne(container, '[data-pagination-prev], [fs-list-element="pagination-previous"]', true)
    //         : queryOne(container, '[data-pagination-next], [fs-list-element="pagination-next"]', true);
    //
    //       if (paginationTarget) {
    //         event.preventDefault();
    //         paginationTarget.click();
    //         setTimeout(function () {
    //           restartProjectsList('pagination ' + direction);
    //         }, 30);
    //       }
    //
    //       return;
    //     }
    //   }
    //
    //   var item = target.closest('.filters__item');
    //   if (!item || !container.contains(item)) return;
    //   if (isNativeFormControl(target)) return;
    //
    //   if (typeof event.preventDefault === 'function') {
    //     event.preventDefault();
    //   }
    //
    //   if (typeof event.stopPropagation === 'function') {
    //     event.stopPropagation();
    //   }
    //
    //   var input = findProjectsFilterInput(item);
    //   if (!input) return;
    //
    //   triggerProjectsFilterInput(input);
    //
    //   setTimeout(function () {
    //     restartProjectsList('filter click');
    //   }, 30);
    // };
    //
    // container.addEventListener('click', onProjectsClick);
    // cleanups.push(function () {
    //   container.removeEventListener('click', onProjectsClick);
    // });
    // --- end filter/pagination click bridge disabled ---

    // logProjectsDiagnostics(container, 'before init');

    // if (MBC.features.finsweet && typeof MBC.features.finsweet.inspect === 'function') {
    //   traceSync('projects finsweet inspect before init', function () {
    //     MBC.features.finsweet.inspect(container, 'projects before init');
    //   });
    // }

    if (MBC.features.finsweet && typeof MBC.features.finsweet.init === 'function') {
      var finsweetModules = detectProjectsFinsweetModules(container);

      if (finsweetModules.length) {
        // Destroy stale Finsweet state from previous SPA page before re-init
        if (typeof MBC.features.finsweet.destroy === 'function') {
          await traceAsync('projects finsweet destroy before init', function () {
            return MBC.features.finsweet.destroy({ modules: finsweetModules, timeout: 500 });
          }).catch(function () { });
        }

        // Fix user HTML mistake: fs-list-element="list" should NOT be on the filters
        var filterWrappers = container.querySelectorAll('.cms__filters');
        Array.from(filterWrappers).forEach(function(wrapper) {
          if (wrapper.getAttribute('fs-list-element') === 'list') {
            wrapper.removeAttribute('fs-list-element');
          }
          var childLists = wrapper.querySelectorAll('[fs-list-element="list"]');
          Array.from(childLists).forEach(function(child) {
            child.removeAttribute('fs-list-element');
          });
        });

        var listRoot = normalizeProjectsListRoot(container);
        syncProjectsMainListInstance(container, listRoot);

        if (routeDebug) {
          routeDebug('projects finsweet before init', container, {
            phase: 'projects-finsweet-before-init',
            namespace: 'projects',
            selectors: {
              listElements: '[fs-list-element]',
              filterElements: '[fs-filter-element]',
              filterInputs: 'input[fs-list-field], input[fs-list-value], select[fs-list-field], textarea[fs-list-field]',
              filters: '.filters__item',
              paginationNext: '[data-pagination-next], [fs-list-element="pagination-next"]',
              paginationPrev: '[data-pagination-prev], [fs-list-element="pagination-previous"]',
              dynLists: '.w-dyn-list',
              dynItems: '.w-dyn-item'
            }
          });
        }

        await traceAsync('projects finsweet init', function () {
          return MBC.features.finsweet.init(container, { modules: finsweetModules, label: 'projects' });
        }).catch(function () { });

        if (routeDebug) {
          routeDebug('projects finsweet after init', container, {
            phase: 'projects-finsweet-after-init',
            namespace: 'projects',
            selectors: {
              listElements: '[fs-list-element]',
              filterElements: '[fs-filter-element]',
              filterInputs: 'input[fs-list-field], input[fs-list-value], select[fs-list-field], textarea[fs-list-field]',
              filters: '.filters__item',
              paginationNext: '[data-pagination-next], [fs-list-element="pagination-next"]',
              paginationPrev: '[data-pagination-prev], [fs-list-element="pagination-previous"]',
              dynLists: '.w-dyn-list',
              dynItems: '.w-dyn-item'
            }
          });
        }

        projectsListReady = isProjectsListModuleReady();

        // Wait for Finsweet to render its filter/pagination DOM before binding
        var waitForLayout = MBC.core && MBC.core.utils && MBC.core.utils.waitForLayout;
        if (typeof waitForLayout === 'function') {
          await traceAsync('projects post-finsweet layout settle', function () {
            return waitForLayout();
          });
        }

        if (projectsListReady && queuedRestartReason) {
          var initialQueuedReason = queuedRestartReason;
          queuedRestartReason = '';
          restartProjectsList(initialQueuedReason + ' initial queued');
        }

        refreshProjectsBindings('after finsweet');

        setTimeout(function () {
          if (isUnmounted) {
            return;
          }

          logProjectsRouteState(routeDebug, 'projects delayed settle', container, {
            phase: 'projects-delayed-settle'
          });
        }, 500);
      }
    }

    // if (isProjectsListModuleReady() && queuedRestartReason) {
    //   var initialQueuedReason = queuedRestartReason;
    //   queuedRestartReason = '';
    //   restartProjectsList(initialQueuedReason + ' initial queued');
    // }

    if (!didInitialBindings) {
      refreshProjectsBindings('final');
    }

    // Prevent Webflow's native form module from hiding Finsweet filter forms
    // Webflow uses event delegation on document, so stopPropagation prevents it
    var filterForms = container.querySelectorAll('form');
    Array.from(filterForms).forEach(function (form) {
      if (form.closest('[fs-filter-element="filters"]') || form.hasAttribute('fs-filter-element')) {
        var preventWebflowSubmit = function (e) {
          e.stopPropagation();
        };
        form.addEventListener('submit', preventWebflowSubmit);
        cleanups.push(function () {
          form.removeEventListener('submit', preventWebflowSubmit);
        });
      }
    });

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
              // Note: tab pane switches only reveal filter inputs.
              // Do NOT call restartProjectsList here — it triggers ScrollTrigger.refresh()
              // which internally calls window.scrollTo(0, 0) and scrolls the user to top.
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

    // cleanups.push(function () {
    //   if (MBC.features.finsweet && typeof MBC.features.finsweet.destroy === 'function') {
    //     MBC.features.finsweet.destroy({ modules: ['list'], timeout: 300 }).catch(function () {});
    //   }
    // });

    cleanups.push(function () {
      clearTimeout(observerTimeout);
      if (observer) observer.disconnect();
      if (onSearchClear && searchClose) {
        searchClose.removeEventListener('click', onSearchClear);
      }
    });

    return function cleanup() {
      isUnmounted = true;
      queuedRestartReason = '';

      if (
        activeProjectsMountToken === mountToken &&
        activeProjectsMountContainer === container
      ) {
        activeProjectsMountToken = null;
        activeProjectsMountContainer = null;
      }

      if (typeof horizontalScrollCleanup === 'function') {
        try { horizontalScrollCleanup(); } catch (_) { }
        horizontalScrollCleanup = null;
      }

      if (typeof staggerHoverCleanup === 'function') {
        try { staggerHoverCleanup(); } catch (_) { }
        staggerHoverCleanup = null;
      }

      cleanups.forEach(function (fn) {
        if (typeof fn === 'function') {
          try { fn(); } catch (_) { }
        }
      });
    };
  }

  function unmount() { }

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
