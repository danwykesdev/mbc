(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.transitions = MBC.transitions || {};

  function bypassBarba(url, el) {
    try {
      if (!url) return true;
      if (el && el.hasAttribute && el.hasAttribute("download")) return true;
      if (el && el.target === "_blank") return true;
      if (el && el.hasAttribute && el.hasAttribute("data-no-barba")) return true;

      var next = new URL(url, window.location.origin);
      var currentPath = window.location.pathname.replace(/\/$/, "") || "/";
      var nextPath = next.pathname.replace(/\/$/, "") || "/";

      var isExternal = next.origin !== window.location.origin;
      var isAnchorOnly = currentPath === nextPath && !!next.hash;
      var isSpecial = /^(mailto:|tel:|javascript:)/i.test(url);

      return isExternal || isAnchorOnly || isSpecial;
    } catch (_) {
      return false;
    }
  }

  function pageOut(container) {
    return new Promise(function (resolve) {
      if (typeof gsap === "undefined") {
        resolve();
        return;
      }

      gsap.to(container, {
        autoAlpha: 0,
        duration: 0.24,
        ease: "power2.out",
        onComplete: resolve
      });
    });
  }

  function pageIn(container, isHome) {
    return new Promise(function (resolve) {
      if (typeof gsap === "undefined") {
        resolve();
        return;
      }

      if (isHome) {
        gsap.set(container, { autoAlpha: 1, clearProps: "opacity,visibility" });
        resolve();
        return;
      }

      gsap.fromTo(
        container,
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          duration: 0.28,
          ease: "power2.out",
          clearProps: "opacity,visibility",
          onComplete: resolve
        }
      );
    });
  }

  function initBarbaTransitions() {
    if (typeof barba === "undefined") {
      console.warn("[MBC] Barba is missing");
      return;
    }

    barba.init({
      preventRunning: true,
      prevent: function (ctx) {
        return bypassBarba(ctx.href, ctx.el);
      },
      transitions: [
        {
          name: "mbc-transition",

          async once(data) {
            await MBC.core.lifecycle.mountNext(data, { isFirstLoad: true });
          },

          async leave(data) {
            if (MBC.core.state.lenis && typeof MBC.core.state.lenis.stop === "function") {
              MBC.core.state.lenis.stop();
            }

            await pageOut(data.current.container);
            await MBC.core.lifecycle.unmountCurrent(MBC.core.state.navToken);
          },

          beforeEnter(data) {
            MBC.core.webflow.updatePageIdFromBarba(data);
            if (typeof gsap !== "undefined") {
              gsap.set(data.next.container, { autoAlpha: 0 });
            }
          },

          async enter(data) {
            await MBC.core.lifecycle.mountNext(data, { isFirstLoad: false });

            var ns = MBC.core.utils.normalizeNamespace(data.next.namespace);
            await pageIn(data.next.container, ns === "home");

            if (typeof window.scrollTo === "function") {
              window.scrollTo(0, 0);
            }

            if (MBC.core.state.lenis && typeof MBC.core.state.lenis.scrollTo === "function") {
              MBC.core.state.lenis.scrollTo(0, { immediate: true });
              MBC.core.state.lenis.resize && MBC.core.state.lenis.resize();
            }

            if (typeof ScrollTrigger !== "undefined") {
              ScrollTrigger.refresh(true);
            }
          }
        }
      ]
    });
  }

  MBC.transitions.barba = {
    init: initBarbaTransitions
  };
})();