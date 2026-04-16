# projects.md

## Purpose
This is the page module for the Projects page. It handles Finsweet list/filter integration, horizontal scroll, stagger hover, and tab-based filtering animations.

## What It Does

### Finsweet Integration
- Detects and initializes Finsweet modules (list, filter, slider)
- Excludes slider module (not used on projects page)
- Destroys existing list module before reinitialization
- Restarts list module after tab changes

### Filter Item Animation
- Animate filter items in when tab becomes active
- Hide filter items when tab is inactive
- Staggered animation with GSAP
- Uses MutationObserver to detect tab changes

### Horizontal Scroll Integration
- Initializes horizontal scroll for project cards
- Rebinds after Finsweet initialization
- Rebinds after tab changes
- Applies bottom inset for proper spacing

### Stagger Hover Integration
- Initializes stagger hover for project cards
- Rebinds after Finsweet initialization
- Rebinds after tab changes

### Card Bottom Inset
- Applies 40px bottom padding to horizontal scroll wrapper
- Aligns panels to bottom
- Ensures proper visual spacing

### Tab Change Handling
- Detects Webflow tab changes via MutationObserver
- Animate filter items when tab activates
- Restart Finsweet list module for new content
- Rebind horizontal scroll and stagger hover
- Refresh Webflow IX and ScrollTrigger

### Search Functionality
- Clears search input and triggers change event on close button click
- Resets placeholder text

### Navigation State
- Sets navigation to dark theme with solid background and blur

## Key Functions

### `mount(ctx)`
Main mount function with Finsweet and tab handling.

### Internal Functions
- `bindHorizontalScroll(label)` - initializes horizontal scroll with cleanup
- `bindStaggerHover(label)` - initializes stagger hover with cleanup
- `animatePaneFilters(pane)` - animates filter items in
- `setPaneFiltersInactive(pane)` - hides filter items
- `showPaneFiltersImmediately(pane)` - shows filter items without animation
- `findProjectsFilterInput(scope)` - finds Finsweet filter input
- `triggerProjectsFilterInput(input)` - triggers filter change
- `applyProjectsCardBottomInset(container)` - applies spacing

### Helper Functions
- `isNativeFormControl(el)` - checks if element is a form control
- `setPaneFiltersInactive(pane)` - hides filter items
- `showPaneFiltersImmediately(pane)` - shows filter items
- `animatePaneFilters(pane)` - animates filter items with stagger

## Module Definition

```javascript
{
  webflowTier: 'light',
  mount: mount,
  unmount: unmount
}
```

## Initialization Sequence

1. **Setup**: Set nav state, bind horizontal scroll and stagger hover (early)
2. **Filter Click Handler**: Set up click handler for filter items
3. **Finsweet Inspect**: Log Finsweet state before init
4. **Finsweet Reset**: Destroy existing list module
5. **Finsweet Init**: Initialize list and filter modules
6. **Post-Finsweet**: Apply card inset, rebind features, refresh triggers
7. **Tab State**: Set initial tab filter states
8. **Tab Observer**: Set up MutationObserver for tab changes
9. **Delayed Reflow**: Rebind features after content settles
10. **Search Handler**: Set up search clear functionality

## Important Notes

### Webflow Tier
Uses 'light' tier because the Projects page relies more on Finsweet and custom features than Webflow IX animations.

### Finsweet Reset/Init Pattern
The page destroys the existing list module before reinitializing. This is critical for SPA transitions to ensure clean state.

### Tab Change Detection
Uses MutationObserver on tab pane `class` attribute to detect when Webflow switches tabs. This allows triggering animations and Finsweet restart when content changes.

### Filter Item Animation
Filter items are animated in with a staggered slide-in effect. They're hidden when tabs are inactive to prevent visual clutter.

### Search Clear
The search close button clears the input and triggers the change event, which causes Finsweet to reset the filter.

### Cleanup
On unmount, the page destroys the Finsweet list module to prevent memory leaks and conflicts on subsequent pages.

## Dependencies
- MBC.features.finsweet (for list and filter functionality)
- MBC.features.horizontalScroll (for horizontal scroll sections)
- MBC.features.staggerHover (for project card hover effects)
- MBC.features.nav (for navigation state)
- MBC.core.utils (for traceAsync, traceSync)
- GSAP (for filter item animations)
- ScrollTrigger (for refresh after tab changes)

## Namespace
Registered as 'projects' in the page registry.
