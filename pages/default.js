(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.pages = MBC.pages || {};

  async function mount(ctx) {
    var traceSync = MBC.core && MBC.core.utils && MBC.core.utils.traceSync
      ? MBC.core.utils.traceSync
      : function (_, fn) { return fn(); };

    // Default/contact — minimal, no videos
    traceSync('default init', function () {
      if (MBC.features.nav) {
        MBC.features.nav.setState({ theme: 'dark', bg: 'solid', blur: false });
      }
    });

    return function cleanup() {};
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