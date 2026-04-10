(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.pages = MBC.pages || {};

  async function mount() {
    if (MBC.features.nav) {
      MBC.features.nav.setState({ theme: "dark", bg: "solid", blur: true });
    }

    return function cleanup() {};
  }

  function unmount() {}

  MBC.pages.about = {
    webflowTier: "light",
    mount: mount,
    unmount: unmount
  };
})();