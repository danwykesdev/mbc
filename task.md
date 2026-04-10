# Task Log

Last updated: 2026-04-10 22:10 BST

## Status rules
- `Open` = reported, not fixed
- `Investigating` = code exists or partial fix exists, but not verified complete
- `Fixed` = implemented and verified working end-to-end

## Active issues

### 1. Home hero/nav flashes before animation
- Status: `Investigating`
- Report: nav is visible first, then animates
- Notes:
  - added pre-hide in `main.js` before Home entry mount and in `pages/home.js` immediately before hero init
  - `features/hero.js` still owns the reveal animation timing
- Verification needed:
  - initial page load on Home
  - Home -> Project -> Home transition

### 2. Home video section background looks hidden
- Status: `Investigating`
- Report: background video area appears hidden
- Notes:
  - added forced visibility for the background wrapper and iframe before and after Vimeo ready
  - added a delayed second visibility pass to cover async iframe rendering
- Verification needed:
  - initial Home load
  - after page transitions
  - confirm container visibility and Vimeo ready timing

### 3. Closing video modal does not mute or stop video
- Status: `Investigating`
- Report: modal close does not reliably stop audio/video playback
- Notes:
  - close handling now also listens for document-level close triggers, Escape, and modal attribute changes via `MutationObserver`
  - reset now pauses, seeks, mutes, zeroes volume, and unloads the Vimeo player
- Verification needed:
  - open/close with modal close button
  - open/close by overlay click
  - open/close after page transitions

### 4. Home -> Project -> Home IX3 interactions fail
- Status: `Investigating`
- Report: IX3 interactions break after navigating Home -> Project -> Home
- Notes:
  - `pages/home.js` now requests `webflowTier: 'full'` on route mount
  - `core/webflow-manager.js` now runs a stronger two-pass ready/modules/IX refresh with synthetic events for transition returns
- Verification needed:
  - Home initial load
  - Home -> Project
  - Project -> Home
  - confirm IX3-specific triggers rebind after return navigation

## Change log
- 2026-04-10: created task log and recorded current known issues from runtime review
- 2026-04-10: added nav pre-hide, stronger Vimeo modal/background handling, and stronger Webflow/IX refresh passes; all remain unverified until browser testing passes
