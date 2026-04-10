(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.core = MBC.core || {};

  function add(fn) {
    if (typeof fn !== "function") return;
    MBC.core.state.cleanupStack.push(fn);
  }

  function runAll() {
    var stack = MBC.core.state.cleanupStack;

    for (var i = stack.length - 1; i >= 0; i -= 1) {
      try {
        stack[i]();
      } catch (err) {
        console.warn("[MBC] cleanup failed", err);
      }
    }

    MBC.core.state.cleanupStack = [];
  }

  MBC.core.cleanup = {
    add: add,
    runAll: runAll
  };
})();