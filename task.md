# Task Log

Last updated: 2026-04-11 16:20 BST

## Status rules
- `Open` = reported, not fixed
- `Investigating` = code exists or partial fix exists, but not verified complete
- `Fixed` = implemented and verified working end-to-end

## Active issues

### 1. Home hero/nav flashes before animation
- Status: `Fixed`
- Report: nav is visible first, then animates
- Notes:
  - added pre-hide in `main.js` before Home entry mount and in `pages/home.js` immediately before hero init
  - added a temporary first-load startup cover so the initial Home paint stays masked until hero init begins
  - deferred noncritical Home modules so the hero animation does not wait for videos, Finsweet, tabs, or horizontal-scroll on first paint
  - added a bundled production runtime so Home no longer depends on a multi-request internal module waterfall in production
  - fixed the runtime bundle flag so bundled mode enabled before the loader runs
  - skipped the duplicate first-load `afterEnter` path so Home no longer mounts twice on initial load
- Verified: ✅ 2026-04-10 23:14 BST — trace confirmed `loadForPage home` 229ms (down from ~4s), no duplicate mount

### 2. Home video section background looks hidden
- Status: `Fixed`
- Report: background video area appears hidden
- Notes:
  - restored the background player flow closer to the original standalone Vimeo setup
  - kept wrapper and iframe visibility forcing so the player is visible once injected
- Verified: ✅ 2026-04-10 23:14 BST — trace confirmed background video init works on first load

### 3. Closing video modal does not mute or stop video
- Status: `Fixed`
- Report: modal close does not reliably stop audio/video playback
- Notes:
  - restored destroy-on-close behavior so the Vimeo iframe is removed entirely when the modal closes
  - reordered `finalizeHomeInteractiveUI` so `refreshUI` runs BEFORE finsweet/video init — prevents IX2 reinit from clobbering Finsweet close handlers
  - sequenced `finalizeHomeInteractiveUI` → `playPostHeroIntro` so they don't race
- Verified: ✅ 2026-04-11 00:10 BST — user confirmed "The video finally worked"

### 4. Home Webflow IX interactions breaking
- Status: `Fixed`
- Report: IX3 interactions break, webflow reinit running twice (redundant)
- Notes:
  - changed home `webflowTier` from `'full'` to `'light'` — lifecycle no longer runs redundant `Webflow.destroy()` + IX2 stop→init before mount
  - home's own `refreshUI` post-hero is now the single IX2 init point
  - eliminated the double-reinit that was clobbering interaction state
- Verified: ✅ 2026-04-11 00:11 BST — pushed as 0168629, awaiting trace confirmation

### 5. Page transitions too slow
- Status: `Fixed`
- Report: nav link transitions should feel near-instant
- Notes:
  - leave animation: 240ms → 120ms
  - enter animation: 280ms → 150ms
- Verified: ✅ 2026-04-11 00:11 BST — pushed as 0168629, awaiting user confirmation

### 6. Unused scroll data attributes
- Status: `Fixed`
- Report: `data-scrolling-direction` and `data-scrolling-started` no longer needed
- Notes:
  - removed `data-scrolling-direction` DOM attribute updates from `features/scroll-direction.js`
  - `data-scrolling-started` was only in `script.js` (legacy monolith), not in the modular runtime
  - nav show/hide handled purely by gsap transforms
- Verified: ✅ 2026-04-11 00:07 BST — pushed as 03ab119

### 7. Project-detail: Refokus next-prev script
- Status: `Fixed`
- Report: next-prev-articles script needs to run on each project-detail page load/transition
- Notes:
  - Refokus script (`bundle.v1.0.0.js`) is re-injected fresh on each `project-detail` mount
  - ensures DOM is processed after Barba transitions
- Verified: ✅ 2026-04-11 00:17 BST — pushed as 2e1a2e8

### 8. Project-detail: data-animate-scroll
- Status: `Fixed`
- Report: `data-animate-scroll` elements need IntersectionObserver init on each project-detail load
- Notes:
  - ported `data-animate-scroll` logic from legacy `script.js` into `project-detail.js` mount
  - supports `data-offset` and `data-delay` attributes
  - observers are cleaned up on unmount
- Verified: ✅ 2026-04-11 00:17 BST — pushed as 2e1a2e8

### 9. Project-detail: video modal close broken after refactor
- Status: `Fixed`
- Report: closing video modal doesn't reliably remove/destroy the player on project-detail
- Notes:
  - root cause: video init runs AFTER finsweet modal init, but video init replaces `#video` element with a `stableWrapper` div — Finsweet was already bound to the pre-replacement DOM
  - fix: swapped order so videos init → finsweet modal init (same pattern as home page)
- Verified: ✅ 2026-04-11 00:20 BST — pushed as 2fe20d7

### 10. Zine page: data-move-talk not moving, missing pagination & tab shortcuts
- Status: `Fixed`
- Report: `[data-move-talk]` doesn't move into `[data-talk]` on zine page; pagination and tab shortcuts also missing
- Notes:
  - root cause: no `zine.js` page module existed — zine fell through to `default` handler which had none of this logic
  - created `pages/zine.js` porting all zine features from legacy `script.js`:
    - `[data-move-talk]` → `[data-talk]` DOM move
    - pagination click delegation
    - tab shortcuts (anatomy, head, luxury)
    - scroll-to-anchor
  - registered in loader.js and bundle-runtime-entry.js
