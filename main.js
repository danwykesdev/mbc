/**
 * MBC Main Entry Point
 * Bootstraps the modular system with Barba.js transitions
 */
(function () {
  if (window.__MBC_APP_ACTIVE) return;
  window.__MBC_APP_ACTIVE = true;

  // Set module base path (adjust based on your Webflow asset structure)
  window.MBC.loader.setBasePath('/js');

  var MBC = window.MBC;

  // Disable scroll restoration for SPA behavior
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  // Add JS class for CSS hooks
  document.documentElement.classList.add('js');
  if (document.body) {
    document.body.classList.add('animations-ready');
  }

  // Configure GSAP
  if (typeof gsap !== 'undefined') {
    gsap.config({ nullTargetWarn: false });
  }

  /**
   * Initialize global features that persist across transitions
   */
  function initGlobalFeatures() {
    // Lenis smooth scroll
    if (MBC.features.lenis) {
      MBC.features.lenis.init();
    }

    // Mobile nav (global)
    if (MBC.features.mobileNav) {
      var cleanup = MBC.features.mobileNav.init();
      if (typeof cleanup === 'function') {
        MBC.core.cleanup.add(cleanup);
      }
    }

    // Scroll direction detection
    if (MBC.features.scrollDirection) {
      var cleanup = MBC.features.scrollDirection.init();
      if (typeof cleanup === 'function') {
        MBC.core.cleanup.add(cleanup);
      }
    }
  }

  /**
   * Barba transition configuration - following osmo.md patterns
   */
  function initBarba() {
    if (typeof barba === 'undefined') {
      console.warn('[MBC] Barba.js not loaded');
      return;
    }

    barba.hooks.beforeEnter(function (data) {
      // Position new container on top during transition
      if (typeof gsap !== 'undefined') {
        gsap.set(data.next.container, {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0
        });
      }

      // Stop lenis during transition
      if (MBC.core.state.lenis && typeof MBC.core.state.lenis.stop === 'function') {
        MBC.core.state.lenis.stop();
      }

      // Update Webflow page ID for IX targeting
      MBC.core.webflow.updatePageIdFromBarba(data);
    });

    barba.hooks.afterLeave(function () {
      // Kill all ScrollTriggers from previous page (osmo pattern)
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.getAll().forEach(function (trigger) {
          trigger.kill();
        });
      }

      // Unmount current page module
      MBC.core.lifecycle.unmountCurrent(MBC.core.state.navToken);
    });

    barba.hooks.enter(function () {
      // Container positioning handled by Barba
    });

    barba.hooks.afterEnter(function (data) {
      var namespace = data.next.namespace || 'default';
      var container = data.next.container;

      // Load required modules for this page
      MBC.loader.loadForPage(container, namespace).then(function (info) {
        // Mount the page module
        return MBC.core.lifecycle.mountNext(data, { isFirstLoad: false });
      }).then(function () {
        // Run enter animation
        return pageEnterAnimation(container, namespace === 'home');
      }).then(function () {
        // Reset page position
        resetPage(container);

        // Refresh ScrollTrigger
        if (typeof ScrollTrigger !== 'undefined') {
          ScrollTrigger.refresh();
        }

        // Restart lenis
        if (MBC.core.state.lenis) {
          MBC.core.state.lenis.resize();
          MBC.core.state.lenis.start();
        }
      }).catch(function (err) {
        console.error('[MBC] Page transition failed:', err);
      });
    });

    barba.init({
      debug: false,
      timeout: 7000,
      preventRunning: true,
      prevent: function (ctx) {
        return bypassBarba(ctx.href, ctx.el);
      },
      transitions: [{
        name: 'mbc-default',

        once: function (data) {
          var namespace = data.next.namespace || 'default';
          var container = data.next.container;

          // Load modules for initial page
          return MBC.loader.loadForPage(container, namespace).then(function (info) {
            // Initialize global features
            initGlobalFeatures();

            // Mount initial page
            return MBC.core.lifecycle.mountNext(data, { isFirstLoad: true });
          }).then(function () {
            // Run initial animation
            return pageEnterAnimation(container, namespace === 'home');
          }).then(function () {
            resetPage(container);
          });
        },

        leave: function (data) {
          return pageLeaveAnimation(data.current.container);
        }
      }]
    });
  }

  /**
   * Page leave animation
   */
  function pageLeaveAnimation(current) {
    return new Promise(function (resolve) {
      if (typeof gsap === 'undefined') {
        resolve();
        return;
      }

      gsap.to(current, {
        autoAlpha: 0,
        duration: 0.24,
        ease: 'power2.out',
        onComplete: resolve
      });
    });
  }

  /**
   * Page enter animation
   */
  function pageEnterAnimation(container, isHome) {
    return new Promise(function (resolve) {
      if (typeof gsap === 'undefined') {
        resolve();
        return;
      }

      // Home page: just ensure visible
      if (isHome) {
        gsap.set(container, { autoAlpha: 1, clearProps: 'opacity,visibility' });
        resolve();
        return;
      }

      // Other pages: fade in
      gsap.fromTo(container, {
        autoAlpha: 0
      }, {
        autoAlpha: 1,
        duration: 0.28,
        ease: 'power2.out',
        clearProps: 'opacity,visibility',
        onComplete: resolve
      });
    });
  }

  /**
   * Reset page after transition
   */
  function resetPage(container) {
    window.scrollTo(0, 0);

    if (typeof gsap !== 'undefined') {
      gsap.set(container, { clearProps: 'position,top,left,right' });
    }

    if (MBC.core.state.lenis) {
      MBC.core.state.lenis.scrollTo(0, { immediate: true });
      MBC.core.state.lenis.resize();
    }
  }

  /**
   * Determine if Barba should bypass this navigation
   */
  function bypassBarba(url, el) {
    try {
      if (!url) return true;
      if (el && el.hasAttribute && el.hasAttribute('download')) return true;
      if (el && el.target === '_blank') return true;
      if (el && el.hasAttribute && el.hasAttribute('data-no-barba')) return true;

      var next = new URL(url, window.location.origin);
      var currentPath = window.location.pathname.replace(/\/$/, '') || '/';
      var nextPath = next.pathname.replace(/\/$/, '') || '/';

      var isExternal = next.origin !== window.location.origin;
      var isAnchorOnly = currentPath === nextPath && !!next.hash;
      var isSpecial = /^(mailto:|tel:|javascript:)/i.test(url);

      return isExternal || isAnchorOnly || isSpecial;
    } catch (_) {
      return false;
    }
  }

  // Prevent clicks on current page links
  document.body.addEventListener('click', function (e) {
    var link = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!link) return;

    if (link.classList.contains('w--current')) {
      e.preventDefault();
      return;
    }

    var currentUrl = (window.location.origin + window.location.pathname).replace(/\/$/, '');
    var linkUrl = link.href.split('#')[0].split('?')[0].replace(/\/$/, '');

    if (currentUrl === linkUrl) {
      e.preventDefault();
    }
  });

  // Start Barba
  initBarba();
})();
