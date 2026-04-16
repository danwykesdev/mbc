/**
 * Finsweet Attributes Integration
 * Handles FS List, Modal, Slider, Filter modules
 */
(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.features = MBC.features || {};

  var FINSWEET_MODULES = ['list', 'modal', 'slider', 'filter'];
  var fsBusy = false;

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

  function wait(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  /**
   * Wait for Finsweet Attributes to be available
   */
  async function waitForFinsweet(timeout) {
    timeout = timeout || 3000;
    var start = performance.now();

    while (performance.now() - start < timeout) {
      var fs = window.FinsweetAttributes;
      if (fs && typeof fs === 'object' && typeof fs.load === 'function') {
        return fs;
      }
      await wait(50);
    }

    return window.FinsweetAttributes || null;
  }

  /**
   * Detect which FS modules are needed for a container
   */
  function detectModules(container) {
    var modules = [];

    if (container.querySelector('[fs-list-element]')) {
      modules.push('list');
    }
    if (container.querySelector('[fs-list-element="tabs"], [fs-list-element="tab-link"]')) {
      modules.push('tabs');
    }
    if (container.querySelector('[fs-modal-element]')) {
      modules.push('modal');
    }
    if (container.querySelector('[fs-slider-element]')) {
      modules.push('slider');
    }
    if (container.querySelector('[fs-filter-element]')) {
      modules.push('filter');
    }

    return modules;
  }

  function pushUnique(modules, moduleName) {
    if (modules.indexOf(moduleName) === -1) {
      modules.push(moduleName);
    }
  }

  function resolveModules(container, requestedModules) {
    var source = requestedModules && requestedModules.length ? requestedModules.slice() : detectModules(container);
    var resolved = [];

    source.forEach(function (moduleName) {
      if (moduleName === 'modal') {
        pushUnique(resolved, 'modal');
        return;
      }

      if (moduleName === 'list' || moduleName === 'filter' || moduleName === 'slider' || moduleName === 'tabs') {
        pushUnique(resolved, 'list');
      }
    });

    return resolved;
  }

  function countMatches(container, selector) {
    var utils = MBC.core && MBC.core.utils;

    if (utils && typeof utils.countSelectorMatches === 'function') {
      return utils.countSelectorMatches(container, selector);
    }

    try {
      return container.querySelectorAll(selector).length;
    } catch (_) {
      return 0;
    }
  }

  function inspect(container, label) {
    var utils = MBC.core && MBC.core.utils;
    var selectorMap = {
      listElements: '[fs-list-element]',
      tabsElements: '[fs-list-element="tabs"]',
      tabLinkElements: '[fs-list-element="tab-link"]',
      filterElements: '[fs-filter-element]',
      filterInputs: 'input[fs-list-field], input[fs-list-value], select[fs-list-field], textarea[fs-list-field]',
      sliderElements: '[fs-slider-element]',
      modalElements: '[fs-modal-element]',
      paginationNext: '[data-pagination-next], [fs-list-element="pagination-next"]',
      paginationPrev: '[data-pagination-prev], [fs-list-element="pagination-previous"]',
      customPaginationNext: '[data-pagination="next"]',
      customPaginationPrev: '[data-pagination="prev"]'
    };
    var summary = utils && typeof utils.collectSelectorSummary === 'function'
      ? utils.collectSelectorSummary(container, selectorMap)
      : {
          listElements: countMatches(container, selectorMap.listElements),
          tabsElements: countMatches(container, selectorMap.tabsElements),
          tabLinkElements: countMatches(container, selectorMap.tabLinkElements),
          filterElements: countMatches(container, selectorMap.filterElements),
          filterInputs: countMatches(container, selectorMap.filterInputs),
          sliderElements: countMatches(container, selectorMap.sliderElements),
          modalElements: countMatches(container, selectorMap.modalElements),
          paginationNext: countMatches(container, selectorMap.paginationNext),
          paginationPrev: countMatches(container, selectorMap.paginationPrev),
          customPaginationNext: countMatches(container, selectorMap.customPaginationNext),
          customPaginationPrev: countMatches(container, selectorMap.customPaginationPrev)
        };

    summary.activeModules = detectModules(container);

    console.log('[MBC] Finsweet inspect ' + (label || ''), summary);
    return summary;
  }

  /**
   * Restart a specific FS module
   */
  async function restartModule(fs, moduleName, maxWait) {
    maxWait = maxWait || 2000;

    // Wait for module to finish loading if in progress
    if (fs.modules[moduleName]?.loading) {
      try {
        await Promise.race([fs.modules[moduleName].loading, wait(maxWait)]);
      } catch (_) {}
    }

    // Load module if not loaded
    if (!fs.modules[moduleName]?.restart && typeof fs.load === 'function') {
      try {
        await Promise.race([fs.load(moduleName), wait(maxWait)]);
      } catch (e) {
        console.warn('[MBC] FS load(' + moduleName + ') failed:', e);
      }
    }

    // Wait again after load
    if (fs.modules[moduleName]?.loading) {
      try {
        await Promise.race([fs.modules[moduleName].loading, wait(maxWait)]);
      } catch (_) {}
    }

    // Restart the module
    if (typeof fs.modules[moduleName]?.restart === 'function') {
      try {
        await Promise.resolve(fs.modules[moduleName].restart());
      } catch (e) {
        console.warn('[MBC] FS ' + moduleName + ' restart failed:', e);
      }
    }
  }

  async function destroyModule(fs, moduleName) {
    if (!fs || !fs.modules || !fs.modules[moduleName]) {
      return;
    }

    if (typeof fs.modules[moduleName].destroy === 'function') {
      try {
        await Promise.resolve(fs.modules[moduleName].destroy());
      } catch (e) {
        console.warn('[MBC] FS ' + moduleName + ' destroy failed:', e);
      }
    }
  }

  /**
   * Re-inject standalone modal scripts for SPA transitions
   * The standalone FS modal/a11y scripts self-initialize on load,
   * so re-injecting forces them to process the new DOM
   */
  function reinjectStandaloneModal() {
    var MODAL_URL = 'https://cdn.jsdelivr.net/npm/@finsweet/attributes-modal@1/modal.js';
    var A11Y_URL = 'https://cdn.jsdelivr.net/npm/@finsweet/attributes-a11y@1/a11y.js';
    var cacheBust = 'mbc_reload=' + Date.now();
    var modalSrc = MODAL_URL + (MODAL_URL.indexOf('?') === -1 ? '?' : '&') + cacheBust;
    var a11ySrc = A11Y_URL + (A11Y_URL.indexOf('?') === -1 ? '?' : '&') + cacheBust;

    // Remove old script tags for these URLs
    document.querySelectorAll('script').forEach(function (s) {
      if (s.src && (s.src.indexOf('attributes-modal') !== -1 || s.src.indexOf('attributes-a11y') !== -1)) {
        s.parentNode.removeChild(s);
      }
    });

    // Clear cache so loadExternalScript re-injects
    if (MBC.loader && MBC.loader.isExternalScriptLoaded) {
      // We need to clear the loaded state — access internal state
      // via the loader's tracking
    }

    return new Promise(function (resolve) {
      // Re-inject a11y first (dependency), then modal
      var a11yScript = document.createElement('script');
      a11yScript.type = 'module';
      a11yScript.src = a11ySrc;
      a11yScript.onload = function () {
        var modalScript = document.createElement('script');
        modalScript.type = 'module';
        modalScript.src = modalSrc;
        modalScript.onload = function () {
          // Give the module time to initialize
          setTimeout(resolve, 80);
        };
        modalScript.onerror = resolve;
        document.head.appendChild(modalScript);
      };
      a11yScript.onerror = resolve;
      document.head.appendChild(a11yScript);
    });
  }

  /**
   * Initialize Finsweet for a container
   */
  async function initFinsweet(container, options) {
    options = options || {};

    var neededModules = resolveModules(container, options.modules);
    if (!neededModules.length) return;

    inspect(container, options.label || 'init');

    // Modal-only: use standalone scripts (not the full FS library)
    var isModalOnly = neededModules.length === 1 && neededModules[0] === 'modal';

    if (isModalOnly) {
      // Standalone modal self-initializes — just re-inject for fresh DOM
      await traceAsync('finsweet reinject standalone modal', function () {
        return reinjectStandaloneModal();
      });
      return;
    }

    // Full FS library path (list, slider, filter, etc.)
    if (fsBusy) {
      console.log('[MBC] FS init skipped - already busy');
      return;
    }

    fsBusy = true;

    try {
      // Wait for Finsweet to be available
      var fs = await traceAsync('finsweet waitForFinsweet', function () {
        return waitForFinsweet(3000);
      });

      if (!fs || typeof fs.load !== 'function') {
        console.warn('[MBC] Finsweet Attributes not available');
        fsBusy = false;
        return;
      }

      // Ensure modules object exists
      if (!fs.modules) fs.modules = {};

      // Restart each needed module
      for (var i = 0; i < neededModules.length; i++) {
        var moduleName = neededModules[i];
        if (moduleName === 'modal') continue; // handled by standalone
        if (FINSWEET_MODULES.indexOf(moduleName) === -1) continue;

        await traceAsync('finsweet restart ' + moduleName, function () {
          return restartModule(fs, moduleName, 2000);
        });
      }

      // Wait for things to settle
      await traceAsync('finsweet settle wait 100ms', function () {
        return wait(100);
      });

      if (fs.modules && fs.modules.list) {
        console.log('[MBC] Finsweet list controls ready', {
          hasRestart: typeof fs.modules.list.restart === 'function',
          hasDestroy: typeof fs.modules.list.destroy === 'function',
          version: fs.modules.list.version || null,
          processSize: fs.process && typeof fs.process.size === 'number' ? fs.process.size : null
        });
      }

    } catch (e) {
      console.error('[MBC] Finsweet init failed:', e);
    } finally {
      fsBusy = false;
    }
  }

  async function restartFinsweet(container, options) {
    options = options || {};

    var neededModules = resolveModules(container || document, options.modules);
    if (!neededModules.length) return;

    var fs = await waitForFinsweet(3000);
    if (!fs) return;
    if (!fs.modules) fs.modules = {};

    for (var i = 0; i < neededModules.length; i++) {
      var moduleName = neededModules[i];
      if (moduleName === 'modal') continue;
      await restartModule(fs, moduleName, 2000);
    }
  }

  async function destroyFinsweet(options) {
    options = options || {};

    var fs = await waitForFinsweet(options.timeout || 800);
    if (!fs || !fs.modules) return;

    var requestedModules = options.modules && options.modules.length ? options.modules.slice() : Object.keys(fs.modules);
    var modulesToDestroy = [];

    requestedModules.forEach(function (moduleName) {
      if (moduleName === 'filter' || moduleName === 'slider') {
        moduleName = 'list';
      }

      if (moduleName === 'tabs') {
        moduleName = 'list';
      }
      if (modulesToDestroy.indexOf(moduleName) === -1) {
        modulesToDestroy.push(moduleName);
      }
    });

    for (var i = 0; i < modulesToDestroy.length; i++) {
      await destroyModule(fs, modulesToDestroy[i]);
    }
  }

  /**
   * Preload Finsweet script (call early to start loading)
   */
  function preload() {
    // If FS not present, the loader.js will inject it
    // This function can be called early to ensure it's ready
    return waitForFinsweet(5000);
  }

  MBC.features.finsweet = {
    destroy: destroyFinsweet,
    init: initFinsweet,
    detectModules: detectModules,
    inspect: inspect,
    preload: preload,
    restart: restartFinsweet,
    waitForFinsweet: waitForFinsweet
  };
})();