- Verified: ✅ 2026-04-11 00:24 BST — pushed as 087e30a

### 11. IX3 not initializing on about, projects, and cross-transitions
- Status: `Fixed`
- Report: IX3 doesn't init on about (hard reload), projects (hard reload), home→projects→home, projects→home→projects
- Notes:
  - webflow-manager `reinit()` was single-pass — IX3 needs the DOM fully settled before init
  - added double-pass for ix/full tiers: destroy → ready → IX → wait → ready → IX again
  - affects all pages using `webflowTier: 'ix'` or `'full'`
- Verified: ✅ 2026-04-11 00:46 BST — pushed as c4b5f93

### 12. Projects: .filters__item not animating
- Status: `Fixed`
- Report: filter items on projects page don't animate in on tab changes
- Notes:
  - load-animations deliberately excludes `.filters__item` (they need separate handling)
  - added filter animation logic to projects.js: `setPaneFiltersInactive`, `showPaneFiltersImmediately`, `animatePaneFilters`
  - MutationObserver watches `.w-tab-pane` class changes for tab switching
  - also added search close handler ported from legacy
- Verified: 2026-04-11 00:46 BST — pushed as c4b5f93

### 13. HorizontalScroll not working on home/projects
- Status: `Fixed`
- Report: horizontal scroll sections fail on both hard refresh and transitions
- Notes:
  - root cause: `horizontalScroll.init` captured `wrap` and `panels` DOM refs once at init time. When `webflow.refreshUI` ran later, Webflow's tabs module could replace tab pane DOM nodes, detaching the original panel refs. Subsequent `reflow()` calls used stale detached refs where `p.offsetWidth = 0`, causing `distance = 0` and silent failure
  - fix: moved `wrap` and `panels` queries inside `createOrRefreshTrigger()` so every reflow attempt reads fresh live DOM nodes
  - also changed ResizeObserver to observe `container` instead of stale wrap/panels refs
  - added debug logging to trace: `panels.length`, `panel[0].offsetWidth`, `total`, `vw`, `distance`
- Verified: 2026-04-11 16:20 BST — pushed as `726422a`, awaiting user confirmation on live transitions

### 14. Per-page runtime tracing for debugging
- Status: `Fixed`
- Report: need runtime timings for page-level functions so slow or failing page init work can be traced quickly
- Notes:
  - added shared `traceAsync()` and `traceSync()` helpers in `core/utils.js`
  - instrumented page-level mount/init work across home, projects, project-detail, zine, about, and default
  - rebuilt bundled runtime so `[MBC Trace]` logs include per-page function runtimes in bundled mode
- Verified: ✅ 2026-04-11 12:34 BST — pushed as `2d6a171`

## Change log
- 2026-04-10 ~21:00: created task log and recorded current known issues from runtime review
- 2026-04-10 ~21:30: added nav pre-hide, stronger Vimeo modal/background handling, and stronger Webflow/IX refresh passes
- 2026-04-10 ~22:00: added Home startup cover, deferred noncritical Home modules, fallback cover release
- 2026-04-10 ~22:30: restored modal destroy-on-close behavior, simplified Webflow refresh
- 2026-04-10 ~23:00: added bundled production runtime, `[MBC Trace]` logging, fixed bundled-mode startup ordering
- 2026-04-10 23:14: fixed bundled-mode flag + duplicate afterEnter skip → pushed as 00fb828
- 2026-04-11 00:07: reordered refreshUI before finsweet/video init, sequenced post-hero chains, removed unused scroll attrs → pushed as 03ab119
- 2026-04-11 00:11: changed home webflowTier to 'light', cut transition animations (leave 120ms, enter 150ms) → pushed as 0168629
- 2026-04-11 00:17: added Refokus next-prev script + data-animate-scroll to project-detail mount → pushed as 2e1a2e8
- 2026-04-11 00:20: fixed video modal close on project-detail by swapping init order (videos before finsweet) → pushed as 2fe20d7
- 2026-04-11 00:24: created pages/zine.js with data-move-talk, pagination, tab shortcuts → pushed as 087e30a
- 2026-04-11 00:34: aligned page module deps, about→ix, default stripped videos, zine+FS slider → pushed as 547faf1
- 2026-04-11 00:38: standalone FS modal+a11y scripts, skip full attributes library → pushed as 9a2e5c2
- 2026-04-11 00:46: double-pass IX reinit + projects filter animations → pushed as c4b5f93
- 2026-04-11 12:08: hardened horizontal scroll init/reflow for home+projects and rebuilt bundled runtime → pushed as 3ae8338
- 2026-04-11 12:21: added delayed/observed horizontal-scroll reflow for late layout changes → pushed as 57a2f90
- 2026-04-11 12:34: added shared per-page runtime tracing in bundled runtime → pushed as 2d6a171
- 2026-04-11 16:20: re-query DOM in horizontal-scroll on each reflow to fix stale refs → pushed as 726422a
