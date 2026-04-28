# Task Log

Last updated: 2026-04-28 16:45:00Z

## Status rules
- `Open` = reported, not fixed
- `Investigating` = code exists or partial fix exists, but not verified complete
- `Fixed` = implemented and verified working end-to-end

## Commit History

### investigating - re-enable shared runtime trace logs for projects route debugging
- Date: 2026-04-28 16:45:00Z
- Branch: horizontal-scroll-debug-logs
- Changes:
  - Defaulted `window.MBC_DEBUG` to `true` in `main.js` so existing loader, lifecycle, utils, and Finsweet `[MBC Trace]` instrumentation emits on page load again
  - Rebuilt `dist/mbc.runtime.js` so the active bundled runtime includes the trace-default change
  - Documented that shared trace logs are now on by default and can be suppressed with `window.MBC_DEBUG = false` before runtime boot
- Related to: Capturing route-enter diagnostics for projects horizontal scroll, filters, and Finsweet readiness failures

### investigating - restore projects main-instance sync and route-enter list readiness guards
- Date: 2026-04-28 15:23:11Z
- Branch: horizontal-scroll-debug-logs
- Changes:
  - Restored Projects-side main list instance wiring so external `fs-list-element="filters"` and `fs-list-element="scroll-anchor"` are stamped to the active list instance before Finsweet init
  - Hardened Projects route-enter list detection and restart sequencing by queuing restart requests until the list module is confirmed ready
  - Added deterministic post-bind horizontal-scroll reflow checkpoint after list-driven DOM updates
  - Updated Projects and Finsweet docs to match current runtime contracts (task-chain serialization and observer/restart timing)
- Related to: Projects route enter where filters, pagination, and horizontal-scroll wrap all fail to reinitialize

### investigating - guard projects mount/init and serialize Finsweet route work
- Date: 2026-04-28 14:50:59Z
- Branch: horizontal-scroll-debug-logs
- Changes:
  - Added a projects mount guard keyed by lifecycle navigation token + container to prevent duplicate same-route mount work
  - Stopped forcing horizontal-scroll teardown before every projects rebind so repeated list refreshes can reuse/reflow the active instance instead of recreating triggers
  - Serialized Finsweet init/restart/destroy operations in `features/finsweet.js` to avoid home deferred init and projects init collisions during transitions
  - Added extra container presence checks in home deferred finalize flow so stale home async work does not run tabs/Finsweet after navigating away
  - Rebuilt `dist/mbc.runtime.js`
- Related to: Multiple `[MBC HorizontalScroll Debug]` init cycles on projects and missing filters/list behavior on home -> projects navigation

### 6e4fdba - stabilize touch horizontal scroll reflows
- Date: 2026-04-16 23:06:00Z
- Branch: main
- Changes:
  - Suppressed ResizeObserver-driven and delayed auto-reflows for horizontal scroll on touch devices and tablet widths at `<= 991px`
  - Kept width-based window resize handling and manual Home lifecycle reflows so the section can still settle after deferred modules load
  - Updated runtime docs and agent notes to reflect the touch/tablet reflow guard
- Related to: Home tablet horizontal scroll resetting instead of advancing smoothly

### 83c7f1a - remove ScrollTrigger.normalizeScroll usage
- Date: 2026-04-26 14:30:00Z
- Branch: main
- Changes:
  - Removed `ScrollTrigger.normalizeScroll(true)` from `main.js`
  - Dropped active `normalizeScroll` debug tracing from `features/horizontal-scroll.js`
  - Updated runtime docs and agent notes to reflect the current `ignoreMobileResize`-only approach
- Related to: remove unnecessary iOS scroll normalization behavior

### f714265 - remove home trace noise and disable stagger hover on tablet
- Date: 2026-04-16 22:40:00Z
- Branch: main
- Changes:
  - Removed Home page trace wrappers so the route no longer emits generic `[MBC Trace]` logs during the horizontal-scroll investigation
  - Upgraded horizontal-scroll diagnostics to warning-level logs with explicit abort reasons and pin-spacer measurements
  - Disabled stagger-hover behavior at `<= 991px` while keeping cards visible without hover listeners
