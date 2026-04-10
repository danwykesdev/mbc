(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.features = MBC.features || {};

  function setNavState(config) {
    var nav = document.querySelector(".nav");
    if (!nav) return;

    var theme = config && config.theme ? config.theme : "dark";
    var bg = config && config.bg ? config.bg : "solid";
    var blur = !!(config && config.blur);

    nav.setAttribute("data-nav-theme", theme);
    nav.setAttribute("data-nav-bg", bg);
    nav.setAttribute("data-nav-blur", blur ? "true" : "false");
  }

  MBC.features.nav = {
    setState: setNavState
  };
})();