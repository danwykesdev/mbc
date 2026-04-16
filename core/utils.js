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
    traceAsync: traceAsync,
    traceSync: traceSync
  };
})();