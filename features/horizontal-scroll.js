/**
 * Horizontal Scroll Feature
 * GSAP ScrollTrigger-powered horizontal scrolling section
 * Used on Projects page
 */
(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.features = MBC.features || {};

  function initHorizontalScroll(container) {
    var wrap = container.querySelector('[data-horizontal-scroll-wrap]');
    if (!wrap || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      return null;
    }

    var existing = ScrollTrigger.getById('horizontal-pin');
    if (existing) existing.kill();

    var panels = gsap.utils.toArray(container.querySelectorAll('[data-horizontal-scroll-panel]'));
    if (panels.length < 2) return null;

    var vw = window.innerWidth;
    wrap.style.paddingRight = vw < 768 ? '20px' : vw < 992 ? '40px' : '80px';

    var first = panels[0];
    var second = panels[1];
    var gap = 14;

    if (first && second) {
      var a = first.getBoundingClientRect();
      var b = second.getBoundingClientRect();
      gap = Math.max(0, b.left - (a.left + a.width)) || (parseFloat(getComputedStyle(first).marginRight) || 14);
    }

    var last = panels[panels.length - 1];
    last.style.marginRight = vw < 768 ? '1rem' : vw < 992 ? '1.5rem' : '2rem';

    var total = 0;
    panels.forEach(function (p, i) {
      total += i < panels.length - 1 ? p.offsetWidth + gap : p.offsetWidth;
    });

    total += parseFloat(getComputedStyle(last).marginRight) || 0;
    total += parseFloat(getComputedStyle(wrap).paddingRight) || 0;

    var distance = Math.max(0, total - vw);
    if (distance <= 0) return null;

    var tween = gsap.to(panels, {
      x: function () {
        return -distance;
      },
      ease: 'none',
      scrollTrigger: {
        id: 'horizontal-pin',
        trigger: wrap,
        start: 'top top',
        end: function () {
          return '+=' + distance;
        },
        scrub: 1,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });

    // Handle resize
    var onResize = function () {
      ScrollTrigger.refresh();
    };

    window.addEventListener('resize', onResize, { passive: true });

    // Cleanup function
    return function cleanup() {
      if (tween && tween.scrollTrigger) tween.scrollTrigger.kill();
      if (tween) tween.kill();
      window.removeEventListener('resize', onResize);
    };
  }

  MBC.features.horizontalScroll = {
    init: initHorizontalScroll
  };
})();
