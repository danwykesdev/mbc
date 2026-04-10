(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.pages = MBC.pages || {};

  async function mount(ctx) {
    var container = ctx.container;

    if (MBC.features.nav) {
      MBC.features.nav.setState({ theme: "dark", bg: "solid", blur: true });
    }

    if (typeof window.initHorizontalScrolling === "function") {
      window.initHorizontalScrolling(container);
    }

    return function cleanup() {};
  }

  function unmount() {}

  MBC.pages.projects = {
    webflowTier: "full",
    mount: mount,
    unmount: unmount
  };
})();