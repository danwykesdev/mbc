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
  var activeContainer = null;
  var DEBUG_PREFIX = '[MBC HorizontalScroll Debug]';

  function isDebugEnabled() {
    return window.MBC_HORIZONTAL_SCROLL_DEBUG !== false;
  }

  function debugLog() {
    if (!isDebugEnabled() || typeof console === 'undefined') {
      return;
    }

    var logger = typeof console.warn === 'function' ? console.warn : console.log;
    if (typeof logger !== 'function') {
      return;
    }

    var args = Array.prototype.slice.call(arguments);

    if (!args.length || typeof args[0] !== 'string') {
      args.unshift(DEBUG_PREFIX);
    } else if (args[0].indexOf(DEBUG_PREFIX) !== 0) {
      args[0] = DEBUG_PREFIX + ' ' + args[0];
    }

    logger.apply(console, args);
  }

  function getPinSpacerMetrics(wrap) {
    var spacer = wrap && wrap.parentNode && wrap.parentNode.classList && wrap.parentNode.classList.contains('pin-spacer')
      ? wrap.parentNode
      : null;

    return {
      spacerClassName: spacer ? spacer.className : null,
      spacerHeight: spacer ? spacer.style.height || null : null,
      spacerPaddingBottom: spacer ? spacer.style.paddingBottom || null : null,
      wrapHeight: wrap ? wrap.style.height || null : null,
      wrapMaxHeight: wrap ? wrap.style.maxHeight || null : null,
      wrapTransform: wrap ? wrap.style.transform || null : null
    };
  }

  function getElementSummary(element) {
    if (!element) {
      return null;
    }

    var rect = typeof element.getBoundingClientRect === 'function'
      ? element.getBoundingClientRect()
      : null;
    var classes = typeof element.className === 'string'
      ? element.className
      : (element.className && typeof element.className.baseVal === 'string' ? element.className.baseVal : '');

    return {
      tagName: element.tagName || null,
      id: element.id || null,
      className: classes || null,
      dataThemeSection: typeof element.getAttribute === 'function' ? element.getAttribute('data-theme-section') : null,
      rect: rect ? {
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      } : null
    };
  }

  function findVideoSectionAnchor(wrap, container) {
    var candidate = null;
    var pointer = wrap && wrap.parentNode && wrap.parentNode.classList && wrap.parentNode.classList.contains('pin-spacer')
      ? wrap.parentNode.previousElementSibling
      : wrap ? wrap.previousElementSibling : null;

    while (pointer) {
      if (
        (pointer.matches && pointer.matches('.is-video, section.is-video, [data-theme-section]')) ||
        (pointer.classList && pointer.classList.contains('is-video'))
      ) {
        candidate = pointer;
        break;
      }

      pointer = pointer.previousElementSibling;
    }

    if (!candidate && container && container.querySelector) {
      candidate = container.querySelector('.is-video, section.is-video');
    }

    return candidate;
  }

  function collectSectionDebugSnapshot(container, wrap, trigger, reason) {
    var spacer = wrap && wrap.parentNode && wrap.parentNode.classList && wrap.parentNode.classList.contains('pin-spacer')
      ? wrap.parentNode
      : null;
    var videoSection = findVideoSectionAnchor(wrap, container);
    var videoRect = videoSection && typeof videoSection.getBoundingClientRect === 'function'
      ? videoSection.getBoundingClientRect()
      : null;
    var spacerRect = spacer && typeof spacer.getBoundingClientRect === 'function'
      ? spacer.getBoundingClientRect()
      : null;
    var wrapRect = wrap && typeof wrap.getBoundingClientRect === 'function'
      ? wrap.getBoundingClientRect()
      : null;

    return {
      reason: reason || null,
      scrollY: Math.round(window.scrollY || window.pageYOffset || 0),
      viewportHeight: window.innerHeight,
      trigger: trigger ? {
        isActive: !!trigger.isActive,
        progress: typeof trigger.progress === 'number' ? Number(trigger.progress.toFixed(4)) : null,
        direction: trigger.direction || null,
        start: typeof trigger.start === 'number' ? Math.round(trigger.start) : trigger.start || null,
        end: typeof trigger.end === 'number' ? Math.round(trigger.end) : trigger.end || null,
        pinType: trigger.pinType || null
      } : null,
      spacer: getElementSummary(spacer),
      wrap: getElementSummary(wrap),
      videoSection: getElementSummary(videoSection),
      relationships: {
        videoBottomToSpacerTop: videoRect && spacerRect ? Math.round(spacerRect.top - videoRect.bottom) : null,
        videoBottomToWrapTop: videoRect && wrapRect ? Math.round(wrapRect.top - videoRect.bottom) : null,
        spacerTopToWrapTop: spacerRect && wrapRect ? Math.round(wrapRect.top - spacerRect.top) : null
      },
      pinSpacerMetrics: getPinSpacerMetrics(wrap)
    };
  }

  function logSectionDebugSnapshot(container, wrap, trigger, reason) {
    debugLog('[MBC HorizontalScroll] section snapshot', collectSectionDebugSnapshot(container, wrap, trigger, reason));
  }

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
      debugLog('init aborted', {
        hasGsap: typeof gsap !== 'undefined',
        hasScrollTrigger: typeof ScrollTrigger !== 'undefined'
      });
      return null;
    }

    // Only reuse if same container AND it's still in the live DOM
    if (
      activeInstance &&
      activeContainer === container &&
      document.documentElement.contains(container) &&
      typeof activeInstance.reflow === 'function' &&
      typeof activeInstance.cleanup === 'function'
    ) {
      debugLog('init reuse existing instance', {
        hasContainer: !!container,
        windowInnerWidth: window.innerWidth,
        windowInnerHeight: window.innerHeight
      });
      activeInstance.reflow();
      return activeInstance.cleanup;
    }

    debugLog('init start', {
      hasContainer: !!container,
      windowInnerWidth: window.innerWidth,
      windowInnerHeight: window.innerHeight,
      isTouch: ScrollTrigger.isTouch,
      normalizeScrollActive: !!(typeof ScrollTrigger.normalizeScroll === 'function' && ScrollTrigger.normalizeScroll()),
      hadStaleInstance: !!(activeInstance && activeContainer !== container)
    });

    // Always fully clean up any previous instance before creating a new one
    if (activeInstance && typeof activeInstance.cleanup === 'function') {
      debugLog('init cleanup stale instance');
      activeInstance.cleanup();
      activeInstance = null;
      activeContainer = null;
    }

    // Kill any orphaned ScrollTrigger from a previous page
    killTriggerById('horizontal-pin');

    var tween = null;
    var resizeRaf = null;
    var retryTimer = null;
    var delayedReflowTimer = null;
    var resizeObserver = null;
    var retryAttempts = 0;
    var maxRetries = 12;
    var cleanedUp = false;
    var isReflowing = false;
    var lastWindowWidth = window.innerWidth;
    var lastWrapWidth = 0;
    var lastPanelCount = 0;
    var lastTotalPanelWidth = 0;
    var suppressAutoReflow = ScrollTrigger.isTouch === 1 || window.innerWidth <= 991;
    var hasResizeObserver = typeof ResizeObserver !== 'undefined';
    var useDelayedReflowFallback = !suppressAutoReflow && !hasResizeObserver;
    var scrollSampleRaf = null;
    var lastScrollSample = null;
    var lastLoggedDirection = 0;

    debugLog('[MBC HorizontalScroll] auto reflow mode', {
      suppressAutoReflow: suppressAutoReflow,
      useDelayedReflowFallback: useDelayedReflowFallback,
      isTouch: ScrollTrigger.isTouch,
      windowInnerWidth: window.innerWidth
    });

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

    function shouldLogScrollSample(snapshot, force) {
      if (!snapshot) return false;
      if (force || !lastScrollSample) return true;

      var trigger = snapshot.trigger || {};
      var lastTrigger = lastScrollSample.trigger || {};
      var relationships = snapshot.relationships || {};
      var lastRelationships = lastScrollSample.relationships || {};

      if (trigger.isActive !== lastTrigger.isActive) return true;
      if (Math.abs((trigger.progress || 0) - (lastTrigger.progress || 0)) >= 0.08) return true;
      if (Math.abs((relationships.videoBottomToSpacerTop || 0) - (lastRelationships.videoBottomToSpacerTop || 0)) >= 24) return true;
      if (Math.abs((relationships.videoBottomToWrapTop || 0) - (lastRelationships.videoBottomToWrapTop || 0)) >= 24) return true;

      return false;
    }

    function sampleScrollState(reason, force) {
      var liveWrap = container.querySelector('[data-horizontal-scroll-wrap]');
      var trigger = typeof ScrollTrigger !== 'undefined' ? ScrollTrigger.getById('horizontal-pin') : null;
      var snapshot = collectSectionDebugSnapshot(container, liveWrap, trigger, reason);

      if (!shouldLogScrollSample(snapshot, force)) {
        return;
      }

      lastScrollSample = snapshot;
      debugLog('[MBC HorizontalScroll] scroll sample', snapshot);
    }

    function scheduleScrollSample(reason, force) {
      if (cleanedUp || scrollSampleRaf) return;

      scrollSampleRaf = requestAnimationFrame(function () {
        scrollSampleRaf = null;
        sampleScrollState(reason, force);
      });
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
      lastPanelCount = panels ? panels.length : 0;
      
      var totalPanelWidth = 0;
      if (panels && panels.length) {
        panels.forEach(function(p) { totalPanelWidth += p.offsetWidth; });
      }
      lastTotalPanelWidth = totalPanelWidth;
    }

    function shouldReflow(wrap, panels) {
      if (!wrap) return true;

      if (suppressAutoReflow) {
        debugLog('[MBC HorizontalScroll] shouldReflow suppressed', {
          suppressAutoReflow: suppressAutoReflow,
          currentWindowWidth: window.innerWidth,
          wrapClientWidth: wrap.clientWidth,
          wrapScrollWidth: wrap.scrollWidth,
          panelCount: panels.length
        });
        return false;
      }

      var should = false;
      if (window.innerWidth !== lastWindowWidth) should = true;
      if (panels.length !== lastPanelCount) should = true;
      if (Math.abs(wrap.clientWidth - lastWrapWidth) > 1) should = true;
      
      var currentTotalPanelWidth = 0;
      panels.forEach(function(p) { currentTotalPanelWidth += p.offsetWidth; });
      if (Math.abs(currentTotalPanelWidth - lastTotalPanelWidth) > 10) should = true;

      debugLog('[MBC HorizontalScroll] shouldReflow', {
        should: should,
        lastWindowWidth: lastWindowWidth,
        currentWindowWidth: window.innerWidth,
        lastWrapWidth: lastWrapWidth,
        currentWrapWidth: wrap.clientWidth,
        lastPanelCount: lastPanelCount,
        currentPanelCount: panels.length,
        lastTotalPanelWidth: lastTotalPanelWidth,
        currentTotalPanelWidth: currentTotalPanelWidth
      });
      return should;
    }

    function createOrRefreshTrigger() {
      if (cleanedUp) return false;
      if (isReflowing) return false;

      isReflowing = true;

      // Disconnect ResizeObserver during DOM mutations to prevent re-entrant reflows
      if (resizeObserver) resizeObserver.disconnect();

      clearTween();

      var wrap = container.querySelector('[data-horizontal-scroll-wrap]');
      if (!wrap) {
        debugLog('[MBC HorizontalScroll] no wrap found');
        isReflowing = false;
        if (resizeObserver && !cleanedUp) resizeObserver.observe(container);
        return false;
      }

      var wrapRect = wrap.getBoundingClientRect();
      debugLog('[MBC HorizontalScroll] createOrRefreshTrigger start', {
        wrapClientWidth: wrap.clientWidth,
        wrapScrollWidth: wrap.scrollWidth,
        wrapHeight: wrap.clientHeight,
        wrapRectWidth: wrapRect.width,
        wrapRectHeight: wrapRect.height,
        windowInnerWidth: window.innerWidth,
        windowInnerHeight: window.innerHeight,
        scrollTriggerActive: !!ScrollTrigger.getById('horizontal-pin'),
        pinSpacer: getPinSpacerMetrics(wrap)
      });
      logSectionDebugSnapshot(container, wrap, ScrollTrigger.getById('horizontal-pin'), 'createOrRefreshTrigger:start');

      clearPanelTransforms(wrap);

      var panels = gsap.utils.toArray('[data-horizontal-scroll-panel]', wrap);
      if (panels.length < 2) {
        debugLog('[MBC HorizontalScroll] panels:', panels.length, 'distance: 0');
        isReflowing = false;
        if (resizeObserver && !cleanedUp) resizeObserver.observe(wrap);
        return false;
      }

      debugLog('[MBC HorizontalScroll] panels found', panels.length);

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
      debugLog('[MBC HorizontalScroll] distance details', {
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
        debugLog('[MBC HorizontalScroll] distance 0, scrollWidth:', wrap.scrollWidth);
        isReflowing = false;
        if (resizeObserver && !cleanedUp) {
          resizeObserver.observe(wrap || container);
        }
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
          onUpdate: function () {
            if (this.direction && this.direction !== lastLoggedDirection) {
              lastLoggedDirection = this.direction;
              logSectionDebugSnapshot(container, wrap, this, this.direction > 0 ? 'direction:down' : 'direction:up');
              return;
            }

            if (this.isActive || this.progress < 0.02 || this.progress > 0.98) {
              scheduleScrollSample('onUpdate', false);
            }
          },
          onToggle: function () {
            logSectionDebugSnapshot(container, wrap, this, this.isActive ? 'toggle:active' : 'toggle:inactive');
          },
          onEnter: function () {
            logSectionDebugSnapshot(container, wrap, this, 'enter');
          },
          onLeave: function () {
            logSectionDebugSnapshot(container, wrap, this, 'leave');
          },
          onEnterBack: function () {
            logSectionDebugSnapshot(container, wrap, this, 'enterBack');
          },
          onLeaveBack: function () {
            logSectionDebugSnapshot(container, wrap, this, 'leaveBack');
          },
          onRefresh: function () {
            debugLog('[MBC HorizontalScroll] ScrollTrigger onRefresh', {
              progress: this.progress,
              start: this.start,
              end: this.end,
              pinType: this.pinType,
              trigger: this.trigger && this.trigger.tagName,
              pinSpacer: getPinSpacerMetrics(wrap)
            });
            logSectionDebugSnapshot(container, wrap, this, 'refresh');
          }
        }
      });

      debugLog('[MBC HorizontalScroll] ScrollTrigger created', {
        totalDistance: distance,
        trigger: wrap.tagName,
        panelCount: panels.length,
        pinSpacer: getPinSpacerMetrics(wrap)
      });

      ScrollTrigger.refresh(true);
      sampleScrollState('post-refresh', true);

      // Re-snapshot after refresh so the ResizeObserver baseline matches the settled layout
      syncMeasurements(container.querySelector('[data-horizontal-scroll-wrap]') || wrap, panels);

      isReflowing = false;

      // Reconnect observer after all mutations are done
      if (resizeObserver && !cleanedUp) {
        var rewrap = container.querySelector('[data-horizontal-scroll-wrap]');
        resizeObserver.observe(rewrap || container);
      }

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
      if (cleanedUp || !useDelayedReflowFallback) {
        return;
      }

      if (delayedReflowTimer) {
        clearTimeout(delayedReflowTimer);
      }

      delayedReflowTimer = setTimeout(function () {
        var liveWrap;
        var livePanels;

        delayedReflowTimer = null;
        if (cleanedUp) return;

        liveWrap = container.querySelector('[data-horizontal-scroll-wrap]');
        livePanels = liveWrap ? gsap.utils.toArray('[data-horizontal-scroll-panel]', liveWrap) : [];

        if (!shouldReflow(liveWrap, livePanels)) {
          debugLog('[MBC HorizontalScroll] delayed reflow skipped', {
            reason: 'no layout change detected'
          });
          return;
        }

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

    var onScroll = function () {
      scheduleScrollSample('window-scroll', false);
    };

    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });

    if (!suppressAutoReflow && hasResizeObserver) {
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

      // Also observe DOM mutations to catch Finsweet async pagination appends
      var mutationObserver = new MutationObserver(function(mutations) {
        if (cleanedUp) return;
        var hasRelevantChange = mutations.some(function(m) {
          return m.addedNodes.length > 0 || m.removedNodes.length > 0;
        });
        if (hasRelevantChange) {
          debugLog('[MBC HorizontalScroll] MutationObserver triggered reflow');
          scheduleDelayedReflow(50);
        }
      });
      mutationObserver.observe(observedWrap || container, { childList: true, subtree: true });

    } else if (suppressAutoReflow) {
      debugLog('[MBC HorizontalScroll] skipping ResizeObserver auto reflow', {
        suppressAutoReflow: suppressAutoReflow
      });
    }

    reflow();
    sampleScrollState('init', true);

    // Delayed reflow replaces the old window.load listener which never fires on SPA nav.
    // This ensures the trigger settles after Barba container swap + Finsweet DOM mutations.
    scheduleDelayedReflow(600);
    scheduleDelayedReflow(2000);

    // Also explicitly watch for images loading inside the horizontal scroll
    var observedWrap = container.querySelector('[data-horizontal-scroll-wrap]');
    if (observedWrap) {
      var imgs = observedWrap.querySelectorAll('img');
      Array.from(imgs).forEach(function(img) {
        if (!img.complete) {
          img.addEventListener('load', function() {
            if (!cleanedUp) {
              debugLog('[MBC HorizontalScroll] Image loaded, triggering reflow');
              scheduleDelayedReflow(50);
            }
          }, { once: true });
        }
      });
    }

    var api = {
      reflow: reflow,
      cleanup: cleanup
    };

    activeInstance = api;
    activeContainer = container;

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

      if (scrollSampleRaf) {
        cancelAnimationFrame(scrollSampleRaf);
        scrollSampleRaf = null;
      }

      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
      
      if (typeof mutationObserver !== 'undefined' && mutationObserver) {
        mutationObserver.disconnect();
        mutationObserver = null;
      }

      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);

      clearTween();

      if (activeInstance === api) {
        activeInstance = null;
        activeContainer = null;
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
