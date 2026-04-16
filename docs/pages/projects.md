# projects.md

## Purpose
This is the page module for the Projects page. It handles Finsweet list/filter integration, horizontal scroll, stagger hover, and tab-based filter animations.

## What It Does

### Finsweet Integration
- Initializes Finsweet list/filter controls for Projects
- Supports Finsweet-powered filter buttons, search inputs, and list refresh
- Re-attaches the external filters form and filter scroll anchor to the `main` list instance before Finsweet initializes
- Normalizes the list load mode to one of Finsweet's official values: `more`, `all`, `infinite`, or `pagination`
- Re-syncs layout-sensitive features after Finsweet list updates
- Destroys and re-initializes the list on mount to reduce stale SPA state
- Re-runs the list after delayed layout settling and tab changes

### Custom Filter Bridge
- Bridges `.filters__item` wrappers to hidden Finsweet inputs
- Supports radio and checkbox style filter controls inside the custom UI
- Leaves filtering to Finsweet's native form listeners once the main list instance wiring is restored

### Custom Pagination Bridge
- Supports optional visible wrappers using `[data-pagination="next"]` and `[data-pagination="prev"]`
- Forwards those clicks to hidden Finsweet pagination controls when present

### Filter Item Animation
- Animate filter items in when tab becomes active
- Hide filter items when tab is inactive
- Staggered animation with GSAP
- Uses MutationObserver to detect tab changes

### Horizontal Scroll Integration
- Initializes horizontal scroll for project cards
- Rebinds after Finsweet updates
- Rebinds after tab changes
- Applies bottom inset for proper spacing

### Stagger Hover Integration
- Initializes stagger hover for project cards
- Rebinds after Finsweet updates
- Rebinds after tab changes

### Card Bottom Inset
- Applies 40px bottom padding to horizontal scroll wrapper
- Aligns panels to bottom
- Ensures proper visual spacing

### Tab Change Handling
- Detects Webflow tab changes via MutationObserver
- Animate filter items when tab activates
- Rebind horizontal scroll and stagger hover
- Refresh Webflow IX and ScrollTrigger

### Search Functionality
- Clears search input and triggers a new search pass on close button click
- Resets placeholder text

### Diagnostics
- Logs selector counts before init, after init, after delayed restarts, and after tab changes
- Reports the live Webflow contract used on staging: `fs-list-element="filters"`, `#Search`, and native `.w-pagination-next/.w-pagination-previous` controls

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
- `restartProjectsList(reason)` - restarts the Finsweet list and re-syncs layout bindings
- `logProjectsDiagnostics(container, label)` - logs key selector counts for debugging
- `syncProjectsMainListInstance(container)` - assigns the external filters form and scroll anchor to the `main` Finsweet instance when Webflow renders them outside the list wrapper
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
2. **Finsweet Init**: Destroy stale list state, then initialize Finsweet list/filter on projects roots
3. **Post-Init Sync**: Apply card inset, rebind features, refresh triggers, and log selector diagnostics
4. **Tab State**: Set initial tab filter states
5. **Tab Observer**: Set up MutationObserver for tab changes
6. **Delayed Reflow**: Rebind features after content settles
7. **Search Handler**: Set up search clear functionality

## Important Notes

### Webflow Tier
Uses 'light' tier because the Projects page relies more on Finsweet and custom features than Webflow IX animations.

### Finsweet Root Contract
The page expects a `main` list instance for the filtered project grid and a standard `fs-list-element="filters"` form for search and filter inputs. If Webflow renders the filters form outside `fs-list-instance="main"`, the page module re-attaches that form and the filter scroll anchor to the `main` instance before Finsweet boots.

The Projects list load mode is taken from the list wrapper and normalized to one of Finsweet's supported values: `fs-list-load="more"`, `fs-list-load="all"`, `fs-list-load="infinite"`, or `fs-list-load="pagination"`. Invalid values fall back to `pagination`.

### Custom UI Contract
If the visible Projects filter or pagination UI does not use native Finsweet attributes directly, the page expects bridgeable wrappers such as `.filters__item` and optional `[data-pagination]` controls.

### Tab Change Detection
Uses MutationObserver on tab pane `class` attribute to detect when Webflow switches tabs. This allows triggering filter animations and layout rebinds when content changes.

### Filter Item Animation
Filter items are animated in with a staggered slide-in effect. They're hidden when tabs are inactive to prevent visual clutter.

### Search Clear
The search close button clears the input and triggers a fresh search pass.

### Cleanup
On unmount, the page destroys Finsweet list instances, removes bridge listeners, and clears feature bindings.

## Dependencies
- MBC.features.finsweet (for Finsweet list/filter init)
- MBC.features.horizontalScroll (for horizontal scroll sections)
- MBC.features.staggerHover (for project card hover effects)
- MBC.features.nav (for navigation state)
- MBC.core.utils (for traceAsync, traceSync)
- GSAP (for filter item animations)
- ScrollTrigger (for refresh after tab changes)

## Namespace
Registered as 'projects' in the page registry.
