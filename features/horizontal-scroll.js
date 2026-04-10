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
    var scrollSection = container.querySelector('[data-horizontal-scroll]');
    if (!scrollSection || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      return null;
    }

    var track = scrollSection.querySelector('[data-horizontal-track]');
    if (!track) return null;

    var items = Array.from(track.children);
    if (!items.length) return null;

    // Calculate total scroll distance
    var getScrollAmount = function () {
      var trackWidth = track.scrollWidth;
      var viewportWidth = window.innerWidth;
      return -(trackWidth - viewportWidth);
    };

    // Create the horizontal scroll tween
    var tween = gsap.to(track, {
      x: getScrollAmount,
      ease: 'none'
    });

    // Create ScrollTrigger
    var st = ScrollTrigger.create({
      trigger: scrollSection,
      start: 'top top',
      end: function () {
        return '+=' + Math.abs(getScrollAmount());
      },
      pin: true,
      scrub: 1,
      animation: tween,
      invalidateOnRefresh: true,
      id: 'horizontal-pin',
      onRefresh: function () {
        // Recalculate on resize
        tween.vars.x = getScrollAmount();
        tween.invalidate();
      }
    });

    // Handle resize
    var onResize = function () {
      ScrollTrigger.refresh();
    };

    window.addEventListener('resize', onResize, { passive: true });

    // Cleanup function
    return function cleanup() {
      st.kill();
      window.removeEventListener('resize', onResize);
    };
  }

  MBC.features.horizontalScroll = {
    init: initHorizontalScroll
  };
})();
