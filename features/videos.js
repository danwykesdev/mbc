/**
 * Videos Feature
 * Handles standalone video modals with Finsweet Attributes
 */
(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.features = MBC.features || {};

  var activePlayer = null;

  /**
   * Create Vimeo player from element
   */
  function createVimeoPlayer(element) {
    if (typeof Vimeo === 'undefined' || !Vimeo.Player) return null;

    var vimeoId = element.getAttribute('data-vimeo-id');
    var iframe = element.querySelector('iframe[src*="vimeo"]');

    if (!vimeoId && !iframe) return null;

    var player;
    if (iframe) {
      player = new Vimeo.Player(iframe);
    } else if (vimeoId) {
      // Create iframe
      var newIframe = document.createElement('iframe');
      newIframe.src = 'https://player.vimeo.com/video/' + vimeoId + '?autoplay=1&muted=1&loop=1&background=1';
      newIframe.width = '100%';
      newIframe.height = '100%';
      newIframe.frameBorder = '0';
      newIframe.allow = 'autoplay; fullscreen';
      element.appendChild(newIframe);
      player = new Vimeo.Player(newIframe);
    }

    return player;
  }

  /**
   * Initialize background videos
   */
  function initBackgroundVideos(container) {
    var bgVideo = container.querySelector('#videoLoad, [data-bg-video]');
    if (!bgVideo) return null;

    var player = createVimeoPlayer(bgVideo);

    if (player && typeof player.play === 'function') {
      player.play().catch(function () {
        // Autoplay might be blocked, that's ok
      });
    }

    return function cleanup() {
      if (player && typeof player.destroy === 'function') {
        player.destroy();
      }
    };
  }

  /**
   * Initialize modal videos
   */
  function initModalVideos(container) {
    var openers = Array.from(container.querySelectorAll('[fs-modal-element="open"]'));
    var closers = Array.from(container.querySelectorAll('[fs-modal-element="close"]'));

    if (!openers.length && !closers.length) return null;

    function onOpen(e) {
      var modalId = e.currentTarget.getAttribute('data-modal-id');
      if (!modalId) return;

      var modal = document.querySelector('[fs-modal-element="modal"][data-modal-id="' + modalId + '"]');
      if (!modal) return;

      var videoContainer = modal.querySelector('[data-modal-video], #video');
      if (!videoContainer) return;

      // Create player if not exists
      if (!activePlayer) {
        activePlayer = createVimeoPlayer(videoContainer);
      }

      if (activePlayer && typeof activePlayer.play === 'function') {
        activePlayer.play().catch(function () {});
      }
    }

    function onClose() {
      if (activePlayer && typeof activePlayer.pause === 'function') {
        activePlayer.pause();
      }
    }

    openers.forEach(function (el) {
      el.addEventListener('click', onOpen);
    });

    closers.forEach(function (el) {
      el.addEventListener('click', onClose);
    });

    return function cleanup() {
      openers.forEach(function (el) {
        el.removeEventListener('click', onOpen);
      });
      closers.forEach(function (el) {
        el.removeEventListener('click', onClose);
      });

      if (activePlayer && typeof activePlayer.destroy === 'function') {
        activePlayer.destroy();
        activePlayer = null;
      }
    };
  }

  /**
   * Main init function - handles both background and modal videos
   */
  function initStandaloneVideos(context) {
    var container = (context && context.container) || document;
    var cleanups = [];

    // Background videos
    var bgCleanup = initBackgroundVideos(container);
    if (typeof bgCleanup === 'function') {
      cleanups.push(bgCleanup);
    }

    // Modal videos
    var modalCleanup = initModalVideos(container);
    if (typeof modalCleanup === 'function') {
      cleanups.push(modalCleanup);
    }

    return function cleanup() {
      cleanups.forEach(function (fn) {
        if (typeof fn === 'function') {
          try { fn(); } catch (_) {}
        }
      });
    };
  }

  MBC.features.videos = {
    initStandalone: initStandaloneVideos,
    createVimeoPlayer: createVimeoPlayer
  };
})();