- Related to: Home tablet hero/pin-spacing issue and request to turn off staggerHover at tablet widths

### 4aff2e4 - silence shared trace logs during horizontal-scroll debugging
- Date: 2026-04-16 22:20:00Z
- Branch: main
- Changes:
  - Gated shared `[MBC Trace]` logging behind `window.MBC_DEBUG === true` in core, loader, lifecycle, and Finsweet helpers
  - Strengthened horizontal-scroll diagnostics with a dedicated `[MBC HorizontalScroll Debug]` prefix and init-time logging
  - Updated docs and agent notes so live iPad testing can focus on horizontal-scroll console output only
- Related to: Home horizontal scroll issue needing targeted live console logs without runtime trace noise

### a9f2b3d - enable horizontal scroll diagnostics by default
- Date: 2026-04-16 21:00:03Z
- Branch: main
- Changes:
  - Enabled horizontal-scroll diagnostics by default without enabling the broader runtime trace logs
  - Documented how to disable the targeted horizontal-scroll logging with `window.MBC_HORIZONTAL_SCROLL_DEBUG = false`
- Related to: Capturing iPad console output for the home horizontal scroll issue

### 1b37ab6 - gate horizontal scroll debug logs
- Date: 2026-04-16 20:55:51Z
- Branch: main
- Changes:
  - Wrapped horizontal-scroll console traces in `window.MBC_DEBUG`
  - Kept the measurement and trigger lifecycle instrumentation available for targeted debugging only
- Related to: Home horizontal scroll issue needing quieter production output

### investigating - normalize touch scroll for ScrollTrigger
- Date: 2026-04-16 21:14:00Z
- Branch: main
- Changes:
  - Enabled `ScrollTrigger.normalizeScroll(true)` when `ScrollTrigger.isTouch === 1`
  - Documented the touch-only scroll normalization behavior in runtime and agent docs
- Related to: Home horizontal scroll gaps and pin jitter on iOS touch devices

### investigating - ignore mobile ScrollTrigger resize refreshes
- Date: 2026-04-16 21:05:00Z
- Branch: main
- Changes:
  - Applied `ScrollTrigger.config({ ignoreMobileResize: true })` globally in the runtime entry
  - Documented the global mobile resize guard in runtime and agent docs
- Related to: Home horizontal scroll gaps on iOS after address-bar viewport-height changes

### 1b243c6 - harden home horizontal scroll on iOS
- Date: 2026-04-16 20:15:23Z
- Branch: main
- Changes:
  - Restored legacy-style horizontal distance math based on panel widths, gap, trailing margin, and wrapper padding
  - Added width-only resize guards so iOS browser chrome height changes do not recreate the pinned section mid-scroll
  - Restored legacy pin tuning with `scrub: 1`, `pinSpacing: true`, and `anticipatePin: 1`
- Related to: Home horizontal scroll panels creating large white gaps on iPad and mobile during scroll

### 3d00b1a - remove zine move-talk DOM reparenting
- Date: 2026-04-16 19:00:29Z
- Branch: main
- Changes:
  - Removed the zine `[data-move-talk]` to `[data-talk]` reparenting block
  - Updated zine docs and agent notes to stop describing the DOM move behavior
- Related to: Testing whether Finsweet combine works without additional DOM reparenting

### 1547023 - add zine list-tabs support
- Date: 2026-04-16 16:18:09Z
- Branch: main
- Changes:
  - Added Finsweet list-tabs detection and diagnostics to the shared Finsweet bridge
  - Marked zine list-tabs roots for IX reset, waited for generated tab markup, and scrolled to the anchor after init
  - Updated zine docs and agent notes for list-tabs support
- Related to: Zine page support for Finsweet list-tabs tabs

### 313b7dd - fix project-detail modal transition bugs
- Date: 2026-04-16 15:38:31Z
- Branch: main
- Changes:
  - Added a reusable video modal close trigger and call it on project-detail mount/cleanup
  - Made project-detail prev/next CMS link hydration retry once if the current item is not ready yet
  - Updated project-detail docs and agent notes for the modal close and retry behavior
