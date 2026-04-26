# Agent Guide

## Purpose

This file is the working guide for AI agents making changes in this repo.

Use it to understand:

- which files are authoritative
- how pages are loaded and transitioned
- how `core`, `features`, and `pages` fit together
- how to safely make changes without breaking Barba, Webflow, GSAP, Finsweet, Vimeo, or page-specific behavior
- when and how to update `task.md`

## High-level architecture

This repo is a modular front-end runtime for a Webflow site.

The main runtime stack is:

- `Barba.js` for page transitions
- `Webflow` reinit logic for IX/modules after transitions
- `GSAP` and `ScrollTrigger` for motion and scroll behavior
- `Lenis` for smooth scrolling
- `Finsweet` for modal/list/filter/slider behavior
- `Vimeo Player` for project/home video behavior

The runtime is designed so each page namespace mounts through a page module instead of relying on one giant monolithic script.

## Which files are authoritative

### Primary runtime files

These are the main files to inspect before changing behavior:

- `main.js`
  - main runtime entry
  - sets environment/base path
  - configures Barba hooks and page enter/leave behavior
  - resolves transition nav state
  - binds shared features after mount

- `loader.js`
  - source of truth for module definitions
  - maps core/features/pages
  - detects DOM-dependent features
  - loads external scripts like Vimeo and Finsweet
  - handles bundled vs dynamic runtime mode

- `core/lifecycle.js`
  - source of truth for page mount/unmount flow
  - runs Webflow reinit before page module mount
  - stores current namespace/container/page module in state

- `core/webflow-manager.js`
  - source of truth for Webflow/IX reinit policy
  - defines tiers: `light`, `ix`, `full`, `strong`

- `bundle-runtime-entry.js`
  - source of truth for what gets included in the bundled runtime
  - if a module is missing here, it may not exist in production bundled builds

### Page modules

These are the authoritative page-level implementations:

- `pages/home.js`
- `pages/projects.js`
- `pages/project-detail.js`
- `pages/about.js`
- `pages/zine.js`
- `pages/default.js`

If behavior belongs to a specific namespace, prefer updating the relevant page module.

### Feature modules

Shared feature logic lives in `features/`.

Key files include:

- `features/nav.js`
- `features/mobile-nav.js`
- `features/load-animations.js`
- `features/horizontal-scroll.js`
- `features/stagger-hover.js`
- `features/videos.js`
- `features/finsweet.js`
- `features/lenis.js`
- `features/tabs.js`
- `features/hero.js`
- `features/scroll-direction.js`

### Legacy archive

- `legacy/script.js`
- `legacy/app.js`
- `legacy/bundle-entry.js`
- `legacy/transitions/barba-transition.js`
- `legacy/dist/mbc.bundle.js`

Treat these as **legacy reference files**, not the first place to implement new logic.

Use it when:

- porting old behavior into modular page/feature files
- checking how a behavior originally worked
- comparing old selectors or data attributes

Do **not** assume logic in the `legacy/` folder is active in the current runtime.

## Folder guide

### `core/`

Shared runtime infrastructure.

- `state.js`
  - global runtime state
  - current namespace, container, cleanup stacks, Lenis instance, nav token

- `utils.js`
  - helpers like `debounce`, `waitForLayout`, `normalizeNamespace`, selector diagnostics, `traceAsync`, `traceSync`
  - selector diagnostics on Projects should be interpreted against `fs-list-element="filters"` forms and native Webflow pagination, not only `fs-filter-element`

- `cleanup.js`
  - page/global cleanup stack management

- `page-registry.js`
  - registers and resolves page modules by namespace

- `webflow-manager.js`
  - handles Webflow module ready/init and IX refresh strategy

- `lifecycle.js`
  - orchestrates mount/unmount around transitions

### `features/`

Reusable cross-page behavior.

General rule:

- if logic is reused across multiple namespaces, it belongs here
- if it depends heavily on one namespace’s layout/data, keep it in `pages/`

### `pages/`

Namespace-specific logic.

Each page module usually exports:

- `webflowTier`
- `mount(ctx)`
- `unmount()`

The `mount(ctx)` function should:

- use `ctx.container` as the primary DOM root
- initialize only what the page needs
- return a cleanup function if listeners/observers/timers are created

### `transitions/`

This folder is no longer part of the active runtime path.

Important note:

- the repo currently uses the transition setup in `main.js`
- older alternate transition code is archived under `legacy/transitions/barba-transition.js`

### `dist/`

Built runtime assets.

Important:

- if runtime code changes, rebuild bundled output so `dist/mbc.runtime.js` stays in sync
- `dist/mbc.runtime.js` is the active built site file
- the old `mbc.bundle.js` file is archived under `legacy/dist/mbc.bundle.js`

### `task.md`

Persistent task/change log.

Update this when you make meaningful changes so future agents can quickly understand:

- what was fixed
- where the fix lives
- what commit introduced it
- whether it was verified

## Runtime flow

## 1. Boot

`main.js`:

- detects local vs production base path
- sets `MBC.loader` base path
- adds startup classes
- ensures initial Home cover behavior
- initializes Barba

## 2. Route loading

Before mount, `main.js` calls `MBC.loader.loadForPage(container, namespace)`.

`loader.js` decides:

- which core modules are required
- which shared features are always needed
- which DOM-detected feature modules should load
- which page module matches the namespace
- which external scripts must load first

Examples:

- Vimeo loads when video DOM is detected
- standalone Finsweet modal/a11y scripts load when `[fs-modal-element]` exists
- full Finsweet Attributes loads when list/filter/slider DOM exists

## 3. Mount lifecycle

`core/lifecycle.js` then:

- waits for layout
- runs `MBC.core.webflow.reinit(pageModule.webflowTier)`
- waits for layout again
- calls the page module `mount(ctx)`
- stores the resulting cleanup if returned

## 4. Shared feature binding

After page mount, `main.js` binds shared per-page features such as:

- mobile nav
- scroll-direction
- load animations

## 5. Enter animation and settle

`main.js` then:

- clears fixed positioning used during transition
- resets scroll state
- refreshes IX/Lenis/ScrollTrigger
- plays page enter animation
- optionally plays load intro animations

## 6. Unmount lifecycle

On leave:

- page leave animation runs
- ScrollTriggers are killed
- current page module `unmount()` runs if provided
- page cleanup stack runs

## Webflow tiers

The `webflowTier` on each page module matters.

Use the smallest tier that works.

- `light`
  - minimal Webflow module refresh
  - use for simple pages

- `ix`
  - includes IX refresh
  - use when interactions need rebinding

- `full`
  - stronger reset for richer pages

- `strong`
  - most aggressive reset
  - use when IX3/rebinding is fragile and needs a double-pass

Do not casually upgrade a page to `strong` unless necessary. It can affect timing and page feel.

## Page guide

### `pages/home.js`

Responsible for:

- Home hero behavior
- deferred feature loading for first paint speed
- tabs/video/finsweet sequencing after hero settles
- horizontal scroll + stagger hover binding
- targeted horizontal-scroll debugging without page-level trace noise

Key idea:

- Home is performance-sensitive and intentionally defers some noncritical work

### `pages/projects.js`

Responsible for:

- nav state for projects
- horizontal scroll binding/rebinding
- stagger hover binding/rebinding
- projects filter animation behavior
- search close behavior
- Projects list-load normalization and pagination bridge behavior

Key idea:

- projects has late DOM/layout dependencies, so some behavior rebinds after filter, search, pagination, or tab changes; the page module forces `pagination` by default unless a page-level override sets `data-projects-list-load` or `data-list-load`

### `pages/project-detail.js`

Responsible for:

- project-detail nav/body theme sync
- top-of-page transparent nav state
- project detail video/modal reset and reinit
- local prev/next project population
- `data-animate-scroll`
- `.h1_display-project` fitting
- `[data-set="order"]` numbering
- cleanup of invisible Webflow items
- mutation-driven re-sync for late CMS changes

Key idea:

- this page is sensitive to detail-to-detail transitions; revisit behavior must be treated like a fresh load, and it must explicitly close any open video modal on mount/cleanup while retrying CMS prev/next hydration once if the current link is not ready yet

### `pages/zine.js`

Responsible for:

- shared Finsweet Attributes v2 list/slider init path
- list-tabs prep and hydration wait
- pagination shortcut behavior
- tab shortcut behavior

Key idea:

- zine now uses the shared Finsweet Attributes runtime rather than a standalone slider script, and it should mark `fs-list-element="tabs"` roots with `fs-list-resetix="true"` before Finsweet initializes

### `pages/about.js`

Responsible for:

- setting about nav state
- using `strong` Webflow tier for reliable IX behavior

### `pages/default.js`

Responsible for:

- minimal fallback/default pages
- simple nav state only

## Feature guide

### `features/nav.js`

Owns nav state application to `.nav` and mobile visual sync behavior.

Use it when changing:

- nav theme
- nav background state
- blur state
- mobile/tablet burger/logo styling

