(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.pages = MBC.pages || {};

  /**
   * Initialize data-animate-scroll elements with IntersectionObserver
   */
  function initAnimateScroll(container) {
    var items = container.querySelectorAll('[data-animate-scroll]');
    if (!items.length) return null;

    var observers = [];
    var groups = {};

    items.forEach(function (item) {
      // Reset state for SPA transitions
      item.classList.remove('is-visible');

      var offset = (item.getAttribute('data-offset') || '50').replace('%', '');
      if (!groups[offset]) groups[offset] = [];
      groups[offset].push(item);
    });

    Object.keys(groups).forEach(function (offset) {
      var observer = new IntersectionObserver(function (entries, obs) {
        entries.filter(function (e) { return e.isIntersecting; }).forEach(function (entry, index) {
          var el = entry.target;
          var delay = el.getAttribute('data-delay') !== null
            ? parseInt(el.getAttribute('data-delay'), 10)
            : index * 120;

          setTimeout(function () {
            el.classList.add('is-visible');
            obs.unobserve(el);
          }, delay);
        });
      }, {
        rootMargin: '0px 0px -' + offset + '% 0px',
        threshold: 0
      });

      groups[offset].forEach(function (el) {
        observer.observe(el);
      });
      observers.push(observer);
    });

    return function cleanup() {
      observers.forEach(function (obs) { obs.disconnect(); });
    };
  }

  /**
   * Load the Refokus next-prev-articles script
   * Re-injects each time so it processes the new DOM after a Barba transition
   */
  function loadNextPrevScript() {
    return new Promise(function (resolve) {
      var script = document.createElement('script');
      script.src = 'https://tools.refokus.com/next-prev-articles/bundle.v1.0.0.js';
      script.async = true;
      script.onload = resolve;
      script.onerror = function () {
        console.warn('[MBC] Refokus next-prev script failed to load');
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  function setProjectDetailBodyTheme(theme) {
    var nextTheme = theme === 'dark' ? 'dark' : 'light';

    if (document.body) {
      document.body.setAttribute('data-theme-section', nextTheme);
    }
  }

  function initProjectDetailBodyThemeScroll(container) {
    if (!container) return null;

    var sections = Array.from(container.querySelectorAll('[data-theme-section]'));
    if (!sections.length) {
      setProjectDetailBodyTheme('light');
      return null;
    }

    var navBarHeightEl = document.querySelector('[data-nav-bar-height]');
    var offset = navBarHeightEl ? navBarHeightEl.offsetHeight / 2 : 0;
    var rafId = null;

    function updateBodyTheme() {
      rafId = null;
      var activeTheme = 'light';

      sections.forEach(function (section) {
        var rect = section.getBoundingClientRect();
        if (rect.top <= offset && rect.bottom >= offset) {
          activeTheme = section.getAttribute('data-theme-section') || 'light';
        }
      });

      setProjectDetailBodyTheme(activeTheme);
    }

    function onScroll() {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(updateBodyTheme);
    }

    updateBodyTheme();
    document.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return function cleanup() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      document.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (document.body) {
        document.body.removeAttribute('data-theme-section');
      }
    };
  }

  function applyInitialProjectDetailNavState() {
    var nav = document.querySelector('.nav');

    if (document.documentElement) {
      document.documentElement.removeAttribute('data-theme-nav');
      document.documentElement.removeAttribute('data-nav-theme');
      document.documentElement.removeAttribute('data-bg-nav');
      document.documentElement.removeAttribute('data-nav-blur');
    }

    if (document.body) {
      document.body.removeAttribute('data-theme-nav');
      document.body.removeAttribute('data-nav-theme');
      document.body.removeAttribute('data-bg-nav');
      document.body.removeAttribute('data-nav-blur');
    }

    if (nav) {
      nav.setAttribute('data-theme-nav', 'light');
      nav.setAttribute('data-nav-theme', 'light');
      nav.setAttribute('data-bg-nav', 'none');
      nav.setAttribute('data-nav-blur', 'false');
    }

    if (MBC.features.nav) {
      MBC.features.nav.setState({ theme: 'light', bg: 'none', blur: false });
    }

    setProjectDetailBodyTheme('light');
  }

  async function mount(ctx) {
    var container = ctx.container;
    var cleanups = [];
    var traceAsync = MBC.core && MBC.core.utils && MBC.core.utils.traceAsync
      ? MBC.core.utils.traceAsync
      : function (label, promiseFactory) { return Promise.resolve().then(promiseFactory); };
    var traceSync = MBC.core && MBC.core.utils && MBC.core.utils.traceSync
      ? MBC.core.utils.traceSync
      : function (_, fn) { return fn(); };

    applyInitialProjectDetailNavState();

    // Videos init BEFORE Finsweet — video init replaces #video element
    // with a stableWrapper, so this must happen before Finsweet binds
    // its modal open/close handlers to the DOM
    if (MBC.features.videos) {
      var videoCleanup = traceSync('project-detail videos.initStandalone', function () {
        return MBC.features.videos.initStandalone({ container: container });
      });
      if (typeof videoCleanup === 'function') {
        cleanups.push(videoCleanup);
      }
    }

    // Finsweet modal AFTER video DOM is stable
    if (MBC.features.finsweet) {
      await traceAsync('project-detail finsweet.modal init', function () {
        return MBC.features.finsweet.init(container, { modules: ['modal'] });
      });
    }

    applyInitialProjectDetailNavState();

    // Scroll-triggered animations
    var scrollAnimCleanup = traceSync('project-detail initAnimateScroll', function () {
      return initAnimateScroll(container);
    });
    if (typeof scrollAnimCleanup === 'function') {
      cleanups.push(scrollAnimCleanup);
    }

    var bodyThemeCleanup = traceSync('project-detail initBodyThemeScroll', function () {
      return initProjectDetailBodyThemeScroll(container);
    });
    if (typeof bodyThemeCleanup === 'function') {
      cleanups.push(bodyThemeCleanup);
    }

    // Slide reveal animations
    if (MBC.features.loadAnimations && typeof MBC.features.loadAnimations.init === 'function') {
      var loadAnimCleanup = traceSync('project-detail loadAnimations.init', function () {
        return MBC.features.loadAnimations.init(container);
      });
      if (typeof loadAnimCleanup === 'function') {
        cleanups.push(loadAnimCleanup);
      }
    }

    // Refokus next-prev articles (re-inject each transition)
    await traceAsync('project-detail loadNextPrevScript', function () {
      return loadNextPrevScript();
    });

    requestAnimationFrame(function () {
      applyInitialProjectDetailNavState();
    });

    return function cleanup() {
      cleanups.forEach(function (fn) {
        if (typeof fn === 'function') {
          try { fn(); } catch (_) {}
        }
      });
    };
  }

  function unmount() {}

  var moduleDef = {
    webflowTier: 'ix',
    mount: mount,
    unmount: unmount
  };

  MBC.pages.projectDetail = moduleDef;

  if (MBC.core && MBC.core.registry) {
    MBC.core.registry.register('project-detail', moduleDef);
  }
})();