- Related to: Project-detail modal sticking open on navigation and unreliable prev/next hydration

### investigating - force Projects list-load to pagination by default
- Date: 2026-04-16 16:20:00Z
- Branch: main
- Changes:
  - Changed Projects to ignore the wrapper's existing `fs-list-load` value and default to `pagination`
  - Allowed only explicit page-level overrides via `data-projects-list-load` or `data-list-load`
  - Updated docs and agent notes to match the default pagination contract
- Related to: Projects pagination not activating because the live wrapper was still set to `infinite`

### 8df623d - fix: normalize Projects list-load modes
- Date: 2026-04-16 15:08:31Z
- Branch: main
- Changes:
  - Added a Projects-side list-load normalizer that only accepts `more`, `all`, `infinite`, and `pagination`
  - Defaulted invalid or missing values to `pagination`
  - Gated the custom visible pagination click bridge so it only runs in pagination mode
- Related to: Projects pagination mode support

### investigating - bind Projects filters form to main Finsweet list instance
- Date: 2026-04-16 16:15:00Z
- Branch: main
- Changes:
  - Patched `pages/projects.js` to assign the external `fs-list-element="filters"` form and filter scroll anchor to `fs-list-instance="main"` before Finsweet init
  - Removed unnecessary per-click Finsweet list restarts for bridged filter chips and custom pagination wrappers
  - Updated Projects/Finsweet diagnostics to report real staging selectors, including native Webflow pagination and the filters form
- Related to: Projects Finsweet filter, search, and infinite-load binding investigation

### investigating - restore Projects filter bridge and add lifecycle diagnostics
- Date: 2026-04-16 15:35:00Z
- Branch: main
- Changes:
  - Restored the custom `.filters__item` bridge to hidden Finsweet inputs in `pages/projects.js`
  - Added delayed and tab-change Finsweet list restarts to better match Barba/Webflow lifecycle timing
  - Added generic selector diagnostics helpers in `core/utils.js` and used them for Projects/Finsweet debugging
  - Added optional custom pagination forwarding for `[data-pagination="next"]` and `[data-pagination="prev"]`
- Related to: Projects Finsweet filter and pagination lifecycle investigation

### investigating - try fs-attributes-auto for Finsweet detection
- Date: 2026-04-16 15:10:00Z
- Branch: main
- Changes:
  - Updated loader.js to load Finsweet Attributes with `fs-attributes-auto`
  - Broadened Finsweet detection to include modal attributes as a trigger for loading
  - Keeping the existing Finsweet feature init path while testing improved auto-detection
- Related to: Projects Finsweet filter stability investigation

### fixed - revert Projects Advanced Filter System and restore Finsweet
- Date: 2026-04-16 15:00:00Z
- Branch: main
- Changes:
  - Removed Projects-specific Advanced Filter System integration
  - Restored Finsweet loading and page module support for Projects
  - Updated loader.js to allow Finsweet on the Projects namespace again
  - Removed advanced-filter bundle import and docs references
  - Updated Projects docs and agent guide to reflect Finsweet instead of Advanced Filter System
- Related to: Projects filter integration rollback

### 143f1fe - fix: add z-index 999 to navBottom to prevent it from being covered by mobile nav menu
- Date: 2026-04-16 13:29:00Z
- Branch: main
- Changes:
  - Added `zIndex: 999` to `navBottom` initialization and fallback state
  - This ensures the line is painted OVER the mobile nav menu (which has a z-index of 998)
  - Resolves the issue where only 5% of the navBottom was visible because it was overlapped by the menu background
- Related to: Nav__bottom display coverage issue

### 0c12ed0 - fix: change navBottom animation from 100% to 100vw for full viewport width
- Date: 2026-04-16 13:23:00Z
- Branch: main
- Changes:
  - Change original timeline animation from width: '100%' to width: '100vw'
  - Change recreated timeline animation from width: '100%' to width: '100vw'
  - This ensures navBottom spans full viewport width regardless of parent container constraints
  - Fixes issue where navBottom appeared narrow (5%) despite being set to 100%
- Related to: Nav__bottom width display issue on mobile

