/**
 * Horizontal Scroll Feature
 * GSAP ScrollTrigger-powered horizontal scrolling section
 * Used on Projects page
 */
(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.features = MBC.features || {};
  var activeInstance = null;

  function killTriggerById(id) {
    if (typeof ScrollTrigger === 'undefined') return;

    var trigger = ScrollTrigger.getById(id);
    if (!trigger) return;

    try {
      trigger.kill();
    } catch (_) {}
  }

  function initHorizontalScroll(container) {
    var wrap = container.querySelector('[data-horizontal-scroll-wrap]');
    if (!wrap || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      return null;
    }

    if (activeInstance && typeof activeInstance.cleanup === 'function') {
      activeInstance.cleanup();
    }

    killTriggerById('horizontal-pin');

    var panels = gsap.utils.toArray(container.querySelectorAll('[data-horizontal-scroll-panel]'));
    if (panels.length < 2) return null;

    var tween = null;
    var resizeRaf = null;
    var retryTimer = null;
    var retryAttempts = 0;
    var maxRetries = 12;
    var cleanedUp = false;

    function clearTween() {
      killTriggerById('horizontal-pin');
      if (tween) {
        try {
          tween.kill();
        } catch (_) {}
      }
      tween = null;
    }

    function createOrRefreshTrigger() {
      if (cleanedUp) return false;

      clearTween();

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
      if (distance <= 0) return false;

      tween = gsap.to(panels, {
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

      ScrollTrigger.refresh(true);
      return true;
    }

    function scheduleRetry() {
      if (cleanedUp || retryAttempts >= maxRetries) return;

      if (retryTimer) {
        clearTimeout(retryTimer);
      }

      var delay = retryAttempts === 0 ? 0 : 120;
      retryTimer = setTimeout(function () {
        retryTimer = null;
        if (cleanedUp) return;
        retryAttempts += 1;

        if (!createOrRefreshTrigger()) {
          scheduleRetry();
        }
      }, delay);
    }

    function reflow() {
      retryAttempts = 0;
      if (!createOrRefreshTrigger()) {
        scheduleRetry();
      }
    }

    var onResize = function () {
      if (cleanedUp) return;
      if (resizeRaf) {
        cancelAnimationFrame(resizeRaf);
      }
      resizeRaf = requestAnimationFrame(function () {
        resizeRaf = null;
        reflow();
      });
    };

    var onWindowLoad = function () {
      reflow();
    };

    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('load', onWindowLoad, { once: true });
    reflow();

    var api = {
      reflow: reflow,
      cleanup: cleanup
    };

    activeInstance = api;

    function cleanup() {
      cleanedUp = true;

      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }

      if (resizeRaf) {
        cancelAnimationFrame(resizeRaf);
        resizeRaf = null;
      }

      window.removeEventListener('resize', onResize);
      window.removeEventListener('load', onWindowLoad);

      clearTween();

      if (activeInstance === api) {
        activeInstance = null;
      }
    }

    return cleanup;
  }

  MBC.features.horizontalScroll = {
    init: initHorizontalScroll,
    reflow: function () {
      if (activeInstance && typeof activeInstance.reflow === 'function') {
        activeInstance.reflow();
      }
    }
  };
})();
