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
    'core/registry': { src: 'core/registry.js', deps: ['core/state'] },
    'core/webflow': { src: 'core/webflow-manager.js', deps: ['core/state', 'core/utils'] },
    'core/lifecycle': { src: 'core/lifecycle.js', deps: ['core/state', 'core/cleanup', 'core/registry', 'core/webflow'] },

    // Features - loaded based on DOM attributes
    'features/lenis': { src: 'features/lenis.js', deps: ['core/state'] },
    'features/nav': { src: 'features/nav.js', deps: [] },
    'features/mobile-nav': { src: 'features/mobile-nav.js', deps: [] },
    'features/scroll-direction': { src: 'features/scroll-direction.js', deps: ['core/state'] },
    'features/tabs': { src: 'features/tabs.js', deps: [], domCheck: '.project_component' },
    'features/hero': { src: 'features/hero.js', deps: ['core/state'], domCheck: '.hero-animate' },
    'features/videos': { src: 'features/videos.js', deps: [], domCheck: '[fs-modal-element]' },
    'features/finsweet': { src: 'features/finsweet.js', deps: [], domCheck: '[fs-list-element], [fs-modal-element], [fs-slider-element], [fs-filter-element]' },
    'features/horizontal-scroll': { src: 'features/horizontal-scroll.js', deps: ['core/state'], domCheck: '[data-horizontal-scroll]' },

    // Pages - loaded based on barba namespace
    'pages/home': { src: 'pages/home.js', deps: ['features/lenis', 'features/nav'], namespace: 'home' },
    'pages/projects': { src: 'pages/projects.js', deps: ['features/lenis', 'features/nav', 'features/horizontal-scroll'], namespace: 'projects' },
    'pages/project-detail': { src: 'pages/project-detail.js', deps: ['features/lenis', 'features/nav'], namespace: 'project-detail' },
    'pages/about': { src: 'pages/about.js', deps: ['features/lenis', 'features/nav'], namespace: 'about' },
    'pages/default': { src: 'pages/default.js', deps: ['features/lenis', 'features/nav'], namespace: 'default' }
  };

  var loadedModules = {};
  var loadingPromises = {};
  var basePath = '';

  // External scripts that may be loaded dynamically
  var EXTERNAL_SCRIPTS = {
    'finsweet-attributes': 'https://cdn.jsdelivr.net/npm/@finsweet/attributes@2.0.11/dist/attributes.js'
  };

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
  function loadScript(src) {
    if (loadingPromises[src]) {
      return loadingPromises[src];
    }

    var promise = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = src;
      script.async = true;

      script.onload = function () {
        resolve();
      };

      script.onerror = function () {
        reject(new Error('Failed to load: ' + src));
      };

      document.head.appendChild(script);
    });

    loadingPromises[src] = promise;
    return promise;
  }

  /**
   * Load external script (like Finsweet Attributes)
   */
  function loadExternalScript(name, url) {
    if (loadedModules['external:' + name]) {
      return Promise.resolve();
    }

    return loadScript(url).then(function () {
      loadedModules['external:' + name] = true;
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

    // 3. Collect all modules to load
    var modulesToLoad = ['core/state', 'core/utils', 'core/cleanup', 'core/registry', 'core/webflow', 'core/lifecycle'];
    modulesToLoad = modulesToLoad.concat(features);
    if (pageModule) {
      modulesToLoad.push(pageModule);
    }

    // 4. Check for Finsweet features
    var needsFinsweet = hasDomFeature(container, '[fs-list-element], [fs-modal-element], [fs-slider-element], [fs-filter-element]');

    // 5. Load all modules
    var promise = Promise.resolve();
    var loaded = [];

    modulesToLoad.forEach(function (moduleId) {
      if (loaded.indexOf(moduleId) !== -1) return;
      loaded.push(moduleId);

      promise = promise.then(function () {
        return loadModule(moduleId);
      });
    });

    // 6. Load Finsweet if needed
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
        hasFinsweet: needsFinsweet
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

  // Export loader API
  MBC.loader = {
    setBasePath: setBasePath,
    loadModule: loadModule,
    loadForPage: loadForPage,
    loadExternalScript: loadExternalScript,
    detectFeatures: detectFeatures,
    getPageModule: getPageModule,
    isLoaded: isLoaded,
    preload: preload,
    hasDomFeature: hasDomFeature
  };
})();
