(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.features = MBC.features || {};

  function initMobileNav() {
    if (typeof gsap === 'undefined') return function () {};

    var menuBtn = document.querySelector('.nav-menu_btn');
    var nav = document.querySelector('.nav');
    var menuWrapper = document.querySelector('.nav-menu');
    var navLinks = nav ? Array.prototype.slice.call(nav.querySelectorAll('.nav-link')) : [];
    var navBottom = document.querySelector('.nav__bottom');
    var navLogo = document.querySelector('.nav-logo_link');
    var isMobile = window.innerWidth <= 991;
    var isOpen = false;
    var closeTl = null;
    var pendingHref = null;
    var pendingTarget = null;

    if (!menuBtn || !nav || !menuWrapper || !navBottom || !isMobile) return function () {};

    gsap.set(menuWrapper, { autoAlpha: 0, x: -16, pointerEvents: 'none', visibility: 'hidden' });
    gsap.set(navLinks, { autoAlpha: 0, x: -14 });
    gsap.set(navBottom, { width: '0%', zIndex: 999 });

    function refreshNavStyles() {
      if (MBC.features.nav && typeof MBC.features.nav.refreshMobileStyles === 'function') {
        MBC.features.nav.refreshMobileStyles();
      }
    }

    function navigateToPendingHref() {
      var href = pendingHref;
      var target = pendingTarget;

      pendingHref = null;
      pendingTarget = null;

      if (!href) return;

      if (typeof barba !== 'undefined' && target && !target.hasAttribute('data-no-barba') && target.target !== '_blank' && !target.hasAttribute('download')) {
        barba.go(href);
        return;
      }

      window.location.href = href;
    }

    function finishClose() {
      nav.classList.remove('is-open');
      menuBtn.classList.remove('w--open');
      gsap.set(menuWrapper, { visibility: 'hidden', pointerEvents: 'none' });
      if (window.lenis && typeof window.lenis.start === 'function') {
        window.lenis.start();
      }
      refreshNavStyles();
      navigateToPendingHref();
    }

    function runCloseSequence() {
      if (closeTl) {
        closeTl.kill();
      }

      gsap.set(navLinks, { autoAlpha: 1, x: 0 });

      closeTl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        onComplete: function () {
          closeTl = null;
          finishClose();
        }
      });

      closeTl
        .to(navLinks, { autoAlpha: 0, x: -14, duration: 0.18, stagger: 0.06 }, 0)
        .to(navBottom, { width: '0%', duration: 0.32 }, '>-0.02')
        .to(navLogo, { autoAlpha: 1, x: 0, duration: 0.18 }, '>-0.02')
        .to(menuWrapper, { autoAlpha: 0, x: -16, duration: 0.22 }, '>-0.02');
    }

    var menuTl = gsap.timeline({
      paused: true,
      defaults: { duration: 0.45, ease: 'power2.out' },
      onStart: function () {
        nav.classList.add('is-open');
        menuBtn.classList.add('w--open');
        gsap.set(menuWrapper, { visibility: 'visible', pointerEvents: 'auto' });
        if (window.lenis && typeof window.lenis.stop === 'function') {
          window.lenis.stop();
        }
        refreshNavStyles();
      },
      onReverseComplete: function () {
        nav.classList.remove('is-open');
        menuBtn.classList.remove('w--open');
        gsap.set(menuWrapper, { visibility: 'hidden', pointerEvents: 'none' });
        if (window.lenis && typeof window.lenis.start === 'function') {
          window.lenis.start();
        }
        refreshNavStyles();
        navigateToPendingHref();
      }
    });

    menuTl
      .to(navBottom, { width: '100vw', duration: 0.5 }, 0)
      .to(navLogo, { autoAlpha: 0.35, x: 8, duration: 0.25 }, 0)
      .to(menuWrapper, { autoAlpha: 1, x: 0, duration: 0.38 }, 0)
      .to(navLinks, { autoAlpha: 1, x: 0, stagger: 0.06, duration: 0.42 }, 0);

    function openMenu() {
      if (isOpen) return;
      isOpen = true;
      menuTl.timeScale(1).restart();
      refreshNavStyles();
    }

    function closeMenu(forceClose) {
      if (!isOpen && !forceClose) return false;
      isOpen = false;
      menuTl.pause();
      runCloseSequence();
      refreshNavStyles();
      return true;
    }

    function onClick() {
      if (isOpen) {
        closeMenu(false);
      } else {
        openMenu();
      }
    }

    function onNavLinkClick(event) {
      var link = event.currentTarget;
      var href;
      var nextUrl;
      var currentPath;
      var nextPath;

      if (!link || !isOpen) return;

      href = link.getAttribute('href') || '';
      if (!href || /^#/.test(href) || /^(mailto:|tel:|javascript:)/i.test(href) || link.target === '_blank' || link.hasAttribute('download') || link.hasAttribute('data-no-barba')) {
        closeMenu(false);
        return;
      }

      try {
        nextUrl = new URL(href, window.location.origin);
        currentPath = window.location.pathname.replace(/\/$/, '') || '/';
        nextPath = nextUrl.pathname.replace(/\/$/, '') || '/';
        if (nextUrl.origin !== window.location.origin || (currentPath === nextPath && nextUrl.hash)) {
          closeMenu(false);
          return;
        }
      } catch (_) {
        closeMenu(false);
        return;
      }

      event.preventDefault();
      pendingHref = nextUrl.href;
      pendingTarget = link;
      closeMenu(true);
    }

    menuBtn.addEventListener('click', onClick);
    navLinks.forEach(function (link) {
      link.addEventListener('click', onNavLinkClick);
    });
    window._closeMobileNav = function (force) {
      var didClose = closeMenu(force || false);

      // Aggressive fallback: if force is true and menu didn't close, force close via DOM manipulation
      if (force && !didClose) {
        nav.classList.remove('is-open');
        menuBtn.classList.remove('w--open');
        gsap.set(menuWrapper, { autoAlpha: 0, x: -16, pointerEvents: 'none', visibility: 'hidden' });
        gsap.set(navLinks, { autoAlpha: 0, x: -14 });
        gsap.set(navBottom, { width: "0%", zIndex: 999 });
        isOpen = false;
        if (closeTl) {
          closeTl.kill();
          closeTl = null;
        }
        if (window.lenis && typeof window.lenis.start === 'function') {
          window.lenis.start();
        }
        refreshNavStyles();
        // Kill and recreate timeline to ensure clean state for next open
        menuTl.kill();
        menuTl = gsap.timeline({
          paused: true,
          defaults: { duration: 0.45, ease: 'power2.out' },
          onStart: function () {
            nav.classList.add('is-open');
            menuBtn.classList.add('w--open');
            gsap.set(menuWrapper, { visibility: 'visible', pointerEvents: 'auto' });
            if (window.lenis && typeof window.lenis.stop === 'function') {
              window.lenis.stop();
            }
            refreshNavStyles();
          },
          onReverseComplete: function () {
            nav.classList.remove('is-open');
            menuBtn.classList.remove('w--open');
            gsap.set(menuWrapper, { visibility: 'hidden', pointerEvents: 'none' });
            if (window.lenis && typeof window.lenis.start === 'function') {
              window.lenis.start();
            }
            refreshNavStyles();
            navigateToPendingHref();
          }
        });
        menuTl
          .to(navBottom, { width: '100vw', duration: 0.5 }, 0)
          .to(navLogo, { autoAlpha: 0.35, x: 8, duration: 0.25 }, 0)
          .to(menuWrapper, { autoAlpha: 1, x: 0, duration: 0.38 }, 0)
          .to(navLinks, { autoAlpha: 1, x: 0, stagger: 0.06, duration: 0.42 }, 0);
      }
    };
    refreshNavStyles();

    return function cleanup() {
      menuBtn.removeEventListener('click', onClick);
      navLinks.forEach(function (link) {
        link.removeEventListener('click', onNavLinkClick);
      });
      if (isOpen) {
        closeMenu(true);
      }
      if (closeTl) {
        closeTl.kill();
        closeTl = null;
      }
      menuTl.kill();
      gsap.set([menuWrapper, navLinks, navBottom, navLogo], { clearProps: 'all' });
      nav.classList.remove('is-open');
      menuBtn.classList.remove('w--open');
      pendingHref = null;
      pendingTarget = null;
      window._closeMobileNav = null;
      if (window.lenis && typeof window.lenis.start === 'function') {
        window.lenis.start();
      }
      refreshNavStyles();
    };
  }

  MBC.features.mobileNav = {
    init: initMobileNav
  };
})();