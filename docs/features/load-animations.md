# load-animations.js

## Purpose
This module handles page load animations including reveal animations, slide-in animations, and intro sequences. It uses IntersectionObserver to trigger animations when elements enter the viewport.

## What It Does

### Reveal on Scroll
- Uses IntersectionObserver to detect when elements enter the viewport
- Animates elements from hidden state (opacity 0, x -14px) to visible
- Supports scroll-only reveals (elements that animate only on scroll, not on initial load)
- Can exclude specific selectors (e.g., hero section on home page)

### Slide-In Animations
- Similar to reveal but with longer duration and different timing
- Uses a separate observer with different threshold and root margin
- For elements marked with `[data-load-items="slide"]`

### Intro Sequence
- Plays a coordinated animation when a page loads
- Staggers nav items and reveal elements
- Can include or exclude navigation based on options
- Different behavior for first load vs subsequent loads

### Hover State Reset
- Clears hover-related inline styles on page load
- Removes opacity, visibility, will-change, and transform properties
- Ensures clean state for hover interactions

### Filter Item Handling
- Excludes projects filter items from reveal animations
- These have their own animation logic in the projects page module

## Key Functions

### `init(container, options)`
Main initialization function. Sets up scroll-based observers and initial state. Returns a cleanup function.

### `playIntro(container, options)`
Plays the intro animation sequence. Staggers nav items and reveal elements.

### `initRevealOnScroll(container, options)`
Sets up IntersectionObserver for scroll-based reveal animations.

### `initSlideInAnimations(container)`
Sets up IntersectionObserver for slide-in animations.

### `resetHoverStates(scope)`
Clears hover-related inline styles from elements.

## Animation Timing

### Reveal on Scroll
- Threshold: 12% of element must be visible
- Root margin: -8% (triggers slightly before element is fully visible)
- Duration: 0.35s
- Ease: power2.out

### Slide-In
- Threshold: 12% of element must be visible
- Root margin: -10%
- Duration: 0.6s
- Ease: power2.out

### Intro
- Nav items: 0.32s duration, 0.08s stagger
- Reveal items: 0.5s duration, 0.05s stagger
- Timing offset: 0.08s after nav items

## Important Notes

### Data Attributes
- `[data-load-items="reveal"]` - standard reveal animation
- `[data-load-items="reveal"][data-reveal-scroll="true"]` - scroll-only reveal
- `[data-load-items="slide"]` - slide-in animation
- `[data-load-items="nav-item"]` - nav items for intro

### Initial State
Elements are set to `autoAlpha: 0, x: -14` before the observer is set up. This ensures they're hidden until the observer triggers.

### Cleanup
Each initialization function returns a cleanup function that disconnects the IntersectionObserver. This is important for SPA transitions to prevent memory leaks.

### Exclusion Selectors
The `introExcludeSelector` and `forceScrollExcludeSelector` options allow fine-grained control over which elements get which animations. This is used on the home page to exclude the hero section from intro animations.

## Dependencies
- GSAP (for animations)
- IntersectionObserver (for viewport detection)

## Usage Pattern

```javascript
// In a page module mount:
var loadAnimCleanup = MBC.features.loadAnimations.init(container, {
  disableIntroReveals: false, // for home page
  forceScrollExcludeSelector: '.hero-animate' // exclude hero from scroll reveals
});
cleanups.push(loadAnimCleanup);

// Play intro after page transition:
MBC.features.loadAnimations.playIntro(container, {
  includeNav: false,
  isFirstLoad: true
});
```
