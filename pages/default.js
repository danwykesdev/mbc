(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.pages = MBC.pages || {};

  async function mount(ctx) {
    var container = ctx.container;
    var cleanups = [];

    // Default nav state
    if (MBC.features.nav) {
      MBC.features.nav.setState({ theme: 'dark', bg: 'solid', blur: false });
    }

    // Videos (if any)
    if (MBC.features.videos) {
      var videoCleanup = MBC.features.videos.initStandalone({ container: container });
      if (typeof videoCleanup === 'function') {
        cleanups.push(videoCleanup);
      }
    }

    return function cleanup() {
      cleanups.forEach(function (fn) {
        if (typeof fn === 'function') {
          try { fn(); } catch (_) {}
        }
      });
    };
  }

  function unmount() {}

  var moduleDef = {
    webflowTier: 'light',
    mount: mount,
    unmount: unmount
  };

  MBC.pages.default = moduleDef;

  if (MBC.core && MBC.core.registry) {
    MBC.core.registry.register('default', moduleDef);
  }
})();