/**
 * MBC Module Loader
 * Dynamic script loader with dependency resolution
 */
(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  // Module registry - defines dependencies and load conditions
  var MODULES = {
    // Core modules
    'core/state': { src: 'core/state.js', deps: [] },
    'core/utils': { src: 'core/utils.js', deps: [] },
    'core/cleanup': { src: 'core/cleanup.js', deps: [] },
    'core/registry': { src: 'core/page-registry.js', deps: ['core/state'] },
    'core/webflow': { src: 'core/webflow-manager.js', deps: ['core/state', 'core/utils'] },
    'core/lifecycle': { src: 'core/lifecycle.js', deps: ['core/state', 'core/cleanup', 'core/registry', 'core/webflow'] },

    // Features - loaded based on DOM attributes
    'features/lenis': { src: 'features/lenis.js', deps: ['core/state'] },
    'features/nav': { src: 'features/nav.js', deps: [] },
    'features/mobile-nav': { src: 'features/mobile-nav.js', deps: [] },
    'features/scroll-direction': { src: 'features/scroll-direction.js', deps: ['core/state'] },
    'features/tabs': { src: 'features/tabs.js', deps: [], domCheck: '.project_component' },
    'features/hero': { src: 'features/hero.js', deps: ['core/state'], domCheck: '.hero-animate' },
    'features/videos': { src: 'features/videos.js', deps: [], domCheck: '#videoLoad, #video, [data-video], [data-vimeo-id], [fs-modal-element]' },
    'features/finsweet': { src: 'features/finsweet.js', deps: [], domCheck: '[fs-list-element], [fs-modal-element], [fs-slider-element], [fs-filter-element]' },
    'features/horizontal-scroll': { src: 'features/horizontal-scroll.js', deps: ['core/state'], domCheck: '[data-horizontal-scroll], [data-horizontal-scroll-wrap], [data-horizontal-track], [data-horizontal-scroll-panel]' },

    // Pages - loaded based on barba namespace
    'pages/home': { src: 'pages/home.js', deps: ['features/lenis', 'features/nav', 'features/hero', 'features/tabs', 'features/videos', 'features/finsweet', 'features/horizontal-scroll'], namespace: 'home' },
    'pages/projects': { src: 'pages/projects.js', deps: ['features/lenis', 'features/nav', 'features/horizontal-scroll', 'features/finsweet'], namespace: 'projects' },
    'pages/project-detail': { src: 'pages/project-detail.js', deps: ['features/lenis', 'features/nav', 'features/videos', 'features/finsweet'], namespace: 'project-detail' },
    'pages/about': { src: 'pages/about.js', deps: ['features/lenis', 'features/nav', 'features/videos'], namespace: 'about' },
    'pages/default': { src: 'pages/default.js', deps: ['features/lenis', 'features/nav', 'features/videos'], namespace: 'default' }
  };

  var loadedModules = {};
  var loadingPromises = {};
  var basePath = '';

  // External scripts that may be loaded dynamically
  // type: 'module' means it's an ES module that needs type="module"
  var EXTERNAL_SCRIPTS = {
    'finsweet-attributes': { url: 'https://cdn.jsdelivr.net/npm/@finsweet/attributes@2/attributes.js', type: 'module' },
    'finsweet-modal': { url: 'https://cdn.jsdelivr.net/npm/@finsweet/attributes-modal@1/modal.js', type: 'module' },
    'vimeo-player': { url: 'https://player.vimeo.com/api/player.js', type: 'classic' }
  };

  // Track which external scripts are loaded
  var loadedExternalScripts = {};

  /**
   * Set the base path for loading modules
   */
  function setBasePath(path) {
    basePath = path.replace(/\/$/, '') + '/';
  }

  /**
   * Check if element or its children have attributes matching selector
   */
  function hasDomFeature(container, selector) {
    if (!container || !selector) return false;
    if (typeof selector === 'string') {
      return !!container.querySelector(selector);
    }
    if (Array.isArray(selector)) {
      return selector.some(function (s) { return !!container.querySelector(s); });
    }
    return false;
  }

  /**
   * Load a single script and return a promise
   */
  function loadScript(src, scriptType) {
    var cacheKey = src + (scriptType || '');

    if (loadingPromises[cacheKey]) {
      return loadingPromises[cacheKey];
    }

    var promise = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = src;
      script.async = true;

      if (scriptType === 'module') {
        script.type = 'module';
      }

      script.onload = function () {
        resolve();
      };

      script.onerror = function () {
        reject(new Error('Failed to load: ' + src));
      };

      document.head.appendChild(script);
    });

    loadingPromises[cacheKey] = promise;
    return promise;
  }

  /**
   * Load external script (like Finsweet Attributes, Vimeo)
   */
  function loadExternalScript(name, urlOrConfig) {
    if (loadedExternalScripts[name]) {
      return Promise.resolve();
    }

    if (loadingPromises['external:' + name]) {
      return loadingPromises['external:' + name];
    }

    // Support both string URL and config object
    var url, scriptType;
    if (typeof urlOrConfig === 'string') {
      url = urlOrConfig;
      scriptType = 'classic';
    } else {
      url = urlOrConfig.url;
      scriptType = urlOrConfig.type || 'classic';
    }

    var promise = loadScript(url, scriptType).then(function () {
      loadedExternalScripts[name] = true;
      delete loadingPromises['external:' + name];
    });

    loadingPromises['external:' + name] = promise;
    return promise;
  }

  /**
   * Wait for an external script to be available (window global)
   */
  function waitForExternalScript(name, windowGlobal, timeout) {
    timeout = timeout || 5000;
    var start = performance.now();

    return new Promise(function (resolve) {
      function check() {
        if (window[windowGlobal]) {
          resolve(true);
          return;
        }
        if (performance.now() - start > timeout) {
          console.warn('[MBC] Timeout waiting for:', name);
          resolve(false);
          return;
        }
        setTimeout(check, 50);
      }
      check();
    });
  }

  /**
   * Resolve dependency graph and return ordered array
   */
  function resolveDeps(moduleId, resolved, resolving) {
    resolved = resolved || [];
    resolving = resolving || {};

    if (resolved.indexOf(moduleId) !== -1) {
      return resolved;
    }

    if (resolving[moduleId]) {
      console.warn('[MBC Loader] Circular dependency detected:', moduleId);
      return resolved;
    }

    resolving[moduleId] = true;

    var module = MODULES[moduleId];
    if (module && module.deps) {
      module.deps.forEach(function (dep) {
        resolveDeps(dep, resolved, resolving);
      });
    }

    resolved.push(moduleId);
    delete resolving[moduleId];

    return resolved;
  }

  /**
   * Load a module and its dependencies
   */
  function loadModule(moduleId) {
    if (loadedModules[moduleId]) {
      return Promise.resolve();
    }

    var module = MODULES[moduleId];
    if (!module) {
      return Promise.reject(new Error('Unknown module: ' + moduleId));
    }

    // Resolve all dependencies in order
    var deps = resolveDeps(moduleId);

    // Load each dependency sequentially
    var promise = Promise.resolve();
    deps.forEach(function (depId) {
      if (!loadedModules[depId]) {
        var dep = MODULES[depId];
        if (dep) {
          promise = promise.then(function () {
            return loadScript(basePath + dep.src);
          }).then(function () {
            loadedModules[depId] = true;
          });
        }
      }
    });

    return promise;
  }

  /**
   * Detect which feature modules are needed for a container
   */
  function detectFeatures(container) {
    var features = [];

    Object.keys(MODULES).forEach(function (moduleId) {
      if (moduleId.indexOf('features/') !== 0) return;

      var module = MODULES[moduleId];
      if (module.domCheck && hasDomFeature(container, module.domCheck)) {
        features.push(moduleId);
      }
    });

    return features;
  }

  /**
   * Get page module for namespace
   */
  function getPageModule(namespace) {
    var ns = String(namespace || '').toLowerCase();

    for (var moduleId in MODULES) {
      if (MODULES[moduleId].namespace === ns) {
        return moduleId;
      }
    }

    return 'pages/default';
  }

  /**
   * Load all modules needed for a page transition
   */
  function loadForPage(container, namespace) {
    // 1. Detect features needed for this container
    var features = detectFeatures(container);

    // 2. Get page module for namespace
    var pageModule = getPageModule(namespace);

    // 3. Detect external script needs
    var needsFinsweetModal = hasDomFeature(container, '[fs-modal-element]') || hasDomFeature(document, '[fs-modal-element]');
    var needsVimeo = hasDomFeature(container, '#videoLoad, #video, [data-video], [data-vimeo-id], [data-modal-video]') || hasDomFeature(document, '#videoLoad, #video, [data-video], [data-vimeo-id], [data-modal-video]');
    var needsFinsweetList = hasDomFeature(container, '[fs-list-element], [fs-slider-element], [fs-filter-element]') || hasDomFeature(document, '[fs-list-element], [fs-slider-element], [fs-filter-element]');
    var needsFinsweet = needsFinsweetModal || needsFinsweetList;

    // 4. Collect all modules to load
    var modulesToLoad = ['core/state', 'core/utils', 'core/cleanup', 'core/registry', 'core/webflow', 'core/lifecycle'];
    modulesToLoad = modulesToLoad.concat(features);
    if (pageModule) {
      modulesToLoad.push(pageModule);
    }

    // 5. Load external scripts first (so they're available for modules)
    var promise = Promise.resolve();

    // Load Vimeo player if needed
    if (needsVimeo) {
      promise = promise.then(function () {
        return loadExternalScript('vimeo-player', EXTERNAL_SCRIPTS['vimeo-player']);
      });
    }

    // Load Finsweet modal if needed (ES module)
    if (needsFinsweetModal) {
      promise = promise.then(function () {
        return loadExternalScript('finsweet-modal', EXTERNAL_SCRIPTS['finsweet-modal']);
      });
    }

    // 6. Load all modules
    var loaded = [];
    modulesToLoad.forEach(function (moduleId) {
      if (loaded.indexOf(moduleId) !== -1) return;
      loaded.push(moduleId);

      promise = promise.then(function () {
        return loadModule(moduleId);
      });
    });

    // 7. Load Finsweet Attributes if needed (list/filter/slider)
    if (needsFinsweet) {
      promise = promise.then(function () {
        return loadExternalScript('finsweet-attributes', EXTERNAL_SCRIPTS['finsweet-attributes']);
      }).then(function () {
        // Also load our Finsweet integration module
        return loadModule('features/finsweet');
      });
    }

    return promise.then(function () {
      return {
        features: features,
        pageModule: pageModule,
        hasFinsweet: needsFinsweet,
        hasFinsweetModal: needsFinsweetModal,
        hasVimeo: needsVimeo
      };
    });
  }

  /**
   * Check if a module is loaded
   */
  function isLoaded(moduleId) {
    return !!loadedModules[moduleId];
  }

  /**
   * Preload modules (for performance optimization)
   */
  function preload(moduleIds) {
    return Promise.all(moduleIds.map(function (id) {
      return loadModule(id).catch(function () { /* ignore preload errors */ });
    }));
  }

  /**
   * Check if external script is loaded
   */
  function isExternalScriptLoaded(name) {
    return !!loadedExternalScripts[name];
  }

  // Export loader API
  MBC.loader = {
    setBasePath: setBasePath,
    loadModule: loadModule,
    loadForPage: loadForPage,
    loadExternalScript: loadExternalScript,
    waitForExternalScript: waitForExternalScript,
    isExternalScriptLoaded: isExternalScriptLoaded,
    detectFeatures: detectFeatures,
    getPageModule: getPageModule,
    isLoaded: isLoaded,
    preload: preload,
    hasDomFeature: hasDomFeature
  };
})();
