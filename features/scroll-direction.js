(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.features = MBC.features || {};

  function initScrollDirection() {
    if (window.__mbcScrollDirectionBound) return function () {};
    window.__mbcScrollDirectionBound = true;

    var lastY = window.scrollY;
    var ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(function () {
        var y = window.scrollY;
        var dir = y > lastY ? "down" : "up";

        document.querySelectorAll("[data-scrolling-direction]").forEach(function (el) {
          el.setAttribute("data-scrolling-direction", dir);
        });

        lastY = y;
        ticking = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });

    return function cleanup() {
      window.removeEventListener("scroll", onScroll);
      window.__mbcScrollDirectionBound = false;
    };
  }

  MBC.features.scrollDirection = {
    init: initScrollDirection
  };
})();