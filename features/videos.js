/**
 * Videos Feature
 * Handles standalone video modals with Finsweet Attributes
 */
(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.features = MBC.features || {};

  /**
   * Create Vimeo player from element
   */
  function createVimeoPlayer(element) {
    if (typeof Vimeo === 'undefined' || !Vimeo.Player) return null;

    var vimeoId = element.getAttribute('data-vimeo-id') || element.getAttribute('data-video');
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
    var bgVideo = container.querySelector('#videoLoad, [data-bg-video]') || document.getElementById('videoLoad');
    if (!bgVideo) return null;

    var player = null;
    var bgTarget = null;

    if (bgVideo.getAttribute('data-video')) {
      var bgId = bgVideo.getAttribute('data-video');
      bgTarget = bgVideo;

      if (bgVideo.tagName && bgVideo.tagName.toLowerCase() !== 'div') {
        bgTarget = document.createElement('div');
        bgTarget.id = bgVideo.id;
        bgTarget.className = bgVideo.className;
        bgTarget.style.cssText = 'width:100%;height:100%;position:absolute;top:0;left:0;';
        bgTarget.setAttribute('data-video', bgId);
        bgVideo.parentNode.replaceChild(bgTarget, bgVideo);
      } else {
        bgTarget.innerHTML = '';
      }

      player = new Vimeo.Player(bgTarget, {
        id: bgId,
        autoplay: true,
        loop: true,
        muted: true,
        background: true,
        autopause: false
      });
    } else {
      player = createVimeoPlayer(bgVideo);
    }

    if (player && typeof player.ready === 'function') {
      player.ready().then(function () {
        if (bgTarget && bgTarget.style) {
          bgTarget.style.opacity = '1';
          bgTarget.style.visibility = 'visible';
        }

        if (typeof player.play === 'function') {
          player.play().catch(function () {
          });
        }
      }).catch(function () {
      });
    } else if (player && typeof player.play === 'function') {
      player.play().catch(function () {
      });
    }

    return function cleanup() {
      if (player && typeof player.destroy === 'function') {
        player.destroy().catch(function () {});
      }
    };
  }

  /**
   * Initialize modal videos
   */
  function initModalVideos(container) {
    var openers = Array.from(container.querySelectorAll('[fs-modal-element="open"]'));
    var closers = Array.from(container.querySelectorAll('[fs-modal-element="close"]'));
    var modalVideoEl = container.querySelector('#video') || document.getElementById('video');
    var stableWrapper = null;
    var modalVideoId = null;
    var modalPlayer = null;
    var modalElements = Array.from(container.querySelectorAll('[fs-modal-element="modal"]'));

    if (!modalElements.length) {
      modalElements = Array.from(document.querySelectorAll('[fs-modal-element="modal"]'));
    }

    if (!openers.length) {
      openers = Array.from(document.querySelectorAll('[fs-modal-element="open"]'));
    }

    if (!closers.length) {
      closers = Array.from(document.querySelectorAll('[fs-modal-element="close"]'));
    }

    if (modalVideoEl) {
      modalVideoId = modalVideoEl.getAttribute('data-video') || modalVideoEl.getAttribute('data-vimeo-id');
      stableWrapper = document.createElement('div');
      stableWrapper.id = modalVideoEl.id;
      stableWrapper.className = modalVideoEl.className;
      stableWrapper.style.cssText = 'width:100%;height:100%;';
      if (modalVideoId) stableWrapper.setAttribute('data-video', modalVideoId);
      modalVideoEl.parentNode.replaceChild(stableWrapper, modalVideoEl);
    }

    if (!openers.length && !closers.length && !stableWrapper) return null;

    function resetPlayerState() {
      if (!modalPlayer) return;

      if (typeof modalPlayer.pause === 'function') {
        modalPlayer.pause().catch(function () {});
      }

      if (typeof modalPlayer.setCurrentTime === 'function') {
        modalPlayer.setCurrentTime(0).catch(function () {});
      }

      if (typeof modalPlayer.setVolume === 'function') {
        modalPlayer.setVolume(0).catch(function () {});
      }

      if (typeof modalPlayer.setMuted === 'function') {
        modalPlayer.setMuted(true).catch(function () {});
      }
    }

    function onOpen(e) {
      var modalId = e.currentTarget.getAttribute('data-modal-id');

      // Create player if not exists
      if (!modalPlayer) {
        if (stableWrapper && modalVideoId) {
          modalPlayer = new Vimeo.Player(stableWrapper, {
            id: modalVideoId,
            autoplay: true,
            loop: true,
            controls: false,
            muted: false,
            autopause: false
          });
        } else if (modalId) {
          var modal = document.querySelector('[fs-modal-element="modal"][data-modal-id="' + modalId + '"]');
          if (!modal) return;

          var videoContainer = modal.querySelector('[data-modal-video], #video');
          if (!videoContainer) return;
          modalPlayer = createVimeoPlayer(videoContainer);
        }
      }

      if (modalPlayer && typeof modalPlayer.setVolume === 'function') {
        modalPlayer.setVolume(1).catch(function () {});
      }

      if (modalPlayer && typeof modalPlayer.setMuted === 'function') {
        modalPlayer.setMuted(false).catch(function () {});
      }

      if (modalPlayer && typeof modalPlayer.play === 'function') {
        modalPlayer.play().catch(function () {});
      }
    }

    function onClose() {
      resetPlayerState();
    }

    openers.forEach(function (el) {
      el.addEventListener('click', onOpen);
    });

    closers.forEach(function (el) {
      el.addEventListener('click', onClose);
    });

    modalElements.forEach(function (el) {
      el.addEventListener('transitionend', onClose);
      el.addEventListener('animationend', onClose);
    });

    return function cleanup() {
      openers.forEach(function (el) {
        el.removeEventListener('click', onOpen);
      });
      closers.forEach(function (el) {
        el.removeEventListener('click', onClose);
      });
      modalElements.forEach(function (el) {
        el.removeEventListener('transitionend', onClose);
        el.removeEventListener('animationend', onClose);
      });

      resetPlayerState();

      if (modalPlayer && typeof modalPlayer.destroy === 'function') {
        modalPlayer.destroy().catch(function () {});
        modalPlayer = null;
      }
    };
  }

  /**
   * Main init function - handles both background and modal videos
   */
  function initStandaloneVideos(context) {
    var container = (context && context.container) || document;
    var includeBackground = !context || context.includeBackground !== false;
    var includeModal = !context || context.includeModal !== false;
    var cleanups = [];

    if (includeBackground) {
      var bgCleanup = initBackgroundVideos(container);
      if (typeof bgCleanup === 'function') {
        cleanups.push(bgCleanup);
      }
    }

    if (includeModal) {
      var modalCleanup = initModalVideos(container);
      if (typeof modalCleanup === 'function') {
        cleanups.push(modalCleanup);
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

  MBC.features.videos = {
    initBackground: initBackgroundVideos,
    initModal: initModalVideos,
    initStandalone: initStandaloneVideos,
    createVimeoPlayer: createVimeoPlayer
  };
})();