### 11f6e4a - fix: correct navBottom timeline animation to animate to 100% when nav opens
- Date: 2026-04-16 13:08:00Z
- Branch: main
- Changes:
  - Fix recreated timeline animation from width: '0%' to width: '100%'
  - This ensures navBottom animates to 100% when menu opens
  - Timeline reverse will animate back to 0% when menu closes
- Related to: Nav__bottom width animation behavior

### af4af26 - revert: change nav__bottom width back to 0% for proper animation
- Date: 2026-04-16 13:06:00Z
- Branch: main
- Changes:
  - Revert initial state of navBottom from width: '100%' to width: '0%'
  - Revert aggressive fallback state of navBottom from width: '100%' to width: '0%'
  - Revert timeline animation from width: '100%' to width: '0%'
  - This ensures proper animation behavior
- Related to: Nav__bottom width animation fix

### e7e68cb - fix: set nav__bottom width to 100% initially to fix display issue
- Date: 2026-04-16 12:58:00Z
- Branch: main
- Changes:
  - Change initial state of navBottom from width: 0 to width: '100%'
  - Change aggressive fallback state of navBottom from width: 0 to width: '100%'
  - This fixes nav__bottom display issue in viewport
- Related to: Nav__bottom width display issue

### 83c77ed - fix: kill and recreate timeline after aggressive fallback to ensure clean animation state
- Date: 2026-04-16 12:48:00Z
- Branch: main
- Changes:
  - Replace clearProps approach with timeline recreation
  - Kill and recreate GSAP timeline after aggressive fallback
  - This ensures nav__bottom and other elements animate correctly when menu is re-opened
  - Prevents timeline state corruption from interfering with animations
- Related to: Nav__bottom width animation issue after aggressive fallback

### b11bd71 - fix: clear GSAP props in aggressive fallback to ensure proper re-open animation
- Date: 2026-04-16 12:36:00Z
- Branch: main
- Changes:
  - Use clearProps to reset GSAP state after aggressive fallback
  - Re-set initial state for next menu open
  - This ensures nav__bottom and other elements animate correctly when menu is re-opened
- Related to: Mobile nav re-open animation issue after aggressive fallback

### 6b1b66f - fix: add aggressive fallback for mobile nav close to prevent menu staying open
- Date: 2026-04-16 12:07:00Z
- Branch: main
- Changes:
  - Allow forceClose to bypass isOpen check in closeMenu function
  - Add DOM manipulation fallback in window._closeMobileNav if animation fails
  - Directly remove nav classes and set GSAP state to ensure menu closes
- Related to: Mobile nav menu staying open despite forceClose fixes

### 5117918 - fix: prevent hero animation from disappearing on mobile transitions
- Date: 2026-04-16 12:00:00Z
- Branch: main
- Changes:
  - Move nav hiding inside matchMedia to only hide on desktop, keep visible on mobile/tablet
  - Update prepareHeroEntryState to only hide nav on desktop
  - Add matchMediaRefresh to force GSAP breakpoint re-evaluation on transitions
  - This ensures crisp-loader animation plays correctly when navigating projects > home on mobile
- Related to: Hero animation reliability on mobile transitions

### ab37215 - fix: force close mobile navigation menu during transitions on iOS
- Date: 2026-04-16 11:50:00Z
- Branch: main
- Changes:
  - Added forceClose parameter to closeMenu function in features/mobile-nav.js for faster closing during transitions (2.5x speed vs 1.15x)
  - Updated onNavLinkClick to use closeMenu(true) when navigating
  - Updated cleanup function to force close menu if still open
  - Updated window._closeMobileNav to support force parameter
  - Added mobile nav close logic to barba.hooks.beforeEnter in main.js to force close before any transition
  - Added documentation sync rule to copilot-instructions.md
  - Rebuilt bundled runtime with mobile navigation fixes
- Related to: Mobile navigation reliability on iOS

### c04b5a6 - Force fresh Finsweet modal reload on SPA return
- Date: 2026-04-16 09:41:03Z
- Changes: Force Finsweet modal to reload when returning to pages via SPA navigation
- Related to: Projects/Zine Finsweet modal reliability

