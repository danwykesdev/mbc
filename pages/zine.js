(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.pages = MBC.pages || {};

  function queryOne(container, selector, fallbackGlobal) {
    var el = container.querySelector(selector);
    if (!el && fallbackGlobal) el = document.querySelector(selector);
    return el;
  }

  function prepareListTabs(container) {
    var tabsRoots = Array.from(container.querySelectorAll('[fs-list-element="tabs"]'));

    tabsRoots.forEach(function (tabsRoot) {
      if (!tabsRoot.hasAttribute('fs-list-resetix')) {
        tabsRoot.setAttribute('fs-list-resetix', 'true');
      }
    });
  }

  function waitForListTabs(container) {
    var tabsRoots = Array.from(container.querySelectorAll('[fs-list-element="tabs"]'));

    if (!tabsRoots.length) {
      return Promise.resolve(false);
    }

    var start = performance.now();

    return new Promise(function (resolve) {
      function check() {
        if (!document.body.contains(container)) {
          resolve(false);
          return;
        }

        var ready = tabsRoots.some(function (tabsRoot) {
          return !!tabsRoot.querySelector('[data-w-tab]');
        });

        if (ready) {
          resolve(true);
          return;
        }

        if (performance.now() - start > 1500) {
          resolve(false);
          return;
        }

        setTimeout(check, 50);
      }

      check();
    });
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

    if (MBC.features.finsweet && typeof MBC.features.finsweet.inspect === 'function') {
      traceSync('zine finsweet inspect before init', function () {
        MBC.features.finsweet.inspect(container, 'zine before init');
      });
    }

    prepareListTabs(container);

    if (MBC.features.finsweet && typeof MBC.features.finsweet.init === 'function') {
      var finsweetModules = typeof MBC.features.finsweet.detectModules === 'function'
        ? MBC.features.finsweet.detectModules(container).filter(function (moduleName) {
            return moduleName !== 'modal';
          })
        : ['list'];

      if (finsweetModules.length) {
        await traceAsync('zine finsweet init', function () {
          return MBC.features.finsweet.init(container, { modules: finsweetModules, label: 'zine' });
        });
      }
    }

    await traceAsync('zine waitForListTabs', function () {
      return waitForListTabs(container);
    });

    scrollToAnchor();

    if (MBC.features.finsweet && typeof MBC.features.finsweet.inspect === 'function') {
      traceSync('zine finsweet inspect after init', function () {
        MBC.features.finsweet.inspect(container, 'zine after init');
      });
    }

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

    traceSync('zine bindTabShortcuts', function () {
      bindTabShortcut('[data="anatomy"]', 'anatomy of an event');
      bindTabShortcut('[data="head"]', 'head to head');
      bindTabShortcut('[data="luxury"]', 'luxury in numbers');
    });

    // Move [data-move-talk] into [data-talk]
    traceSync('zine moveTalkBlock', function () {
      var talkSource = queryOne(container, '[data-move-talk]', true);
      var talkDest = queryOne(container, '[data-talk]', true);

      if (talkSource && talkDest && !talkDest.contains(talkSource)) {
        talkDest.appendChild(talkSource);
      }
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

  MBC.pages.zine = moduleDef;

  if (MBC.core && MBC.core.registry) {
    MBC.core.registry.register('zine', moduleDef);
  }
})();
