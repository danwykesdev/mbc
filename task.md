# Task Log

Last updated: 2026-04-10 22:51 BST

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
  - added a temporary first-load startup cover so the initial Home paint stays masked until hero init begins
  - deferred noncritical Home modules so the hero animation does not wait for videos, Finsweet, tabs, or horizontal-scroll on first paint
  - added a hard fallback release for the startup cover so Home never stays black while long network tasks continue
  - `features/hero.js` still owns the reveal animation timing
- Verification needed:
  - initial page load on Home
  - Home -> Project -> Home transition

### 2. Home video section background looks hidden
- Status: `Investigating`
- Report: background video area appears hidden
- Notes:
  - restored the background player flow closer to the original standalone Vimeo setup
  - kept wrapper and iframe visibility forcing so the player is visible once injected
- Verification needed:
  - initial Home load
  - after page transitions
  - confirm container visibility and Vimeo ready timing

### 3. Closing video modal does not mute or stop video
- Status: `Investigating`
- Report: modal close does not reliably stop audio/video playback
- Notes:
  - restored destroy-on-close behavior so the Vimeo iframe is removed entirely when the modal closes
  - close handling still listens for close buttons, Escape, and modal visibility changes
- Verification needed:
  - open/close with modal close button
  - open/close by overlay click
  - open/close after page transitions

### 4. Home -> Project -> Home IX3 interactions fail
- Status: `Investigating`
- Report: IX3 interactions break after navigating Home -> Project -> Home
- Notes:
  - `pages/home.js` now requests `webflowTier: 'full'` on route mount
  - removed the synthetic `load` and `readystatechange` dispatches because they were re-registering the same interactions repeatedly
  - kept a simpler resize-driven Webflow refresh path after the full reset
- Verification needed:
  - Home initial load
  - Home -> Project
  - Project -> Home
  - confirm IX3-specific triggers rebind after return navigation

## Change log
- 2026-04-10: created task log and recorded current known issues from runtime review
- 2026-04-10: added nav pre-hide, stronger Vimeo modal/background handling, and stronger Webflow/IX refresh passes; all remain unverified until browser testing passes
- 2026-04-10: added a Home-only startup cover to hide the first-load delay before the hero animation begins
- 2026-04-10: restored modal destroy-on-close behavior, simplified Webflow refresh to reduce duplicate IX registrations, and stopped requesting unsupported Finsweet filter loads
- 2026-04-10: deferred noncritical Home modules during initial page load so the hero can start before videos/Finsweet/tabs finish loading
- 2026-04-10: added a timeout/DOMContentLoaded fallback so the Home startup cover releases even if full mount is still waiting on slower work
