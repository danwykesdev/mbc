/**
 * MBC Main Entry Point
 * Bootstraps the modular system with Barba.js transitions
 *
 * Environment: Set window.MBC_ENV before this script to control mode
 *   'local'      - loads from local server (e.g. localhost:3000)
 *   'production' - loads from GitHub via jsDelivr CDN
 *   auto (default) - detects from script src
 */
(function () {
  if (window.__MBC_APP_ACTIVE) return;
  window.__MBC_APP_ACTIVE = true;

  function getEntryScriptSrc() {
    var currentScript = document.currentScript;
    var scripts;
    var i;

    if (currentScript && currentScript.src) {
      return currentScript.src;
    }

    scripts = document.getElementsByTagName('script');
    for (i = scripts.length - 1; i >= 0; i -= 1) {
      if (scripts[i] && scripts[i].src && /(^|\/)main\.js(?:\?.*)?$/.test(scripts[i].src)) {
        return scripts[i].src;
      }
    }

    return '';
  }

  function resolveProductionBasePath(scriptSrc) {
    var normalizedSrc = String(scriptSrc || '').split('?')[0];
    var jsDelivrMatch = normalizedSrc.match(/^(https:\/\/cdn\.jsdelivr\.net\/gh\/[^@]+@[^/]+)/i);

    if (jsDelivrMatch) {
      return jsDelivrMatch[1];
    }

    return 'https://cdn.jsdelivr.net/gh/danwykesdev/mbc@main';
  }

  // Environment detection
  var env = window.MBC_ENV || 'auto';
  var entryScriptSrc = getEntryScriptSrc();

  if (env === 'auto') {
    env = entryScriptSrc.indexOf('jsdelivr.net') !== -1 ? 'production' :
         (entryScriptSrc.indexOf('localhost') !== -1 ? 'local' : 'production');
  }

  var localBaseUrl = window.MBC_LOCAL_BASE_URL || '';
  var localPort = window.MBC_LOCAL_PORT || '5500';
  var resolvedBasePath = env === 'local'
    ? (localBaseUrl || ('http://localhost:' + localPort))
    : resolveProductionBasePath(entryScriptSrc);

  // Set module base path based on environment
  window.MBC.loader.setBasePath(resolvedBasePath);

  if (window.MBC_DEBUG || env === 'local') {
    console.log('[MBC] Environment:', env, '| Base path:', resolvedBasePath);
  }

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
    if (MBC.features.lenis) {
      MBC.features.lenis.init();
    }
  }

  function addPageCleanup(fn) {
    var cleanupApi;
    var addFn;

    if (typeof fn !== 'function' || !MBC.core || !MBC.core.cleanup) {
      return;
    }

    cleanupApi = MBC.core.cleanup;
    addFn = typeof cleanupApi.addPage === 'function' ? cleanupApi.addPage : cleanupApi.add;

    if (typeof addFn === 'function') {
      addFn(fn);
    }
  }

  function prepareHomeHeroState() {
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

  function getInitialNamespace() {
    var container = document.querySelector('[data-barba="container"]');

    if (container && container.getAttribute) {
      return container.getAttribute('data-barba-namespace') || 'default';
    }

    return 'default';
  }

  function ensureInitialHomeCover() {
    var cover;

    if (!isHomeNamespace(getInitialNamespace())) {
      return;
    }

    if (document.getElementById('mbc-home-startup-cover')) {
      return;
    }

    cover = document.createElement('div');
    cover.id = 'mbc-home-startup-cover';
    cover.setAttribute('aria-hidden', 'true');
    cover.style.position = 'fixed';
    cover.style.inset = '0';
    cover.style.zIndex = '2147483647';
    cover.style.background = '#0d0d0d';
    cover.style.opacity = '1';
    cover.style.pointerEvents = 'none';
    cover.style.transition = 'opacity 220ms ease';

    (document.body || document.documentElement).appendChild(cover);
  }

  function releaseInitialHomeCover() {
    var cover = document.getElementById('mbc-home-startup-cover');

    if (!cover) return;

    cover.style.opacity = '0';

    setTimeout(function () {
      if (cover.parentNode) {
        cover.parentNode.removeChild(cover);
      }
    }, 260);
  }

  function bindSharedFeatures() {
    if (MBC.features.mobileNav) {
      var mobileCleanup = MBC.features.mobileNav.init();
      if (typeof mobileCleanup === 'function') {
        addPageCleanup(mobileCleanup);
      }
    }

    if (MBC.features.scrollDirection) {
      var scrollCleanup = MBC.features.scrollDirection.init();
      if (typeof scrollCleanup === 'function') {
        addPageCleanup(scrollCleanup);
      }
    }
  }

  var pendingPageLoad = null;

  function isHomeNamespace(namespace) {
    var utils = MBC.core && MBC.core.utils;
    var normalized = utils && typeof utils.normalizeNamespace === 'function'
      ? utils.normalizeNamespace(namespace)
      : String(namespace || 'default').toLowerCase();

    return normalized === 'home';
  }

  function loadModulesForRoute(data) {
    if (!data || !data.next || !data.next.container) {
      return Promise.resolve();
    }

    if (pendingPageLoad) {
      return pendingPageLoad;
    }

    pendingPageLoad = MBC.loader.loadForPage(data.next.container, data.next.namespace);
    return pendingPageLoad;
  }

  function settleAfterMount(container) {
    resetPage(container);

    if (MBC.core.webflow && typeof MBC.core.webflow.refreshIX === 'function') {
      MBC.core.webflow.refreshIX();
    }

    if (MBC.core.state.lenis) {
      if (typeof MBC.core.state.lenis.resize === 'function') {
        MBC.core.state.lenis.resize();
      }
      if (typeof MBC.core.state.lenis.start === 'function') {
        MBC.core.state.lenis.start();
      }
    }

    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.refresh(true);
    }
  }

  function mountRoute(data, opts) {
    return loadModulesForRoute(data).then(function () {
      return MBC.core.lifecycle.mountNext(data, opts);
    }).then(function (result) {
      bindSharedFeatures();

      if (MBC.features.loadAnimations && result && result.container) {
        var loadAnimationCleanup = MBC.features.loadAnimations.init(result.container, {
          disableIntroReveals: result.namespace === 'home',
          forceScrollExcludeSelector: result.namespace === 'home' ? '.hero-animate, [data-hero]' : null
        });
        if (typeof loadAnimationCleanup === 'function') {
          addPageCleanup(loadAnimationCleanup);
        }
      }

      return result;
    });
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
      if (isHomeNamespace(data && data.next ? data.next.namespace : 'default')) {
        prepareHomeHeroState();
      }

      if (typeof gsap !== 'undefined') {
        var nextNamespace = data && data.next ? data.next.namespace : 'default';
        var nextState = {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0
        };

        if (!isHomeNamespace(nextNamespace)) {
          nextState.autoAlpha = 0;
        }

        gsap.set(data.next.container, nextState);
      }

      if (MBC.core.state.lenis && typeof MBC.core.state.lenis.stop === 'function') {
        MBC.core.state.lenis.stop();
      }

      MBC.core.webflow.updatePageIdFromBarba(data);

      return loadModulesForRoute(data);
    });

    barba.hooks.afterLeave(function () {
      MBC.core.webflow.killScrollTriggers();
      return MBC.core.lifecycle.unmountCurrent(MBC.core.state.navToken);
    });

    barba.hooks.enter(function () {
    });

    barba.hooks.afterEnter(function (data) {
      var namespace = data.next.namespace || 'default';
      var container = data.next.container;

      return mountRoute(data, { isFirstLoad: false }).then(function () {
        settleAfterMount(container);
        return pageEnterAnimation(container, isHomeNamespace(namespace));
      }).then(function () {
        if (!isHomeNamespace(namespace) && MBC.features.loadAnimations) {
          MBC.features.loadAnimations.playIntro(container, {
            isFirstLoad: false,
            includeNav: false
          });
        }

        pendingPageLoad = null;
      }).catch(function (err) {
        pendingPageLoad = null;
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

          if (isHomeNamespace(namespace)) {
            prepareHomeHeroState();
          }

          return loadModulesForRoute(data).then(function () {
            initGlobalFeatures();
            return mountRoute(data, { isFirstLoad: true });
          }).then(function () {
            settleAfterMount(container);
            return pageEnterAnimation(container, isHomeNamespace(namespace));
          }).then(function () {
            if (!isHomeNamespace(namespace) && MBC.features.loadAnimations) {
              MBC.features.loadAnimations.playIntro(container, { isFirstLoad: true });
            }

            pendingPageLoad = null;
          }).catch(function (err) {
            pendingPageLoad = null;
            throw err;
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
  ensureInitialHomeCover();
  initBarba();
})();
