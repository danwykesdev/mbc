(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.features = MBC.features || {};

  function initScrollDirection() {
    if (window.__mbcScrollDirectionBound) return function () {};
    window.__mbcScrollDirectionBound = true;

    var nav = document.querySelector('.nav');
    var lastY = window.scrollY;
    var isHidden = false;
    var ticking = false;
    var HIDE_AFTER_PX = 80;
    var MIN_DELTA = 6;

    function showNav() {
      if (!nav || !isHidden || typeof gsap === 'undefined') return;

      isHidden = false;
      gsap.to(nav, {
        yPercent: 0,
        y: 0,
        duration: 0.45,
        ease: 'power3.out',
        overwrite: 'auto'
      });
    }

    function hideNav() {
      if (!nav || isHidden || typeof gsap === 'undefined') return;
      if (MBC.core && MBC.core.state && MBC.core.state.heroAnimating) return;
      if (nav.classList.contains('is-open')) return;

      isHidden = true;
      gsap.to(nav, {
        yPercent: -110,
        duration: 0.3,
        ease: 'power2.inOut',
        overwrite: 'auto'
      });
    }

    window.__resetNavScrollHide = function () {
      isHidden = false;
      lastY = window.scrollY;

      if (nav && typeof gsap !== 'undefined') {
        gsap.killTweensOf(nav);
        gsap.set(nav, { yPercent: 0, y: 0 });
      }
    };

    function onScroll() {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(function () {
        var y = window.scrollY;
        var diff = y - lastY;

        if (y <= 0) {
          showNav();
          lastY = y;
          ticking = false;
          return;
        }

        if (Math.abs(diff) >= MIN_DELTA) {
          if (diff > 0 && y > HIDE_AFTER_PX) {
            hideNav();
          } else if (diff < 0) {
            showNav();
          }

          lastY = y;
        }

        ticking = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });

    return function cleanup() {
      window.removeEventListener("scroll", onScroll);
      window.__mbcScrollDirectionBound = false;

      if (window.__resetNavScrollHide) {
        delete window.__resetNavScrollHide;
      }

      if (nav && typeof gsap !== 'undefined') {
        gsap.killTweensOf(nav);
        gsap.set(nav, { clearProps: 'transform' });
      }
    };
  }

  MBC.features.scrollDirection = {
    init: initScrollDirection
  };
})();