### e4eeed5 - Remove unused modular README
- Date: 2026-04-15 18:14:43Z
- Changes: Removed README-MODULAR.md as documentation is now in agent.md and docs/

### 2aba9cb - Archive legacy runtime files and update docs
- Date: 2026-04-15 17:40:45Z
- Changes:
  - Moved legacy runtime files to legacy/ directory
  - Updated agent.md to reference legacy/ folder
  - Updated package.json build entry
- Files moved: script.js, app.js, bundle-entry.js, transitions/barba-transition.js, dist/mbc.bundle.js
- Related to: Issue #19 (Legacy runtime/archive cleanup)

### c37ebd2 - Reset projects Finsweet list on SPA re-entry
- Date: 2026-04-15 17:29:14Z
- Changes:
  - Added list destroy/restart handling in projects.js on mount, tab activation, and cleanup
  - Added shared Finsweet restart/destroy helpers in features/finsweet.js
- Related to: Issue #18 (Projects/Zine Finsweet Attributes v2 integration)

### 13c54aa - Bridge projects filter UI to Finsweet inputs
- Date: 2026-04-15 17:21:33Z
- Changes:
  - Added custom filter-item bridge in projects.js to trigger hidden Finsweet inputs
  - Filter clicks now trigger input change events and restart Finsweet list
- Related to: Issue #18 (Projects/Zine Finsweet Attributes v2 integration)

### 1f3f946 - Fix Finsweet Attributes v2 loading and reinit
- Date: 2026-04-15 16:35:38Z
- Changes:
  - Fixed loader.js to inject Finsweet Attributes v2 with fs-list marker
  - Added window.FinsweetAttributes priming
  - Updated features/finsweet.js with safe restart/destroy helpers
  - Added page-level inspection logging
- Related to: Issue #18 (Projects/Zine Finsweet Attributes v2 integration)

### 3468602 - Fix Finsweet init on projects and zine
- Date: 2026-04-15 15:37:34Z
- Changes:
  - Restored shared Finsweet Attributes v2 path for projects and zine
  - Updated zine.js to use shared path instead of standalone slider
  - Rebuilt bundled runtime
- Related to: Issue #18 (Projects/Zine Finsweet Attributes v2 integration)

### bcbafd2 - docs: add repo guide for future agents
- Date: 2026-04-14 11:20:39Z
- Changes: Created agent.md with comprehensive guide for AI agents working on this repo

### d0d4240 - docs: update task log with latest nav and project detail fixes
- Date: 2026-04-14 11:17:07Z
- Changes: Updated task.md with issues #15-17 and corresponding commit references

### 8c81aa8 - Delete index.html
- Date: 2026-04-14 11:15:08Z
- Changes: Removed unused index.html file

### c38cdae - Delete folio-book-regular_IbeCW.zip
- Date: 2026-04-14 11:14:57Z
- Changes: Removed unused font zip file

### 553cca7 - Delete osmo.md
- Date: 2026-04-14 11:14:43Z
- Changes: Removed osmo.md file

### 828e880 - Delete Folio Book Regular directory
- Date: 2026-04-14 11:14:24Z
- Changes: Removed unused font directory

### 8ca9994 - fix: keep project detail ordering synced after cms updates
- Date: 2026-04-13 20:33:23Z
- Changes:
  - Added MutationObserver in project-detail.js to detect late CMS/Webflow DOM updates
  - Re-runs invisible-item cleanup and order numbering when DOM changes
- Related to: Issue #17 (Project-detail revisit reliability)

### 0f17149 - fix: remove invisible project detail items before ordering
- Date: 2026-04-13 20:27:49Z
- Changes:
  - Removed .w-condition-invisible items before applying order numbering
  - Ensures hidden items don't affect numbering sequence
- Related to: Issue #17 (Project-detail revisit reliability)

### 3d38bcf - feat: restore project detail title and order logic
- Date: 2026-04-13 20:25:42Z
- Changes:
  - Restored .h1_display-project fit-to-container behavior with debounced resize
  - Added document.fonts.ready reflow for title fitting
  - Restored [data-set="order"] numbering logic
