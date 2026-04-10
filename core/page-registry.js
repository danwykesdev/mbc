(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.core = MBC.core || {};

  var pages = {};

  function register(namespace, moduleDef) {
    pages[String(namespace).toLowerCase()] = moduleDef;
  }

  function get(namespace) {
    return pages[String(namespace || "").toLowerCase()] || pages.default || null;
  }

  MBC.core.registry = {
    register: register,
    get: get,
    all: pages
  };
})();