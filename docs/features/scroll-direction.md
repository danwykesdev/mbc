# scroll-direction.js

## Purpose
This module implements scroll-based navigation hiding/showing. It hides the navigation bar when scrolling down and shows it when scrolling up, creating a clean reading experience.

## What It Does

### Scroll Direction Detection
- Monitors scroll position changes
- Compares current scroll position with previous position
- Determines scroll direction (up or down)

### Navigation Hide/Show
- Hides nav when scrolling down after 80px threshold
- Shows nav when scrolling up
- Uses GSAP for smooth hide/show animations
- Minimum delta of 6px to prevent jitter

### Special Conditions
- Never hides if hero animation is in progress
- Never hides if mobile menu is open
- Always shows if at top of page (scrollY ≤ 0)

### GSAP Animation
- Hide: translates nav to -110% y (above viewport)
- Show: translates nav to 0% y (in viewport)
- Smooth easing for natural feel
- Overwrites existing tweens to prevent conflicts

### Reset Function
- Exposes `window.__resetNavScrollHide` for external reset
- Used by hero module after animation completes
- Forces nav to visible state and resets scroll tracking

## Key Functions

### `initScrollDirection()`
Initializes the scroll direction listener. Returns a cleanup function.

### Internal Functions
- `showNav()` - animates nav into view
- `hideNav()` - animates nav out of view
- `onScroll()` - scroll event handler with throttling

## Configuration

### Thresholds
- `HIDE_AFTER_PX` - 80px (scroll this far down before hiding)
- `MIN_DELTA` - 6px (minimum scroll change to trigger action)

### Animation Timing
- Hide: 0.3s duration, power2.inOut ease
- Show: 0.45s duration, power3.out ease

## Important Notes

### Single Instance
The module uses `window.__mbcScrollDirectionBound` flag to ensure only one instance is initialized. If called again, it returns an empty cleanup function.

### Hero Animation Respect
The module checks `MBC.core.state.heroAnimating` and won't hide the nav during the hero animation. This prevents conflicts with the hero reveal animation.

### Throttling
Uses requestAnimationFrame throttling to prevent excessive calculations during rapid scrolling.

### Global Reset
The reset function is called by the hero module after the hero animation completes to ensure the nav is visible and scroll tracking is reset.

## Dependencies
- GSAP (for animations)
- MBC.core.state (for heroAnimating flag)

## Usage Pattern

```javascript
// In main.js or shared features:
var scrollCleanup = MBC.features.scrollDirection.init();
cleanups.push(scrollCleanup);

// Reset (e.g., after hero animation):
if (window.__resetNavScrollHide) {
  window.__resetNavScrollHide();
}
```
