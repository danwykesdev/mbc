/**
 * Videos Feature
 * Handles standalone video modals with Finsweet Attributes
 */
(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.features = MBC.features || {};

  function setElementVisible(element) {
    if (!element || !element.style) return;

    element.style.opacity = '1';
    element.style.visibility = 'visible';
    element.style.display = '';
  }

  function setIframeVisible(element) {
    if (!element || !element.querySelectorAll) return;

    Array.from(element.querySelectorAll('iframe')).forEach(function (iframe) {
      if (!iframe || !iframe.style) return;
      iframe.style.opacity = '1';
      iframe.style.visibility = 'visible';
      iframe.style.display = 'block';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
    });
  }

  function destroyPlayer(player, wrapper) {
    if (!player) return Promise.resolve();

    if (typeof player.destroy === 'function') {
      return player.destroy().catch(function () {
        if (wrapper) {
          wrapper.innerHTML = '';
        }
      });
    }

    if (wrapper) {
      wrapper.innerHTML = '';
    }

    return Promise.resolve();
  }

  function isModalHidden(modal) {
    if (!modal) return true;
    if (modal.hasAttribute('hidden')) return true;
    if (modal.getAttribute('aria-hidden') === 'true') return true;
    if (modal.classList && modal.classList.contains('is-hidden')) return true;
    if (modal.classList && modal.classList.contains('w-condition-invisible')) return true;

    if (typeof window.getComputedStyle === 'function') {
      var styles = window.getComputedStyle(modal);
      if (styles.display === 'none' || styles.visibility === 'hidden' || styles.opacity === '0') {
        return true;
      }
    }

    return false;
  }

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
      bgTarget = bgVideo;
    }

    setElementVisible(bgTarget || bgVideo);

    if (player && typeof player.ready === 'function') {
      player.ready().then(function () {
        setElementVisible(bgTarget || bgVideo);
        setIframeVisible(bgTarget || bgVideo);

        if (typeof player.play === 'function') {
          player.play().catch(function () {
          });
        }
      }).catch(function () {
        setElementVisible(bgTarget || bgVideo);
        setIframeVisible(bgTarget || bgVideo);
      });
    } else if (player && typeof player.play === 'function') {
      player.play().catch(function () {
      });
    }

    setTimeout(function () {
      setElementVisible(bgTarget || bgVideo);
      setIframeVisible(bgTarget || bgVideo);
    }, 250);

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
    var modalObserver = null;
    var destroyTimeouts = [];
    var modalEndHandlers = [];

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

    function clearDestroyTimeouts() {
      destroyTimeouts.forEach(function (timeoutId) {
        clearTimeout(timeoutId);
      });
      destroyTimeouts = [];
    }

    function queueDestroy(delay) {
      destroyTimeouts.push(setTimeout(function () {
        destroyModalPlayer();
      }, delay));
    }

    function ensureStableWrapper(targetEl) {
      if (!targetEl || !targetEl.parentNode) return stableWrapper;

      if (stableWrapper && stableWrapper.parentNode && stableWrapper !== targetEl) {
        return stableWrapper;
      }

      modalVideoId = targetEl.getAttribute('data-video') || targetEl.getAttribute('data-vimeo-id') || modalVideoId;

      stableWrapper = document.createElement('div');
      stableWrapper.id = targetEl.id || 'video';
      stableWrapper.className = targetEl.className || '';
      stableWrapper.style.cssText = 'width:100%;height:100%;';
      if (modalVideoId) {
        stableWrapper.setAttribute('data-video', modalVideoId);
      }

      targetEl.parentNode.replaceChild(stableWrapper, targetEl);
      return stableWrapper;
    }

    function resolveModalTarget(modalId) {
      if (stableWrapper && stableWrapper.parentNode) {
        return stableWrapper;
      }

      if (modalId) {
        var modal = document.querySelector('[fs-modal-element="modal"][data-modal-id="' + modalId + '"]');
        if (modal) {
          var nestedVideoEl = modal.querySelector('#video, [data-modal-video], [data-video], [data-vimeo-id]');
          if (nestedVideoEl) {
            return ensureStableWrapper(nestedVideoEl);
          }
        }
      }

      return stableWrapper;
    }

    function destroyModalPlayer() {
      var currentPlayer = modalPlayer;

      clearDestroyTimeouts();

      modalPlayer = null;

      if (!currentPlayer) {
        if (stableWrapper) {
          stableWrapper.innerHTML = '';
        }
        return;
      }

      destroyPlayer(currentPlayer, stableWrapper).then(function () {
        if (stableWrapper) {
          stableWrapper.innerHTML = '';
        }
      });
    }

    function onOpen(e) {
      var modalId = e.currentTarget.getAttribute('data-modal-id');
      var targetEl = resolveModalTarget(modalId);

      clearDestroyTimeouts();

      if (!targetEl || !modalVideoId || typeof Vimeo === 'undefined' || !Vimeo.Player) {
        return;
      }

      if (!modalPlayer) {
        targetEl.innerHTML = '';
        modalPlayer = new Vimeo.Player(targetEl, {
          id: modalVideoId,
          autoplay: true,
          loop: true,
          controls: false,
          muted: false,
          autopause: false
        });
      }

      if (modalPlayer && typeof modalPlayer.ready === 'function') {
        modalPlayer.ready().then(function () {
          if (!modalPlayer) return;

          if (typeof modalPlayer.setVolume === 'function') {
            modalPlayer.setVolume(1).catch(function () {});
          }

          if (typeof modalPlayer.setMuted === 'function') {
            modalPlayer.setMuted(false).catch(function () {});
          }

          if (typeof modalPlayer.play === 'function') {
            modalPlayer.play().catch(function () {});
          }
        }).catch(function () {});
      }
    }

    function onClose() {
      queueDestroy(0);
      queueDestroy(120);
      queueDestroy(300);
    }

    function onDocumentClick(e) {
      var trigger = e.target && e.target.closest ? e.target.closest('[fs-modal-element="close"], [data-modal-close], .w-close, .w-lightbox-close, [aria-label="Close"]') : null;
      var clickedModal = e.target && e.target.closest ? e.target.closest('[fs-modal-element="modal"]') : null;

      if (trigger || (clickedModal && e.target === clickedModal)) {
        onClose();
      }
    }

    function onEscape(e) {
      if (e.key !== 'Escape') return;
      onClose();
    }

    openers.forEach(function (el) {
      el.addEventListener('click', onOpen);
    });

    closers.forEach(function (el) {
      el.addEventListener('click', onClose);
    });

    modalElements.forEach(function (el) {
      var transitionHandler = function () {
        if (isModalHidden(el)) {
          onClose();
        }
      };
      var animationHandler = function () {
        if (isModalHidden(el)) {
          onClose();
        }
      };

      modalEndHandlers.push({
        element: el,
        transitionHandler: transitionHandler,
        animationHandler: animationHandler
      });

      el.addEventListener('transitionend', transitionHandler);
      el.addEventListener('animationend', animationHandler);
    });

    document.addEventListener('click', onDocumentClick, true);
    document.addEventListener('keydown', onEscape, true);

    if (typeof MutationObserver !== 'undefined' && modalElements.length) {
      modalObserver = new MutationObserver(function () {
        modalElements.forEach(function (modal) {
          if (isModalHidden(modal)) {
            onClose();
          }
        });
      });

      modalElements.forEach(function (modal) {
        modalObserver.observe(modal, {
          attributes: true,
          attributeFilter: ['class', 'style', 'hidden', 'aria-hidden']
        });
      });
    }

    return function cleanup() {
      openers.forEach(function (el) {
        el.removeEventListener('click', onOpen);
      });
      closers.forEach(function (el) {
        el.removeEventListener('click', onClose);
      });
      modalEndHandlers.forEach(function (entry) {
        entry.element.removeEventListener('transitionend', entry.transitionHandler);
        entry.element.removeEventListener('animationend', entry.animationHandler);
      });

      document.removeEventListener('click', onDocumentClick, true);
      document.removeEventListener('keydown', onEscape, true);

      if (modalObserver) {
        modalObserver.disconnect();
        modalObserver = null;
      }

      clearDestroyTimeouts();
      destroyModalPlayer();
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
