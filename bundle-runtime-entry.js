window.__MBC_BUNDLED_RUNTIME__ = true;

window.__MBC_BUILD_VERSION__ = 'mobile-nav-transition-cover-white-2026-04-30-11';

if (typeof console !== 'undefined') {
	console.log('[MBC Build] mobile nav transition cover now uses white to avoid a black flash between pages | version:', window.__MBC_BUILD_VERSION__);
}

import './loader.js';

import './core/state.js';
import './core/utils.js';
import './core/cleanup.js';
import './core/page-registry.js';
import './core/webflow-manager.js';
import './core/lifecycle.js';

import './features/lenis.js';
import './features/nav.js';
import './features/mobile-nav.js';
import './features/scroll-direction.js';
import './features/load-animations.js';
import './features/stagger-hover.js';
import './features/tabs.js';
import './features/hero.js';
import './features/videos.js';
import './features/finsweet.js';
import './features/horizontal-scroll.js';

import './pages/home.js';
import './pages/projects.js';
import './pages/project-detail.js';
import './pages/about.js';
import './pages/zine.js';
import './pages/default.js';

import './main.js';
