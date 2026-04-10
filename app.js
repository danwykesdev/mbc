(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  function registerPages() {
    MBC.core.registry.register("home", MBC.pages.home);
    MBC.core.registry.register("project", MBC.pages.projects);
    MBC.core.registry.register("projects", MBC.pages.projects);
    MBC.core.registry.register("project-detail", MBC.pages.projectDetail);
    MBC.core.registry.register("project_detail", MBC.pages.projectDetail);
    MBC.core.registry.register("about", MBC.pages.about);
    MBC.core.registry.register("default", MBC.pages.default);
  }

  function bindPreventSameUrlClick() {
    document.body.addEventListener("click", function (e) {
      var link = e.target && e.target.closest ? e.target.closest("a") : null;
      if (!link) return;

      if (link.classList.contains("w--current")) {
        e.preventDefault();
        return;
      }

      var currentUrl = (window.location.origin + window.location.pathname).replace(/\/$/, "");
      var linkUrl = link.href.split("#")[0].split("?")[0].replace(/\/$/, "");

      if (currentUrl === linkUrl) {
        e.preventDefault();
      }
    });
  }

  function start() {
    if (window.__MBC_APP_ACTIVE) return;
    window.__MBC_APP_ACTIVE = true;

    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    if (document.body) {
      document.body.classList.add("animations-ready");
    }

    document.documentElement.classList.add("js");

    if (typeof gsap !== "undefined") {
      gsap.config({ nullTargetWarn: false });
    }

    MBC.features.lenis.init();

    var mobileCleanup = MBC.features.mobileNav.init();
    if (typeof mobileCleanup === "function") {
      MBC.core.cleanup.add(mobileCleanup);
    }

    var scrollCleanup = MBC.features.scrollDirection.init();
    if (typeof scrollCleanup === "function") {
      MBC.core.cleanup.add(scrollCleanup);
    }

    bindPreventSameUrlClick();
    registerPages();
    MBC.transitions.barba.init();
  }

  MBC.app = {
    start: start
  };

  MBC.app.start();
})();