(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.pages = MBC.pages || {};

  async function mount(ctx) {
    var container = ctx.container;

    if (MBC.features.nav) {
      MBC.features.nav.setState({ theme: "dark", bg: "none", blur: false });
    }

    if (typeof window.scrollTo === "function") {
      window.scrollTo(0, 0);
    }

    if (MBC.core.state.lenis && typeof MBC.core.state.lenis.scrollTo === "function") {
      MBC.core.state.lenis.scrollTo(0, { immediate: true });
    }

    var heroRoot = container.querySelector(".hero-animate");
    if (heroRoot && typeof gsap !== "undefined") {
      MBC.core.state.heroAnimating = true;

      var tl = gsap.timeline({
        onComplete: function () {
          MBC.core.state.heroAnimating = false;
        }
      });

      tl.fromTo(heroRoot, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: "power2.out" });

      MBC.core.cleanup.add(function () {
        tl.kill();
        MBC.core.state.heroAnimating = false;
      });
    }

    var videoCleanup = MBC.features.videos ? MBC.features.videos.initStandalone({ container: container }) : null;

    return function cleanup() {
      if (typeof videoCleanup === "function") videoCleanup();
    };
  }

  function unmount() {
    MBC.core.state.heroAnimating = false;
  }

  MBC.pages.home = {
    webflowTier: "ix",
    mount: mount,
    unmount: unmount
  };
})();