- Related to: Issue #17 (Project-detail revisit reliability)

### d5d63d6 - fix: hard reset project detail video and prev-next
- Date: 2026-04-13 20:21:34Z
- Changes:
  - Replaced fragile external Refokus dependency with local prev/next project mapping
  - Added stronger project-detail video DOM reset and reinit flow
  - Ensures revisiting detail pages behaves like a fresh load
- Related to: Issue #17 (Project-detail revisit reliability)

### f9c3c82 - fix: reset project detail nav refokus and video state
- Date: 2026-04-13 20:15:23Z
- Changes:
  - Forced project-detail top nav transparent
  - Refreshed Refokus/video reinit path
- Related to: Issue #17 (Project-detail revisit reliability)

### 1560686 - fix: restore mobile nav stagger and speed route mounts
- Date: 2026-04-13 20:00:12Z
- Changes:
  - Restored GSAP-driven mobile nav open/close with staggered .nav-link reveal
  - Added close-before-navigation on internal mobile nav links
  - Made projects Finsweet list init non-blocking during mount
  - Made zine FS slider load asynchronous
- Related to: Issues #15, #16 (Nav consistency, route transition speed)

### 1c4b7f9 - fix: darken mobile nav controls when open
- Date: 2026-04-13 19:48:48Z
- Changes: Updated features/nav.js to force logo/button styling black when mobile menu is open
- Related to: Issue #15 (Nav theme, blur, and mobile nav consistency)

### 586c0fc - fix: only force mobile nav bar border dark
- Date: 2026-04-13 19:45:51Z
- Changes: Limited mobile nav bar border styling to dark only
- Related to: Issue #15 (Nav theme, blur, and mobile nav consistency)

### 231ef3b - fix: keep mobile nav bars dark
- Date: 2026-04-13 19:44:42Z
- Changes: Updated features/nav.js to keep mobile/tablet burger bar borders dark
- Related to: Issue #15 (Nav theme, blur, and mobile nav consistency)

### 095ced2 - fix: sync project detail nav with scroll sections
- Date: 2026-04-13 19:42:39Z
- Changes: Updated pages/project-detail.js to sync nav theme with scroll position
- Related to: Issue #15 (Nav theme, blur, and mobile nav consistency)

### 726422a - fix: re-query DOM in horizontal-scroll on each reflow
- Date: 2026-04-11 16:20:00Z
- Changes:
  - Moved wrap and panels queries inside createOrRefreshTrigger()
  - Changed ResizeObserver to observe container instead of stale refs
  - Added debug logging for panels.length, panel[0].offsetWidth, total, vw, distance
- Related to: Issue #13 (HorizontalScroll not working on home/projects)

### 2d6a171 - feat: add per-page runtime tracing
- Date: 2026-04-11 12:34:00Z
- Changes:
  - Added traceAsync() and traceSync() helpers in core/utils.js
  - Instrumented page-level mount/init work across all pages
  - Rebuilt bundled runtime with [MBC Trace] logs
- Related to: Issue #14 (Per-page runtime tracing for debugging)

### 57a2f90 - fix: add delayed horizontal-scroll reflow
- Date: 2026-04-11 12:21:00Z
- Changes: Added delayed/observed horizontal-scroll reflow for late layout changes
- Related to: Issue #13 (HorizontalScroll not working on home/projects)

### 3ae8338 - fix: harden horizontal scroll init/reflow
- Date: 2026-04-11 12:08:00Z
- Changes: Hardened horizontal scroll init/reflow for home+projects and rebuilt bundled runtime
- Related to: Issue #13 (HorizontalScroll not working on home/projects)

### c4b5f93 - fix: double-pass IX reinit + projects filter animations
- Date: 2026-04-11 00:46:00Z
- Changes:
  - Added double-pass for ix/full tiers: destroy → ready → IX → wait → ready → IX
  - Added filter animation logic to projects.js
  - Added MutationObserver for tab switching
  - Added search close handler
- Related to: Issues #11, #12 (IX3 initialization, Projects filter animations)

