(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.features = MBC.features || {};
  var mobileBarListenerBound = false;

  function syncMobileMenuBars() {
    var bars = document.querySelectorAll('.nav-menu_btn-bar');
    if (!bars.length) return;

    var isMobile = window.innerWidth <= 991;

    bars.forEach(function (bar) {
      if (!bar || !bar.style) return;

      if (isMobile) {
        bar.style.borderColor = '#111111';
      } else {
        bar.style.borderColor = '';
      }
    });
  }

  function ensureMobileBarListener() {
    if (mobileBarListenerBound) return;
    mobileBarListenerBound = true;

    window.addEventListener('resize', syncMobileMenuBars, { passive: true });
  }

  function setNavState(config) {
    var nav = document.querySelector(".nav");
    ensureMobileBarListener();
    if (!nav) {
      syncMobileMenuBars();
      return;
    }

    var theme = config && config.theme ? config.theme : "dark";
    var bg = config && config.bg ? config.bg : "solid";
    var blur = !!(config && config.blur);

    nav.setAttribute("data-nav-theme", theme);
    nav.setAttribute("data-nav-bg", bg);
    nav.setAttribute("data-nav-blur", blur ? "true" : "false");
    syncMobileMenuBars();
  }

  ensureMobileBarListener();
  syncMobileMenuBars();

  MBC.features.nav = {
    setState: setNavState
  };
})();