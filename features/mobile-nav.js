(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.features = MBC.features || {};

  function initMobileNav() {
    var menuBtn = document.querySelector(".nav-menu_btn");
    var nav = document.querySelector(".nav");

    if (!menuBtn || !nav) return function () {};

    function onClick() {
      nav.classList.toggle("is-open");
    }

    menuBtn.addEventListener("click", onClick);

    return function cleanup() {
      menuBtn.removeEventListener("click", onClick);
      nav.classList.remove("is-open");
    };
  }

  MBC.features.mobileNav = {
    init: initMobileNav
  };
})();