(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.features = MBC.features || {};

  function init(container) {
    if (typeof gsap === 'undefined') {
      return null;
    }

    var root = container || document;
    var triggers = Array.from(root.querySelectorAll('[data-stagger="projects"]'));
    if (!triggers.length) {
      return null;
    }

    var canHover = typeof window.matchMedia !== 'function' || window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var triggerMap = new Map();
    var activeTrigger = null;

    function animateIn(entry) {
      if (!entry) return;

      if (entry.items.length) {
        gsap.killTweensOf(entry.items);
        gsap.to(entry.items, {
          autoAlpha: 1,
          y: 0,
          duration: 0.2,
          ease: 'power2.out',
          stagger: {
            total: 0.1,
            from: 'start'
          },
          overwrite: 'auto'
        });
      }

      if (entry.image) {
        gsap.killTweensOf(entry.image);
        gsap.to(entry.image, {
          scale: 1.05,
          duration: 0.2,
          ease: 'power1.out',
          force3D: true,
          overwrite: 'auto'
        });
      }

      if (entry.overlay) {
        gsap.killTweensOf(entry.overlay);
        gsap.to(entry.overlay, {
          autoAlpha: 1,
          duration: 0.2,
          ease: 'power1.out',
          overwrite: 'auto'
        });
      }
    }

    function animateOut(entry) {
      if (!entry) return;

      if (entry.items.length) {
        gsap.killTweensOf(entry.items);
        gsap.to(entry.items, {
          autoAlpha: 0,
          y: 14,
          duration: 0.18,
          ease: 'power2.out',
          stagger: {
            total: 0.08,
            from: 'end'
          },
          overwrite: 'auto'
        });
      }

      if (entry.image) {
        gsap.killTweensOf(entry.image);
        gsap.to(entry.image, {
          scale: 1,
          duration: 0.35,
          ease: 'power2.out',
          force3D: true,
          overwrite: 'auto'
        });
      }

      if (entry.overlay) {
        gsap.killTweensOf(entry.overlay);
        gsap.to(entry.overlay, {
          autoAlpha: 0,
          duration: 0.2,
          ease: 'power1.out',
          overwrite: 'auto'
        });
      }
    }

    function setActiveTrigger(nextTrigger) {
      if (activeTrigger === nextTrigger) {
        return;
      }

      if (activeTrigger && triggerMap.has(activeTrigger)) {
        animateOut(triggerMap.get(activeTrigger));
      }

      activeTrigger = nextTrigger && triggerMap.has(nextTrigger) ? nextTrigger : null;

      if (activeTrigger) {
        animateIn(triggerMap.get(activeTrigger));
      }
    }

    triggers.forEach(function (trigger) {
      var items = Array.from(trigger.querySelectorAll('[data-stagger="item"]'));
      var image = trigger.querySelector('.img-component .u-img-cover, .img-component img, .img-component video');
      var overlay = trigger.querySelector('[data-stagger="overlay"]');

      if (!items.length && !image && !overlay) {
        return;
      }

      if (!canHover) {
        if (items.length) {
          gsap.set(items, { autoAlpha: 1, y: 0, clearProps: 'opacity,visibility,transform' });
        }
        if (image) {
          gsap.set(image, { scale: 1, clearProps: 'transform' });
        }
        if (overlay) {
          gsap.set(overlay, { autoAlpha: 1, clearProps: 'opacity,visibility' });
        }
        return;
      }

      if (items.length) {
        gsap.set(items, { autoAlpha: 0, y: 14 });
      }

      if (image) {
        gsap.set(image, { scale: 1, transformOrigin: '50% 50%', force3D: true });
      }

      if (overlay) {
        gsap.set(overlay, { autoAlpha: 0 });
      }

      triggerMap.set(trigger, {
        trigger: trigger,
        items: items,
        image: image,
        overlay: overlay
      });
    });

    if (!triggerMap.size) {
      return null;
    }

    function getTriggerFromTarget(target) {
      if (!(target instanceof Element)) {
        return null;
      }

      var match = target.closest('[data-stagger="projects"]');
      return match && triggerMap.has(match) ? match : null;
    }

    function onMouseOver(event) {
      var nextTrigger = getTriggerFromTarget(event.target);
      if (!nextTrigger) return;
      setActiveTrigger(nextTrigger);
    }

    function onMouseOut(event) {
      var currentTrigger = getTriggerFromTarget(event.target);
      if (!currentTrigger) return;

      var relatedTrigger = getTriggerFromTarget(event.relatedTarget);
      if (currentTrigger === relatedTrigger) {
        return;
      }

      if (activeTrigger === currentTrigger) {
        setActiveTrigger(null);
      }
    }

    function onFocusIn(event) {
      var nextTrigger = getTriggerFromTarget(event.target);
      if (!nextTrigger) return;
      setActiveTrigger(nextTrigger);
    }

    function onFocusOut(event) {
      var currentTrigger = getTriggerFromTarget(event.target);
      if (!currentTrigger) return;

      var relatedTrigger = getTriggerFromTarget(event.relatedTarget);
      if (currentTrigger === relatedTrigger) {
        return;
      }

      if (activeTrigger === currentTrigger) {
        setActiveTrigger(null);
      }
    }

    root.addEventListener('mouseover', onMouseOver);
    root.addEventListener('mouseout', onMouseOut);
    root.addEventListener('focusin', onFocusIn);
    root.addEventListener('focusout', onFocusOut);

    return function cleanup() {
      root.removeEventListener('mouseover', onMouseOver);
      root.removeEventListener('mouseout', onMouseOut);
      root.removeEventListener('focusin', onFocusIn);
      root.removeEventListener('focusout', onFocusOut);

      triggerMap.forEach(function (entry) {
        if (entry.items.length) {
          gsap.killTweensOf(entry.items);
          gsap.set(entry.items, { clearProps: 'opacity,visibility,transform' });
        }

        if (entry.image) {
          gsap.killTweensOf(entry.image);
          gsap.set(entry.image, { clearProps: 'transform' });
        }

        if (entry.overlay) {
          gsap.killTweensOf(entry.overlay);
          gsap.set(entry.overlay, { clearProps: 'opacity,visibility' });
        }
      });

      triggerMap.clear();
      activeTrigger = null;
    };
  }

  MBC.features.staggerHover = {
    init: init
  };
})();
