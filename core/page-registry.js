(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.core = MBC.core || {};

  var pages = {};

  function normalize(namespace) {
    var utils = MBC.core && MBC.core.utils;

    if (utils && typeof utils.normalizeNamespace === "function") {
      return utils.normalizeNamespace(namespace);
    }

    return String(namespace || "").toLowerCase().trim();
  }

  function register(namespace, moduleDef) {
    pages[normalize(namespace)] = moduleDef;
  }

  function get(namespace) {
    return pages[normalize(namespace)] || pages.default || null;
  }

  MBC.core.registry = {
    register: register,
    get: get,
    all: pages
  };
})();