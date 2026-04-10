(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.pages = MBC.pages || {};

  async function mount(ctx) {
    var container = ctx.container;

    if (MBC.features.nav) {
      MBC.features.nav.setState({ theme: "light", bg: "none", blur: false });
    }

    var videoCleanup = MBC.features.videos ? MBC.features.videos.initStandalone({ container: container }) : null;

    return function cleanup() {
      if (typeof videoCleanup === "function") videoCleanup();
    };
  }

  function unmount() {}

  MBC.pages.projectDetail = {
    webflowTier: "ix",
    mount: mount,
    unmount: unmount
  };
})();