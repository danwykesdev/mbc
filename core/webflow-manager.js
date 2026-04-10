(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.core = MBC.core || {};

  function updatePageIdFromBarba(data) {
    if (!data || !data.next || !data.next.html) return;

    try {
      var parser = new DOMParser();
      var nextDoc = parser.parseFromString(data.next.html, "text/html");
      var newPageId = nextDoc.documentElement.getAttribute("data-wf-page");

      if (newPageId) {
        document.documentElement.setAttribute("data-wf-page", newPageId);
      }
    } catch (err) {
      console.warn("[MBC] updatePageIdFromBarba failed", err);
    }
  }

  function moduleReady(name) {
    var mod = window.Webflow && window.Webflow.require ? window.Webflow.require(name) : null;
    if (!mod) return;

    if (typeof mod.ready === "function") mod.ready();
    else if (typeof mod.init === "function") mod.init();
    else if (typeof mod.redraw === "function") mod.redraw();
  }

  function initIX() {
    try {
      var ix2 = window.Webflow && window.Webflow.require ? window.Webflow.require("ix2") : null;
      if (ix2 && ix2.store && ix2.actions && typeof ix2.actions.stop === "function") {
        ix2.store.dispatch(ix2.actions.stop());
      }
      if (ix2 && typeof ix2.init === "function") ix2.init();
    } catch (err) {
      console.warn("[MBC] ix2 init failed", err);
    }

    try {
      var ix3 = window.Webflow && window.Webflow.require ? window.Webflow.require("ix3") : null;
      if (ix3 && typeof ix3.init === "function") ix3.init();
    } catch (err) {
      console.warn("[MBC] ix3 init failed", err);
    }
  }

  function runModules() {
    ["links", "scroll", "tabs", "dropdown", "navbar", "slider", "forms"].forEach(moduleReady);
  }

  async function reinit(tier) {
    var utils = MBC.core.utils;

    if (!window.Webflow) return;

    if (tier === "full") {
      window.Webflow.destroy && window.Webflow.destroy();
    }

    window.Webflow.ready && window.Webflow.ready();
    runModules();

    if (tier === "ix" || tier === "full") {
      initIX();
    }

    try {
      window.dispatchEvent(new Event("resize"));
    } catch (_) {}

    if (typeof ScrollTrigger !== "undefined") {
      ScrollTrigger.refresh(true);
    }

    await utils.wait(50);
  }

  MBC.core.webflow = {
    updatePageIdFromBarba: updatePageIdFromBarba,
    reinit: reinit,
    initIX: initIX
  };
})();