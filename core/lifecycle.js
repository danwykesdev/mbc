(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.core = MBC.core || {};

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

  async function unmountCurrent(token) {
    var state = MBC.core.state;
    var utils = MBC.core.utils;
    var routeDebug = utils && typeof utils.logRouteState === "function" ? utils.logRouteState : null;
    var currentNamespace = state.currentNamespace || "default";
    var currentContainer = state.currentContainer || document;

    if (routeDebug) {
      routeDebug("lifecycle unmount start " + currentNamespace, currentContainer, {
        phase: "unmount-start",
        namespace: currentNamespace,
        previousNamespace: currentNamespace
      });
    }

    if (state.currentPageModule && typeof state.currentPageModule.unmount === "function") {
      utils.safeCall(function () {
        return state.currentPageModule.unmount({ token: token, state: state });
      }, "page unmount failed");
    }

    if (MBC.features && MBC.features.finsweet && typeof MBC.features.finsweet.destroy === "function") {
      try {
        await MBC.features.finsweet.destroy({ timeout: 800 });
      } catch (err) {
        console.warn("[MBC] Finsweet destroy on unmount failed", err);
      }
    }

    MBC.core.cleanup.runPage();

    if (routeDebug) {
      routeDebug("lifecycle unmount done " + currentNamespace, currentContainer, {
        phase: "unmount-done",
        namespace: currentNamespace,
        previousNamespace: currentNamespace
      });
    }

    state.currentPageModule = null;
    state.currentNamespace = "";
    state.currentContainer = document;
  }

  async function mountNext(data, opts) {
    var options = opts || {};
    var state = MBC.core.state;
    var utils = MBC.core.utils;
    var routeDebug = utils && typeof utils.logRouteState === "function" ? utils.logRouteState : null;
    var registry = MBC.core.registry;

    var token = state.nextToken();
    var previousNamespace = state.currentNamespace || "default";
    var previousContainer = state.currentContainer || document;
    var namespace = utils.normalizeNamespace(data && data.next ? data.next.namespace : "");
    var container = data && data.next ? data.next.container : document;
    var pageModule = registry.get(namespace);

    state.currentNamespace = namespace;
    state.currentContainer = container;

    if (routeDebug) {
      routeDebug("lifecycle mount start " + namespace, container, {
        phase: "mount-start",
        pageNamespace: namespace,
        namespace: namespace,
        previousNamespace: previousNamespace,
        previousContainerNamespace: previousContainer && previousContainer.getAttribute ? previousContainer.getAttribute("data-barba-namespace") || null : null,
        nextNamespace: namespace,
        token: token
      });
    }

    if (!pageModule || typeof pageModule.mount !== "function") {
      console.warn("[MBC] Missing page module for namespace:", namespace);
      return;
    }

    var tier = pageModule.webflowTier || "light";

    await traceAsync('lifecycle waitForLayout pre-reinit ' + namespace, function () {
      return utils.waitForLayout();
    });
    if (state.isStale(token)) return;

    await traceAsync('lifecycle webflow.reinit ' + namespace + ' (' + tier + ')', function () {
      return MBC.core.webflow.reinit(tier);
    });
    if (state.isStale(token)) return;

    await traceAsync('lifecycle waitForLayout post-reinit ' + namespace, function () {
      return utils.waitForLayout();
    });
    if (state.isStale(token)) return;

    var pageCleanup = await traceAsync('lifecycle mount page ' + namespace, function () {
      return pageModule.mount({
        token: token,
        state: state,
        data: data,
        isFirstLoad: !!options.isFirstLoad,
        container: container,
        namespace: namespace
      });
    });

    if (typeof pageCleanup === "function") {
      addPageCleanup(pageCleanup);
    }

    state.currentPageModule = pageModule;

    if (options.isFirstLoad) {
      state.initialLoadComplete = true;
    }

    if (routeDebug) {
      routeDebug("lifecycle mount done " + namespace, container, {
        phase: "mount-done",
        pageNamespace: namespace,
        namespace: namespace,
        previousNamespace: previousNamespace,
        nextNamespace: namespace,
        token: token
      });
    }

    return {
      token: token,
      namespace: namespace,
      container: container,
      pageModule: pageModule,
      webflowTier: tier,
      isFirstLoad: !!options.isFirstLoad
    };
  }

  function addPageCleanup(fn) {
    var cleanupApi = MBC.core && MBC.core.cleanup;

    if (typeof fn !== "function" || !cleanupApi) {
      return;
    }

    if (typeof cleanupApi.addPage === "function") {
      cleanupApi.addPage(fn);
      return;
    }

    if (typeof cleanupApi.add === "function") {
      cleanupApi.add(fn);
    }
  }

  MBC.core.lifecycle = {
    mountNext: mountNext,
    unmountCurrent: unmountCurrent
  };
})();
