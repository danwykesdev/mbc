(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.core = MBC.core || {};

  async function unmountCurrent(token) {
    var state = MBC.core.state;
    var utils = MBC.core.utils;

    if (state.currentPageModule && typeof state.currentPageModule.unmount === "function") {
      utils.safeCall(function () {
        return state.currentPageModule.unmount({ token: token, state: state });
      }, "page unmount failed");
    }

    MBC.core.cleanup.runPage();

    state.currentPageModule = null;
    state.currentNamespace = "";
    state.currentContainer = document;
  }

  async function mountNext(data, opts) {
    var options = opts || {};
    var state = MBC.core.state;
    var utils = MBC.core.utils;
    var registry = MBC.core.registry;

    var token = state.nextToken();
    var namespace = utils.normalizeNamespace(data && data.next ? data.next.namespace : "");
    var container = data && data.next ? data.next.container : document;
    var pageModule = registry.get(namespace);

    state.currentNamespace = namespace;
    state.currentContainer = container;

    if (!pageModule || typeof pageModule.mount !== "function") {
      console.warn("[MBC] Missing page module for namespace:", namespace);
      return;
    }

    var tier = pageModule.webflowTier || "light";

    await utils.waitForLayout();
    if (state.isStale(token)) return;

    await MBC.core.webflow.reinit(tier);
    if (state.isStale(token)) return;

    await utils.waitForLayout();
    if (state.isStale(token)) return;

    var pageCleanup = await pageModule.mount({
      token: token,
      state: state,
      data: data,
      isFirstLoad: !!options.isFirstLoad,
      container: container,
      namespace: namespace
    });

    if (typeof pageCleanup === "function") {
      MBC.core.cleanup.add(pageCleanup);
    }

    state.currentPageModule = pageModule;

    if (options.isFirstLoad) {
      state.initialLoadComplete = true;
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

  MBC.core.lifecycle = {
    mountNext: mountNext,
    unmountCurrent: unmountCurrent
  };
})();