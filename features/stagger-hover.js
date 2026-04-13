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
    var disposers = [];

    triggers.forEach(function (trigger) {
      var items = Array.from(trigger.querySelectorAll('[data-stagger="item"]'));
      var image = trigger.querySelector('.img-component');

      if (!items.length && !image) {
        return;
      }

      if (!canHover) {
        if (items.length) {
          gsap.set(items, { autoAlpha: 1, y: 0, clearProps: 'opacity,visibility,transform' });
        }
        if (image) {
          gsap.set(image, { scale: 1, clearProps: 'transform' });
        }
        return;
      }

      if (items.length) {
        gsap.set(items, { autoAlpha: 0, y: 14 });
      }

      if (image) {
        gsap.set(image, { scale: 1, transformOrigin: '50% 50%' });
      }

      var onEnter = function () {
        if (items.length) {
          gsap.killTweensOf(items);
          gsap.to(items, {
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

        if (image) {
          gsap.killTweensOf(image);
          gsap.to(image, {
            scale: 1.05,
            duration: 0.5,
            ease: 'power2.out',
            overwrite: 'auto'
          });
        }
      };

      var onLeave = function () {
        if (items.length) {
          gsap.killTweensOf(items);
          gsap.to(items, {
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

        if (image) {
          gsap.killTweensOf(image);
          gsap.to(image, {
            scale: 1,
            duration: 0.35,
            ease: 'power2.out',
            overwrite: 'auto'
          });
        }
      };

      trigger.addEventListener('pointerenter', onEnter);
      trigger.addEventListener('pointerleave', onLeave);
      trigger.addEventListener('focusin', onEnter);
      trigger.addEventListener('focusout', onLeave);

      disposers.push(function () {
        trigger.removeEventListener('pointerenter', onEnter);
        trigger.removeEventListener('pointerleave', onLeave);
        trigger.removeEventListener('focusin', onEnter);
        trigger.removeEventListener('focusout', onLeave);

        if (items.length) {
          gsap.killTweensOf(items);
          gsap.set(items, { clearProps: 'opacity,visibility,transform' });
        }

        if (image) {
          gsap.killTweensOf(image);
          gsap.set(image, { clearProps: 'transform' });
        }
      });
    });

    if (!disposers.length) {
      return null;
    }

    return function cleanup() {
      disposers.forEach(function (dispose) {
        try { dispose(); } catch (_) {}
      });
    };
  }

  MBC.features.staggerHover = {
    init: init
  };
})();
