(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.pages = MBC.pages || {};

  async function mount() {
    return function cleanup() {};
  }

  function unmount() {}

  MBC.pages.default = {
    webflowTier: "light",
    mount: mount,
    unmount: unmount
  };
})();