(function () {
  window.MBC = window.MBC || {};
  const MBC = window.MBC;

  MBC.core = MBC.core || {};

  const state = {
    navToken: 0,
    currentNamespace: "",
    currentContainer: document,
    currentPageModule: null,
    initialLoadComplete: false,
    lenis: null,
    heroAnimating: false,
    cleanupStack: []
  };

  state.nextToken = function nextToken() {
    state.navToken += 1;
    return state.navToken;
  };

  state.isStale = function isStale(token) {
    return token !== state.navToken;
  };

  MBC.core.state = state;
})();