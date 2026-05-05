(function () {

  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.pages = MBC.pages || {};

  async function mount(ctx) {
    var container = ctx.container;
    var cleanups = [];
    var horizontalScrollCleanup = null;
    var staggerHoverCleanup = null;
    var deferredHomeFeaturesPromise = null;

    function getHeroFeature(namespace) {
      if (namespace === 'home-2' && MBC.features.hero2 && typeof MBC.features.hero2.init === 'function') {
        return MBC.features.hero2;
      }

      return MBC.features.hero;
    }

    function traceMobileScroll(label, fn) {
      if (typeof window.__MBC_TRACE_MOBILE_SCROLL === 'function') {
        return window.__MBC_TRACE_MOBILE_SCROLL(label, fn);
      }

      return typeof fn === 'function' ? fn() : undefined;
    }

    function bindHorizontalScroll(label) {
      if (!MBC.features.horizontalScroll || typeof MBC.features.horizontalScroll.init !== 'function') {
        return;
      }

      if (typeof horizontalScrollCleanup === 'function') {
        try { horizontalScrollCleanup(); } catch (_) {}
        horizontalScrollCleanup = null;
      }

      var nextCleanup = traceMobileScroll(label || 'home horizontalScroll.init', function () {
        return MBC.features.horizontalScroll.init(container);
      });

      if (typeof nextCleanup === 'function') {
        horizontalScrollCleanup = nextCleanup;
      }
    }

    function bindStaggerHover(label) {
      if (!MBC.features.staggerHover || typeof MBC.features.staggerHover.init !== 'function') {
        return;
      }

      if (typeof staggerHoverCleanup === 'function') {
        try { staggerHoverCleanup(); } catch (_) {}
        staggerHoverCleanup = null;
      }

      var nextCleanup = MBC.features.staggerHover.init(container);

      if (typeof nextCleanup === 'function') {
        staggerHoverCleanup = nextCleanup;
      }
    }

    function loadDeferredHomeFeatures() {
      if (deferredHomeFeaturesPromise) {
        return deferredHomeFeaturesPromise;
      }

      var jobs = [];

      if (!MBC.loader) {
        return Promise.resolve();
      }

      if (container.querySelector('[data-horizontal-scroll], [data-horizontal-scroll-wrap], [data-horizontal-track], [data-horizontal-scroll-panel]')) {
        jobs.push(MBC.loader.loadModule('features/horizontal-scroll'));
      }

      if (container.querySelector('.project_component')) {
        jobs.push(MBC.loader.loadModule('features/tabs'));
      }

      if (container.querySelector('#videoLoad, #video, [data-video], [data-vimeo-id], [data-modal-video]')) {
        jobs.push(
          MBC.loader.loadExternalScript('vimeo-player', 'https://player.vimeo.com/api/player.js').then(function () {
            return MBC.loader.loadModule('features/videos');
          })
        );
      }

      if (container.querySelector('[fs-modal-element]')) {
        jobs.push(
          MBC.loader.loadExternalScript('finsweet-modal', {
            url: 'https://cdn.jsdelivr.net/npm/@finsweet/attributes-modal@1/modal.js',
            type: 'module'
          }).then(function () {
            return MBC.loader.loadModule('features/finsweet');
          })
        );
      }

      deferredHomeFeaturesPromise = Promise.all(jobs).catch(function (err) {
        console.warn('[MBC] Home deferred features failed to load', err);
      });

      return deferredHomeFeaturesPromise;
    }

    function releaseStartupCover() {
      var cover = document.getElementById('mbc-home-startup-cover');

      if (!cover) return;

      cover.style.opacity = '0';

      setTimeout(function () {
        if (cover.parentNode) {
          cover.parentNode.removeChild(cover);
        }
      }, 260);
    }

    function prepareHeroEntryState() {
      if (typeof gsap === 'undefined') return;

      var nav = document.querySelector('.nav');
      var navItems = document.querySelectorAll('[data-load-items="nav-item"], [data-load-item="nav"], [data-load-items="nav"]');
      var isDesktop = window.innerWidth >= 992;

      // Only hide nav on desktop, keep it visible on mobile/tablet
      if (isDesktop && nav) {
        gsap.killTweensOf(nav);
        gsap.set(nav, { yPercent: -100, autoAlpha: 0 });
      }

      if (isDesktop && navItems.length) {
        gsap.killTweensOf(navItems);
        gsap.set(navItems, { autoAlpha: 0, x: -10 });
      }
    }

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

      await loadDeferredHomeFeatures();

      if (!document.body.contains(container)) return;

      await wait(50);

      if (!document.body.contains(container)) return;

      // Videos and Finsweet init AFTER refreshUI so listeners aren't clobbered
      await initVideosAfterHero();

      if (!document.body.contains(container)) return;

      if (MBC.features.tabs) {
        var tabsCleanup = MBC.features.tabs.init(container);
        if (typeof tabsCleanup === 'function') {
          cleanups.push(tabsCleanup);
        }
      }

      if (!document.body.contains(container)) return;

      if (MBC.features.finsweet) {
        await MBC.features.finsweet.init(container, { modules: ['modal'] });
      }

      if (!document.body.contains(container)) return;

      if (MBC.features.loadAnimations && typeof MBC.features.loadAnimations.resetHoverStates === 'function') {
        MBC.features.loadAnimations.resetHoverStates(container);
      }

      // Only reinit horizontal scroll if not already running, otherwise do nothing
      // (early bindHorizontalScroll already set it up; reflow mid-scroll causes glitch)
      if (typeof horizontalScrollCleanup !== 'function') {
        bindHorizontalScroll('home horizontalScroll.init final');
      }
      bindStaggerHover('home staggerHover.init final');
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

    bindHorizontalScroll('home horizontalScroll.init early');
    bindStaggerHover('home staggerHover.init early');

    // Hero animation
    var heroFeature = getHeroFeature(ctx.namespace);
    if (heroFeature) {
      prepareHeroEntryState();
      releaseStartupCover();

      var heroCleanup = heroFeature.init(container);
      if (typeof heroCleanup === 'function') {
        cleanups.push(heroCleanup);
      }
    } else {
      releaseStartupCover();
    }

    // Custom tabs
    if (MBC.features.tabs) {
      var tabsCleanup = MBC.features.tabs.init(container);
      if (typeof tabsCleanup === 'function') {
        cleanups.push(tabsCleanup);
      }
    }

    // Horizontal scroll section (used on home too)
    if (MBC.features.videos && typeof MBC.features.videos.initBackground === 'function') {
      var backgroundVideoCleanup = MBC.features.videos.initBackground(container);
      if (typeof backgroundVideoCleanup === 'function') {
        cleanups.push(backgroundVideoCleanup);
      }
    }

    // Sequence: finalize (incl refreshUI) completes before intro reveals play
    finalizeHomeInteractiveUI().then(function () {
      playPostHeroIntro();
    });

    return function cleanup() {
      if (typeof horizontalScrollCleanup === 'function') {
        try { horizontalScrollCleanup(); } catch (_) {}
        horizontalScrollCleanup = null;
      }

      if (typeof staggerHoverCleanup === 'function') {
        try { staggerHoverCleanup(); } catch (_) {}
        staggerHoverCleanup = null;
      }

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
    webflowTier: 'light',
    mount: mount,
    unmount: unmount
  };

  MBC.pages.home = moduleDef;
  MBC.pages['home-2'] = moduleDef;

  // Self-register with the page registry
  if (MBC.core && MBC.core.registry) {
    MBC.core.registry.register('home', moduleDef);
    MBC.core.registry.register('home-2', moduleDef);
  }
})();
