(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.pages = MBC.pages || {};

  async function mount(ctx) {
    // About only needs IX — no videos, no finsweet
    if (MBC.features.nav) {
      MBC.features.nav.setState({ theme: 'dark', bg: 'solid', blur: true });
    }

    return function cleanup() {};
  }

  function unmount() {}

  var moduleDef = {
    webflowTier: 'strong',
    mount: mount,
    unmount: unmount
  };

  MBC.pages.about = moduleDef;

  if (MBC.core && MBC.core.registry) {
    MBC.core.registry.register('about', moduleDef);
  }
})();