# Task Log

Last updated: 2026-04-16 10:56 BST

## Status rules
- `Open` = reported, not fixed
- `Investigating` = code exists or partial fix exists, but not verified complete
- `Fixed` = implemented and verified working end-to-end

## Commit History

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
  - Latest live testing showed partial improvement:
    - Hard reload on projects: pagination improved, filters still broken
    - Projects > Home > Projects: pagination and filters both broke before the latest reset/re-entry patch
  - Latest commits attempted to fix this: c37ebd2, 13c54aa, 1f3f946, 3468602
  - Final verification still pending on live pages
- Related commits: c04b5a6, c37ebd2, 13c54aa, 1f3f946, 3468602
