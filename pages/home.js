(function () {

  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.pages = MBC.pages || {};

  async function mount(ctx) {
    var container = ctx.container;
    var cleanups = [];

    function wait(ms) {
      return new Promise(function (resolve) {
        setTimeout(resolve, ms);
      });
    }

    async function waitForHeroToSettle() {
      var start = performance.now();

      while (MBC.core.state.heroAnimating && performance.now() - start < 3200) {
        await wait(50);
      }
    }

    async function initVideosAfterHero() {
      if (!MBC.features.videos) return;

      if (!document.body.contains(container)) return;

      var videoCleanup = MBC.features.videos.initStandalone({
        container: container,
        includeBackground: false,
        includeModal: true
      });
      if (typeof videoCleanup === 'function') {
        cleanups.push(videoCleanup);
      }
    }

    async function finalizeHomeInteractiveUI() {
      await waitForHeroToSettle();

      if (!document.body.contains(container)) return;

      if (MBC.core.webflow && typeof MBC.core.webflow.refreshUI === 'function') {
        await MBC.core.webflow.refreshUI();
      } else if (MBC.core.webflow && typeof MBC.core.webflow.refreshIX === 'function') {
        MBC.core.webflow.refreshIX();
      }

      await wait(50);

      if (!document.body.contains(container)) return;

      await initVideosAfterHero();

      if (MBC.features.tabs) {
        var tabsCleanup = MBC.features.tabs.init(container);
        if (typeof tabsCleanup === 'function') {
          cleanups.push(tabsCleanup);
        }
      }

      if (MBC.features.loadAnimations && typeof MBC.features.loadAnimations.resetHoverStates === 'function') {
        MBC.features.loadAnimations.resetHoverStates(container);
      }

      if (MBC.features.finsweet) {
        await MBC.features.finsweet.init(container, { modules: ['modal'] });
      }
    }

    async function playPostHeroIntro() {
      await waitForHeroToSettle();

      if (!document.body.contains(container)) return;

      if (MBC.features.loadAnimations) {
        MBC.features.loadAnimations.playIntro(container, {
          isFirstLoad: !!ctx.isFirstLoad,
          includeNav: false,
          excludeSelector: '.hero-animate, [data-hero]'
        });
      }
    }

    // Set nav state
    if (MBC.features.nav) {
      MBC.features.nav.setState({ theme: 'dark', bg: 'none', blur: false });
    }

    // Scroll to top
    if (typeof window.scrollTo === 'function') {
      window.scrollTo(0, 0);
    }

    if (MBC.core.state.lenis && typeof MBC.core.state.lenis.scrollTo === 'function') {
      MBC.core.state.lenis.scrollTo(0, { immediate: true });
    }

    // Hero animation
    if (MBC.features.hero) {
      var heroCleanup = MBC.features.hero.init(container);
      if (typeof heroCleanup === 'function') {
        cleanups.push(heroCleanup);
      }
    }

    // Custom tabs
    if (MBC.features.tabs) {
      var tabsCleanup = MBC.features.tabs.init(container);
      if (typeof tabsCleanup === 'function') {
        cleanups.push(tabsCleanup);
      }
    }

    // Horizontal scroll section (used on home too)
    if (MBC.features.horizontalScroll) {
      var hsCleanup = MBC.features.horizontalScroll.init(container);
      if (typeof hsCleanup === 'function') {
        cleanups.push(hsCleanup);
      }
    }

    if (MBC.features.videos && typeof MBC.features.videos.initBackground === 'function') {
      var backgroundVideoCleanup = MBC.features.videos.initBackground(container);
      if (typeof backgroundVideoCleanup === 'function') {
        cleanups.push(backgroundVideoCleanup);
      }
    }

    // Finsweet components
    if (MBC.features.finsweet) {
      await MBC.features.finsweet.init(container, { modules: ['modal'] });
    }

    finalizeHomeInteractiveUI();
    playPostHeroIntro();

    return function cleanup() {
      cleanups.forEach(function (fn) {
        if (typeof fn === 'function') {
          try { fn(); } catch (_) {}
        }
      });
    };
  }

  function unmount() {
    MBC.core.state.heroAnimating = false;
  }

  var moduleDef = {
    webflowTier: 'ix',
    mount: mount,
    unmount: unmount
  };

  MBC.pages.home = moduleDef;

  // Self-register with the page registry
  if (MBC.core && MBC.core.registry) {
    MBC.core.registry.register('home', moduleDef);
  }
})();