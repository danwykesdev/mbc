(function () {
  window.MBC = window.MBC || {};
  const MBC = window.MBC;

  MBC.core = MBC.core || {};

  function wait(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function raf2() {
    return new Promise(function (resolve) {
      requestAnimationFrame(function () {
        requestAnimationFrame(resolve);
      });
    });
  }

  async function waitForLayout() {
    await raf2();

    if (document.fonts && document.fonts.ready) {
      try {
        await Promise.race([document.fonts.ready, wait(700)]);
      } catch (_) {}
    }

    await wait(30);
  }

  function debounce(fn, ms) {
    var timer = null;

    return function () {
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(null, args);
      }, ms);
    };
  }

  var NAMESPACE_ALIASES = {
    project: "projects",
    project_detail: "project-detail",
    zine_detail: "zine-detail"
  };

  function normalizeNamespace(ns) {
    var value = String(ns || "").toLowerCase().trim();

    if (!value) return "default";

    return NAMESPACE_ALIASES[value] || value;
  }

  function isHome(ns) {
    return normalizeNamespace(ns) === "home";
  }

  function safeCall(fn, label) {
    try {
      return fn();
    } catch (err) {
      console.warn("[MBC]", label || "safeCall failed", err);
      return null;
    }
  }

  function countSelectorMatches(container, selector) {
    var root = container && typeof container.querySelectorAll === 'function'
      ? container
      : document;

    try {
      return root.querySelectorAll(selector).length;
    } catch (_) {
      return 0;
    }
  }

  function collectSelectorSummary(container, selectorMap) {
    var summary = {};

    Object.keys(selectorMap || {}).forEach(function (key) {
      summary[key] = countSelectorMatches(container, selectorMap[key]);
    });

    return summary;
  }

  function logSelectorSummary(label, container, selectorMap) {
    var summary = collectSelectorSummary(container, selectorMap);
    console.log('[MBC] Selector inspect ' + (label || ''), summary);
    return summary;
  }

  function isRouteDebugEnabled() {
    return window.MBC_DEBUG === true || window.MBC_ROUTE_DEBUG === true;
  }

  function ensureRouteDebugHelpers() {
    if (window.__MBC_ROUTE_DEBUG_EXPORT && window.__MBC_ROUTE_DEBUG_CLEAR) {
      return;
    }

    window.__MBC_ROUTE_DEBUG_EXPORT = function () {
      return JSON.stringify(window.__MBC_ROUTE_DEBUG_EVENTS || [], null, 2);
    };

    window.__MBC_ROUTE_DEBUG_CLEAR = function () {
      window.__MBC_ROUTE_DEBUG_HISTORY = [];
      window.__MBC_ROUTE_DEBUG_EVENTS = [];
      window.__MBC_ROUTE_DEBUG_LAST_STATE = null;
      return true;
    };

    window.__MBC_ROUTE_DEBUG_COPY = function () {
      var output = window.__MBC_ROUTE_DEBUG_EXPORT();

      if (navigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        return navigator.clipboard.writeText(output).then(function () {
          return output;
        });
      }

      return output;
    };
  }

  function summarizeFeatureAvailability() {
    var features = MBC.features || {};

    return {
      lenisInit: !!(features.lenis && typeof features.lenis.init === 'function'),
      navSetState: !!(features.nav && typeof features.nav.setState === 'function'),
      mobileNavInit: !!(features.mobileNav && typeof features.mobileNav.init === 'function'),
      scrollDirectionInit: !!(features.scrollDirection && typeof features.scrollDirection.init === 'function'),
      loadAnimationsInit: !!(features.loadAnimations && typeof features.loadAnimations.init === 'function'),
      loadAnimationsPlayIntro: !!(features.loadAnimations && typeof features.loadAnimations.playIntro === 'function'),
      horizontalScrollInit: !!(features.horizontalScroll && typeof features.horizontalScroll.init === 'function'),
      horizontalScrollReflow: !!(features.horizontalScroll && typeof features.horizontalScroll.reflow === 'function'),
      staggerHoverInit: !!(features.staggerHover && typeof features.staggerHover.init === 'function'),
      tabsInit: !!(features.tabs && typeof features.tabs.init === 'function'),
      heroInit: !!(features.hero && typeof features.hero.init === 'function'),
      videosInitStandalone: !!(features.videos && typeof features.videos.initStandalone === 'function'),
      videosInitModal: !!(features.videos && typeof features.videos.initModal === 'function'),
      finsweetInit: !!(features.finsweet && typeof features.finsweet.init === 'function'),
      finsweetRestart: !!(features.finsweet && typeof features.finsweet.restart === 'function'),
      finsweetDestroy: !!(features.finsweet && typeof features.finsweet.destroy === 'function'),
      finsweetInspect: !!(features.finsweet && typeof features.finsweet.inspect === 'function')
    };
  }

  function summarizeNavState() {
    var nav = document.querySelector('.nav');

    if (!nav) {
      return null;
    }

    return {
      theme: nav.getAttribute('data-nav-theme') || nav.getAttribute('data-theme-nav') || null,
      bg: nav.getAttribute('data-nav-bg') || nav.getAttribute('data-bg-nav') || null,
      blur: nav.getAttribute('data-nav-blur') || null,
      open: nav.classList.contains('is-open'),
      classes: nav.className || ''
    };
  }

  function summarizeBodyState() {
    if (!document.body) {
      return null;
    }

    return {
      classes: document.body.className || '',
      themeSection: document.body.getAttribute('data-theme-section') || null,
      navTheme: document.body.getAttribute('data-theme-nav') || null,
      bgNav: document.body.getAttribute('data-bg-nav') || null,
      navBlur: document.body.getAttribute('data-nav-blur') || null
    };
  }

  function summarizeLenisState() {
    var lenis = MBC.core && MBC.core.state && MBC.core.state.lenis;

    return {
      available: !!lenis,
      scroll: lenis && typeof lenis.scroll === 'number'
        ? Math.round(lenis.scroll)
        : Math.round(window.scrollY || window.pageYOffset || 0)
    };
  }

  function summarizeFinsweetState(container) {
    var fs = window.FinsweetAttributes;
    var modules = fs && fs.modules ? fs.modules : null;
    var list = modules && modules.list ? modules.list : null;
    var listRoot = container && typeof container.querySelector === 'function'
      ? container.querySelector('[fs-list-element="list"]')
      : null;

    return {
      available: !!fs,
      moduleKeys: modules ? Object.keys(modules).sort() : [],
      listReady: !!(list && typeof list.restart === 'function'),
      listLoading: !!(list && list.loading),
      listProcessSize: list && list.process && typeof list.process.size === 'number' ? list.process.size : null,
      listInstance: listRoot && listRoot.getAttribute ? listRoot.getAttribute('fs-list-instance') || null : null,
      listLoad: listRoot && listRoot.getAttribute ? listRoot.getAttribute('fs-list-load') || null : null,
      listElements: countSelectorMatches(container, '[fs-list-element]'),
      listItems: countSelectorMatches(container, '[fs-list-element="item"]'),
      filterElements: countSelectorMatches(container, '[fs-filter-element]'),
      filterInputs: countSelectorMatches(container, 'input[fs-list-field], input[fs-list-value], select[fs-list-field], textarea[fs-list-field]'),
      sliderElements: countSelectorMatches(container, '[fs-slider-element]'),
      modalElements: countSelectorMatches(container, '[fs-modal-element]'),
      dynLists: countSelectorMatches(container, '.w-dyn-list'),
      dynItems: countSelectorMatches(container, '.w-dyn-item')
    };
  }

  function createRouteSnapshot(label, container, meta) {
    var state = MBC.core && MBC.core.state;
    var options = meta || {};
    var selectorMap = options.selectors || null;
    var pageNamespace = options.pageNamespace || options.namespace || (state && state.currentNamespace) || null;
    var snapshot = {
      label: label || '',
      phase: options.phase || null,
      namespace: options.namespace || (state && state.currentNamespace) || null,
      pageNamespace: pageNamespace,
      currentNamespace: state && state.currentNamespace || null,
      previousNamespace: options.previousNamespace || null,
      nextNamespace: options.nextNamespace || null,
      pathname: window.location.pathname,
      containerInDom: !!(container && document.body && document.body.contains(container)),
      containerNamespace: container && container.getAttribute ? container.getAttribute('data-barba-namespace') || null : null,
      containerChildren: container && container.children ? container.children.length : null,
      currentPageModuleActive: !!(state && state.currentPageModule),
      cleanup: {
        page: state && state.pageCleanupStack ? state.pageCleanupStack.length : 0,
        global: state && state.globalCleanupStack ? state.globalCleanupStack.length : 0
      },
      features: summarizeFeatureAvailability(),
      nav: summarizeNavState(),
      body: summarizeBodyState(),
      lenis: summarizeLenisState(),
      finsweet: summarizeFinsweetState(container)
    };

    if (selectorMap) {
      snapshot.selectors = collectSelectorSummary(container, selectorMap);
    }

    return snapshot;
  }

  function getRouteSnapshotDiff(previousSnapshot, currentSnapshot) {
    var diff = {};
    var changed = false;

    Object.keys(currentSnapshot).forEach(function (key) {
      var previousValue = previousSnapshot ? previousSnapshot[key] : undefined;
      var currentValue = currentSnapshot[key];

      if (JSON.stringify(previousValue) !== JSON.stringify(currentValue)) {
        diff[key] = {
          from: previousValue,
          to: currentValue
        };
        changed = true;
      }
    });

    return changed ? diff : null;
  }

  function logRouteState(label, container, meta) {
    var snapshot = createRouteSnapshot(label, container, meta);
    var history = window.__MBC_ROUTE_DEBUG_HISTORY || [];
    var events = window.__MBC_ROUTE_DEBUG_EVENTS || [];
    var previousSnapshot = history.length ? history[history.length - 1] : window.__MBC_ROUTE_DEBUG_LAST_STATE || null;
    var delta = null;

    if (!isRouteDebugEnabled()) {
      return snapshot;
    }

    ensureRouteDebugHelpers();

    console.log('[MBC Route Debug] ' + (label || 'state'), snapshot);

    if (previousSnapshot) {
      delta = getRouteSnapshotDiff(previousSnapshot, snapshot);
      if (delta) {
        console.log('[MBC Route Debug] delta', delta);
      }
    }

    history.push(snapshot);
    events.push({
      label: label || 'state',
      timestamp: Date.now(),
      snapshot: snapshot,
      delta: delta
    });
    window.__MBC_ROUTE_DEBUG_HISTORY = history;
    window.__MBC_ROUTE_DEBUG_EVENTS = events;
    window.__MBC_ROUTE_DEBUG_LAST_STATE = snapshot;

    return snapshot;
  }

  function shouldTrace() {
    return window.MBC_DEBUG === true;
  }

  function traceLog(state, label, start) {
    if (!shouldTrace()) {
      return;
    }

    var args = ['[MBC Trace] ' + state + ':', label];

    if (typeof start === 'number') {
      args.push(Math.round(performance.now() - start) + 'ms');
    }

    console.log.apply(console, args);
  }

  function traceAsync(label, promiseFactory) {
    var start = performance.now();
    traceLog('start', label);

    return Promise.resolve().then(promiseFactory).then(function (result) {
      traceLog('done', label, start);
      return result;
    }).catch(function (err) {
      traceLog('fail', label, start);
      throw err;
    });
  }

  function traceSync(label, fn) {
    var start = performance.now();
    traceLog('start', label);

    try {
      var result = fn();
      traceLog('done', label, start);
      return result;
    } catch (err) {
      traceLog('fail', label, start);
      throw err;
    }
  }

  MBC.core.utils = {
    wait: wait,
    raf2: raf2,
    waitForLayout: waitForLayout,
    debounce: debounce,
    normalizeNamespace: normalizeNamespace,
    isHome: isHome,
    safeCall: safeCall,
    countSelectorMatches: countSelectorMatches,
    collectSelectorSummary: collectSelectorSummary,
    logSelectorSummary: logSelectorSummary,
    logRouteState: logRouteState,
    traceAsync: traceAsync,
    traceSync: traceSync
  };
})();