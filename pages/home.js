(function () {

  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.pages = MBC.pages || {};

  async function mount(ctx) {
    var container = ctx.container;
    var cleanups = [];
    var deferredHomeFeaturesPromise = null;

    function traceAsync(label, promiseFactory) {
      var start = performance.now();
      console.log('[MBC Trace] start:', label);

      return Promise.resolve().then(promiseFactory).then(function (result) {
        console.log('[MBC Trace] done:', label, Math.round(performance.now() - start) + 'ms');
        return result;
      }).catch(function (err) {
        console.log('[MBC Trace] fail:', label, Math.round(performance.now() - start) + 'ms');
        throw err;
      });
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

      deferredHomeFeaturesPromise = traceAsync('home deferred feature batch', function () {
        return Promise.all(jobs);
      }).catch(function (err) {
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

      if (nav) {
        gsap.killTweensOf(nav);
        gsap.set(nav, { yPercent: -100, autoAlpha: 0 });
      }

      if (navItems.length) {
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
      await traceAsync('home waitForHeroToSettle', function () {
        return waitForHeroToSettle();
      });

      if (!document.body.contains(container)) return;

      await traceAsync('home finalize deferred load', function () {
        return loadDeferredHomeFeatures();
      });

      if (!document.body.contains(container)) return;

      // refreshUI MUST run before finsweet/video init so IX2 is stable
      // before Finsweet binds its event listeners
      if (MBC.core.webflow && typeof MBC.core.webflow.refreshUI === 'function') {
        await traceAsync('home webflow.refreshUI final', function () {
          return MBC.core.webflow.refreshUI();
        });
      } else if (MBC.core.webflow && typeof MBC.core.webflow.refreshIX === 'function') {
        MBC.core.webflow.refreshIX();
      }

      await traceAsync('home settle wait 50ms', function () {
        return wait(50);
      });

      if (!document.body.contains(container)) return;

      // Videos and Finsweet init AFTER refreshUI so listeners aren't clobbered
      await traceAsync('home initVideosAfterHero', function () {
        return initVideosAfterHero();
      });

      if (MBC.features.tabs) {
        var tabsCleanup = MBC.features.tabs.init(container);
        if (typeof tabsCleanup === 'function') {
          cleanups.push(tabsCleanup);
        }
      }

      if (MBC.features.finsweet) {
        await traceAsync('home finsweet modal init', function () {
          return MBC.features.finsweet.init(container, { modules: ['modal'] });
        });
      }

      if (!document.body.contains(container)) return;

      if (MBC.features.loadAnimations && typeof MBC.features.loadAnimations.resetHoverStates === 'function') {
        MBC.features.loadAnimations.resetHoverStates(container);
      }
    }

    async function playPostHeroIntro() {
      await traceAsync('home waitForHeroToSettle for intro', function () {
        return waitForHeroToSettle();
      });

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
      prepareHeroEntryState();
      releaseStartupCover();

      var heroCleanup = MBC.features.hero.init(container);
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

    // Sequence: finalize (incl refreshUI) completes before intro reveals play
    finalizeHomeInteractiveUI().then(function () {
      playPostHeroIntro();
    });

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
    webflowTier: 'full',
    mount: mount,
    unmount: unmount
  };

  MBC.pages.home = moduleDef;

  // Self-register with the page registry
  if (MBC.core && MBC.core.registry) {
    MBC.core.registry.register('home', moduleDef);
  }
})();
