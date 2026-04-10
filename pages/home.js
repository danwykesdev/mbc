(function () {
console.log('home page loaded');

  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.pages = MBC.pages || {};

  async function mount(ctx) {
    var container = ctx.container;
    var cleanups = [];

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

    // Videos (modals)
    if (MBC.features.videos) {
      var videoCleanup = MBC.features.videos.initStandalone({ container: container });
      if (typeof videoCleanup === 'function') {
        cleanups.push(videoCleanup);
      }
    }

    // Finsweet components
    if (MBC.features.finsweet) {
      await MBC.features.finsweet.init(container, { modules: ['modal'] });
    }

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