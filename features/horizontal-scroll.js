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
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      return null;
    }

    if (activeInstance && typeof activeInstance.cleanup === 'function') {
      activeInstance.cleanup();
    }

    killTriggerById('horizontal-pin');

    var tween = null;
    var resizeRaf = null;
    var retryTimer = null;
    var delayedReflowTimer = null;
    var resizeObserver = null;
    var retryAttempts = 0;
    var maxRetries = 12;
    var cleanedUp = false;

    function clearPanelTransforms(wrap) {
      if (!wrap) return;

      var livePanels = gsap.utils.toArray('[data-horizontal-scroll-panel]', wrap);
      if (!livePanels.length) return;

      gsap.killTweensOf(livePanels);
      gsap.set(livePanels, { clearProps: 'transform,x,y,translate,rotate,scale' });
    }

    function clearTween() {
      var liveWrap = container.querySelector('[data-horizontal-scroll-wrap]');

      killTriggerById('horizontal-pin');
      if (tween) {
        try {
          tween.kill();
        } catch (_) {}
      }

      clearPanelTransforms(liveWrap);
      tween = null;
    }

    function createOrRefreshTrigger() {
      if (cleanedUp) return false;

      clearTween();

      var wrap = container.querySelector('[data-horizontal-scroll-wrap]');
      if (!wrap) {
        console.log('[MBC HorizontalScroll] no wrap found');
        return false;
      }

      clearPanelTransforms(wrap);

      var panels = gsap.utils.toArray('[data-horizontal-scroll-panel]', wrap);
      if (panels.length < 2) {
        console.log('[MBC HorizontalScroll] panels:', panels.length, 'distance: 0');
        return false;
      }

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

      var track = first && first.parentElement ? first.parentElement : null;

      var total = 0;
      panels.forEach(function (p, i) {
        total += i < panels.length - 1 ? p.offsetWidth + gap : p.offsetWidth;
      });

      total += parseFloat(getComputedStyle(last).marginRight) || 0;
      total += parseFloat(getComputedStyle(wrap).paddingRight) || 0;

      var liveTrackWidth = track ? track.scrollWidth : 0;
      var liveWrapWidth = wrap.scrollWidth;
      total = Math.max(total, liveTrackWidth, liveWrapWidth);

      var distance = Math.max(0, total - vw);
      console.log('[MBC HorizontalScroll] panels:', panels.length, 'panel[0] width:', panels[0].offsetWidth, 'trackWidth:', liveTrackWidth, 'wrapWidth:', liveWrapWidth, 'total:', total, 'vw:', vw, 'distance:', distance);

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

    function scheduleDelayedReflow(delay) {
      if (cleanedUp) return;

      if (delayedReflowTimer) {
        clearTimeout(delayedReflowTimer);
      }

      delayedReflowTimer = setTimeout(function () {
        delayedReflowTimer = null;
        if (cleanedUp) return;
        reflow();
      }, delay);
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
      scheduleDelayedReflow(2000);
    };

    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('load', onWindowLoad, { once: true });

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(function () {
        if (cleanedUp) return;
        if (resizeRaf) {
          cancelAnimationFrame(resizeRaf);
        }
        resizeRaf = requestAnimationFrame(function () {
          resizeRaf = null;
          reflow();
        });
      });

      resizeObserver.observe(container);
    }

    reflow();
    scheduleDelayedReflow(700);
    scheduleDelayedReflow(2000);

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

      if (delayedReflowTimer) {
        clearTimeout(delayedReflowTimer);
        delayedReflowTimer = null;
      }

      if (resizeRaf) {
        cancelAnimationFrame(resizeRaf);
        resizeRaf = null;
      }

      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
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
