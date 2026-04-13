(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.features = MBC.features || {};
  var mobileBarListenerBound = false;

  function syncMobileOpenStateStyles() {
    var nav = document.querySelector('.nav');
    var menuBtn = document.querySelector('.nav-menu_btn');
    var logo = document.querySelector('.nav-logo_link');
    var bars = document.querySelectorAll('.nav-menu_btn-bar');
    var isMobile = window.innerWidth <= 991;
    var isOpen = !!(nav && nav.classList.contains('is-open'));

    if (logo && logo.style) {
      if (isMobile && isOpen) {
        logo.style.color = '#111111';
      } else {
        logo.style.color = '';
      }
    }

    if (menuBtn && menuBtn.style) {
      if (isMobile && isOpen) {
        menuBtn.style.color = '#111111';
      } else {
        menuBtn.style.color = '';
      }
    }

    bars.forEach(function (bar) {
      if (!bar || !bar.style) return;

      if (isMobile && isOpen) {
        bar.style.borderColor = '#111111';
      }
    });
  }

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

    syncMobileOpenStateStyles();
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