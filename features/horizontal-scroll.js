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
    var lastWindowWidth = window.innerWidth;
    var lastWrapWidth = 0;
    var lastWrapScrollWidth = 0;
    var lastPanelCount = 0;

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

    function calculateDistance(wrap, panels, viewportWidth, gap) {
      var total = 0;

      panels.forEach(function (panel, index) {
        total += index < panels.length - 1 ? panel.offsetWidth + gap : panel.offsetWidth;
      });

      var last = panels[panels.length - 1];
      total += parseFloat(getComputedStyle(last).marginRight) || 0;
      total += parseFloat(getComputedStyle(wrap).paddingRight) || 0;

      return Math.max(0, total - viewportWidth);
    }

    function syncMeasurements(wrap, panels) {
      lastWindowWidth = window.innerWidth;
      lastWrapWidth = wrap ? wrap.clientWidth : 0;
      lastWrapScrollWidth = wrap ? wrap.scrollWidth : 0;
      lastPanelCount = panels ? panels.length : 0;
    }

    function shouldReflow(wrap, panels) {
      if (!wrap) return true;
      var should = false;
      if (window.innerWidth !== lastWindowWidth) should = true;
      if (panels.length !== lastPanelCount) should = true;
      if (Math.abs(wrap.clientWidth - lastWrapWidth) > 1) should = true;
      if (Math.abs(wrap.scrollWidth - lastWrapScrollWidth) > 1) should = true;
      console.log('[MBC HorizontalScroll] shouldReflow', {
        should: should,
        lastWindowWidth: lastWindowWidth,
        currentWindowWidth: window.innerWidth,
        lastWrapWidth: lastWrapWidth,
        currentWrapWidth: wrap.clientWidth,
        lastWrapScrollWidth: lastWrapScrollWidth,
        currentWrapScrollWidth: wrap.scrollWidth,
        lastPanelCount: lastPanelCount,
        currentPanelCount: panels.length
      });
      return should;
    }

    function createOrRefreshTrigger() {
      if (cleanedUp) return false;

      clearTween();

      var wrap = container.querySelector('[data-horizontal-scroll-wrap]');
      if (!wrap) {
        console.log('[MBC HorizontalScroll] no wrap found');
        return false;
      }

      var wrapRect = wrap.getBoundingClientRect();
      console.log('[MBC HorizontalScroll] createOrRefreshTrigger start', {
        wrapClientWidth: wrap.clientWidth,
        wrapScrollWidth: wrap.scrollWidth,
        wrapHeight: wrap.clientHeight,
        wrapRectWidth: wrapRect.width,
        wrapRectHeight: wrapRect.height,
        windowInnerWidth: window.innerWidth,
        windowInnerHeight: window.innerHeight,
        scrollTriggerActive: !!ScrollTrigger.getById('horizontal-pin')
      });

      clearPanelTransforms(wrap);

      var panels = gsap.utils.toArray('[data-horizontal-scroll-panel]', wrap);
      if (panels.length < 2) {
        console.log('[MBC HorizontalScroll] panels:', panels.length, 'distance: 0');
        return false;
      }

      console.log('[MBC HorizontalScroll] panels found', panels.length);

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
      var lastMarginRight = vw < 768 ? '1rem' : vw < 992 ? '1.5rem' : '2rem';
      last.style.marginRight = lastMarginRight;

      var getDistance = function () {
        return calculateDistance(wrap, panels, window.innerWidth, gap);
      };

      syncMeasurements(wrap, panels);

      var distance = getDistance();
      console.log('[MBC HorizontalScroll] distance details', {
        distance: distance,
        vw: window.innerWidth,
        gap: gap,
        wrapScrollWidth: wrap.scrollWidth,
        wrapClientWidth: wrap.clientWidth,
        wrapPaddingRight: getComputedStyle(wrap).paddingRight,
        lastMarginRight: getComputedStyle(last).marginRight,
        panelWidths: panels.map(function (panel) { return panel.offsetWidth; })
      });

      if (distance <= 0) {
        console.log('[MBC HorizontalScroll] distance 0, scrollWidth:', wrap.scrollWidth);
        return false;
      }

      tween = gsap.to(panels, {
        x: function () {
          return -getDistance();
        },
        ease: 'none',
        scrollTrigger: {
          id: 'horizontal-pin',
          trigger: wrap,
          start: 'top top',
          end: function () {
            return '+=' + getDistance();
          },
          scrub: 1,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefresh: function () {
            console.log('[MBC HorizontalScroll] ScrollTrigger onRefresh', {
              progress: this.progress,
              start: this.start,
              end: this.end,
              pinType: this.pinType,
              trigger: this.trigger && this.trigger.tagName
            });
          }
        }
      });

      console.log('[MBC HorizontalScroll] ScrollTrigger created', {
        totalDistance: distance,
        trigger: wrap.tagName,
        panelCount: panels.length
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
      if (window.innerWidth === lastWindowWidth) return;
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
        var liveWrap = container.querySelector('[data-horizontal-scroll-wrap]');
        var livePanels = liveWrap ? gsap.utils.toArray('[data-horizontal-scroll-panel]', liveWrap) : [];

        if (!shouldReflow(liveWrap, livePanels)) {
          return;
        }

        if (resizeRaf) {
          cancelAnimationFrame(resizeRaf);
        }
        resizeRaf = requestAnimationFrame(function () {
          resizeRaf = null;
          reflow();
        });
      });

      var observedWrap = container.querySelector('[data-horizontal-scroll-wrap]');
      if (observedWrap) {
        resizeObserver.observe(observedWrap);
      } else {
        resizeObserver.observe(container);
      }
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
