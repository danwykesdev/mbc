# home.md

## Purpose
This is the page module for the Home page. It handles the complex initialization sequence including the hero animation, deferred feature loading, and interactive UI setup.

## What It Does

### Hero Animation
- Prepares hero entry state (hides nav and nav items)
- Releases startup cover (removes temporary black overlay)
- Initializes hero animation
- Waits for hero to complete before initializing interactive features

### Deferred Feature Loading
- Loads heavy features only after hero animation completes
- Dynamically loads modules based on DOM presence:
  - Horizontal scroll (if panels exist)
  - Tabs (if project component exists)
  - Vimeo player (if video elements exist)
  - Finsweet modal (if modal elements exist)
- Uses MBC.loader for on-demand loading

### Interactive UI Sequencing
- Waits for hero animation to settle
- Loads deferred features
- Initializes videos (after refreshUI to prevent listener clobbering)
- Initializes tabs
- Initializes Finsweet modal
- Resets hover states
- Rebinds horizontal scroll and stagger hover without wrapping the Home flow in trace logging

### Post-Hero Intro Animation
- Plays load animations intro after hero completes
- Excludes hero elements from intro
- Reflows horizontal scroll after intro

### Navigation State
- Sets navigation to dark theme with no background and no blur
- Scrolls to top on mount

### Cleanup
- Cleans up horizontal scroll
- Cleans up stagger hover
- Cleans up all registered features

## Key Functions

### `mount(ctx)`
Main mount function with complex sequencing logic.

### Internal Functions
- `bindHorizontalScroll(label)` - initializes horizontal scroll with cleanup
- `bindStaggerHover(label)` - initializes stagger hover with cleanup
- `loadDeferredHomeFeatures()` - loads heavy features on demand
- `releaseStartupCover()` - removes black overlay
- `prepareHeroEntryState()` - hides nav for hero animation
- `waitForHeroToSettle()` - waits for hero to complete
- `initVideosAfterHero()` - initializes videos after hero
- `finalizeHomeInteractiveUI()` - orchestrates post-hero setup
- `playPostHeroIntro()` - plays intro animations

## Module Definition

```javascript
{
  webflowTier: 'light',
  mount: mount,
  unmount: unmount
}
```

## Initialization Sequence

1. **Setup**: Set nav state, scroll to top
2. **Early Features**: Bind horizontal scroll and stagger hover (early)
3. **Hero**: Prepare state, release cover, init hero animation
4. **Tabs**: Initialize tabs (early)
5. **Background Video**: Initialize background video
6. **Wait**: Wait for hero to complete
7. **Deferred Load**: Load deferred features (horizontal scroll, tabs, Vimeo, Finsweet)
8. **Finalize**: Initialize videos, tabs, Finsweet, reset hover states, rebind features
9. **Intro**: Play post-hero intro animation
10. **Reflow**: Reflow horizontal scroll

## Important Notes

### Webflow Tier
Uses 'light' tier because the home page doesn't rely heavily on Webflow IX animations. Most animations are custom GSAP.

### Deferred Loading
Heavy features (Vimeo, Finsweet) are loaded only after the hero animation completes. This prioritizes the initial visual impact and improves perceived performance.

### Startup Cover
A temporary black cover prevents flash during initial load. It's released after the hero animation starts.

### Hero Dependency
Interactive features wait for the hero animation to complete. This prevents conflicts and ensures the hero animation plays smoothly.

### Video Timing
Videos are initialized after refreshUI to ensure Finsweet doesn't clobber the video DOM listeners.

### Targeted Diagnostics Only
Home avoids page-level trace wrappers for the horizontal-scroll investigation. Console output on this route should come from targeted feature diagnostics like `[MBC HorizontalScroll Debug]`, not generic `[MBC Trace]` timing logs.

## Dependencies
- MBC.features.hero (for hero animation)
- MBC.features.horizontalScroll (for horizontal scroll sections)
- MBC.features.staggerHover (for project card hover effects)
- MBC.features.tabs (for custom tabs)
- MBC.features.videos (for background and modal videos)
- MBC.features.finsweet (for modal functionality)
- MBC.features.loadAnimations (for intro animations)
- MBC.features.nav (for navigation state)
- MBC.loader (for deferred module loading)
- MBC.core.state (for heroAnimating flag)

## Namespace
Registered as 'home' in the page registry.

The same page module also self-registers as `home-2` and switches to `MBC.features.hero2` for that namespace so the original mobile loader layout stays isolated from the default home route.
