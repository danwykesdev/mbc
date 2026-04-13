(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.pages = MBC.pages || {};

  /**
   * Initialize data-animate-scroll elements with IntersectionObserver
   */
  function initAnimateScroll(container) {
    var items = container.querySelectorAll('[data-animate-scroll]');
    if (!items.length) return null;

    var observers = [];
    var groups = {};

    items.forEach(function (item) {
      // Reset state for SPA transitions
      item.classList.remove('is-visible');

      var offset = (item.getAttribute('data-offset') || '50').replace('%', '');
      if (!groups[offset]) groups[offset] = [];
      groups[offset].push(item);
    });

    Object.keys(groups).forEach(function (offset) {
      var observer = new IntersectionObserver(function (entries, obs) {
        entries.filter(function (e) { return e.isIntersecting; }).forEach(function (entry, index) {
          var el = entry.target;
          var delay = el.getAttribute('data-delay') !== null
            ? parseInt(el.getAttribute('data-delay'), 10)
            : index * 120;

          setTimeout(function () {
            el.classList.add('is-visible');
            obs.unobserve(el);
          }, delay);
        });
      }, {
        rootMargin: '0px 0px -' + offset + '% 0px',
        threshold: 0
      });

      groups[offset].forEach(function (el) {
        observer.observe(el);
      });
      observers.push(observer);
    });

    return function cleanup() {
      observers.forEach(function (obs) { obs.disconnect(); });
    };
  }

  function initPrevNextProjects(container) {
    var sourceRoot = document.querySelector('[r-prevnext-source], [np-articles-source]');
    var currentEl;
    var links;
    var currentLink;
    var currentIndex;
    var prevLink;
    var nextLink;

    if (!sourceRoot) return;

    currentEl = sourceRoot.querySelector('.w--current');
    if (!currentEl) return;

    links = Array.from(sourceRoot.querySelectorAll('a[href]'));
    if (!links.length) return;

    currentLink =
      (currentEl.matches && currentEl.matches('a') ? currentEl : null) ||
      (currentEl.closest ? currentEl.closest('a') : null) ||
      (currentEl.querySelector ? currentEl.querySelector('a') : null);

    if (!currentLink) return;

    currentIndex = links.indexOf(currentLink);
    if (currentIndex < 0) return;

    prevLink = links[(currentIndex - 1 + links.length) % links.length];
    nextLink = links[(currentIndex + 1) % links.length];

    function getData(link) {
      return {
        href: link ? link.getAttribute('href') || '' : '',
        title: link && link.innerText ? link.innerText.trim() : '',
        imgSrc: link && link.querySelector ? ((link.querySelector('img') && link.querySelector('img').getAttribute('src')) || '') : ''
      };
    }

    function applyMapping(selector, attr, value) {
      if (!value) return;

      Array.from(document.querySelectorAll(selector)).forEach(function (el) {
        if (!el) return;
        if (attr === 'text') {
          el.innerText = value;
        } else {
          el.setAttribute(attr, value);
        }
      });
    }

    var prev = getData(prevLink);
    var next = getData(nextLink);

    applyMapping('[r-prevnext-next-btn], [np-articles-next-btn]', 'href', next.href);
    applyMapping('[r-prevnext-next-text], [np-articles-next-text]', 'text', next.title);
    applyMapping('[r-prevnext-prev-btn], [np-articles-prev-btn]', 'href', prev.href);
    applyMapping('[r-prevnext-prev-text], [np-articles-prev-text]', 'text', prev.title);
    applyMapping('[r-prevnext-prev-img], [np-articles-prev-img]', 'src', prev.imgSrc);
    applyMapping('[r-prevnext-next-img], [np-articles-next-img]', 'src', next.imgSrc);
  }

  function processProjectDetailPageData(container) {
    var removeElements = container.querySelectorAll('.row.w-condition-invisible');
    var orderElements = container.querySelectorAll('[data-set="order"]');

    removeElements.forEach(function (el) {
      el.remove();
    });

    orderElements.forEach(function (el, index) {
      var orderNumber = String(index + 1).padStart(2, '0');
      el.textContent = '[' + orderNumber + ']';
    });
  }

  function fitProjectTitleToContainer(container) {
    var containerEl = container.querySelector('.container.is-inline');
    var textEl = container.querySelector('.h1_display-project');
    var containerWidth;
    var originalFontSize;
    var measurer;
    var fontSize;

    if (typeof gsap === 'undefined') return;
    if (!containerEl || !textEl) return;

    containerWidth = containerEl.offsetWidth;
    if (!containerWidth) return;

    if (!textEl.dataset.originalFontSize) {
      textEl.dataset.originalFontSize = String(parseFloat(window.getComputedStyle(textEl).fontSize));
    }

    originalFontSize = parseFloat(textEl.dataset.originalFontSize || '16');
    measurer = textEl.cloneNode(true);
    measurer.style.position = 'absolute';
    measurer.style.visibility = 'hidden';
    measurer.style.pointerEvents = 'none';
    measurer.style.whiteSpace = 'nowrap';
    measurer.style.width = 'auto';
    measurer.style.left = '-9999px';
    measurer.style.top = '-9999px';
    measurer.style.fontSize = originalFontSize + 'px';

    document.body.appendChild(measurer);

    fontSize = originalFontSize;
    while (measurer.offsetWidth > containerWidth && fontSize > 8) {
      fontSize -= 1;
      measurer.style.fontSize = fontSize + 'px';
    }

    document.body.removeChild(measurer);

    gsap.to(textEl, {
      fontSize: fontSize + 'px',
      duration: 0.4,
      ease: 'power2.out',
      overwrite: 'auto'
    });
  }

  function resetProjectDetailVideoDom(container) {
    if (!container) return;

    Array.from(container.querySelectorAll('#video iframe, #videoLoad iframe, [data-modal-video] iframe, [data-bg-video] iframe')).forEach(function (iframe) {
      if (iframe && iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    });

    Array.from(container.querySelectorAll('#video, #videoLoad, [data-modal-video], [data-bg-video]')).forEach(function (el) {
      if (!el || !el.style) return;
      el.style.opacity = '';
      el.style.visibility = '';
      el.style.display = '';
    });
  }

  function setProjectDetailBodyTheme(theme) {
    var nextTheme = theme === 'dark' ? 'dark' : 'light';

    if (document.body) {
      document.body.setAttribute('data-theme-section', nextTheme);
    }
  }

  function parseProjectDetailBlur(value) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (value === false || value === 'false' || value === '0' || value === 'none' || value === 'no-blur') {
      return false;
    }

    return true;
  }

  function resolveProjectDetailNavState(section) {
    if (!section) {
      return {
        theme: 'light',
        bg: 'none',
        blur: false
      };
    }

    var theme = section.getAttribute('data-theme-section') || section.getAttribute('data-nav-theme') || 'light';
    var blur = parseProjectDetailBlur(section.getAttribute('data-nav-blur'));
    var bg = section.getAttribute('data-bg-section') || section.getAttribute('data-bg-nav') || null;

    if (blur === null) {
      blur = theme === 'dark';
    }

    if (blur === false) {
      bg = 'none';
    } else if (!bg) {
      bg = 'solid';
    }

    return {
      theme: theme === 'dark' ? 'dark' : 'light',
      bg: bg,
      blur: blur
    };
  }

  function applyProjectDetailNavState(state) {
    var nextState = state || { theme: 'light', bg: 'none', blur: false };
    var nav = document.querySelector('.nav');

    if (nav) {
      nav.setAttribute('data-theme-nav', nextState.theme);
      nav.setAttribute('data-nav-theme', nextState.theme);
      nav.setAttribute('data-bg-nav', nextState.bg);
      nav.setAttribute('data-nav-bg', nextState.bg);
      nav.setAttribute('data-nav-blur', nextState.blur ? 'true' : 'false');
    }

    if (MBC.features.nav) {
      MBC.features.nav.setState(nextState);
    }
  }

  function initProjectDetailThemeScroll(container) {
    if (!container) return null;

    var sections = Array.from(container.querySelectorAll('[data-theme-section]'));
    if (!sections.length) {
      setProjectDetailBodyTheme('light');
      applyProjectDetailNavState({ theme: 'light', bg: 'none', blur: false });
      return null;
    }

    var navBarHeightEl = document.querySelector('[data-nav-bar-height]');
    var offset = navBarHeightEl ? navBarHeightEl.offsetHeight / 2 : 0;
    var rafId = null;

    function updateTheme() {
      rafId = null;
      var activeSection = null;

      if ((window.scrollY || window.pageYOffset || 0) <= 8) {
        setProjectDetailBodyTheme('light');
        applyProjectDetailNavState({ theme: 'light', bg: 'none', blur: false });
        return;
      }

      sections.forEach(function (section) {
        var rect = section.getBoundingClientRect();
        if (rect.top <= offset && rect.bottom >= offset) {
          activeSection = section;
        }
      });

      if (!activeSection) {
        setProjectDetailBodyTheme('light');
        applyProjectDetailNavState({ theme: 'light', bg: 'none', blur: false });
        return;
      }

      setProjectDetailBodyTheme(activeSection.getAttribute('data-theme-section') || 'light');
      applyProjectDetailNavState(resolveProjectDetailNavState(activeSection));
    }

    function onScroll() {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(updateTheme);
    }

    updateTheme();
    document.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return function cleanup() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      document.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (document.body) {
        document.body.removeAttribute('data-theme-section');
      }
    };
  }

  function applyInitialProjectDetailNavState() {
    if (document.documentElement) {
      document.documentElement.removeAttribute('data-theme-nav');
      document.documentElement.removeAttribute('data-nav-theme');
      document.documentElement.removeAttribute('data-bg-nav');
      document.documentElement.removeAttribute('data-nav-blur');
    }

    if (document.body) {
      document.body.removeAttribute('data-theme-nav');
      document.body.removeAttribute('data-nav-theme');
      document.body.removeAttribute('data-bg-nav');
      document.body.removeAttribute('data-nav-blur');
    }

    applyProjectDetailNavState({ theme: 'light', bg: 'none', blur: false });
    setProjectDetailBodyTheme('light');
  }

  async function mount(ctx) {
    var container = ctx.container;
    var cleanups = [];
    var videoCleanup = null;
    var debounce = MBC.core && MBC.core.utils && MBC.core.utils.debounce
      ? MBC.core.utils.debounce
      : function (fn) { return fn; };
    var traceAsync = MBC.core && MBC.core.utils && MBC.core.utils.traceAsync
      ? MBC.core.utils.traceAsync
      : function (label, promiseFactory) { return Promise.resolve().then(promiseFactory); };
    var traceSync = MBC.core && MBC.core.utils && MBC.core.utils.traceSync
      ? MBC.core.utils.traceSync
      : function (_, fn) { return fn(); };

    applyInitialProjectDetailNavState();
    resetProjectDetailVideoDom(container);
    traceSync('project-detail processPageData', function () {
      processProjectDetailPageData(container);
    });

    // Videos init BEFORE Finsweet — video init replaces #video element
    // with a stableWrapper, so this must happen before Finsweet binds
    // its modal open/close handlers to the DOM
    if (MBC.features.videos) {
      videoCleanup = traceSync('project-detail videos.initStandalone', function () {
        return MBC.features.videos.initStandalone({ container: container });
      });
      if (typeof videoCleanup === 'function') {
        cleanups.push(videoCleanup);
      }
    }

    // Finsweet modal AFTER video DOM is stable
    if (MBC.features.finsweet) {
      await traceAsync('project-detail finsweet.modal init', function () {
        return MBC.features.finsweet.init(container, { modules: ['modal'] });
      });
    }

    if (MBC.features.videos) {
      if (typeof videoCleanup === 'function') {
        try { videoCleanup(); } catch (_) {}
      }

      resetProjectDetailVideoDom(container);

      videoCleanup = traceSync('project-detail videos.initStandalone refresh', function () {
        return MBC.features.videos.initStandalone({ container: container });
      });
      if (typeof videoCleanup === 'function') {
        cleanups.push(videoCleanup);
      }
    }

    applyInitialProjectDetailNavState();

    // Scroll-triggered animations
    var scrollAnimCleanup = traceSync('project-detail initAnimateScroll', function () {
      return initAnimateScroll(container);
    });
    if (typeof scrollAnimCleanup === 'function') {
      cleanups.push(scrollAnimCleanup);
    }

    var bodyThemeCleanup = traceSync('project-detail initThemeScroll', function () {
      return initProjectDetailThemeScroll(container);
    });
    if (typeof bodyThemeCleanup === 'function') {
      cleanups.push(bodyThemeCleanup);
    }

    // Slide reveal animations
    if (MBC.features.loadAnimations && typeof MBC.features.loadAnimations.init === 'function') {
      var loadAnimCleanup = traceSync('project-detail loadAnimations.init', function () {
        return MBC.features.loadAnimations.init(container);
      });
      if (typeof loadAnimCleanup === 'function') {
        cleanups.push(loadAnimCleanup);
      }
    }

    await traceAsync('project-detail initPrevNextProjects', function () {
      return Promise.resolve().then(function () {
        initPrevNextProjects(container);
      });
    });

    var fitTitle = function () {
      fitProjectTitleToContainer(container);
    };
    var onResize = debounce(function () {
      fitTitle();
    }, 120);

    window.addEventListener('resize', onResize);
    cleanups.push(function () {
      window.removeEventListener('resize', onResize);
    });

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        fitTitle();
      });
    });

    if (document.fonts && document.fonts.ready && typeof document.fonts.ready.then === 'function') {
      document.fonts.ready.then(function () {
        if (!document.body.contains(container)) return;
        fitTitle();
      });
    }

    requestAnimationFrame(function () {
      applyInitialProjectDetailNavState();
    });

    return function cleanup() {
      cleanups.forEach(function (fn) {
        if (typeof fn === 'function') {
          try { fn(); } catch (_) {}
        }
      });
    };
  }

  function unmount() {}

  var moduleDef = {
    webflowTier: 'ix',
    mount: mount,
    unmount: unmount
  };

  MBC.pages.projectDetail = moduleDef;

  if (MBC.core && MBC.core.registry) {
    MBC.core.registry.register('project-detail', moduleDef);
  }
})();