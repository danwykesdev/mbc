(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.pages = MBC.pages || {};

  function queryOne(container, selector, fallbackGlobal) {
    var el = container.querySelector(selector);
    if (!el && fallbackGlobal) el = document.querySelector(selector);
    return el;
  }

  /**
   * Load the standalone FS Slider script
   * Re-injects each time so it processes new DOM after Barba transitions
   */
  function loadFsSlider() {
    // Remove any previous slider script so it re-executes on fresh DOM
    document.querySelectorAll('script').forEach(function (s) {
      if (s.src && s.src.indexOf('attributes-slider') !== -1) {
        s.parentNode.removeChild(s);
      }
    });

    return new Promise(function (resolve) {
      var script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://cdn.jsdelivr.net/npm/@finsweet/attributes-slider@1/slider.js';
      script.onload = function () {
        // Give the module time to initialize
        setTimeout(resolve, 80);
      };
      script.onerror = function () {
        console.warn('[MBC] FS Slider script failed to load');
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  async function mount(ctx) {
    var container = ctx.container;
    var cleanups = [];

    // FS Slider MUST init before pagination so slider DOM is ready
    await loadFsSlider();

    // Scroll to list anchor
    function scrollToAnchor() {
      var anchor = queryOne(container, "[fs-list-element='scroll-anchor']", true);
      if (!anchor) return;

      if (window.lenis && typeof window.lenis.scrollTo === 'function') {
        window.lenis.scrollTo(anchor, {
          offset: 0,
          duration: 0.8,
          immediate: false
        });
      } else {
        anchor.scrollIntoView({ behavior: 'smooth' });
      }
    }

    // Pagination click handler
    function onBodyClick(e) {
      var nextTrigger = e.target.closest('[data-pagination="next"]');
      var prevTrigger = e.target.closest('[data-pagination="prev"]');

      if (nextTrigger) {
        e.preventDefault();
        var nextTarget = queryOne(container, '[data-pagination-next]', true);
        if (nextTarget) nextTarget.click();

        var nextBtn = queryOne(container, '[data-pagination="next"]', true);
        var prevBtn = queryOne(container, '[data-pagination="prev"]', true);

        if (nextBtn) {
          var nextArrow = nextBtn.querySelector('.zine_arrow-svg');
          if (nextArrow) nextArrow.classList.add('is-active');
        }
        if (prevBtn) {
          var prevArrow = prevBtn.querySelector('.zine_arrow-svg');
          if (prevArrow) prevArrow.classList.remove('is-active');
        }
      }

      if (prevTrigger) {
        e.preventDefault();
        var prevTarget = queryOne(container, '[data-pagination-prev]', true);
        if (prevTarget) prevTarget.click();

        var nextBtn2 = queryOne(container, '[data-pagination="next"]', true);
        var prevBtn2 = queryOne(container, '[data-pagination="prev"]', true);

        if (nextBtn2) {
          var nextArrow2 = nextBtn2.querySelector('.zine_arrow-svg');
          if (nextArrow2) nextArrow2.classList.remove('is-active');
        }
        if (prevBtn2) {
          var prevArrow2 = prevBtn2.querySelector('.zine_arrow-svg');
          if (prevArrow2) prevArrow2.classList.add('is-active');
        }
      }
    }

    document.body.addEventListener('click', onBodyClick);
    cleanups.push(function () {
      document.body.removeEventListener('click', onBodyClick);
    });

    // Tab shortcuts
    function bindTabShortcut(triggerSelector, tabValue) {
      var trigger = queryOne(container, triggerSelector, true);
      if (!trigger) return;

      var handler = function () {
        var tabBtn = queryOne(container, '[data-w-tab="' + tabValue + '"]', true);
        if (!tabBtn) return;

        tabBtn.click();
        setTimeout(function () { scrollToAnchor(); }, 100);
      };

      trigger.addEventListener('click', handler);
      cleanups.push(function () {
        trigger.removeEventListener('click', handler);
      });
    }

    bindTabShortcut('[data="anatomy"]', 'anatomy of an event');
    bindTabShortcut('[data="head"]', 'head to head');
    bindTabShortcut('[data="luxury"]', 'luxury in numbers');

    // Move [data-move-talk] into [data-talk]
    var talkSource = queryOne(container, '[data-move-talk]', true);
    var talkDest = queryOne(container, '[data-talk]', true);

    if (talkSource && talkDest && !talkDest.contains(talkSource)) {
      talkDest.appendChild(talkSource);
    }

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

  MBC.pages.zine = moduleDef;

  if (MBC.core && MBC.core.registry) {
    MBC.core.registry.register('zine', moduleDef);
  }
})();
