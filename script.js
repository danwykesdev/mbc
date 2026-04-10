(() => {
  if (window.__MBC_APP_ACTIVE) return;
  window.__MBC_APP_ACTIVE = true;

  if (document.body) document.body.classList.add("animations-ready");
  document.documentElement.classList.add("js");
  gsap.config({ nullTargetWarn: false });

  const FINSWEET_MODULES = ["list"];

  const APP = {
    navToken: 0,
    currentContainer: document,
    cleanupFns: [],
    mobileNavCleanup: null,
    themeScrollCleanup: null,
    standaloneVideoCleanup: null,
    homeHeroRunToken: null,
    heroAnimating: false,
    initialLoadComplete: false,
    initialNamespace: "",
    loadEnhancementsBound: false,
    activeMountToken: 0
  };

  let lenis = null;
  let fsBusy = false;

  // Set to false once QA is done
  const DEBUG_HOME = true;

  function dlog(label, payload) {
    if (!DEBUG_HOME) return;
    if (payload === undefined) {
      console.log(`[MBC DEBUG] ${label}`);
    } else {
      console.log(`[MBC DEBUG] ${label}`, payload);
    }
  }

  function inspectHome(container, stage) {
    if (!DEBUG_HOME) return;

    dlog(stage, {
      wfPage: document.documentElement.getAttribute("data-wf-page"),
      barbaNamespace: container?.getAttribute?.("data-barba-namespace") ||
        container?.dataset?.barbaNamespace ||
        null,
      crispLoaders: container?.querySelectorAll?.(".crisp-loader")?.length || 0,
      tabsRoot: !!container?.querySelector?.(".w-tabs"),
      wfTabLinks: container?.querySelectorAll?.(".w-tab-link")?.length || 0,
      projectLinks: container?.querySelectorAll?.(".project__link")?.length || 0,
      bgVideo: !!(container?.querySelector?.("#videoLoad") || document.getElementById(
        "videoLoad")),
      modalVideo: !!(container?.querySelector?.("#video") || document.getElementById(
        "video")),
      nav: !!document.querySelector(".nav"),
      modules: {
        tabs: !!window.Webflow?.require?.("tabs"),
        navbar: !!window.Webflow?.require?.("navbar"),
        slider: !!window.Webflow?.require?.("slider"),
        forms: !!window.Webflow?.require?.("forms"),
        ix2: !!window.Webflow?.require?.("ix2"),
        ix3: !!window.Webflow?.require?.("ix3")
      }
    });
  }

  const warn = (...args) => console.warn("[APP]", ...args);

  function isHomeNS(ns = "") {
    return String(ns).toLowerCase() === "home";
  }

  function isProjectsNS(ns = "") {
    const v = String(ns).toLowerCase();
    return v === "project" || v === "projects";
  }

  function isProjectDetailNS(ns = "") {
    const v = String(ns).toLowerCase();
    return v === "project-detail" || v === "project_detail";
  }

  function isZineDetailNS(ns = "") {
    const v = String(ns).toLowerCase();
    return v === "zine-detail" || v === "zine_detail";
  }

  function nextNavToken() {
    APP.navToken += 1;
    return APP.navToken;
  }

  function isStale(token) {
    return token !== APP.navToken;
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function waitForLayout() {
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    );

    await wait(60);
  }

  function debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  function registerCleanup(fn) {
    if (typeof fn === "function") APP.cleanupFns.push(fn);
  }

  function queryOne(scope, selector, fallback = false) {
    const el = scope?.querySelector?.(selector);
    return el || (fallback ? document.querySelector(selector) : null);
  }

  function queryAll(scope, selector, fallback = false) {
    const local = scope?.querySelectorAll?.(selector);
    if (local && local.length) return Array.from(local);
    return fallback ? Array.from(document.querySelectorAll(selector)) : [];
  }

  function isProjectsFilterItem(el) {
    return !!(el && (el.classList?.contains("filters__item") || el.closest?.(".filters__item")));
  }

  function cleanupPageModules() {
    if (window.__homeHeroMM) {
      try {
        window.__homeHeroMM.revert();
      } catch (_) {}
      window.__homeHeroMM = null;
    }

    if (window.__homeHeroTL) {
      try {
        window.__homeHeroTL.kill();
      } catch (_) {}
      window.__homeHeroTL = null;
    }

    APP.heroAnimating = false;

    for (let i = APP.cleanupFns.length - 1; i >= 0; i--) {
      try {
        APP.cleanupFns[i]();
      } catch (e) {
        warn("cleanup error:", e);
      }
    }

    APP.cleanupFns = [];

    if (APP.standaloneVideoCleanup) {
      try {
        APP.standaloneVideoCleanup();
      } catch (_) {}
      APP.standaloneVideoCleanup = null;
    }

    if (window.__homeModalPlayer) {
      window.__homeModalPlayer.destroy?.().catch?.(() => null);
      window.__homeModalPlayer = null;
    }

    if (typeof ScrollTrigger !== "undefined") {
      ScrollTrigger.getAll().forEach((st) => {
        if (st.vars?.id === "horizontal-pin") st.kill();
      });
    }
  }

  function initLenisGlobal() {
    if (lenis) return;
    if (typeof window.Webflow?.env === "function" && window.Webflow.env("editor") !== undefined)
      return;
    if (typeof Lenis === "undefined") {
      warn("Lenis missing");
      return;
    }

    lenis = new Lenis({
      lerp: 0.1,
      wheelMultiplier: 0.7,
      gestureOrientation: "vertical",
      normalizeWheel: false,
      smoothTouch: false
    });

    window.lenis = lenis;

    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);

    if (typeof ScrollTrigger !== "undefined") {
      lenis.on("scroll", ScrollTrigger.update);
    }

    if (window.jQuery) {
      $("[data-lenis-start]").off("click").on("click", () => lenis?.start());
      $("[data-lenis-stop]").off("click").on("click", () => lenis?.stop());
      $("[data-lenis-toggle]").off("click").on("click", function () {
        $(this).toggleClass("stop-scroll");
        if (!lenis) return;
        $(this).hasClass("stop-scroll") ? lenis.stop() : lenis.start();
      });
    }
  }

  // -----------------------------------------
  // WEBFLOW RESET / REBIND
  // -----------------------------------------

  function updateWebflowPageId(data) {
    if (!data?.next?.html) return;

    try {
      const parser = new DOMParser();
      const nextDoc = parser.parseFromString(data.next.html, "text/html");
      const newPageId = nextDoc.documentElement.getAttribute("data-wf-page");
      const currentHtml = document.documentElement;

      if (newPageId && currentHtml.getAttribute("data-wf-page") !== newPageId) {
        currentHtml.setAttribute("data-wf-page", newPageId);
      }
    } catch (e) {
      warn("updateWebflowPageId failed:", e);
    }
  }

  function initIXModules() {
    try {
      const ix2 = window.Webflow?.require?.("ix2");
      if (ix2?.store && ix2?.actions && typeof ix2.actions.stop === "function") {
        ix2.store.dispatch(ix2.actions.stop());
      }
      if (typeof ix2?.init === "function") {
        ix2.init();
      }
    } catch (e) {
      warn("IX2 init failed:", e);
    }

    try {
      const ix3 = window.Webflow?.require?.("ix3");
      if (ix3 && typeof ix3.init === "function") {
        ix3.init();
      }
    } catch (e) {
      warn("IX3 init failed:", e);
    }
  }

  function runWebflowModuleReady(names = []) {
    names.forEach((name) => {
      try {
        const mod = window.Webflow?.require?.(name);
        if (!mod) return;

        if (typeof mod.ready === "function") mod.ready();
        else if (typeof mod.init === "function") mod.init();
        else if (typeof mod.redraw === "function") mod.redraw();
      } catch (e) {
        warn(`Webflow module ready failed: ${name}`, e);
      }
    });
  }

  function dispatchSyntheticWebflowEvents({
    includeReadystatechange = false,
    includeLoad = false,
    includeResize = true
  } = {}) {
    if (includeReadystatechange) {
      try {
        document.dispatchEvent(new Event("readystatechange"));
      } catch (_) {}
    }

    if (includeLoad) {
      try {
        window.dispatchEvent(new Event("load"));
      } catch (_) {}
    }

    if (includeResize) {
      try {
        window.dispatchEvent(new Event("resize"));
      } catch (_) {}
    }
  }

  function refreshIXOnly() {
    try {
      window.Webflow?.ready?.();
      initIXModules();
    } catch (e) {
      warn("refreshIXOnly failed:", e);
    }
  }

  async function forceWebflowRestartSafe(token, reason = "unknown", options = {}) {
    if (isStale(token)) return false;

    const opts = {
      includeReadystatechange: false,
      includeLoad: false,
      includeResize: true,
      secondPass: true,
      ...options
    };

    try {
      if (window.Webflow) {
        window.Webflow.destroy?.();
        window.Webflow.ready?.();
      }

      initIXModules();

      dispatchSyntheticWebflowEvents({
        includeReadystatechange: opts.includeReadystatechange,
        includeLoad: opts.includeLoad,
        includeResize: opts.includeResize
      });

      if (typeof ScrollTrigger !== "undefined") {
        ScrollTrigger.refresh(true);
      }

      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      );

      if (isStale(token)) return false;

      if (opts.secondPass) {
        window.Webflow?.ready?.();
        initIXModules();

        if (opts.includeResize) {
          try {
            window.dispatchEvent(new Event("resize"));
          } catch (_) {}
        }

        if (typeof ScrollTrigger !== "undefined") {
          ScrollTrigger.refresh(true);
        }

        await wait(90);
        if (isStale(token)) return false;
      }

      return true;
    } catch (e) {
      warn(`forceWebflowRestartSafe failed (${reason}):`, e);
      return false;
    }
  }

  async function runVisibleWebflowPass({ withIX = true } = {}) {
    try {
      window.Webflow?.ready?.();

      if (withIX) {
        initIXModules();
      } else {
        runWebflowModuleReady([
          "links",
          "scroll",
          "tabs",
          "dropdown",
          "navbar",
          "slider",
          "forms"
        ]);
      }

      try {
        window.dispatchEvent(new Event("resize"));
      } catch (_) {}

      if (typeof ScrollTrigger !== "undefined") {
        ScrollTrigger.refresh(true);
      }

      await wait(70);

      window.Webflow?.ready?.();

      if (withIX) {
        initIXModules();
      } else {
        runWebflowModuleReady([
          "links",
          "scroll",
          "tabs",
          "dropdown",
          "navbar",
          "slider",
          "forms"
        ]);
      }

      if (typeof ScrollTrigger !== "undefined") {
        ScrollTrigger.refresh(true);
      }
    } catch (e) {
      warn("runVisibleWebflowPass failed:", e);
    }
  }

  async function runVisibleWebflowUIPass(token, reason = "home-ui-post") {
    if (isStale(token)) return false;

    dlog(`${reason}:start`);

    try {
      window.Webflow?.ready?.();
      initIXModules();

      runWebflowModuleReady([
        "links",
        "scroll",
        "tabs",
        "dropdown",
        "navbar",
        "slider",
        "forms"
      ]);

      try {
        window.dispatchEvent(new Event("resize"));
      } catch (_) {}

      if (typeof ScrollTrigger !== "undefined") {
        ScrollTrigger.refresh(true);
      }

      await wait(90);
      if (isStale(token)) return false;

      window.Webflow?.ready?.();
      initIXModules();

      runWebflowModuleReady([
        "links",
        "scroll",
        "tabs",
        "dropdown",
        "navbar",
        "slider",
        "forms"
      ]);

      if (typeof ScrollTrigger !== "undefined") {
        ScrollTrigger.refresh(true);
      }

      dlog(`${reason}:done`);
      return true;
    } catch (e) {
      dlog(`${reason}:fail`, e);
      return false;
    }
  }

  // -----------------------------------------
  // FINSWEET ATTRIBUTES V2
  // -----------------------------------------

  if (!window.__fsHookAttached) {
    window.__fsHookAttached = true;

    window.FinsweetAttributes ||= [];
    window.FinsweetAttributes.push([
      "list",
      () => {
        dlog("fs:list:hook:ready");
      }
    ]);
  }

  async function waitForFinsweetV2(timeout = 2200) {
    const start = performance.now();

    while (performance.now() - start < timeout) {
      const fs = window.FinsweetAttributes;
      if (fs && typeof fs === "object" && typeof fs.load === "function") {
        return fs;
      }
      await wait(50);
    }

    return window.FinsweetAttributes || null;
  }

  async function reinitFinsweetAttributesSafe(token) {
    if (isStale(token) || fsBusy) return false;

    fsBusy = true;

    try {
      const fs = await waitForFinsweetV2(2200);

      if (!fs || typeof fs.load !== "function") {
        dlog("fs:list:unavailable");
        return true;
      }

      if (!fs.modules) fs.modules = {};

      dlog("fs:modules", Object.keys(fs.modules || {}));

      if (fs.modules.list?.loading) {
        try {
          await Promise.race([fs.modules.list.loading, wait(1800)]);
        } catch (_) {}
      }

      if (!fs.modules.list?.restart) {
        dlog("fs:list:load:start");
        try {
          await Promise.race([fs.load("list"), wait(1800)]);
        } catch (e) {
          warn("FS load(list) failed:", e);
        }
        dlog("fs:list:load:done");
      }

      if (fs.modules.list?.loading) {
        try {
          await Promise.race([fs.modules.list.loading, wait(1800)]);
        } catch (_) {}
      }

      if (isStale(token)) return false;

      if (typeof fs.modules.list?.restart === "function") {
        dlog("fs:list:restart:start");
        await Promise.resolve(fs.modules.list.restart());
        dlog("fs:list:restart:done");
      } else {
        dlog("fs:list:restart:missing");
      }

      await wait(120);
      return !isStale(token);
    } catch (e) {
      warn("Finsweet list reinit failed:", e);
      return false;
    } finally {
      fsBusy = false;
    }
  }

  // -----------------------------------------
  // NAV STATE
  // -----------------------------------------

  function setAttr(target, name, value) {
    if (!target) return;
    if (value === null || value === undefined || value === "") {
      target.removeAttribute(name);
    } else {
      target.setAttribute(name, String(value));
    }
  }

  function normalizeNavBlurValue(value) {
    if (value === null || value === undefined || value === "") return null;
    if (
      value === false ||
      value === "false" ||
      value === "0" ||
      value === "none" ||
      value === "no-blur"
    ) {
      return "false";
    }
    return String(value);
  }

  function getNavTargets() {
    const set = new Set([
      document.documentElement,
      document.body,
      document.querySelector(".nav")
    ]);

    document
      .querySelectorAll("[data-theme-nav], [data-nav-theme], [data-bg-nav], [data-nav-blur]")
      .forEach((el) => {
        set.add(el);
      });

    return Array.from(set).filter(Boolean);
  }

  function applyNavState({ theme = "dark", bg = null, blur = null } = {}) {
    const targets = getNavTargets();
    const blurValue = normalizeNavBlurValue(blur);

    targets.forEach((el) => {
      setAttr(el, "data-theme-nav", theme);
      setAttr(el, "data-nav-theme", theme);
    });

    if (bg !== null && bg !== undefined) {
      targets.forEach((el) => setAttr(el, "data-bg-nav", bg));
    } else if (blurValue === "false") {
      targets.forEach((el) => setAttr(el, "data-bg-nav", "none"));
    }

    if (blurValue !== null) {
      targets.forEach((el) => setAttr(el, "data-nav-blur", blurValue));
    }
  }

  function getTrackedThemeSections(container) {
    return container.querySelectorAll("header, section, [data-theme-section], [data-bg-section]");
  }

  function getSectionTheme(section) {
    return (
      section?.getAttribute("data-theme-section") ||
      section?.getAttribute("data-nav-theme") ||
      "dark"
    );
  }

  function getSectionBg(section) {
    return (
      section?.getAttribute("data-bg-section") ||
      section?.getAttribute("data-bg-nav") ||
      null
    );
  }

  function getSectionBlur(section) {
    return section?.getAttribute("data-nav-blur") ?? null;
  }

  function applyNavThemeFromSection(section) {
    applyNavState({
      theme: getSectionTheme(section),
      bg: getSectionBg(section),
      blur: getSectionBlur(section)
    });
  }

  function getFixedNavState(namespace, container) {
    const ns = String(namespace || "").toLowerCase();

    if (isProjectDetailNS(ns)) {
      return {
        theme: "light",
        bg: "none",
        blur: false
      };
    }

    const explicit =
      container?.querySelector?.(
        "[data-page-nav-theme], [data-page-nav-blur], [data-page-bg-nav]"
      ) || null;

    if (explicit) {
      return {
        theme: explicit.getAttribute("data-page-nav-theme") ||
          explicit.getAttribute("data-nav-theme") ||
          "dark",
        bg: explicit.getAttribute("data-page-bg-nav") ||
          explicit.getAttribute("data-bg-nav") ||
          null,
        blur: explicit.getAttribute("data-page-nav-blur") ??
          explicit.getAttribute("data-nav-blur") ??
          null
      };
    }

    return null;
  }

  function clearThemeScrollCleanup() {
    if (APP.themeScrollCleanup) {
      APP.themeScrollCleanup();
      APP.themeScrollCleanup = null;
    }
  }

  function resetGlobalNavTheme(container) {
    const sections = getTrackedThemeSections(container);
    if (!sections.length) {
      applyNavState({ theme: "dark", bg: null, blur: null });
      return;
    }

    applyNavThemeFromSection(sections[0]);
  }

  function initCheckSectionThemeScroll(container) {
    clearThemeScrollCleanup();

    const navBarHeight = document.querySelector("[data-nav-bar-height]");
    const offset = navBarHeight ? navBarHeight.offsetHeight / 2 : 0;
    const sections = Array.from(getTrackedThemeSections(container));

    const onScroll = () => {
      let active = null;

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= offset && rect.bottom >= offset) active = section;
      });

      if (active) applyNavThemeFromSection(active);
      else resetGlobalNavTheme(container);
    };

    onScroll();

    document.addEventListener("scroll", onScroll, { passive: true });
    APP.themeScrollCleanup = () => document.removeEventListener("scroll", onScroll);
    registerCleanup(APP.themeScrollCleanup);
  }

  function initCurrentYear(container) {
    const year = new Date().getFullYear();
    container.querySelectorAll("[data-current-year]").forEach((el) => {
      el.textContent = year;
    });
  }

  function prepLoadReveal(container) {
    const items = Array.from(
      container.querySelectorAll('[data-load-items="reveal"]:not([data-reveal-scroll="true"])')
    ).filter((el) => !isProjectsFilterItem(el));

    if (!items.length) return;
    gsap.set(items, { autoAlpha: 0, x: -14 });
  }

  function playNavAndRevealIntro(
    container, { isFirstLoad = false, includeNav = true, excludeSelector = null } = {}
  ) {
    const navItems = includeNav ?
      document.querySelectorAll('[data-load-items="nav-item"], [data-load-item="nav"]') : [];

    const revealItems = Array.from(
      container.querySelectorAll('[data-load-items="reveal"]:not([data-reveal-scroll="true"])')
    ).filter((el) => {
      if (isProjectsFilterItem(el)) return false;
      if (excludeSelector && el.closest(excludeSelector)) return false;
      return true;
    });

    const tl = gsap.timeline({
      defaults: {
        ease: "power2.out",
        overwrite: "auto"
      }
    });

    if (navItems.length) {
      gsap.set(navItems, { autoAlpha: 0, x: -14 });
      tl.to(
        navItems,
        {
          autoAlpha: 1,
          x: 0,
          duration: 0.32,
          stagger: 0.08,
          clearProps: "transform,opacity,visibility"
        },
        0
      );
    }

    if (revealItems.length) {
      gsap.set(revealItems, { autoAlpha: 0, x: -14 });
      tl.to(
        revealItems,
        {
          autoAlpha: 1,
          x: 0,
          duration: 0.5,
          stagger: 0.05,
          clearProps: "transform,opacity,visibility"
        },
        navItems.length ? 0.08 : isFirstLoad ? 0.1 : 0
      );
    }

    return tl;
  }

  function initRevealOnScroll(container) {
    const items = Array.from(
      container.querySelectorAll('[data-load-items="reveal"][data-reveal-scroll="true"]')
    ).filter((el) => !isProjectsFilterItem(el));

    if (!items.length) return;

    const obs = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const el = entry.target;
          if (el.dataset.revealPlayed === "true") {
            observer.unobserve(el);
            return;
          }

          el.dataset.revealPlayed = "true";

          gsap.to(el, {
            autoAlpha: 1,
            x: 0,
            duration: 0.35,
            ease: "power2.out",
            clearProps: "transform,opacity,visibility"
          });

          observer.unobserve(el);
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -8% 0px"
      }
    );

    items.forEach((el) => {
      if (el.dataset.revealInitialized === "true") return;
      el.dataset.revealInitialized = "true";
      gsap.set(el, { autoAlpha: 0, x: -14 });
      obs.observe(el);
    });

    registerCleanup(() => obs.disconnect());
  }

  function initSlideInAnimations(container) {
    const items = container.querySelectorAll('[data-load-items="slide"]');
    if (!items.length) return;

    const obs = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const el = entry.target;
          if (el.dataset.slidePlayed === "true") {
            observer.unobserve(el);
            return;
          }

          el.dataset.slidePlayed = "true";

          gsap.to(el, {
            autoAlpha: 1,
            x: 0,
            duration: 0.6,
            ease: "power2.out",
            clearProps: "transform,opacity,visibility"
          });

          observer.unobserve(el);
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -10% 0px"
      }
    );

    items.forEach((el) => {
      if (el.dataset.slideInitialized === "true") return;
      el.dataset.slideInitialized = "true";
      gsap.set(el, { autoAlpha: 0, x: -14 });
      obs.observe(el);
    });

    registerCleanup(() => obs.disconnect());
  }

  function initScrollAnimations(container) {
    const items = container.querySelectorAll("[data-animate-scroll]");
    if (!items.length) return;

    const observers = [];
    const groups = {};

    items.forEach((el) => {
      const offset = (el.getAttribute("data-offset") || "50").replace("%", "");
      if (!groups[offset]) groups[offset] = [];
      groups[offset].push(el);
    });

    Object.keys(groups).forEach((offset) => {
      const obs = new IntersectionObserver(
        (entries, observer) => {
          entries
            .filter((e) => e.isIntersecting)
            .forEach((entry, index) => {
              const target = entry.target;
              const delay =
                target.getAttribute("data-delay") !== null ?
                parseInt(target.getAttribute("data-delay"), 10) :
                index * 120;

              setTimeout(() => {
                target.classList.add("is-visible");
                observer.unobserve(target);
              }, delay);
            });
        },
        {
          rootMargin: `0px 0px -${offset}% 0px`,
          threshold: 0
        }
      );

      groups[offset].forEach((el) => obs.observe(el));
      observers.push(obs);
    });

    registerCleanup(() => observers.forEach((o) => o.disconnect()));
  }

  function resetUnderlineHoverStates(scope = document) {
    scope.querySelectorAll("[data-hover], [data-underline-link]").forEach((el) => {
      el.style.opacity = "";
      el.style.visibility = "";
      el.style.willChange = "";
      el.style.backfaceVisibility = "";

      if (
        el.style.transform === "translateZ(0)" ||
        el.style.transform === "translate3d(0px, 0px, 0px)"
      ) {
        el.style.transform = "";
      }
    });
  }

  function initTabHoverAnimation(container) {
    const mm = gsap.matchMedia();

    mm.add("(min-width: 992px)", () => {
      const tabsWrapper = container.querySelector(".w-tabs");
      const tabLinks = container.querySelectorAll(".project__link");
      const tabPanes = container.querySelectorAll(".project__tab-pane");
      const defaultPane = container.querySelector(".projects__default-pane");

      if (!tabsWrapper || !tabLinks.length || !tabPanes.length) return;

      let activeTl = null;

      function showDefaultPane() {
        activeTl?.kill();

        if (!defaultPane) return;

        gsap.set(defaultPane, { display: "block", autoAlpha: 1 });

        const imgs = defaultPane.querySelectorAll("img");
        if (!imgs.length) return;

        activeTl = gsap.fromTo(
          imgs, { autoAlpha: 0, y: 12 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.45,
            stagger: 0.06
          }
        );
      }

      tabLinks.forEach((link, index) => {
        const handler = () => {
          const pane = tabPanes[index];
          if (!pane) return;

          if (defaultPane) gsap.set(defaultPane, { display: "none", autoAlpha: 0 });

          const images = pane.querySelectorAll("img");
          const textLinks = pane.querySelectorAll(".is-link");

          activeTl?.kill();
          activeTl = gsap.timeline({ defaults: { ease: "power2.out" } });

          if (images.length) {
            activeTl.fromTo(
              images, { autoAlpha: 0, y: 12 },
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.45,
                stagger: 0.06
              },
              0
            );
          }

          if (textLinks.length) {
            activeTl.fromTo(
              textLinks, { autoAlpha: 0, y: 10 },
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.35,
                stagger: 0.04
              },
              0.05
            );
          }
        };

        link.addEventListener("mouseenter", handler);
        registerCleanup(() => link.removeEventListener("mouseenter", handler));
      });

      const leaveHandler = () => showDefaultPane();
      tabsWrapper.addEventListener("mouseleave", leaveHandler);
      registerCleanup(() => tabsWrapper.removeEventListener("mouseleave", leaveHandler));

      showDefaultPane();
    });

    registerCleanup(() => mm.revert());
  }

  function initHorizontalScrolling(container) {
    if (typeof ScrollTrigger === "undefined") return;

    const wrap = container.querySelector("[data-horizontal-scroll-wrap]");
    if (!wrap) return;

    const existing = ScrollTrigger.getById("horizontal-pin");
    if (existing) existing.kill();

    const panels = gsap.utils.toArray(container.querySelectorAll(
      "[data-horizontal-scroll-panel]"));
    if (panels.length < 2) return;

    const vw = window.innerWidth;
    wrap.style.paddingRight = vw < 768 ? "20px" : vw < 992 ? "40px" : "80px";

    const [first, second] = panels;
    let gap = 14;

    if (first && second) {
      const a = first.getBoundingClientRect();
      const b = second.getBoundingClientRect();
      gap =
        Math.max(0, b.left - (a.left + a.width)) ||
        (parseFloat(getComputedStyle(first).marginRight) || 14);
    }

    const last = panels[panels.length - 1];
    last.style.marginRight = vw < 768 ? "1rem" : vw < 992 ? "1.5rem" : "2rem";

    let total = 0;
    panels.forEach((p, i) => {
      total += i < panels.length - 1 ? p.offsetWidth + gap : p.offsetWidth;
    });

    total += parseFloat(getComputedStyle(last).marginRight) || 0;
    total += parseFloat(getComputedStyle(wrap).paddingRight) || 0;

    const distance = Math.max(0, total - vw);
    if (distance <= 0) return;

    gsap.to(panels, {
      x: () => -distance,
      ease: "none",
      scrollTrigger: {
        id: "horizontal-pin",
        trigger: wrap,
        start: "top top",
        end: () => `+=${distance}`,
        scrub: 1,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });
  }

  function shouldInitStandaloneVideo(namespace = "", container = document) {
    const ns = String(namespace || "").toLowerCase();
    return (
      ns === "home" ||
      ns === "project-detail" ||
      ns === "project_detail" ||
      !!container.querySelector("#videoLoad, #video")
    );
  }

  function initStandaloneVideos(container, namespace = "") {
    if (!shouldInitStandaloneVideo(namespace, container)) return;
    if (typeof Vimeo === "undefined" || !Vimeo.Player) return;

    if (APP.standaloneVideoCleanup) {
      try {
        APP.standaloneVideoCleanup();
      } catch (_) {}
      APP.standaloneVideoCleanup = null;
    }

    if (window.__homeModalPlayer) {
      window.__homeModalPlayer.destroy?.().catch?.(() => null);
      window.__homeModalPlayer = null;
    }

    let bgPlayer = null;
    const bgVideoEl = container.querySelector("#videoLoad") || document.getElementById(
      "videoLoad");

    if (bgVideoEl) {
      const bgId = bgVideoEl.getAttribute("data-video");
      if (bgId) {
        let bgDiv;

        if (bgVideoEl.tagName.toLowerCase() === "div") {
          bgDiv = bgVideoEl;
          bgDiv.innerHTML = "";
        } else {
          bgDiv = document.createElement("div");
          bgDiv.id = bgVideoEl.id;
          bgDiv.className = bgVideoEl.className;
          bgDiv.style.cssText = "width:100%;height:100%;position:absolute;top:0;left:0;";
          bgDiv.setAttribute("data-video", bgId);
          bgVideoEl.parentNode.replaceChild(bgDiv, bgVideoEl);
        }

        bgPlayer = new Vimeo.Player(bgDiv, {
          id: bgId,
          autoplay: true,
          loop: true,
          muted: true,
          background: true,
          autopause: false
        });
      }
    }

    let modalPlayer = null;
    let stableWrapper = null;
    let videoId = null;

    const modalVideoEl = container.querySelector("#video") || document.getElementById("video");
    if (modalVideoEl) {
      videoId = modalVideoEl.getAttribute("data-video");

      stableWrapper = document.createElement("div");
      stableWrapper.id = modalVideoEl.id;
      stableWrapper.className = modalVideoEl.className;
      stableWrapper.style.cssText = "width:100%;height:100%;";
      if (videoId) stableWrapper.setAttribute("data-video", videoId);

      modalVideoEl.parentNode.replaceChild(stableWrapper, modalVideoEl);
    }

    let openBtns = Array.from(container.querySelectorAll('[fs-modal-element="open"]'));
    let closeBtns = Array.from(container.querySelectorAll('[fs-modal-element="close"]'));

    if (!openBtns.length) openBtns = Array.from(document.querySelectorAll(
      '[fs-modal-element="open"]'));
    if (!closeBtns.length) closeBtns = Array.from(document.querySelectorAll(
      '[fs-modal-element="close"]'));

    const openSubs = [];
    const closeSubs = [];

    openBtns.forEach((btn) => {
      const onOpen = () => {
        if (window.__homeModalPlayer) {
          modalPlayer = window.__homeModalPlayer;
          modalPlayer.play?.().catch?.(() => null);
          return;
        }

        if (!modalPlayer && stableWrapper && videoId) {
          modalPlayer = new Vimeo.Player(stableWrapper, {
            id: videoId,
            autoplay: true,
            loop: true,
            controls: false,
            muted: false,
            autopause: false
          });

          window.__homeModalPlayer = modalPlayer;

          modalPlayer
            .ready()
            .then(() => modalPlayer.setVolume(1))
            .catch(() => {});
        }
      };

      btn.addEventListener("click", onOpen);
      openSubs.push([btn, onOpen]);
    });

    closeBtns.forEach((btn) => {
      const onClose = () => {
        if (!modalPlayer) return;

        modalPlayer
          .pause()
          .catch(() => null);
      };

      btn.addEventListener("click", onClose);
      closeSubs.push([btn, onClose]);
    });

    APP.standaloneVideoCleanup = () => {
      openSubs.forEach(([btn, fn]) => btn.removeEventListener("click", fn));
      closeSubs.forEach(([btn, fn]) => btn.removeEventListener("click", fn));

      if (modalPlayer) {
        modalPlayer.destroy().catch(() => null);
        modalPlayer = null;
      }

      if (window.__homeModalPlayer) {
        window.__homeModalPlayer.destroy?.().catch?.(() => null);
        window.__homeModalPlayer = null;
      }

      if (bgPlayer) {
        bgPlayer.destroy().catch(() => null);
        bgPlayer = null;
      }
    };

    registerCleanup(APP.standaloneVideoCleanup);
  }

  function rebindHomeInteractiveUI(container, source = "home-final") {
    if (APP.standaloneVideoCleanup) {
      try {
        APP.standaloneVideoCleanup();
      } catch (_) {}
      APP.standaloneVideoCleanup = null;
    }

    initStandaloneVideos(container, "home");
    dlog(`${source}:videos:init`);

    requestAnimationFrame(() => {
      if (!document.body.contains(container)) return;
      initTabHoverAnimation(container);
      dlog(`${source}:tabs-hover:init`);
      resetUnderlineHoverStates(container);
    });
  }

  async function finalizeHomeInteractiveUI(token, container, source = "home-final") {
    if (isStale(token)) return false;

    dlog(`${source}:ui:start`);

    await runVisibleWebflowUIPass(token, `${source}:ui`);
    if (isStale(token)) return false;

    await wait(50);
    if (isStale(token)) return false;

    rebindHomeInteractiveUI(container, source);

    await wait(40);
    if (isStale(token)) return false;

    inspectHome(container, `${source}:inspect`);

    return !isStale(token);
  }

  function runHeroAnimation(scope = document) {
    const root = scope.querySelector(".hero-animate");
    if (!root) return null;

    if (window.__homeHeroMM) {
      try {
        window.__homeHeroMM.revert();
      } catch (_) {}
      window.__homeHeroMM = null;
    }

    if (window.__homeHeroTL) {
      try {
        window.__homeHeroTL.kill();
      } catch (_) {}
      window.__homeHeroTL = null;
    }

    const containers = root.querySelectorAll(".crisp-loader");
    const navItems = document.querySelectorAll("[data-load-items=nav-item]");
    const nav = document.querySelector(".nav");

    const config = {
      startDelay: 0.075,
      loaderStagger: 0.2,
      duration: 0.5,
      overlap: 0.1,
      ease: "power2.in",
      tabletGap: 10
    };

    if (nav) gsap.set(nav, { yPercent: -100, y: 0, autoAlpha: 0 });
    if (navItems.length) gsap.set(navItems, { autoAlpha: 0, y: -10 });

    const mm = gsap.matchMedia();
    window.__homeHeroMM = mm;

    mm.add(
      {
        isDesktop: "(min-width: 992px)",
        isTablet: "(min-width: 768px) and (max-width: 991px)",
        isMobile: "(max-width: 767px)"
      },
      (context) => {
        const { isDesktop, isTablet, isMobile } = context.conditions;
        const masterTl = gsap.timeline();
        window.__homeHeroTL = masterTl;

        let tabletInitialRects = [];

        if (isTablet && containers.length) {
          const parent = containers[0].parentNode;
          const parentRect = parent.getBoundingClientRect();

          tabletInitialRects = Array.from(containers).map((c) => {
            const r = c.getBoundingClientRect();
            return {
              width: r.width,
              height: r.height,
              left: r.left - parentRect.left,
              top: r.top - parentRect.top
            };
          });

          gsap.set(parent, { position: "relative", height: parentRect.height });

          containers.forEach((c, i) => {
            gsap.set(c, {
              position: "absolute",
              top: tabletInitialRects[i].top,
              left: tabletInitialRects[i].left,
              width: tabletInitialRects[i].width,
              height: tabletInitialRects[i].height,
              margin: 0
            });
          });
        }

        if (isMobile && containers.length) {
          gsap.set(containers[0].parentNode, {
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            alignContent: "center",
            minHeight: "100svh",
            gap: "0rem",
            paddingTop: "0rem"
          });

          gsap.set(containers, { width: "100%", height: "33.333svh" });
        }

        containers.forEach((container, index) => {
          const items = container.querySelectorAll(".crisp-loader__single");
          const total = items.length;
          if (!total) return;

          const columnTl = gsap.timeline({ defaults: { ease: config.ease } });
          gsap.set(items, { zIndex: (i) => total - i });

          items.forEach((item, i) => {
            const t = i * (config.duration - config.overlap);

            columnTl.to({}, { duration: config.duration }, t);

            const imgs = item.querySelectorAll("img");
            if (imgs.length) {
              columnTl.to(
                imgs,
                {
                  delay: 0.1,
                  opacity: 0,
                  duration: config.duration * 0.075
                },
                t
              );
            }
          });

          if (isDesktop) {
            const containerRect = container.getBoundingClientRect();
            const deltaY = window.innerHeight - containerRect.bottom - 40;

            columnTl.to(
              container,
              {
                y: `+=${deltaY}`,
                duration: 0.75,
                ease: "power3.out"
              },
              "<"
            );
          } else if (isTablet) {
            const parent = container.parentNode;
            const parentWidth = parent.getBoundingClientRect().width;
            const padding = 16;
            const cardWidth =
              (parentWidth - padding * 2 - config.tabletGap * (containers.length - 1)) /
              containers.length;
            const targetLeft = padding + index * (cardWidth + config.tabletGap);
            const targetTop = tabletInitialRects[Math.floor(containers.length / 2)].top;

            columnTl.to(
              container,
              {
                left: targetLeft,
                top: targetTop,
                width: cardWidth,
                height: cardWidth,
                duration: 0.75,
                ease: "power3.out"
              },
              "<"
            );
          } else {
            columnTl.to(
              container,
              {
                x: 0,
                y: 0,
                duration: 0.75,
                ease: "power3.out"
              },
              "<"
            );
          }

          masterTl.add(columnTl, config.startDelay + index * config.loaderStagger);
        });

        masterTl.addLabel("syncReveal", "-=0.4");

        if (isMobile && containers.length) {
          masterTl.to(
            containers[0].parentNode,
            {
              gap: "0.625rem",
              paddingTop: "5rem",
              duration: 0.75,
              ease: "power3.inOut"
            },
            "syncReveal"
          );

          masterTl.to(
            containers,
            {
              width: "42vw",
              height: "42vw",
              duration: 0.75,
              ease: "power3.inOut"
            },
            "syncReveal"
          );
        }

        containers.forEach((container) => {
          const heroInner = container.querySelector(".hero__inner");
          const heroBg = container.querySelector(".hero_img-reveal");
          const overlay = heroBg?.querySelector(".img-component_bg-overlay");

          if (heroInner) {
            masterTl.to(
              heroInner,
              {
                opacity: 1,
                y: "0rem",
                duration: 0.5,
                ease: "power3.out",
                immediateRender: false
              },
              "syncReveal+=0.1"
            );
          }

          if (heroBg) {
            masterTl.to(
              heroBg,
              {
                scale: isMobile ? 1 : 1.1,
                opacity: 1,
                duration: 0.5,
                ease: "power3.inOut",
                immediateRender: false
              },
              "syncReveal"
            );
          }

          if (overlay) {
            masterTl.to(
              overlay,
              {
                opacity: 1,
                duration: 0.5,
                ease: "power3.inOut",
                immediateRender: false
              },
              "syncReveal"
            );
          }
        });

        if (nav) {
          masterTl.to(
            nav,
            {
              yPercent: 0,
              y: 0,
              autoAlpha: 1,
              duration: 0.75,
              ease: "power3.out",
              onComplete: () => {
                gsap.set(nav, { clearProps: "y,yPercent" });
                APP.heroAnimating = false;
                if (typeof window.__resetNavScrollHide === "function") {
                  window.__resetNavScrollHide();
                }
              }
            },
            "syncReveal"
          );
        } else {
          masterTl.call(
            () => {
              APP.heroAnimating = false;
            },
            [],
            "syncReveal+=0.75"
          );
        }

        if (navItems.length) {
          masterTl.to(
            navItems,
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.5,
              stagger: { from: "center", amount: 0.3 },
              ease: "power2.out"
            },
            "syncReveal+=0.2"
          );
        }

        return () => {
          masterTl.kill();
          gsap.set(containers, { clearProps: "transform,opacity,willChange" });

          if (containers.length) {
            gsap.set(containers[0].parentNode, {
              clearProps: "display,flexWrap,justifyContent,alignContent,minHeight,gap,paddingTop,height,position"
            });
          }

          if (nav) gsap.set(nav, { clearProps: "transform,opacity,visibility,y,yPercent" });
          if (navItems.length) gsap.set(
            navItems, { clearProps: "transform,opacity,visibility" });
        };
      }
    );

    return mm;
  }

  function resetHomeHeroState(container) {
    const root = container.querySelector("[data-hero]");
    if (!root) return;

    const nav = document.querySelector(".nav");
    const targets = root.querySelectorAll(
      ".hero__inner, .hero_img-reveal, .img-component_bg-overlay, .crisp-loader__single, .crisp-loader__cover-img"
    );

    if (typeof ScrollTrigger !== "undefined") {
      ScrollTrigger.getAll().forEach((st) => {
        const id = String(st.vars?.id || "");
        if (id.startsWith("hero-") || id.startsWith("home-hero")) st.kill();
      });
    }

    gsap.killTweensOf([nav, ...targets]);
    gsap.set(targets, {
      clearProps: "x,y,xPercent,yPercent,scale,scaleX,scaleY,rotation,skewX,skewY,opacity,filter,clipPath,willChange"
    });

    if (nav) gsap.set(nav, { autoAlpha: 0, y: 0, yPercent: -100 });
  }

  async function waitForHomeHeroCompletion(token, timeout = 2600) {
    const start = performance.now();

    while (APP.heroAnimating && performance.now() - start < timeout) {
      if (isStale(token)) return false;
      await wait(50);
    }

    return !isStale(token);
  }

  function killHomeHeroArtifacts() {
    if (typeof ScrollTrigger !== "undefined") {
      ScrollTrigger.getAll().forEach((st) => {
        const id = String(st.vars?.id || "");
        if (id.startsWith("hero-") || id.startsWith("home-hero")) st.kill();
      });
    }

    const heroEls = document.querySelectorAll(".hero, [data-hero], [data-hero-item]");
    gsap.killTweensOf(heroEls);
    gsap.set(heroEls, { clearProps: "transform,opacity,filter,clipPath,willChange" });
  }

  async function playHomeHeroSafe(container, token) {
    if (isStale(token)) return;
    if (APP.heroAnimating) return;
    if (APP.homeHeroRunToken === token) return;

    let tries = 0;
    while (tries < 8 && window.scrollY > 2) {
      window.scrollTo(0, 0);
      lenis?.scrollTo?.(0, { immediate: true });
      await wait(40);
      tries += 1;
    }

    await waitForLayout();
    if (isStale(token)) return;

    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    );

    if (isStale(token)) return;

    killHomeHeroArtifacts();
    resetHomeHeroState(container);

    APP.heroAnimating = true;
    APP.homeHeroRunToken = token;

    runHeroAnimation(container);

    const completed = await waitForHomeHeroCompletion(token, 2600);
    if (!completed || isStale(token)) return;

    await wait(40);
  }

  function initProjectsPageEnhancements(container, { isFirstLoad = false } = {}) {
    const timers = [];
    let active = true;

    const queue = (fn, delay = 0) => {
      const id = setTimeout(() => {
        if (!active) return;
        fn();
      }, delay);
      timers.push(id);
      return id;
    };

    const setPaneItemsInactive = (pane) => {
      const items = pane.querySelectorAll(".filters__item");
      if (!items.length) return;
      gsap.killTweensOf(items);
      gsap.set(items, { autoAlpha: 0, x: -14 });
    };

    const showPaneItemsImmediately = (pane) => {
      const items = pane.querySelectorAll(".filters__item");
      if (!items.length) return;
      gsap.killTweensOf(items);
      gsap.set(items, { autoAlpha: 1, x: 0, clearProps: "transform,opacity,visibility" });
    };

    const animatePaneItems = (pane) => {
      const items = pane.querySelectorAll(".filters__item");
      if (!items.length) return;

      gsap.killTweensOf(items);

      gsap.fromTo(
        items,
        {
          autoAlpha: 0,
          x: -14
        },
        {
          autoAlpha: 1,
          x: 0,
          duration: 0.45,
          ease: "power2.out",
          stagger: 0.03,
          overwrite: "auto",
          clearProps: "transform,opacity,visibility"
        }
      );
    };

    const scrollToListAnchor = (attempt = 0) => {
      const anchor = queryOne(container, '[fs-list-element="scroll-anchor"]', true);
      if (!anchor) return;

      const doScroll = () => {
        if (lenis?.scrollTo) {
          lenis.scrollTo(anchor, {
            offset: 0,
            duration: 0.8,
            immediate: false
          });
        } else {
          const top = anchor.getBoundingClientRect().top + window.pageYOffset;
          window.scrollTo({ top, behavior: "smooth" });
        }
      };

      if (lenis?.isStopped && attempt < 12) {
        queue(() => scrollToListAnchor(attempt + 1), 60);
        return;
      }

      requestAnimationFrame(() => requestAnimationFrame(doScroll));
    };

    const openTabFromQuery = () => {
      const params = new URLSearchParams(window.location.search);
      const tabName = params.get("tab");
      if (!tabName) return;

      const safeTabName = window.CSS?.escape ? CSS.escape(tabName) : tabName;
      const tabButton = queryOne(container, `[data-w-tab="${safeTabName}"]`, true);
      if (!tabButton) return;

      if (!tabButton.classList.contains("w--current")) {
        tabButton.click();
      }

      queue(() => {
        const activePane = queryOne(container, ".w-tab-pane.w--tab-active", true);
        if (activePane) animatePaneItems(activePane);
        refreshIXOnly();
        ScrollTrigger?.refresh?.(true);
      }, 100);

      queue(() => scrollToListAnchor(), 140);
    };

    const tabPanes = queryAll(container, ".w-tab-pane", true);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        const pane = mutation.target;
        if (!(pane instanceof HTMLElement)) return;

        if (pane.classList.contains("w--tab-active")) {
          queue(() => {
            animatePaneItems(pane);
            refreshIXOnly();
            ScrollTrigger?.refresh?.(true);
          }, 20);
        } else {
          setPaneItemsInactive(pane);
        }
      });
    });

    tabPanes.forEach((pane) => {
      observer.observe(pane, { attributes: true, attributeFilter: ["class"] });

      if (pane.classList.contains("w--tab-active")) {
        if (isFirstLoad) showPaneItemsImmediately(pane);
        else animatePaneItems(pane);
      } else {
        setPaneItemsInactive(pane);
      }
    });

    const searchCloseBtn = queryOne(container, "#searchClose", true);
    const searchInput = queryOne(container, "#Search", true);
    let onSearchClear = null;

    if (searchCloseBtn && searchInput) {
      onSearchClear = () => {
        searchInput.value = "";
        searchInput.placeholder = "Search";
        searchInput.dispatchEvent(new Event("input", { bubbles: true }));
      };

      searchCloseBtn.addEventListener("click", onSearchClear);
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        openTabFromQuery();

        const activePane = queryOne(container, ".w-tab-pane.w--tab-active", true);
        if (activePane) {
          if (isFirstLoad) showPaneItemsImmediately(activePane);
          else animatePaneItems(activePane);
        }

        queue(() => {
          refreshIXOnly();
          ScrollTrigger?.refresh?.(true);
        }, 80);
      });
    });

    registerCleanup(() => {
      active = false;
      observer.disconnect();
      timers.forEach(clearTimeout);
      if (onSearchClear) searchCloseBtn.removeEventListener("click", onSearchClear);
    });
  }

  function initProjectDetailPage(container) {
    let active = true;

    function buildPrevNext() {
      const sourceRoot =
        document.querySelector("[r-prevnext-source]") ||
        document.querySelector("[np-articles-source]");

      if (!sourceRoot) return;

      const currentEl = sourceRoot.querySelector(".w--current");
      if (!currentEl) return;

      const links = Array.from(sourceRoot.querySelectorAll("a[href]"));
      if (!links.length) return;

      const currentLink =
        (currentEl.matches?.("a") ? currentEl : currentEl.closest?.("a")) ||
        currentEl.querySelector?.("a");

      if (!currentLink) return;

      const currentIndex = links.indexOf(currentLink);
      if (currentIndex < 0) return;

      const prevLink = links[(currentIndex - 1 + links.length) % links.length];
      const nextLink = links[(currentIndex + 1) % links.length];

      const getData = (link) => ({
        href: link?.getAttribute("href") || "",
        title: link?.innerText?.trim() || "",
        imgSrc: link?.querySelector("img")?.getAttribute("src") || ""
      });

      const prev = getData(prevLink);
      const next = getData(nextLink);

      const mappings = [
      {
        selector: "[r-prevnext-next-btn], [np-articles-next-btn]",
        attr: "href",
        value: next.href
      },
      {
        selector: "[r-prevnext-next-text], [np-articles-next-text]",
        attr: "text",
        value: next.title
      },
      {
        selector: "[r-prevnext-prev-btn], [np-articles-prev-btn]",
        attr: "href",
        value: prev.href
      },
      {
        selector: "[r-prevnext-prev-text], [np-articles-prev-text]",
        attr: "text",
        value: prev.title
      },
      {
        selector: "[r-prevnext-prev-img], [np-articles-prev-img]",
        attr: "src",
        value: prev.imgSrc
      },
      {
        selector: "[r-prevnext-next-img], [np-articles-next-img]",
        attr: "src",
        value: next.imgSrc
      }];

      mappings.forEach((item) => {
        if (!item.value) return;
        const el = document.querySelector(item.selector);
        if (!el) return;

        if (item.attr === "text") el.innerText = item.value;
        else el.setAttribute(item.attr, item.value);
      });
    }

    function processPageData() {
      const removeElements = container.querySelectorAll(".row.w-condition-invisible");
      removeElements.forEach((el) => el.remove());

      const orderElements = container.querySelectorAll('[data-set="order"]');
      orderElements.forEach((el, index) => {
        const orderNumber = String(index + 1).padStart(2, "0");
        el.textContent = `[${orderNumber}]`;
      });
    }

    function updateLinks() {
      const links = container.querySelectorAll('[data-filter="link"]');

      links.forEach((link) => {
        if (!(link instanceof HTMLAnchorElement)) return;

        const name = link.textContent?.trim();
        const type = link.getAttribute("fs-list-field");
        const href = link.getAttribute("href");

        if (!name || !href || !type) return;

        const url = new URL(href, window.location.origin);
        const paramName = `efbeab1a_${type}_equal`;

        url.searchParams.set(paramName, name);
        url.searchParams.set("tab", type);

        link.setAttribute("href", `${url.pathname}${url.search}${url.hash}`);
      });
    }

    function fitTextToContainer() {
      if (!active) return;

      const containerEl = queryOne(container, ".container.is-inline");
      const textEl = queryOne(container, ".h1_display-project");

      if (!containerEl || !textEl) return;

      const containerWidth = containerEl.offsetWidth;
      if (!containerWidth) return;

      if (!textEl.dataset.originalFontSize) {
        textEl.dataset.originalFontSize = String(parseFloat(getComputedStyle(textEl).fontSize));
      }

      const originalFontSize = parseFloat(textEl.dataset.originalFontSize || "16");

      const measurer = textEl.cloneNode(true);
      measurer.style.position = "absolute";
      measurer.style.visibility = "hidden";
      measurer.style.pointerEvents = "none";
      measurer.style.whiteSpace = "nowrap";
      measurer.style.width = "auto";
      measurer.style.left = "-9999px";
      measurer.style.top = "-9999px";
      measurer.style.fontSize = `${originalFontSize}px`;

      document.body.appendChild(measurer);

      let fontSize = originalFontSize;
      while (measurer.offsetWidth > containerWidth && fontSize > 8) {
        fontSize -= 1;
        measurer.style.fontSize = `${fontSize}px`;
      }

      document.body.removeChild(measurer);

      gsap.to(textEl, {
        fontSize: `${fontSize}px`,
        duration: 0.4,
        ease: "power2.out",
        overwrite: "auto"
      });
    }

    const onResize = debounce(() => fitTextToContainer(), 120);
    window.addEventListener("resize", onResize);

    processPageData();
    updateLinks();
    buildPrevNext();

    requestAnimationFrame(() => requestAnimationFrame(() => fitTextToContainer()));
    document.fonts?.ready?.then?.(() => {
      if (!active) return;
      fitTextToContainer();
    });

    registerCleanup(() => {
      active = false;
      window.removeEventListener("resize", onResize);
    });
  }

  function initZineDetailPage(container) {
    const categoryElements = container.querySelectorAll("[data-category]");
    if (!categoryElements.length) return;

    categoryElements.forEach((categoryEl) => {
      const categoryValue = (categoryEl.getAttribute("data-category") || "").trim()
        .toLowerCase();
      if (!categoryValue) return;

      const zineButtons = Array.from(document.querySelectorAll(".zine_btn")).filter(
        (btn) => !btn.closest(".hide")
      );

      zineButtons.forEach((button) => {
        const buttonText = button.querySelector("div")?.textContent?.trim()
          .toLowerCase() || "";

        if (buttonText === categoryValue) button.classList.add("w--current");
        else button.classList.remove("w--current");
      });
    });
  }

  function initZinePage(container) {
    const scrollToAnchor = () => {
      const anchor = queryOne(container, "[fs-list-element='scroll-anchor']", true);
      if (!anchor) return;

      if (lenis?.scrollTo) {
        lenis.scrollTo(anchor, {
          offset: 0,
          duration: 0.8,
          immediate: false
        });
      } else {
        anchor.scrollIntoView({ behavior: "smooth" });
      }
    };

    const onBodyClick = (e) => {
      const nextTrigger = e.target.closest('[data-pagination="next"]');
      const prevTrigger = e.target.closest('[data-pagination="prev"]');

      if (nextTrigger) {
        e.preventDefault();

        const nextTarget = queryOne(container, "[data-pagination-next]", true);
        if (nextTarget) nextTarget.click();

        const nextBtn = queryOne(container, '[data-pagination="next"]', true);
        const prevBtn = queryOne(container, '[data-pagination="prev"]', true);

        nextBtn?.querySelector(".zine_arrow-svg")?.classList.add("is-active");
        prevBtn?.querySelector(".zine_arrow-svg")?.classList.remove("is-active");
      }

      if (prevTrigger) {
        e.preventDefault();

        const prevTarget = queryOne(container, "[data-pagination-prev]", true);
        if (prevTarget) prevTarget.click();

        const nextBtn = queryOne(container, '[data-pagination="next"]', true);
        const prevBtn = queryOne(container, '[data-pagination="prev"]', true);

        nextBtn?.querySelector(".zine_arrow-svg")?.classList.remove("is-active");
        prevBtn?.querySelector(".zine_arrow-svg")?.classList.add("is-active");
      }
    };

    document.body.addEventListener("click", onBodyClick);

    function bindTabShortcut(triggerSelector, tabValue) {
      const trigger = queryOne(container, triggerSelector, true);
      if (!trigger) return;

      const handler = () => {
        const tabBtn = queryOne(container, `[data-w-tab="${tabValue}"]`, true);
        if (!tabBtn) return;

        tabBtn.click();
        setTimeout(() => scrollToAnchor(), 100);
      };

      trigger.addEventListener("click", handler);
      registerCleanup(() => trigger.removeEventListener("click", handler));
    }

    bindTabShortcut('[data="anatomy"]', "anatomy of an event");
    bindTabShortcut('[data="head"]', "head to head");
    bindTabShortcut('[data="luxury"]', "luxury in numbers");

    const talkSource = queryOne(container, "[data-move-talk]", true);
    const talkDestination = queryOne(container, "[data-talk]", true);

    if (talkSource && talkDestination && !talkDestination.contains(talkSource)) {
      talkDestination.appendChild(talkSource);
    }

    registerCleanup(() => {
      document.body.removeEventListener("click", onBodyClick);
    });
  }

  function mountGlobals(container, namespace) {
    const fixedNav = getFixedNavState(namespace, container);

    if (fixedNav) {
      clearThemeScrollCleanup();
      applyNavState(fixedNav);
    } else {
      resetGlobalNavTheme(container);
      initCheckSectionThemeScroll(container);
    }

    initCurrentYear(container);
    prepLoadReveal(container);
    initRevealOnScroll(container);
  }

  async function mountNamespace(namespace, container, token, { isFirstLoad = false } = {}) {
    const ns = String(namespace || "").toLowerCase();

    switch (ns) {
    case "home": {
      dlog("home:mount:start", { isFirstLoad, token });
      inspectHome(container, "home:pre-ui");

      await runVisibleWebflowPass({ withIX: true });
      if (isStale(token)) return;

      await waitForLayout();
      if (isStale(token)) return;

      window.scrollTo(0, 0);
      lenis?.scrollTo?.(0, { immediate: true });

      dlog("home:hero:start");
      await playHomeHeroSafe(container, token);
      if (isStale(token)) return;
      dlog("home:hero:done");

      await finalizeHomeInteractiveUI(
        token,
        container,
        isFirstLoad ? "home:first-load-final" : "home:enter-final"
      );
      if (isStale(token)) return;

      refreshIXOnly();

      requestAnimationFrame(() => {
        if (isStale(token)) return;

        playNavAndRevealIntro(container, {
          isFirstLoad,
          includeNav: false,
          excludeSelector: ".hero-animate, [data-hero]"
        });

        initHorizontalScrolling(container);
        ScrollTrigger?.refresh?.(true);
      });

      break;
    }

    case "project":
    case "projects": {
      await forceWebflowRestartSafe(token, "projects-pre-finsweet", {
        includeReadystatechange: true,
        includeLoad: true,
        includeResize: true,
        secondPass: true
      });
      if (isStale(token)) return;

      await waitForLayout();
      if (isStale(token)) return;

      await reinitFinsweetAttributesSafe(token);
      if (isStale(token)) return;

      await waitForLayout();
      if (isStale(token)) return;

      initHorizontalScrolling(container);
      initProjectsPageEnhancements(container, { isFirstLoad });

      requestAnimationFrame(() => {
        refreshIXOnly();
        ScrollTrigger?.refresh?.(true);
      });

      break;
    }

    case "about": {
      await forceWebflowRestartSafe(token, "about", {
        includeReadystatechange: true,
        includeLoad: true,
        includeResize: true,
        secondPass: true
      });
      if (isStale(token)) return;
      break;
    }

    case "project-detail":
    case "project_detail": {
      applyNavState({ theme: "light", bg: "none", blur: false });

      await forceWebflowRestartSafe(token, "project-detail", {
        includeReadystatechange: false,
        includeLoad: false,
        includeResize: true,
        secondPass: true
      });
      if (isStale(token)) return;

      await waitForLayout();
      if (isStale(token)) return;

      applyNavState({ theme: "light", bg: "none", blur: false });
      initStandaloneVideos(container, "project-detail");
      initProjectDetailPage(container);
      initSlideInAnimations(container);
      initScrollAnimations(container);

      requestAnimationFrame(() => {
        applyNavState({ theme: "light", bg: "none", blur: false });
        refreshIXOnly();
        ScrollTrigger?.refresh?.(true);
      });

      break;
    }

    case "zine-detail":
    case "zine_detail": {
      await forceWebflowRestartSafe(token, "zine-detail", {
        includeReadystatechange: false,
        includeLoad: false,
        includeResize: true,
        secondPass: true
      });
      if (isStale(token)) return;

      await waitForLayout();
      if (isStale(token)) return;

      initZineDetailPage(container);

      requestAnimationFrame(() => {
        refreshIXOnly();
        ScrollTrigger?.refresh?.(true);
      });

      break;
    }

    case "zine": {
      await forceWebflowRestartSafe(token, "zine", {
        includeReadystatechange: false,
        includeLoad: false,
        includeResize: true,
        secondPass: true
      });
      if (isStale(token)) return;

      await waitForLayout();
      if (isStale(token)) return;

      initZinePage(container);

      requestAnimationFrame(() => {
        refreshIXOnly();
        ScrollTrigger?.refresh?.(true);
      });

      break;
    }

    default: {
      await forceWebflowRestartSafe(token, ns || "default", {
        includeReadystatechange: false,
        includeLoad: false,
        includeResize: true,
        secondPass: true
      });
      if (isStale(token)) return;
      break;
    }
    }

    if (!isHomeNS(ns)) {
      const nav = document.querySelector(".nav");
      if (nav) {
        gsap.set(nav, { clearProps: "transform,y,yPercent,opacity,visibility" });
        gsap.set(nav, { autoAlpha: 1 });
      }
    }
  }

  function initDetectScrollingDirectionGlobalOnce() {
    if (window.__scrollDirInit) return;
    window.__scrollDirInit = true;

    let lastScrollTop = 0;
    const threshold = 10;
    const thresholdTop = 50;
    let ticking = false;

    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;

        requestAnimationFrame(() => {
          const y = window.scrollY;

          if (y <= 0) {
            window.scrollDirection = "up";

            document.querySelectorAll("[data-scrolling-direction]").forEach((el) =>
              el.setAttribute("data-scrolling-direction", "up")
            );

            document.querySelectorAll("[data-scrolling-started]").forEach((el) =>
              el.setAttribute("data-scrolling-started", "false")
            );

            lastScrollTop = y;
            ticking = false;
            return;
          }

          if (Math.abs(lastScrollTop - y) >= threshold) {
            const dir = y > lastScrollTop ? "down" : "up";

            if (window.scrollDirection !== dir) {
              window.scrollDirection = dir;
              document.querySelectorAll("[data-scrolling-direction]").forEach((el) =>
                el.setAttribute("data-scrolling-direction", dir)
              );
            }

            document.querySelectorAll("[data-scrolling-started]").forEach((el) =>
              el.setAttribute("data-scrolling-started", y > thresholdTop ? "true" :
                "false")
            );

            lastScrollTop = y;
          }

          ticking = false;
        });
      }, { passive: true }
    );
  }

  function initNavScrollHideGlobal() {
    if (window.__navScrollHideInit) return;
    window.__navScrollHideInit = true;

    const nav = document.querySelector(".nav");
    if (!nav) return;

    let lastScrollY = window.scrollY;
    let isHidden = false;
    let ticking = false;
    const HIDE_AFTER_PX = 80;
    const MIN_DELTA = 6;

    function showNav() {
      if (!isHidden) return;
      isHidden = false;
      gsap.to(nav, {
        yPercent: 0,
        y: 0,
        duration: 0.45,
        ease: "power3.out",
        overwrite: "auto"
      });
    }

    function hideNav() {
      if (isHidden || APP.heroAnimating || nav.classList.contains("is-open")) return;
      isHidden = true;
      gsap.to(nav, {
        yPercent: -110,
        duration: 0.3,
        ease: "power2.inOut",
        overwrite: "auto"
      });
    }

    window.__resetNavScrollHide = () => {
      isHidden = false;
      lastScrollY = window.scrollY;
    };

    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;

        requestAnimationFrame(() => {
          const y = window.scrollY;
          const diff = y - lastScrollY;

          if (y <= 0) {
            showNav();
            lastScrollY = y;
            ticking = false;
            return;
          }

          if (Math.abs(diff) >= MIN_DELTA) {
            if (diff > 0 && y > HIDE_AFTER_PX) hideNav();
            else if (diff < 0) showNav();

            lastScrollY = y;
          }

          ticking = false;
        });
      }, { passive: true }
    );
  }

  function initMobileNavGlobal() {
    if (APP.mobileNavCleanup) return;

    const mm = gsap.matchMedia();

    const detach = mm.add("(max-width: 991px)", () => {
      const navEl = document.querySelector(".nav");
      const menuBtn = document.querySelector(".nav-menu_btn");
      const menuWrapper = document.querySelector(".nav-menu");
      const navLinks = navEl ? navEl.querySelectorAll(".nav-link") : [];
      const navBottom = document.querySelector(".nav__bottom");
      const navLogo = document.querySelector(".nav-logo_link");

      if (!menuBtn || !navEl || !menuWrapper || !navBottom) return;

      let isOpen = false;

      gsap.set(menuWrapper, { autoAlpha: 0, x: -16, pointerEvents: "none" });
      gsap.set(navLinks, { autoAlpha: 0, x: -14 });
      gsap.set(navBottom, { width: 0 });

      const menuTl = gsap.timeline({
        paused: true,
        defaults: { duration: 0.45, ease: "power2.out" },
        onStart: () => {
          navEl.classList.add("is-open");
          gsap.set(menuWrapper, { visibility: "visible", pointerEvents: "auto" });
          lenis?.stop();
        },
        onReverseComplete: () => {
          navEl.classList.remove("is-open");
          gsap.set(menuWrapper, { visibility: "hidden", pointerEvents: "none" });
          lenis?.start();
        }
      });

      menuTl
        .to(navBottom, { width: "100%", duration: 0.5 }, 0)
        .to(navLogo, { autoAlpha: 0.35, x: 8, duration: 0.25 }, 0)
        .to(menuWrapper, { autoAlpha: 1, x: 0, duration: 0.38 }, 0)
        .to(navLinks, { autoAlpha: 1, x: 0, stagger: 0.06, duration: 0.42 }, 0);

      const toggle = () => {
        isOpen = !isOpen;

        if (isOpen) {
          navEl.classList.add("is-open");
          menuBtn.classList.add("w--open");
          menuTl.timeScale(1).play();
        } else {
          menuBtn.classList.remove("w--open");
          menuTl.timeScale(1.15).reverse();
        }
      };

      menuBtn.addEventListener("click", toggle);

      window._closeMobileNav = () => {
        if (!isOpen) return false;
        isOpen = false;
        menuBtn.classList.remove("w--open");
        menuTl.timeScale(1.15).reverse();
        return true;
      };

      return () => {
        menuBtn.removeEventListener("click", toggle);
        menuTl.kill();
        gsap.set([menuWrapper, navLinks, navBottom, navLogo], { clearProps: "all" });
        navEl.classList.remove("is-open");
        menuBtn.classList.remove("w--open");
        window._closeMobileNav = null;
        lenis?.start();
      };
    });

    APP.mobileNavCleanup = () => {
      detach?.();
      mm.revert();
      APP.mobileNavCleanup = null;
    };
  }

  async function mountPage(data, { isFirstLoad = false } = {}) {
    const token = nextNavToken();
    const container = data.next.container;
    const namespace = data.next.namespace || "";

    APP.currentContainer = container;
    APP.activeMountToken = token;
    APP.homeHeroRunToken = null;

    if (isHomeNS(namespace)) {
      const nav = document.querySelector(".nav");
      if (nav) gsap.set(nav, { autoAlpha: 0 });
    }

    cleanupPageModules();
    updateWebflowPageId(data);

    await waitForLayout();
    if (isStale(token)) return;

    mountGlobals(container, namespace);
    if (isStale(token)) return;

    await mountNamespace(namespace, container, token, { isFirstLoad });
    if (isStale(token)) return;

    if (isFirstLoad) APP.initialLoadComplete = true;
  }

  function shouldBypassBarba(url = "", el = null) {
    try {
      if (!url) return true;
      if (el?.hasAttribute?.("download")) return true;
      if (el?.target === "_blank") return true;
      if (el?.hasAttribute?.("data-no-barba")) return true;

      const next = new URL(url, window.location.origin);
      const currentPath = window.location.pathname.replace(/\/$/, "") || "/";
      const nextPath = next.pathname.replace(/\/$/, "") || "/";

      const isExternal = next.origin !== window.location.origin;
      const isAnchorOnly = currentPath === nextPath && !!next.hash;
      const isSpecialLink = /^(mailto:|tel:|javascript:)/i.test(url);

      return isExternal || isAnchorOnly || isSpecialLink;
    } catch (_) {
      return false;
    }
  }

  function setupBarba() {
    if (typeof barba === "undefined") {
      warn("Barba missing");
      return;
    }

    barba.init({
      preventRunning: true,

      prevent: ({ href, el }) => shouldBypassBarba(href, el),

      transitions: [
      {
        name: "app-transition",

        async once(data) {
          const ns = String(data.next.namespace || "").toLowerCase();
          APP.initialNamespace = ns;

          if (isHomeNS(ns)) {
            dlog("home:beforeEnter");
            inspectHome(data.next.container, "home:beforeEnter:inspect");
          }

          if (isProjectDetailNS(ns)) {
            applyNavState({ theme: "light", bg: "none", blur: false });
          }

          await mountPage(data, { isFirstLoad: true });
          await waitForLayout();

          if (isProjectsNS(ns)) {
            await runVisibleWebflowPass({ withIX: true });
          } else if (ns === "about") {
            await runVisibleWebflowPass({ withIX: true });
          } else if (!isHomeNS(ns)) {
            refreshIXOnly();
          }

          if (!isHomeNS(ns)) {
            playNavAndRevealIntro(data.next.container, { isFirstLoad: true });
          }

          if (isProjectDetailNS(ns)) {
            applyNavState({ theme: "light", bg: "none", blur: false });
          }

          ScrollTrigger?.refresh?.(true);
          lenis?.resize?.();
          lenis?.start?.();
        },

        async leave(data) {
          if (typeof window._closeMobileNav === "function") {
            window._closeMobileNav();
          }

          lenis?.stop();

          const nextNs = String(data.next?.namespace || "").toLowerCase();
          const shouldDestroyWebflow = !isHomeNS(nextNs);

          const done = this.async();

          gsap.killTweensOf(data.current.container);
          gsap.to(data.current.container, {
            autoAlpha: 0,
            duration: 0.22,
            ease: "power2.out",
            onComplete: () => {
              if (shouldDestroyWebflow) {
                window.Webflow?.destroy?.();
              }
              done();
            }
          });
        },

        beforeEnter(data) {
          const ns = String(data.next.namespace || "").toLowerCase();
          gsap.set(data.next.container, { autoAlpha: 0 });

          if (isHomeNS(ns)) {
            dlog("home:beforeEnter");
            inspectHome(data.next.container, "home:beforeEnter:inspect");
          }

          if (isProjectDetailNS(ns)) {
            applyNavState({ theme: "light", bg: "none", blur: false });
          }
        },

        async enter(data) {
          const ns = String(data.next.namespace || "").toLowerCase();
          const isHome = isHomeNS(ns);

          if (isHome) {
            dlog("home:enter:start");
          }

          const isProjects = isProjectsNS(ns);
          const isProjectDetail = isProjectDetailNS(ns);
          const isAbout = ns === "about";

          window.scrollTo(0, 0);
          lenis?.scrollTo?.(0, { immediate: true });

          if (isProjectDetail) {
            applyNavState({ theme: "light", bg: "none", blur: false });
          }

          if (isHome) {
            gsap.set(data.next.container, {
              autoAlpha: 1,
              clearProps: "opacity,visibility"
            });

            const nav = document.querySelector(".nav");
            if (nav) gsap.set(nav, { autoAlpha: 0 });
          }

          await mountPage(data, { isFirstLoad: false });

          if (isHome) {
            inspectHome(data.next.container, "home:enter:after-mount");
          }

          if (!isHome) {
            await new Promise((resolve) => {
              gsap.to(data.next.container, {
                autoAlpha: 1,
                duration: 0.28,
                ease: "power2.out",
                clearProps: "opacity,visibility",
                onComplete: resolve
              });
            });
          }

          await waitForLayout();

          if (isProjects || isAbout) {
            await runVisibleWebflowPass({ withIX: true });
          } else if (!isHome) {
            refreshIXOnly();
          }

          if (isProjectDetail) {
            applyNavState({ theme: "light", bg: "none", blur: false });
          }

          ScrollTrigger?.refresh?.(true);
          lenis?.resize?.();
          lenis?.start?.();

          if (!isHome) {
            playNavAndRevealIntro(data.next.container, { isFirstLoad: false });
          }

          if (isProjectDetail) {
            requestAnimationFrame(() => {
              applyNavState({ theme: "light", bg: "none", blur: false });
            });
          }

          resetUnderlineHoverStates(data.next.container);

          requestAnimationFrame(() => {
            gsap.set(
              data.next.container.querySelectorAll(
                "[data-hover], [data-underline-link]"
              ), { clearProps: "transform,opacity,visibility,willChange" }
            );
            resetUnderlineHoverStates(data.next.container);
          });
        }
      }]
    });
  }

  function bindWindowLoadEnhancements() {
    if (APP.loadEnhancementsBound) return;
    APP.loadEnhancementsBound = true;

    let delayedHorizontalTimer = null;

    window.addEventListener("load", () => {
      if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh(true);

      const isInitialHome = APP.initialNamespace === "home";

      if (delayedHorizontalTimer) clearTimeout(delayedHorizontalTimer);
      delayedHorizontalTimer = setTimeout(() => {
        if (isInitialHome && APP.initialLoadComplete) return;
        initHorizontalScrolling(APP.currentContainer || document);
        if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh(true);
      }, 2000);

      if (!window._tabsResizeObserver) {
        const tabsSection = document.querySelector("[data-tabs]");
        if (tabsSection) {
          window._tabsResizeObserver = new ResizeObserver(
            debounce(() => {
              if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
            }, 100)
          );
          window._tabsResizeObserver.observe(tabsSection);
        }
      }

      if (!window._globalLayoutObserver) {
        window._globalLayoutObserver = new ResizeObserver(
          debounce(() => {
            if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
          }, 250)
        );
        window._globalLayoutObserver.observe(document.body);
      }
    });
  }

  function startApp() {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";

    document.body.addEventListener("click", (e) => {
      const link = e.target.closest("a");
      if (!link) return;

      if (link.classList.contains("w--current")) {
        e.preventDefault();
        return;
      }

      const currentUrl = (window.location.origin + window.location.pathname).replace(/\/$/,
        "");
      const linkUrl = link.href.split("#")[0].split("?")[0].replace(/\/$/, "");

      if (currentUrl === linkUrl) e.preventDefault();
    });

    const initialNS = document
      .querySelector("[data-barba='container']")
      ?.getAttribute("data-barba-namespace");

    APP.initialNamespace = String(initialNS || "").toLowerCase();

    if (APP.initialNamespace === "home") {
      const nav = document.querySelector(".nav");
      if (nav) gsap.set(nav, { autoAlpha: 0 });
    }

    initLenisGlobal();
    initDetectScrollingDirectionGlobalOnce();
    initNavScrollHideGlobal();
    initMobileNavGlobal();
    setupBarba();
    bindWindowLoadEnhancements();

    if (!window.__horizontalResizeBound) {
      window.__horizontalResizeBound = true;

      let lastW = window.innerWidth;

      window.addEventListener(
        "resize",
        debounce(() => {
          if (window.innerWidth === lastW) return;
          lastW = window.innerWidth;

          initHorizontalScrolling(APP.currentContainer || document);
          if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh(true);
        }, 180)
      );
    }
  }

  startApp();
})();
