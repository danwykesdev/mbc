/**
 * Hero Animation Feature
 * GSAP-powered hero reveal with matchMedia breakpoints
 */
(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.features = MBC.features || {};

  function initHero(scope) {
    var root = scope.querySelector('.hero-animate');
    if (!root || typeof gsap === 'undefined') return null;

    if (window.__homeHeroMM) {
      try { window.__homeHeroMM.revert(); } catch (_) {}
      window.__homeHeroMM = null;
    }

    if (window.__homeHeroTL) {
      try { window.__homeHeroTL.kill(); } catch (_) {}
      window.__homeHeroTL = null;
    }

    // Force matchMedia to re-evaluate current breakpoint
    if (typeof gsap !== 'undefined' && gsap.matchMediaRefresh) {
      gsap.matchMediaRefresh();
    }

    var containers = root.querySelectorAll('.crisp-loader');
    var navItems = document.querySelectorAll('[data-load-items="nav-item"], [data-load-item="nav"], [data-load-items="nav"]');
    var nav = document.querySelector('.nav');

    var config = {
      startDelay: 0.075,
      loaderStagger: 0.2,
      duration: 0.5,
      overlap: 0.1,
      ease: 'power2.in',
      tabletGap: 10
    };

    function getCenteredTop(parentHeight, cardHeight) {
      return Math.max(0, (parentHeight - cardHeight) / 2);
    }

    MBC.core.state.heroAnimating = true;

    var mm = gsap.matchMedia();
    window.__homeHeroMM = mm;

    mm.add(
      {
        isDesktop: '(min-width: 992px)',
        isTablet: '(min-width: 768px) and (max-width: 991px)',
        isMobile: '(max-width: 767px)'
      },
      function (context) {
        var isDesktop = context.conditions.isDesktop;
        var isTablet = context.conditions.isTablet;
        var isMobile = context.conditions.isMobile;

        // Only hide nav on desktop, keep it visible on mobile/tablet
        if (isDesktop && nav) {
          gsap.set(nav, { yPercent: -100, autoAlpha: 0, transition: 'none' });
        }
        if (isDesktop && navItems.length) {
          gsap.set(navItems, { autoAlpha: 0, x: -10, transition: 'none' });
        }

        var masterTl = gsap.timeline({
          onComplete: function () {
            MBC.core.state.heroAnimating = false;

            if (typeof window.__resetNavScrollHide === 'function') {
              window.__resetNavScrollHide();
            }
          }
        });
        window.__homeHeroTL = masterTl;

        var layoutParentRect = null;
        var layoutInitialRects = [];
        var isTabletLayout = isTablet || isMobile;

        if (isTabletLayout && containers.length) {
          var parent = containers[0].parentNode;
          layoutParentRect = parent.getBoundingClientRect();

          layoutInitialRects = Array.from(containers).map(function (c) {
            var r = c.getBoundingClientRect();
            return {
              width: r.width,
              height: r.height,
              left: r.left - layoutParentRect.left,
              top: r.top - layoutParentRect.top
            };
          });

          gsap.set(parent, {
            position: 'relative',
            height: layoutParentRect.height
          });

          containers.forEach(function (c, i) {
            gsap.set(c, {
              position: 'absolute',
              top: layoutInitialRects[i].top,
              left: layoutInitialRects[i].left,
              width: layoutInitialRects[i].width,
              height: layoutInitialRects[i].height,
              margin: 0
            });
          });
        }

        containers.forEach(function (container, index) {
          var items = container.querySelectorAll('.crisp-loader__single');
          var total = items.length;
          if (!total) return;

          var columnTl = gsap.timeline({ defaults: { ease: config.ease } });
          gsap.set(items, { zIndex: function (i) { return total - i; } });

          items.forEach(function (item, i) {
            var startTime = i * (config.duration - config.overlap);
            columnTl.to({}, { duration: config.duration }, startTime);

            var imgs = item.querySelectorAll('img');
            if (imgs.length) {
              columnTl.to(
                imgs,
                {
                  delay: 0.1,
                  opacity: 0,
                  duration: config.duration * 0.075
                },
                startTime
              );
            }
          });

          if (isDesktop) {
            var barbaContainer = container.closest('[data-barba="container"]') || document.body;
            var barbaRect = barbaContainer.getBoundingClientRect();
            var containerRect = container.getBoundingClientRect();
            // Calculate true bottom relative to the new page container to avoid Barba layout shift bugs
            var trueBottom = containerRect.bottom - barbaRect.top;
            var deltaY = window.innerHeight - trueBottom - 40;

            columnTl.to(
              container,
              { y: '+=' + deltaY, duration: 0.75, ease: 'power3.out' },
              '<'
            );
          } else if (isTabletLayout) {
            var tabletParent = container.parentNode;
            var parentWidth = tabletParent.getBoundingClientRect().width;
            var parentHeight = layoutParentRect ? layoutParentRect.height : tabletParent.getBoundingClientRect().height;
            var padding = isMobile ? 12 : 16;
            var gap = isMobile ? 8 : config.tabletGap;
            var totalGaps = gap * (containers.length - 1);
            var cardWidth = (parentWidth - padding * 2 - totalGaps) / containers.length;
            var targetLeft = padding + index * (cardWidth + gap);
            var targetTabletTop = getCenteredTop(parentHeight, cardWidth);

            columnTl.to(
              container,
              {
                left: targetLeft,
                top: targetTabletTop,
                width: cardWidth,
                height: cardWidth,
                duration: 0.75,
                ease: 'power3.out'
              },
              '<'
            );
          } else if (isMobile) {
            columnTl.to(container, { x: 0, y: 0, duration: 0.75, ease: 'power3.out' }, '<');
          }

          masterTl.add(columnTl, config.startDelay + index * config.loaderStagger);
        });

        masterTl.addLabel('syncReveal', '-=0.4');

        if (isMobile && containers.length) {
          masterTl.to(
            containers[0].parentNode,
            {
              gap: '0.625rem',
              paddingTop: '5rem',
              duration: 0.75,
              ease: 'power3.inOut'
            },
            'syncReveal'
          );
          masterTl.to(
            containers,
            {
              width: '42vw',
              height: '42vw',
              duration: 0.75,
              ease: 'power3.inOut'
            },
            'syncReveal'
          );
        }

        containers.forEach(function (container) {
          var heroInner = container.querySelector('.hero__inner');
          var heroBg = container.querySelector('.hero_img-reveal');
          var overlay = heroBg ? heroBg.querySelector('.img-component_bg-overlay') : null;

          if (heroInner) {
            masterTl.to(
              heroInner,
              {
                opacity: 1,
                y: '0rem',
                duration: 0.5,
                ease: 'power3.out',
                immediateRender: false
              },
              'syncReveal+=0.1'
            );
          }

          if (heroBg) {
            masterTl.to(
              heroBg,
              {
                scale: isMobile ? 1 : 1.1,
                opacity: 1,
                duration: 0.5,
                ease: 'power3.inOut',
                immediateRender: false
              },
              'syncReveal'
            );
          }

          if (overlay) {
            masterTl.to(
              overlay,
              {
                opacity: 1,
                duration: 0.5,
                ease: 'power3.inOut',
                immediateRender: false
              },
              'syncReveal'
            );
          }
        });

        if (nav) {
          masterTl.to(
            nav,
            {
              yPercent: 0,
              autoAlpha: 1,
              duration: 0.75,
              ease: 'power3.out'
            },
            'syncReveal'
          );
        }

        if (navItems.length) {
          masterTl.to(
            navItems,
            {
              autoAlpha: 1,
              x: 0,
              duration: 0.55,
              ease: 'power2.out',
              stagger: 0.04,
              clearProps: 'transform,opacity,visibility,willChange'
            },
            'syncReveal+=0.2'
          );
        }

        return function () {
          masterTl.kill();
          gsap.set(containers, { clearProps: 'transform,opacity,willChange' });

          if (containers.length) {
            gsap.set(containers[0].parentNode, {
              clearProps: 'display,flexWrap,justifyContent,alignContent,minHeight,gap,paddingTop,height,position'
            });
          }

          if (nav) gsap.set(nav, { clearProps: 'transform,opacity,visibility' });
          if (navItems.length) gsap.set(navItems, { clearProps: 'transform,opacity,visibility' });
        };
      }
    );

    return function cleanup() {
      if (window.__homeHeroTL) {
        try { window.__homeHeroTL.kill(); } catch (_) {}
        window.__homeHeroTL = null;
      }

      if (window.__homeHeroMM) {
        try { window.__homeHeroMM.revert(); } catch (_) {}
        window.__homeHeroMM = null;
      }

      MBC.core.state.heroAnimating = false;
    };
  }

  /**
   * Simple fade-in hero (for mobile/reduced motion)
   */
  function initSimpleHero(container) {
    var heroRoot = container.querySelector('.hero-animate');
    if (!heroRoot || typeof gsap === 'undefined') return null;

    gsap.fromTo(heroRoot, {
      autoAlpha: 0
    }, {
      autoAlpha: 1,
      duration: 0.4,
      ease: 'power2.out'
    });

    return function cleanup() {
      gsap.set(heroRoot, { clearProps: 'opacity,visibility' });
    };
  }

  MBC.features.hero = {
    init: initHero,
    initSimple: initSimpleHero
  };
})();
