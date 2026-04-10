(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.core = MBC.core || {};

  /**
   * Update Webflow page ID from Barba data
   * This ensures IX2/IX3 targets the correct page config
   */
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

  /**
   * Run a Webflow module's ready/init/redraw method
   */
  function moduleReady(name) {
    var mod = window.Webflow && window.Webflow.require ? window.Webflow.require(name) : null;
    if (!mod) return;

    if (typeof mod.ready === "function") mod.ready();
    else if (typeof mod.init === "function") mod.init();
    else if (typeof mod.redraw === "function") mod.redraw();
  }

  /**
   * Initialize IX2 and IX3
   * Following osmo.md pattern: stop -> init (simple, no multi-pass)
   */
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

  /**
   * Run all standard Webflow modules
   */
  function runModules() {
    var modules = ["links", "scroll", "tabs", "dropdown", "navbar", "slider", "forms"];
    modules.forEach(moduleReady);
  }

  /**
   * Reinitialize Webflow - simplified osmo.md approach
   * 
   * Tier options:
   * - "full": destroy -> ready -> modules -> IX (for full page transitions)
   * - "ix": just IX reinit (for partial updates)
   * - "light": just modules (for minimal updates)
   */
  async function reinit(tier) {
    if (!window.Webflow) return;

    // Full reset for page transitions
    if (tier === "full") {
      if (typeof window.Webflow.destroy === "function") {
        window.Webflow.destroy();
      }
    }

    // Always run ready and modules
    if (typeof window.Webflow.ready === "function") {
      window.Webflow.ready();
    }
    runModules();

    // IX reinit for interactive pages
    if (tier === "ix" || tier === "full") {
      initIX();
    }

    // Trigger resize for layout recalculation
    try {
      window.dispatchEvent(new Event("resize"));
    } catch (_) {}

    // Refresh ScrollTrigger
    if (typeof ScrollTrigger !== "undefined") {
      ScrollTrigger.refresh(true);
    }

    // Small delay for layout to settle
    await MBC.core.utils.wait(50);
  }

  /**
   * Quick IX refresh - for minor DOM updates
   */
  function refreshIX() {
    initIX();
    try {
      window.dispatchEvent(new Event("resize"));
    } catch (_) {}
    if (typeof ScrollTrigger !== "undefined") {
      ScrollTrigger.refresh();
    }
  }

  MBC.core.webflow = {
    updatePageIdFromBarba: updatePageIdFromBarba,
    reinit: reinit,
    refreshIX: refreshIX,
    initIX: initIX
  };
})();