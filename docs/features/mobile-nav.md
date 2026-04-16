# mobile-nav.js

## Purpose
This module handles the mobile navigation menu. It manages the open/close state, animates the menu in and out, and handles navigation clicks within the menu.

## What It Does

### Mobile Detection
- Only initializes on mobile devices (window width ≤ 991px)
- Returns empty function on desktop

### Menu Animation
- Uses GSAP timeline for smooth open/close animations
- Animate menu wrapper, nav links, nav bottom bar, and logo
- Menu slides in from left, links stagger in
- Nav bottom bar expands from 0 to 100% width
- Logo fades and shifts slightly

### Open/Close State
- Tracks whether menu is currently open
- Adds/removes CSS classes (`is-open`, `w--open`)
- Manages pointer events and visibility

### Navigation Handling
- Intercepts clicks on nav links
- For same-site links: closes menu, then navigates via Barba
- For external/special links: closes menu, lets browser handle navigation
- Prevents default behavior for same-site links to use Barba

### Lenis Integration
- Stops Lenis scrolling when menu opens
- Starts Lenis scrolling when menu closes
- Prevents scroll conflicts

### Mobile Style Sync
- Coordinates with nav feature for mobile-specific styling
- Updates logo and menu button colors when menu is open
- Updates hamburger menu bar colors

## Key Functions

### `initMobileNav()`
Initializes the mobile navigation. Returns a cleanup function.

### Internal Functions
- `openMenu()` - opens the menu
- `closeMenu(forceClose)` - Closes the menu. If `forceClose` is true, uses 2.5x speed animation for faster closing during transitions. Returns true if was open.
- `onClick()` - handles menu button click
- `onNavLinkClick(event)` - handles nav link clicks
- `navigateToPendingHref()` - performs pending navigation after close

## Animation Sequence

### Open
1. Nav bottom bar expands to 100% width
2. Logo fades to 35% opacity and shifts right
3. Menu wrapper fades in and slides in from left
4. Nav links stagger in from left

### Close
1. All animations reverse (1.15x speed for normal close, 2.5x speed for force close)
2. After close, pending navigation executes
3. Lenis scrolling resumes

## Important Notes

### Mobile Only
This module only runs on mobile devices. On desktop, it returns immediately with an empty cleanup function.

### Global Close Function
Exposes `window._closeMobileNav(force)` for external code to close the menu programmatically. When `force` is true, uses 2.5x speed animation for faster closing during transitions.

### Pending Navigation
When a nav link is clicked, the navigation is deferred until the menu closes. This ensures the close animation plays before the page transition.

### Style Coordination
The module calls `refreshMobileStyles()` on the nav feature to ensure mobile-specific styles are applied correctly.

## Dependencies
- GSAP (for animations)
- Barba (for SPA navigation)
- Lenis (for scroll control)
- MBC.features.nav (for style coordination)

## Usage Pattern

```javascript
// In main.js or a shared feature:
var mobileCleanup = MBC.features.mobileNav.init();
cleanups.push(mobileCleanup);

// Close programmatically:
if (window._closeMobileNav) {
  window._closeMobileNav();
}
```
