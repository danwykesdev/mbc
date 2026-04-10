/**
 * Hero Animation Feature
 * GSAP-powered hero reveal with matchMedia breakpoints
 */
(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.features = MBC.features || {};

  function initHero(container) {
    var heroRoot = container.querySelector('.hero-animate');
    if (!heroRoot || typeof gsap === 'undefined') return null;

    // Set animating state
    MBC.core.state.heroAnimating = true;

    // Build timeline
    var tl = gsap.timeline({
      onComplete: function () {
        MBC.core.state.heroAnimating = false;
      }
    });

    // Base animation - fade in
    tl.fromTo(heroRoot, {
      autoAlpha: 0,
      y: 20
    }, {
      autoAlpha: 1,
      y: 0,
      duration: 0.6,
      ease: 'power2.out'
    });

    // Animate hero elements if they exist
    var heroTitle = heroRoot.querySelector('h1, .hero__title');
    var heroSubtitle = heroRoot.querySelector('.hero__subtitle, .subtitle');
    var heroCta = heroRoot.querySelector('.button, .cta');

    if (heroTitle) {
      tl.fromTo(heroTitle, {
        autoAlpha: 0,
        y: 30
      }, {
        autoAlpha: 1,
        y: 0,
        duration: 0.5,
        ease: 'power2.out'
      }, '-=0.3');
    }

    if (heroSubtitle) {
      tl.fromTo(heroSubtitle, {
        autoAlpha: 0,
        y: 20
      }, {
        autoAlpha: 1,
        y: 0,
        duration: 0.4,
        ease: 'power2.out'
      }, '-=0.2');
    }

    if (heroCta) {
      tl.fromTo(heroCta, {
        autoAlpha: 0,
        y: 15
      }, {
        autoAlpha: 1,
        y: 0,
        duration: 0.4,
        ease: 'power2.out'
      }, '-=0.2');
    }

    // Cleanup function
    return function cleanup() {
      tl.kill();
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