### 9a2e5c2 - fix: standalone FS modal+a11y scripts
- Date: 2026-04-11 00:38:00Z
- Changes: Added standalone Finsweet modal and a11y scripts, skip full attributes library
- Related to: Issue #3 (Closing video modal does not mute or stop video)

### 547faf1 - fix: align page module deps
- Date: 2026-04-11 00:34:00Z
- Changes:
  - Aligned page module dependencies
  - Changed about to ix tier
  - Stripped videos from default
  - Added FS slider to zine
- Related to: Multiple issues

### 087e30a - feat: create pages/zine.js
- Date: 2026-04-11 00:24:00Z
- Changes:
  - Created pages/zine.js with data-move-talk, pagination, tab shortcuts
  - Registered in loader.js and bundle-runtime-entry.js
- Related to: Issue #10 (Zine page missing features)

### 2fe20d7 - fix: swap video/finsweet init order on project-detail
- Date: 2026-04-11 00:20:00Z
- Changes: Swapped order so videos init → finsweet modal init (same pattern as home page)
- Related to: Issue #9 (Project-detail video modal close broken)

### 2e1a2e8 - feat: add Refokus script and data-animate-scroll to project-detail
- Date: 2026-04-11 00:17:00Z
- Changes:
  - Added Refokus next-prev script re-injection on each project-detail mount
  - Ported data-animate-scroll logic from legacy script.js
- Related to: Issues #7, #8 (Project-detail Refokus and scroll animations)

### 0168629 - fix: change home webflowTier and cut transition animations
- Date: 2026-04-11 00:11:00Z
- Changes:
  - Changed home webflowTier from 'full' to 'light'
  - Cut transition animations: leave 120ms, enter 150ms
- Related to: Issues #4, #5 (Home IX breaking, page transitions slow)

### 03ab119 - fix: reorder refreshUI and remove unused scroll attrs
- Date: 2026-04-11 00:07:00Z
- Changes:
  - Reordered refreshUI before finsweet/video init
  - Sequenced post-hero chains
  - Removed unused scroll data attributes
- Related to: Issues #3, #6 (Video modal, unused attributes)

### 00fb828 - fix: bundled-mode flag + duplicate afterEnter skip
- Date: 2026-04-10 23:14:00Z
- Changes: Fixed bundled-mode flag and skipped duplicate first-load afterEnter path
- Related to: Issue #1 (Home hero/nav flashes)

### 97e25d9 - feat: set up esbuild bundling
- Date: 2026-04-10 00:49:00Z
- Changes: Set up esbuild bundling and generate production bundle
- Related to: Issue #1 (Home hero/nav flashes - bundled runtime)

### a9f42d2 - fix: restore full script parity and rebuild bundle
- Date: 2026-04-10 01:05:00Z
- Changes: Restored full script parity and rebuilt bundle

### 5823e79 - fix: fix home reinit timing for IX and interactive UI
- Date: 2026-04-10 01:15:00Z
- Changes: Fixed home reinit timing for IX and interactive UI

### 28b230f - fix: stabilize home re-entry
- Date: 2026-04-10 01:19:00Z
- Changes: Stabilized home re-entry by forcing Webflow restart before hero

### fffc2f3 - feat: integrate robust home tabs state machine
- Date: 2026-04-10 01:23:00Z
- Changes: Integrated robust home tabs state machine on transitions

### 2b9a901 - fix: fix home hero and modal
- Date: 2026-04-10 01:28:00Z
- Changes: Fixed home hero and modal by avoiding full destroy on home re-entry

### 9fe876a - fix: revert home tabs changes
- Date: 2026-04-10 01:35:00Z
- Changes: Reverted home tabs changes and hardened modal Vimeo lifecycle

### 7e394cf - feat: add home isolation mode
- Date: 2026-04-10 01:41:00Z
- Changes: Added home isolation mode and targeted tabs diagnostics

### d091039 - feat: restore custom home tabs controller
- Date: 2026-04-10 01:45:00Z
- Changes: Restored custom home tabs controller with transition-safe cleanup

