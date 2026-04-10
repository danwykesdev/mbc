/**
 * Custom Tabs Feature
 * Hover-activated tabs with staggered animations
 * Used on Home page for project categories
 */
(function () {
  window.MBC = window.MBC || {};
  var MBC = window.MBC;

  MBC.features = MBC.features || {};

  function initTabs(container) {
    var root = container.querySelector('.project_component');
    if (!root) return null;

    var tabs = Array.from(root.querySelectorAll('.project__link'));
    var panes = Array.from(root.querySelectorAll('.project__tab-pane'));

    if (!tabs.length || !panes.length) return null;

    var activeName = tabs.find(function (t) {
      return t.classList.contains('w--current');
    })?.getAttribute('data-w-tab') || tabs[0]?.getAttribute('data-w-tab') || 'event-production';

    var cleanups = [];
    var timers = [];

    function addCleanup(fn) {
      cleanups.push(fn);
    }

    function on(el, evt, fn, opts) {
      el.addEventListener(evt, fn, opts);
      addCleanup(function () { el.removeEventListener(evt, fn, opts); });
    }

    function clearTimers() {
      timers.forEach(clearTimeout);
      timers = [];
    }

    function later(fn, delay) {
      var id = setTimeout(fn, delay);
      timers.push(id);
    }

    function getPane(name) {
      return panes.find(function (p) { return p.getAttribute('data-w-tab') === name; });
    }

    function getList(pane, name) {
      if (!pane) return null;
      return pane.querySelector('.project_url-list[data-projects="' + name + '"]');
    }

    function getTextItems(list) {
      if (!list) return [];
      return Array.from(list.querySelectorAll('.service-item-mask > a, .service-item-mask > .w-inline-block'));
    }

    function resetAll() {
      tabs.forEach(function (tab) {
        tab.classList.remove('is-active', 'w--current');
        tab.setAttribute('aria-selected', 'false');
        tab.setAttribute('tabindex', '-1');
      });

      panes.forEach(function (pane) {
        pane.classList.remove('is-active', 'w--tab-active');
        pane.style.display = 'none';
        pane.style.opacity = '0';
        pane.style.visibility = 'hidden';

        pane.querySelectorAll('.images_grid-item').forEach(function (el) {
          el.classList.remove('is-visible');
          el.style.visibility = '';
          el.style.opacity = '';
        });

        pane.querySelectorAll('.project_url-list').forEach(function (list) {
          list.classList.remove('is-active');
          list.style.display = 'none';
          list.style.opacity = '';
          list.style.visibility = '';

          getTextItems(list).forEach(function (el) {
            el.classList.remove('is-visible', 'is-hiding');
            el.style.visibility = '';
          });
        });
      });
    }

    function keepCurrentVisible() {
      clearTimers();

      var tab = tabs.find(function (t) { return t.getAttribute('data-w-tab') === activeName; });
      var pane = getPane(activeName);
      var list = getList(pane, activeName);

      if (!tab || !pane) return;

      tab.classList.add('is-active', 'w--current');
      tab.setAttribute('aria-selected', 'true');
      tab.removeAttribute('tabindex');

      pane.classList.add('is-active', 'w--tab-active');
      pane.style.display = window.innerWidth <= 992 ? 'flex' : 'block';
      pane.style.opacity = '1';
      pane.style.visibility = 'visible';

      if (list) {
        list.classList.add('is-active');
        list.style.display = 'flex';
        list.style.opacity = '1';
        list.style.visibility = 'visible';
      }

      pane.querySelectorAll('.images_grid-item').forEach(function (el) {
        el.classList.add('is-visible');
        el.style.visibility = 'visible';
        if (activeName === 'event-production') el.style.opacity = '1';
      });

      if (list) {
        getTextItems(list).forEach(function (el) {
          el.classList.add('is-visible');
          el.style.visibility = 'visible';
        });
      }
    }

    function animateTextItems(list) {
      var textItems = getTextItems(list);
      var textStart = 120;
      var textDelays = [0, 35, 75, 125, 185];

      textItems.forEach(function (item, index) {
        item.classList.remove('is-visible');
        item.style.visibility = 'visible';

        later(function () {
          item.classList.add('is-visible');
        }, textStart + (textDelays[index] || index * 55));
      });
    }

    function activate(name) {
      if (!name || name === activeName) return;

      clearTimers();
      resetAll();

      var tab = tabs.find(function (t) { return t.getAttribute('data-w-tab') === name; });
      var pane = getPane(name);
      var list = getList(pane, name);

      if (!tab || !pane) return;

      activeName = name;

      tab.classList.add('is-active', 'w--current');
      tab.setAttribute('aria-selected', 'true');
      tab.removeAttribute('tabindex');

      pane.classList.add('is-active', 'w--tab-active');
      pane.style.display = window.innerWidth <= 992 ? 'flex' : 'block';
      pane.style.opacity = '1';
      pane.style.visibility = 'visible';

      // Stagger image items
      var imageItems = pane.querySelectorAll('.images_grid-item');
      var imgDelays = [0, 80, 160, 240];

      imageItems.forEach(function (img, index) {
        later(function () {
          img.classList.add('is-visible');
          img.style.visibility = 'visible';
        }, imgDelays[index] || index * 80);
      });

      if (list) {
        list.classList.add('is-active');
        list.style.display = 'flex';
        list.style.opacity = '1';
        list.style.visibility = 'visible';

        animateTextItems(list);
      }
    }

    // Setup event listeners
    tabs.forEach(function (tab) {
      var name = tab.getAttribute('data-w-tab');
      if (!name) return;

      on(tab, 'mouseenter', function () { activate(name); });
      on(tab, 'click', function (e) {
        e.preventDefault();
        activate(name);
      });
    });

    // Initial state
    keepCurrentVisible();

    // Cleanup function
    return function cleanup() {
      clearTimers();
      cleanups.forEach(function (fn) {
        try { fn(); } catch (_) {}
      });
    };
  }

  MBC.features.tabs = {
    init: initTabs
  };
})();
