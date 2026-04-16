# project-detail.md

## Purpose
This is the page module for the Project Detail page. It handles complex initialization including scroll-triggered animations, theme-based navigation state changes, video integration, and dynamic content processing.

## What It Does

### Scroll-Triggered Animations
- Initializes IntersectionObserver for `[data-animate-scroll]` elements
- Groups elements by offset percentage
- Adds `is-visible` class when elements enter viewport
- Supports custom delays via `data-delay` attribute

### Theme-Based Navigation
- Detects sections with `[data-theme-section]` attribute
- Updates navigation theme (dark/light) based on scroll position
- Updates navigation background and blur based on section
- Uses requestAnimationFrame throttling for performance

### Dynamic Content Processing
- Removes Webflow condition-invisible elements
- Auto-numbers elements with `[data-set="order"]` attribute
- Uses MutationObserver to handle CMS dynamic content updates

### Project Title Fitting
- Dynamically scales project title to fit container width
- Measures text width and adjusts font size
- Updates on resize and font load
- Uses GSAP for smooth size transitions

### Previous/Next Navigation
- Reads project list from CMS collection
- Finds current project and determines prev/next
- Updates prev/next button links, titles, and images
- Retries once if the CMS current link is not ready during SPA hydration

### Video Integration
- Resets video DOM before initialization
- Initializes videos (background and modal)
- Re-initializes after Finsweet to ensure stable DOM
- Closes any open modal on mount and cleanup so transitions do not leave the video modal stuck open
- Critical ordering: videos before Finsweet, then again after

### Finsweet Integration
- Initializes Finsweet modal module
- Runs after video DOM is stable
- Ensures modal open/close handlers work correctly

### Navigation State Reset
- Clears navigation theme attributes from document
- Resets to default light theme at top of page
- Applies appropriate theme based on scroll position

## Key Functions

### `mount(ctx)`
Main mount function with complex initialization sequence.

### Internal Functions
- `initAnimateScroll(container)` - sets up scroll-triggered animations
- `initProjectDetailThemeScroll(container)` - sets up theme-based navigation
- `initProjectDetailDataSync(container)` - sets up dynamic content processing
- `fitProjectTitleToContainer(container)` - scales title to fit
- `initPrevNextProjects(container)` - sets up prev/next navigation
- `resetProjectDetailVideoDom(container)` - clears video iframes
- `applyInitialProjectDetailNavState()` - resets navigation state
- `resolveProjectDetailNavState(section)` - determines nav state from section
- `applyProjectDetailNavState(state)` - applies nav state
- `setProjectDetailBodyTheme(theme)` - sets body theme attribute

## Module Definition

```javascript
{
  webflowTier: 'ix',
  mount: mount,
  unmount: unmount
}
```

## Initialization Sequence

1. **Reset**: Apply initial nav state, reset video DOM, process page data
2. **Data Sync**: Initialize MutationObserver for dynamic content
3. **Video Init**: Initialize videos (before Finsweet)
4. **Finsweet**: Initialize Finsweet modal (after video DOM stable)
5. **Video Re-init**: Re-initialize videos (after Finsweet)
6. **Theme Scroll**: Initialize theme-based navigation
7. **Scroll Anim**: Initialize scroll-triggered animations
8. **Load Anim**: Initialize slide-in animations
9. **Prev/Next**: Set up prev/next navigation
10. **Title Fit**: Scale title to fit container

## Important Notes

### Webflow Tier
Uses 'ix' tier which destroys Webflow and reinitializes modules + IX. This is appropriate for pages that use Webflow IX animations but don't need the full 'strong' tier.

### Video/Finsweet Ordering
Critical ordering:
1. Videos first (creates stable wrapper)
2. Finsweet second (binds to stable DOM)
3. Videos again (re-initializes after Finsweet DOM changes)

This ensures the video player survives Finsweet's DOM manipulation.

### Theme Sections
Sections can have:
- `data-theme-section="dark"` or `"light"` - sets nav theme
- `data-nav-blur="true"` or `"false"` - sets nav blur
- `data-bg-section="solid"` or `"none"` - sets nav background

### Dynamic Content
The MutationObserver watches the CMS collection for changes and re-processes the page data (removing hidden elements, re-numbering) when content updates.

### Title Fitting
The title font size is dynamically adjusted to ensure it fits within its container. This handles variable project title lengths.

## Dependencies
- MBC.features.videos (for video integration)
- MBC.features.finsweet (for modal functionality)
- MBC.features.loadAnimations (for slide-in animations)
- MBC.features.nav (for navigation state)
- MBC.core.utils (for traceAsync, traceSync, debounce)
- GSAP (for title fitting animations)

## Namespace
Registered as 'project-detail' in the page registry.