### `features/mobile-nav.js`

Owns mobile menu open/close behavior.

Use it when changing:

- mobile nav GSAP timeline
- staggered nav-link animation
- close-before-navigation behavior
- mobile-only menu state logic

### `features/videos.js`

Owns Vimeo background and modal video behavior.

Use it when changing:

- modal player lifecycle
- background video init
- iframe/stable wrapper logic
- close/destroy behavior

This is a high-risk file because stale DOM or modal timing often breaks revisits.

Key idea:

- project-detail can call `MBC.features.videos.closeModal()` to force-close any open modal before teardown or re-entry

### `features/finsweet.js`

Owns repo-specific Finsweet integration behavior.

Use it when changing:

- loader-facing list/filter/slider reset behavior
- list restart behavior
- list destroy / SPA re-entry cleanup behavior
- modal reinjection flow
- module detection/restart logic

### `features/horizontal-scroll.js`

Owns GSAP horizontal scroll behavior.

Important:

- it must query live DOM on reflow
- stale refs here have broken Home/Projects before
- width-only resize guards matter on iOS, because browser chrome height changes can otherwise reflow the pinned section and create large white gaps
- horizontal-scroll diagnostics currently default to on; disable them only with `window.MBC_HORIZONTAL_SCROLL_DEBUG = false`
- horizontal-scroll logs are prefixed with `[MBC HorizontalScroll Debug]` so they stay visible without enabling broader trace output
- horizontal-scroll diagnostics should log abort reasons and pin-spacer metrics while this iPad issue is under investigation
- touch/tablet layouts should suppress ResizeObserver and delayed auto-reflows after the trigger is created, otherwise the pinned section can keep resetting instead of progressing

### `features/stagger-hover.js`

Owns project-card hover animation behavior.

Important:

- treat `<= 991px` as non-hover and keep stagger hover effectively off on tablet/mobile

### `features/load-animations.js`

Owns generic load/intro/reveal animation behavior.

Be careful not to use it for page-specific animations that need custom timing/state.

## External dependency rules

### Finsweet

There are two paths:

- standalone modal/a11y scripts for modal-only pages
- full Finsweet Attributes for list/filter/slider pages

Do not load the full library unless the page actually needs list/filter/slider behavior.

### Vimeo

Loaded when relevant video DOM exists.

If video behavior breaks on revisits:

- inspect wrapper replacement logic
- inspect cleanup timing
- inspect modal rebinding order with Finsweet

### GSAP / ScrollTrigger

This repo depends heavily on GSAP.

- `main.js` applies `ScrollTrigger.config({ ignoreMobileResize: true })` globally so mobile address-bar height changes do not refresh pinned sections mid-scroll
- `main.js` applies `ScrollTrigger.config({ ignoreMobileResize: true })` globally to prevent iOS address-bar height changes from refreshing pinned sections mid-scroll
- shared `[MBC Trace]` timing logs stay off unless `window.MBC_DEBUG === true`; use targeted feature diagnostics for single-issue debugging

When changing animation-related code:

- kill or clear stale tweens when reinitializing
- refresh `ScrollTrigger` after layout changes when needed
- avoid assuming DOM references remain stable across Webflow reinit or Barba transitions

## How AI should work in this repo

## 1. Start from the active modular runtime

Prefer this order when investigating behavior:

- `main.js`
- `loader.js`
- `core/*`
- relevant `pages/*`
- relevant `features/*`
- `task.md`
- `legacy/script.js` only as legacy reference

## 2. Check whether behavior is page-specific or shared

Ask:

- does this belong to one namespace only?
- or is it cross-page behavior?

Put code in:

- `pages/*` for namespace-specific behavior
- `features/*` for reused/shared behavior

## 3. Respect the mount/unmount lifecycle

When adding:

- event listeners
- observers
- timeouts
- animation instances
- resize handlers

always return cleanup or register cleanup so transitions do not leak state.

## 4. Use `ctx.container` first

Avoid broad global selectors unless the behavior is intentionally global.

Default rule:

- query inside `ctx.container`
- fall back to `document` only when truly necessary

## 5. Be careful with late DOM mutations

Webflow, CMS bindings, Finsweet, and Barba can all change DOM after mount.

If behavior depends on final DOM shape:

- consider delayed reflow
- consider mutation observation
- consider rebinding after external init completes

## 6. Rebuild bundled runtime after JS changes

If runtime JS changes, rebuild so production output stays aligned.

Typical command:

```bash
npm run build:runtime
```

## 7. Update `task.md`

When making meaningful changes, update `task.md` with:

