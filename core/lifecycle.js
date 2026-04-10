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

    MBC.core.cleanup.runAll();

    if (typeof ScrollTrigger !== "undefined") {
      ScrollTrigger.getAll().forEach(function (st) {
        st.kill();
      });
    }

    state.currentPageModule = null;
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

    var tier = pageModule.webflowTier || "light";
    await MBC.core.webflow.reinit(tier);

    if (typeof ScrollTrigger !== "undefined") {
      ScrollTrigger.refresh(true);
    }

    if (state.lenis && typeof state.lenis.start === "function") {
      state.lenis.start();
    }

    if (options.isFirstLoad) {
      state.initialLoadComplete = true;
    }
  }

  MBC.core.lifecycle = {
    mountNext: mountNext,
    unmountCurrent: unmountCurrent
  };
})();