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

  function traceAsync(label, promiseFactory) {
    var start = performance.now();
    console.log('[MBC Trace] start:', label);

    return Promise.resolve().then(promiseFactory).then(function (result) {
      console.log('[MBC Trace] done:', label, Math.round(performance.now() - start) + 'ms');
      return result;
    }).catch(function (err) {
      console.log('[MBC Trace] fail:', label, Math.round(performance.now() - start) + 'ms');
      throw err;
    });
  }

  function traceSync(label, fn) {
    var start = performance.now();
    console.log('[MBC Trace] start:', label);

    try {
      var result = fn();
      console.log('[MBC Trace] done:', label, Math.round(performance.now() - start) + 'ms');
      return result;
    } catch (err) {
      console.log('[MBC Trace] fail:', label, Math.round(performance.now() - start) + 'ms');
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
    traceAsync: traceAsync,
    traceSync: traceSync
  };
})();