- issue title
- status
- short notes on what changed
- verification state
- commit reference if pushed

Do this especially for:

- architectural fixes
- nav/transition behavior
- page lifecycle issues
- project-detail regressions
- Webflow/Finsweet/Vimeo integration changes

## 8. Push carefully

Before pushing:

- rebuild runtime if needed
- commit only relevant files
- if push is rejected, rebase onto latest `origin/main` and push again

## Common pitfalls

- editing `legacy/script.js` and expecting live runtime behavior to change
- forgetting to add a module to `bundle-runtime-entry.js`
- using stale DOM refs across Webflow reinit
- binding global listeners without cleanup
- changing nav state in multiple places without checking `main.js`, `features/nav.js`, and page modules together
- breaking `project-detail` revisit behavior by changing video/modal timing
- making `projects` or `home` slower by blocking mount on noncritical async work

## If you are about to change a page

Check this list first:

- what is the page namespace?
- which `pages/*.js` file owns it?
- what `webflowTier` does it use?
- which `features/*` does it rely on?
- does `loader.js` already load the needed module/script?
- does bundled runtime need updating?
- does `task.md` need a new entry?

## If you are about to change navigation

Inspect together:

- `main.js`
- `features/nav.js`
- `features/mobile-nav.js`
- relevant page module if page-specific

Navigation state is split across:

- transition-time nav state in `main.js`
- shared nav element state in `features/nav.js`
- mobile menu interaction state in `features/mobile-nav.js`
- page-specific overrides in page modules

## If you are about to change project-detail

Inspect together:

- `pages/project-detail.js`
- `features/videos.js`
- `features/finsweet.js`
- `main.js` nav transition logic
- `task.md` for recent regressions/fixes

This page has had repeated regressions around:

- transparent nav on load
- section-driven nav theme changes
- detail-to-detail revisits
- video modal lifecycle
- prev/next project behavior
- title fitting and order numbering
- late CMS/Webflow DOM updates

## Documentation

The `docs/` directory contains detailed documentation for each module in the codebase. This is the best starting point for understanding individual files.

### Documentation structure

- `docs/entry/` - Entry point documentation
  - `main.md` - Main runtime entry and Barba.js setup
  - `loader.md` - Dynamic module loading and dependency resolution
  - `bundle-runtime-entry.md` - Build entry for production bundling

- `docs/core/` - Core infrastructure documentation
  - `cleanup.md` - Cleanup stack management
  - `lifecycle.md` - Page mount/unmount orchestration
  - `page-registry.md` - Page module registration and resolution
  - `state.md` - Global runtime state
  - `utils.md` - Utility functions (timing, namespace, tracing)
  - `webflow-manager.md` - Webflow IX2/IX3 reinitialization

- `docs/features/` - Feature module documentation
  - `finsweet.md` - Finsweet Attributes integration
  - `hero.md` - Home hero animation
  - `horizontal-scroll.md` - Horizontal scroll sections
  - `lenis.md` - Lenis smooth scrolling
  - `load-animations.md` - Page load and reveal animations
  - `mobile-nav.md` - Mobile navigation menu
  - `nav.md` - Navigation state management
  - `scroll-direction.md` - Scroll-based nav hide/show
  - `stagger-hover.md` - Project card hover effects
  - `tabs.md` - Custom tab system
  - `videos.md` - Vimeo video integration

- `docs/pages/` - Page module documentation
  - `about.md` - About page module
  - `default.md` - Default/fallback page module
  - `home.md` - Home page module
  - `project-detail.md` - Project detail page module
  - `projects.md` - Projects page module
  - `zine.md` - Zine page module

### Using the documentation

When investigating or modifying a module:
1. Read the corresponding markdown file in `docs/`
2. Understand the module's purpose, key functions, and integration points
3. Check the "Important Notes" section for critical details
4. Review the "Dependencies" section for required external libraries
5. Use the "Usage Pattern" examples as a reference

The documentation is written in plain language optimized for AI understanding, avoiding jargon where possible and explaining complex concepts clearly.

## Summary

The current source of truth is the modular runtime, not the legacy monolith.

Future AI agents should:

- understand the page lifecycle before editing
- prefer page modules for namespace logic
- prefer feature modules for shared logic
- treat `legacy/script.js` as reference only
- rebuild the bundled runtime after JS changes
- update `task.md` after meaningful work
- be extra careful with `project-detail`, navigation, Webflow reinit, and any late-mutating CMS/Finsweet behavior
- consult the `docs/` directory for detailed module documentation before making changes
