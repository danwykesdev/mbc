(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.features = MBC.features || {};

  function initLenis() {
    if (MBC.core.state.lenis) return MBC.core.state.lenis;
    if (typeof Lenis === "undefined") return null;

    var lenis = new Lenis({
      lerp: 0.075,
      wheelMultiplier: 1,
      gestureOrientation: "vertical",
      normalizeWheel: false,
      smoothTouch: false
    });

    MBC.core.state.lenis = lenis;
    window.lenis = lenis;

    if (typeof gsap !== "undefined" && gsap.ticker) {
      gsap.ticker.add(function (t) {
        lenis.raf(t * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    }

    if (typeof ScrollTrigger !== "undefined") {
      lenis.on("scroll", ScrollTrigger.update);
    }

    return lenis;
  }

  MBC.features.lenis = {
    init: initLenis
  };
})();