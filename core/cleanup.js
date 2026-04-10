(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.core = MBC.core || {};

  function addToStack(stackName, fn) {
    if (typeof fn !== "function") return;
    MBC.core.state[stackName].push(fn);
  }

  function runStack(stackName) {
    var stack = MBC.core.state[stackName] || [];

    for (var i = stack.length - 1; i >= 0; i -= 1) {
      try {
        stack[i]();
      } catch (err) {
        console.warn("[MBC] cleanup failed", err);
      }
    }

    MBC.core.state[stackName] = [];
  }

  function addPage(fn) {
    addToStack("pageCleanupStack", fn);
  }

  function addGlobal(fn) {
    addToStack("globalCleanupStack", fn);
  }

  function runPage() {
    runStack("pageCleanupStack");
  }

  function runGlobal() {
    runStack("globalCleanupStack");
  }

  MBC.core.cleanup = {
    add: addPage,
    addPage: addPage,
    addGlobal: addGlobal,
    runAll: runPage,
    runPage: runPage,
    runGlobal: runGlobal
  };
})();