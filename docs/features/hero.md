# hero.js

## Purpose
This module handles the hero animation on the home page. It uses GSAP with matchMedia to create a complex, responsive reveal animation for the hero section with image panels, navigation, and staggered elements.

## What It Does

### Hero Animation
- Creates a multi-stage GSAP timeline for the home hero reveal
- Uses GSAP matchMedia for responsive breakpoints (desktop, tablet, mobile)
- Animates image panels (crisp-loader containers) with different behaviors per breakpoint
- Reveals navigation and nav items with staggered timing
- Handles hero inner content, background images, and overlays

### Responsive Behavior

#### Desktop
- Image panels translate vertically to fill the viewport
- Navigation slides down from above
- Nav items stagger in from the left

#### Tablet
- Image panels start centered in the hero component and resize to form a centered grid
- Panels settle 4rem down from the centered start inside the header parent
- Navigation behavior similar to desktop

#### Mobile
- Image panels follow the same centered grid flow as tablet, with tighter spacing
- Panels start centered and settle 4rem down into their final position within the header parent
- Navigation behavior similar to desktop

### State Management
- Sets `MBC.core.state.heroAnimating` during animation
- Clears the flag when animation completes
- Provides a global reset function `window.__resetNavScrollHide` for scroll-direction feature

### Cleanup
- Kills the master timeline on cleanup
- Reverts matchMedia conditions
- Clears GSAP properties on all animated elements
- Resets the heroAnimating state

## Key Functions

### `initHero(scope)`
Main initialization function. Creates the matchMedia context and timeline. Returns a cleanup function.

### `initSimpleHero(container)`
Simplified hero for mobile/reduced motion. Just fades in the hero element.

## Animation Sequence

1. **Setup**: Navigation and nav items are hidden off-screen
2. **Panel Animation**: Image panels animate based on breakpoint
3. **Sync Reveal**: Hero inner content, backgrounds, and overlays fade in
4. **Nav Reveal**: Navigation and nav items animate in
5. **Complete**: heroAnimating flag is cleared

## Important Notes

### Nav Visibility by Breakpoint
- Desktop: Nav is hidden during hero animation (yPercent: -100)
- Mobile/Tablet: Nav remains visible during hero animation
- Nav hiding is controlled via matchMedia to ensure correct behavior per breakpoint

### MatchMedia Refresh
- Forces GSAP matchMedia to re-evaluate on each init
- Ensures correct breakpoint detection on page transitions
- Prevents animation from playing wrong breakpoint animation

### MatchMedia Usage
The animation uses GSAP matchMedia to define different behaviors for different breakpoints. This ensures the animation works correctly on all screen sizes and responds to window resizing.

### Hero Animation Flag
The `heroAnimating` flag is used by other features (like scroll-direction) to know when the hero is animating. This prevents conflicts (e.g., hiding the nav during the hero animation).

### Global Cleanup References
The module stores references to the timeline and matchMedia context on `window` (`__homeHeroTL`, `__homeHeroMM`) for cleanup and to prevent duplicate initialization.

### Usage in Page Module
The home page module calls this after preparing the hero state and releasing the startup cover. The animation runs, then other interactive features are initialized after it completes.

## Dependencies
- GSAP (for animations and matchMedia)
- MBC.core.state (for heroAnimating flag)

## Usage Pattern

```javascript
// In pages/home.js:
if (MBC.features.hero) {
  prepareHeroEntryState(); // Hide nav and items
  releaseStartupCover(); // Remove black cover
  var heroCleanup = MBC.features.hero.init(container);
  cleanups.push(heroCleanup);
}
```
