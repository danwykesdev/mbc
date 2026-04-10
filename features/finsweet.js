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

  /**
   * Initialize Finsweet for a container
   */
  async function initFinsweet(container, options) {
    options = options || {};

    if (fsBusy) {
      console.log('[MBC] FS init skipped - already busy');
      return;
    }

    fsBusy = true;

    try {
      // Detect which modules are needed
      var neededModules = options.modules || detectModules(container);

      if (!neededModules.length) {
        fsBusy = false;
        return;
      }

      // Wait for Finsweet to be available
      var fs = await waitForFinsweet(3000);

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
        if (FINSWEET_MODULES.indexOf(moduleName) === -1) continue;

        await restartModule(fs, moduleName, 2000);
      }

      // Wait for things to settle
      await wait(100);

    } catch (e) {
      console.error('[MBC] Finsweet init failed:', e);
    } finally {
      fsBusy = false;
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
    init: initFinsweet,
    detectModules: detectModules,
    preload: preload,
    waitForFinsweet: waitForFinsweet
  };
})();