### 636712d - feat: implement modular loader system
- Date: 2026-04-10 15:50:00Z
- Changes:
  - Added loader.js with dependency resolution and DOM feature detection
  - Added main.js entry point with Barba patterns
  - Created feature modules: tabs, hero, videos, finsweet, horizontal-scroll
  - Updated page modules: home, projects, project-detail, about, default
  - Simplified webflow-manager.js reinit
  - Dynamic Finsweet loading based on [fs-*] attribute detection
- Related to: Initial modular architecture

### be39185 - feat: add dynamic loading for Finsweet modal and Vimeo scripts
- Date: 2026-04-10 16:39:00Z
- Changes:
  - Added finsweet-modal and vimeo-player to EXTERNAL_SCRIPTS
  - Detect [fs-modal-element] for modal script loading
  - Detect video elements for Vimeo
  - Load external scripts BEFORE modules
- Related to: Initial modular architecture

### 66ffd20 - fix: correct page-registry.js filename in loader
- Date: 2026-04-10 16:47:00Z
- Changes: Fixed page-registry.js filename in loader module manifest (was registry.js)
- Related to: Initial modular architecture

### 7ca302f - fix: update Finsweet Attributes CDN to v2
- Date: 2026-04-10 16:50:00Z
- Changes: Updated Finsweet Attributes CDN to v2 path
- Related to: Initial modular architecture

### d9f3be2 - feat: add ES module support and page self-registration
- Date: 2026-04-10 16:54:00Z
- Changes:
  - Finsweet Attributes/Modal now load with type='module'
  - Vimeo loads as classic script
  - All page modules now self-register with MBC.core.registry.register()
  - Fixed project-detail namespace mismatch
  - Added MBC_ENV flag
  - Debug logging enabled in local mode
- Related to: Initial modular architecture

### 95bbee1 - fix: restore home feature wiring
- Date: 2026-04-10 17:53:00Z
- Changes:
  - Widened loader feature detection
  - Load page feature deps explicitly
  - Initialize horizontal scroll on home page
  - Restore Vimeo data-video handling
  - Preserve page self-registration
- Related to: Initial modular architecture

### 55d3088 - fix: restore original home hero animation
- Date: 2026-04-10 18:03:00Z
- Changes:
  - Replaced simplified fade hero with original crisp-loader animation
  - Keep SPA-safe singleton cleanup for matchMedia and timeline
  - Support both [data-load-items=nav] and [data-load-items=nav-item]
  - Preserve modular cleanup contract
- Related to: Initial modular architecture

### 9c6c09d - feat: refine home transition, reveal, and video behavior
- Date: 2026-04-10 20:44:00Z
- Changes: Refined home transition, reveal, and video behavior

### 095ced2 - feat: add nav pre-hide and Vimeo handling
- Date: 2026-04-10 21:00:00Z
- Changes: Added nav pre-hide, stronger Vimeo modal/background handling, and stronger Webflow/IX refresh passes

### feca373 - feat: initialize modular GSAP/Barba/Webflow architecture
- Date: 2026-04-10 00:44:00Z
- Changes: Initialized modular GSAP/Barba/Webflow architecture
- Related to: Initial modular architecture

## Active Issues

### Projects Finsweet Filters
- Status: `Investigating`
- Report: Projects filters still do not work reliably after Finsweet Attributes v2 integration
- Notes:
  - Live staging markup shows the main filtered grid is `fs-list-instance="main"`, while the `fs-list-element="filters"` form sits outside that instance and therefore is not auto-bound by Finsweet
  - Projects now restores the custom filter bridge and adds delayed/tab-change list restarts to better match lifecycle timing
  - Projects now stamps the external filters form and filter scroll anchor with `fs-list-instance="main"` before list init so search and filter inputs can bind to the main list
  - Shared selector diagnostics now log the real staging selectors before init, after init, and after delayed restarts
  - Verification is still pending on live Webflow markup and interactions after the bridge restoration
  - Latest commits attempted to fix this: c37ebd2, 13c54aa, 1f3f946, 3468602, 1a44bb3, f10a671
  - Final verification still pending on live pages
- Related commits: c04b5a6, c37ebd2, 13c54aa, 1f3f946, 3468602, 1a44bb3
