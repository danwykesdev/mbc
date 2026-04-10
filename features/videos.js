(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.features = MBC.features || {};

  function initStandaloneVideos(context) {
    var container = (context && context.container) || document;
    var openers = Array.from(container.querySelectorAll('[fs-modal-element="open"]'));
    var closers = Array.from(container.querySelectorAll('[fs-modal-element="close"]'));

    if (!openers.length && !closers.length) return function () {};

    function onOpen() {}
    function onClose() {}

    openers.forEach(function (el) {
      el.addEventListener("click", onOpen);
    });

    closers.forEach(function (el) {
      el.addEventListener("click", onClose);
    });

    return function cleanup() {
      openers.forEach(function (el) {
        el.removeEventListener("click", onOpen);
      });
      closers.forEach(function (el) {
        el.removeEventListener("click", onClose);
      });
    };
  }

  MBC.features.videos = {
    initStandalone: initStandaloneVideos
  };
})();