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

  var initialHomeCoverTimer = null;

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

  if (typeof ScrollTrigger !== 'undefined' && typeof ScrollTrigger.config === 'function') {
    ScrollTrigger.config({ ignoreMobileResize: true });
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

    if (initialHomeCoverTimer) {
      clearTimeout(initialHomeCoverTimer);
    }

    initialHomeCoverTimer = setTimeout(function () {
      releaseInitialHomeCover();
    }, 1200);
  }

  function releaseInitialHomeCover() {
    var cover = document.getElementById('mbc-home-startup-cover');

    if (initialHomeCoverTimer) {
      clearTimeout(initialHomeCoverTimer);
      initialHomeCoverTimer = null;
    }

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

  function isProjectDetailNamespace(namespace) {
    var utils = MBC.core && MBC.core.utils;
    var normalized = utils && typeof utils.normalizeNamespace === 'function'
      ? utils.normalizeNamespace(namespace)
      : String(namespace || 'default').toLowerCase();

    return normalized === 'project-detail';
  }

  function parseNavBlur(value) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (value === false || value === 'false' || value === '0' || value === 'none' || value === 'no-blur') {
      return false;
    }

    return true;
  }

  function normalizeTransitionNavState(config) {
    var state = config || {};
    var theme = state.theme || 'dark';
    var blur = parseNavBlur(state.blur);
    var bg = state.bg;

    if (blur === null) {
      blur = theme === 'dark';
    }

    if (blur === false) {
      bg = 'none';
    } else if (bg === null || bg === undefined || bg === '') {
      bg = 'solid';
    }

    return {
      theme: theme,
      bg: bg,
      blur: blur
    };
  }

  function getSectionTransitionNavState(section) {
    if (!section) {
      return normalizeTransitionNavState({ theme: 'dark', bg: 'solid', blur: true });
    }

    return normalizeTransitionNavState({
      theme: section.getAttribute('data-theme-section') || section.getAttribute('data-nav-theme') || 'dark',
      bg: section.getAttribute('data-bg-section') || section.getAttribute('data-bg-nav') || null,
      blur: section.getAttribute('data-nav-blur')
    });
  }

  function getTransitionNavState(namespace, container) {
    if (isProjectDetailNamespace(namespace)) {
      return normalizeTransitionNavState({ theme: 'light', bg: 'none', blur: false });
    }

    var explicit = container && container.querySelector
      ? container.querySelector('[data-page-nav-theme], [data-page-nav-blur], [data-page-bg-nav]')
      : null;

    if (explicit) {
      return normalizeTransitionNavState({
        theme: explicit.getAttribute('data-page-nav-theme') || explicit.getAttribute('data-nav-theme') || explicit.getAttribute('data-theme-section') || 'dark',
        bg: explicit.getAttribute('data-page-bg-nav') || explicit.getAttribute('data-bg-nav') || explicit.getAttribute('data-bg-section') || null,
        blur: explicit.getAttribute('data-page-nav-blur') !== null
          ? explicit.getAttribute('data-page-nav-blur')
          : explicit.getAttribute('data-nav-blur')
      });
    }

    var section = container && container.querySelector
      ? container.querySelector('[data-theme-section], [data-bg-section], [data-nav-blur], [data-nav-theme], [data-bg-nav], header, section')
      : null;

    return getSectionTransitionNavState(section);
  }

  function applyTransitionNavState(config) {
    var state = normalizeTransitionNavState(config);
    var theme = state.theme;
    var bg = state.bg;
    var blur = state.blur;
    var nav = document.querySelector('.nav');
    var mirroredTargets = [document.documentElement, document.body];

    mirroredTargets.forEach(function (target) {
      if (!target) return;
      target.removeAttribute('data-theme-nav');
      target.removeAttribute('data-nav-theme');
      target.removeAttribute('data-bg-nav');
      target.removeAttribute('data-nav-blur');
    });

    if (nav) {
      nav.setAttribute('data-theme-nav', theme);
      nav.setAttribute('data-nav-theme', theme);
      nav.setAttribute('data-bg-nav', bg);
      nav.setAttribute('data-nav-blur', blur ? 'true' : 'false');
    }

    if (MBC.features.nav && typeof MBC.features.nav.setState === 'function') {
      MBC.features.nav.setState({ theme: theme, bg: bg, blur: blur });
    }
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

    var initialOnceHandled = false;
    var initialAfterEnterSkipped = false;

    barba.hooks.beforeEnter(function (data) {
      var nextNamespace = data && data.next ? data.next.namespace : 'default';

      if (window._closeMobileNav && typeof window._closeMobileNav === 'function') {
        window._closeMobileNav(true);
      }

      if (isHomeNamespace(data && data.next ? data.next.namespace : 'default')) {
        prepareHomeHeroState();
      } else {
        applyTransitionNavState(getTransitionNavState(nextNamespace, data && data.next ? data.next.container : null));
      }

      if (typeof gsap !== 'undefined') {
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
      if (initialOnceHandled && !initialAfterEnterSkipped) {
        initialAfterEnterSkipped = true;
        pendingPageLoad = null;
        return Promise.resolve();
      }

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

          initialOnceHandled = true;

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
          var currentNamespace = data && data.current ? data.current.namespace : 'default';
          var nextNamespace = data && data.next ? data.next.namespace : 'default';

          if (isProjectDetailNamespace(currentNamespace) && !isProjectDetailNamespace(nextNamespace)) {
            applyTransitionNavState(getTransitionNavState(nextNamespace, data && data.next ? data.next.container : null));
          }

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
        duration: 0.12,
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
        duration: 0.15,
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', releaseInitialHomeCover, { once: true });
  }

  initBarba();
})();
