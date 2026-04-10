# MBC Modular System - Webflow Integration Guide

This modular system replaces the `script.js` monolith with a dynamic module loader that loads only the code needed for each page.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        main.js                              │
│  Entry point - sets up Barba, calls loader                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      loader.js                               │
│  Dynamic module loader with dependency resolution            │
│  - Loads core modules on every page                          │
│  - Detects features from DOM attributes                    │
│  - Loads page modules by namespace                           │
│  - Injects Finsweet script when needed                       │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  core/         │    │  features/     │    │  pages/        │
│  - state       │    │  - lenis       │    │  - home        │
│  - cleanup     │    │  - nav         │    │  - projects    │
│  - lifecycle   │    │  - tabs        │    │  - project-    │
│  - webflow     │    │  - hero        │    │    detail      │
│  - registry    │    │  - videos      │    │  - about       │
│  - utils       │    │  - finsweet    │    │  - default     │
│                │    │  - horizontal- │    │                │
│                │    │    scroll      │    │                │
└───────────────┘    └───────────────┘    └───────────────┘
```

## File Structure

```
/js
  /core
    state.js           # Global state management
    cleanup.js         # Cleanup stack for listeners/animations
    lifecycle.js       # Page mount/unmount orchestration
    webflow-manager.js # Webflow IX2/IX3 reinit (simplified)
    registry.js        # Page module registry
    utils.js           # Shared utilities
  /features
    lenis.js           # Smooth scroll
    nav.js             # Nav theme/state
    mobile-nav.js      # Mobile menu toggle
    scroll-direction.js # Scroll up/down detection
    tabs.js            # Home page hover tabs
    hero.js            # Home hero animations
    videos.js          # Vimeo background + modal
    finsweet.js        # FS Attributes integration
    horizontal-scroll.js # Projects page scroll
  /pages
    home.js            # Home page module
    projects.js        # Projects page module
    project-detail.js  # Project detail module
    about.js           # About page module
    default.js         # Fallback module
  loader.js            # Module loader with deps
  main.js              # Entry point
```

## Webflow Setup

### 1. Upload Files

Upload all files in `/js` to Webflow's asset hosting. The structure should be:
```
https://your-site.com/js/loader.js
https://your-site.com/js/main.js
https://your-site.com/js/core/state.js
...etc
```

### 2. HTML Structure

Ensure your pages have:
```html
<body data-barba="wrapper">
  <main data-barba="container" data-barba-namespace="home">
    <!-- Page content -->
  </main>
</body>
```

Namespace values should match the page modules:
- `home` → loads `pages/home.js`
- `projects` → loads `pages/projects.js`
- `project-detail` → loads `pages/project-detail.js`
- `about` → loads `pages/about.js`

### 3. Script Tags

Replace your current bundle script with:

```html
<!-- In <head> -->
<script src="https://cdn.jsdelivr.net/npm/@barba/core@2.10.3/dist/barba.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.3.17/dist/lenis.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/ScrollTrigger.min.js"></script>
<script src="https://player.vimeo.com/api/player.js"></script>

<!-- In </body> before closing -->
<script src="/js/loader.js"></script>
<script src="/js/main.js"></script>
```

**Note:** Finsweet Attributes script is now loaded dynamically by `loader.js` only when `[fs-*]` attributes are detected. Remove the static Finsweet script tag.

## How It Works

### Page Load Flow

1. **First Load:**
   ```
   main.js → loader.loadForPage() → load core modules → detect features → 
   load page module → mount() → webflow.reinit() → animations
   ```

2. **Barba Transition:**
   ```
   leave() → cleanup() → kill ScrollTriggers → 
   beforeEnter() → loadForPage() → mount() → 
   enter() → reinit() → refresh ScrollTrigger
   ```

### Feature Detection

The loader checks for DOM attributes to decide which features to load:

| Feature | DOM Check | Loads When... |
|---------|-----------|---------------|
| `tabs` | `.project_component` | Project component exists |
| `hero` | `.hero-animate` | Hero section exists |
| `videos` | `[fs-modal-element]` | Finsweet modal present |
| `finsweet` | `[fs-*]` | Any FS attributes found |
| `horizontal-scroll` | `[data-horizontal-scroll]` | Horizontal section exists |

### Finsweet Integration

Finsweet Attributes is now loaded **dynamically**:

1. Loader detects `[fs-list-element]`, `[fs-modal-element]`, etc.
2. Injects the FS Attributes script from CDN
3. Waits for it to load
4. Calls `features/finsweet.js` to restart modules on each page transition

This fixes the issue where FS modal wasn't reconnecting after transitions.

## Debugging

Enable debug logging by adding this before main.js:
```javascript
<script>
  window.MBC_DEBUG = true;
</script>
```

The loader and lifecycle will log module loading and initialization.

## Migration from script.js

### What's Different

| Aspect | Old (script.js) | New (modular) |
|--------|-----------------|---------------|
| Bundle | Single 84KB bundle | Multiple files, loaded on demand |
| Webflow reinit | Complex 3-pass | Simple osmo.md pattern |
| FS loading | Static script tag | Dynamic injection |
| IX3 on projects | Broken (isolation mode) | Fixed - proper reinit |
| Tabs on home | Inline code | Feature module |
| Hero animation | Inline code | Feature module |

### What's Preserved

- Lenis smooth scroll configuration
- Barba transition timing (0.24s out, 0.28s in)
- Nav state management
- Webflow page ID syncing
- Token-based stale operation prevention
- Cleanup stack pattern

## Troubleshooting

### "Module not found" errors
Check that the `loader.setBasePath()` in main.js matches your actual asset path.

### Finsweet not working
The loader looks for `[fs-*]` attributes. Ensure your HTML has the proper FS attribute syntax.

### IX3 not reinitializing
Check browser console for `[MBC] ix3 init` messages. If missing, the `webflowTier: 'full'` or `'ix'` setting on the page module may need adjustment.

### Scripts loading out of order
The loader handles dependencies automatically. If you're seeing "MBC is not defined" errors, ensure `loader.js` loads before `main.js`.

## Comparison: osmo.md vs This Implementation

Both follow similar patterns:
- `afterLeave`: Kill all ScrollTriggers
- `afterEnter`: Refresh ScrollTrigger
- Simple Webflow reinit (destroy → ready → init)
- Barba hooks for lifecycle

Key difference: This implementation adds module loading and Finsweet integration on top of the osmo patterns.
