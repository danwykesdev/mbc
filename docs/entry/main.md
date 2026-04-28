# main.js

## Purpose
This is the main entry point for the MBC modular runtime system. It bootstraps the entire application, sets up the environment detection, initializes Barba.js for single-page application (SPA) transitions, and manages global features that persist across page transitions.

## What It Does

### Environment Detection
- Detects whether the site is running in local development or production mode
- Automatically detects environment based on script source URL (localhost vs jsdelivr CDN)
- Sets the base path for loading modules accordingly
- Supports manual override via `window.MBC_ENV`
- Defaults shared `[MBC Trace]` logging on unless `window.MBC_DEBUG = false` is set before boot

### Global Initialization
- Disables browser scroll restoration for SPA behavior
- Adds CSS classes to enable JavaScript-dependent styling
- Configures GSAP to suppress null target warnings
- Configures ScrollTrigger to ignore mobile-only vertical resize refreshes
- Initializes Lenis smooth scrolling as a global feature

### Barba.js SPA Setup
- Configures Barba.js transitions for seamless page navigation
- Implements page leave/enter animations
- Manages navigation state (theme, background, blur effects)
- Handles special cases for home page hero animation
- Prevents unnecessary navigation (external links, anchor links, same-page links)

### Page Lifecycle Management
- Coordinates with the lifecycle system to mount/unmount pages
- Loads required modules for each page transition
- Initializes shared features (mobile nav, scroll direction)
- Triggers load animations after page transitions

### Navigation State Management
- Detects and applies navigation styling based on page sections
- Handles theme (dark/light), background (solid/none), and blur settings
- Special handling for project-detail pages with light theme

### Home Page Special Handling
- Creates a temporary black cover during initial load to prevent flash
- Prepares hero animation state
- Releases cover after hero animation completes

## Key Functions

### `initBarba()`
Sets up Barba.js hooks and transitions. Handles beforeEnter, afterLeave, enter, and afterEnter hooks to coordinate page transitions with the lifecycle system.

### `mountRoute(data, opts)`
Loads modules for the next page, mounts it, and initializes shared features. Returns the mounted page context.

### `settleAfterMount(container)`
Performs post-mount cleanup: scrolls to top, refreshes Webflow IX, restarts Lenis, and refreshes ScrollTrigger.

### `bypassBarba(url, el)`
Determines whether Barba should handle a navigation. Returns true for external links, anchor-only links, special protocols (mailto, tel), or links with download attribute.

## Dependencies
- Barba.js (for SPA transitions)
- GSAP (for animations)
- Lenis (for smooth scrolling)
- ScrollTrigger (for scroll-based animations)
- MBC.loader (for module loading)
- MBC.core.lifecycle (for page mounting/unmounting)
- MBC.core.webflow (for Webflow integration)
- MBC.features (for feature modules)

## Important Notes
- This file should only be loaded once per page load
- It sets `window.__MBC_APP_ACTIVE` to prevent duplicate initialization
- The file must be loaded after loader.js is available
- Environment detection happens automatically but can be overridden
- Shared runtime trace logs default to enabled so route-enter diagnostics are available during live debugging; set `window.MBC_DEBUG = false` before the runtime boots to suppress them
- `ScrollTrigger.config({ ignoreMobileResize: true })` is applied globally to avoid iOS address-bar height changes forcing refreshes during pinned sections
