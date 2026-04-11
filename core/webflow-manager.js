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

  function killScrollTriggers() {
    if (typeof ScrollTrigger === "undefined") return;

    ScrollTrigger.getAll().forEach(function (trigger) {
      try {
        trigger.kill();
      } catch (err) {
        console.warn("[MBC] ScrollTrigger kill failed", err);
      }
    });
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

  function dispatchLayoutEvents() {
    try {
      window.dispatchEvent(new Event("resize"));
    } catch (_) {}
  }

  async function runReadyPass(includeIX) {
    if (typeof window.Webflow.ready === "function") {
      window.Webflow.ready();
    }

    runModules();

    if (includeIX) {
      initIX();
    }

    dispatchLayoutEvents();

    if (typeof ScrollTrigger !== "undefined") {
      ScrollTrigger.refresh(true);
    }

    await MBC.core.utils.wait(90);
  }

  /**
   * Reinitialize Webflow
   * 
   * Tier options:
   * - "strong": nuclear reset — destroy → ready → IX stop/init → readystatechange
   *             Use for pages where IX3 must bind reliably (home, projects, about)
   * - "full": destroy → ready → modules → IX (for full page transitions)
   * - "ix": destroy + IX reinit (for partial updates)
   * - "light": just modules (for minimal updates)
   */
  async function reinit(tier) {
    if (!window.Webflow) return;

    var mode = tier || "light";
    var isStrong = mode === "strong";
    var includeIX = isStrong || mode === "ix" || mode === "full";

    // Destroy for strong, full, or ix tiers
    if (includeIX) {
      if (typeof window.Webflow.destroy === "function") {
        window.Webflow.destroy();
      }
    }

    // First pass: ready → modules → IX
    await runReadyPass(includeIX);

    if (isStrong) {
      // The "nuclear" IX3 reset — from the proven Swup pattern
      // readystatechange is what IX3's GSAP engine listens for to calculate bounding boxes
      try {
        document.dispatchEvent(new Event("readystatechange"));
      } catch (_) {}

      // Force resize so ScrollTrigger recalculates
      dispatchLayoutEvents();

      await MBC.core.utils.wait(60);

      // Second pass — IX3 needs this after readystatechange settles
      if (typeof window.Webflow.ready === "function") {
        window.Webflow.ready();
      }
      initIX();

      try {
        document.dispatchEvent(new Event("readystatechange"));
      } catch (_) {}

      dispatchLayoutEvents();

      if (typeof ScrollTrigger !== "undefined") {
        ScrollTrigger.refresh(true);
      }
    } else if (includeIX) {
      // Standard double-pass for ix/full tiers
      if (typeof window.Webflow.ready === "function") {
        window.Webflow.ready();
      }
      initIX();
      dispatchLayoutEvents();

      if (typeof ScrollTrigger !== "undefined") {
        ScrollTrigger.refresh(true);
      }
    }
  }

  async function refreshUI() {
    if (!window.Webflow) return;

    await runReadyPass(true);
  }

  /**
   * Quick IX refresh - for minor DOM updates
   */
  function refreshIX() {
    initIX();
    try {
      window.dispatchEvent(new Event("resize"));
    } catch (_) {}
  }

  MBC.core.webflow = {
    updatePageIdFromBarba: updatePageIdFromBarba,
    killScrollTriggers: killScrollTriggers,
    reinit: reinit,
    refreshUI: refreshUI,
    refreshIX: refreshIX,
    initIX: initIX
  };
})();
