# projects.md

## Purpose
This is the page module for the Projects page. It handles Finsweet list/filter integration, horizontal scroll, stagger hover, and tab-based filter animations.

## What It Does

### Finsweet Integration
- Initializes Finsweet list/filter controls for Projects
- Supports Finsweet-powered filter buttons, search inputs, and list refresh
- Normalizes the Projects DOM to one canonical `fs-list-element="list"` root before Finsweet init so duplicate list markers cannot trigger wrapper multiplication on SPA entry
- Re-attaches the external filters form and filter scroll anchor to the `main` list instance before Finsweet initializes
- Supports both live scroll-anchor contracts: `fs-list-element="scroll-anchor"` and `fs-list-element="scroll-anchor-filter"`
- Removes any empty facet filter wrapper whose `[fs-list-element="facet-count"]` value resolves to `0`
- Uses the init-safe Finsweet load path on SPA entry so the list can finish its async load sequence before layout rebinds
- Re-syncs layout-sensitive features after Finsweet list updates
- Queues restart requests until the list module is confirmed ready on route enter
- Re-runs the list after delayed layout settling and tab changes

### Custom Filter Bridge
- Bridges `.filters__item` wrappers to hidden Finsweet inputs
- Also supports the `.filter__item` wrapper variant used by the facet UI
- Supports radio and checkbox style filter controls inside the custom UI
- Cancels wrapper clicks before triggering the hidden input so filter chips do not steal navigation or scroll position
- Leaves filtering to Finsweet's native form listeners once the main list instance wiring is restored

### Custom Pagination Bridge
- Supports optional visible wrappers using `[data-pagination="next"]` and `[data-pagination="prev"]`
- Forwards those clicks to hidden Finsweet pagination controls when present

### Filter Item Animation
- Animate filter items in when tab becomes active
- Hide filter items when tab is inactive
- Prunes empty facet wrappers before animating the visible filter items
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
- Activates the tab observer after initial Projects list init to avoid early restart races during mount

### Search Functionality
- Clears search input and triggers a new search pass on close button click
- Resets placeholder text

### Diagnostics
- Logs selector counts before init, after init, after delayed restarts, and after tab changes
- Reports which scroll-anchor selector matched during route enter
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
- `pruneEmptyFacetFilters(scope)` - removes zero-count facet wrappers before they can render
- `setPaneFiltersInactive(pane)` - hides filter items
- `showPaneFiltersImmediately(pane)` - shows filter items without animation
- `findProjectsFilterInput(scope)` - finds Finsweet filter input
- `triggerProjectsFilterInput(input)` - triggers filter change
- `restartProjectsList(reason)` - restarts the Finsweet list and re-syncs layout bindings
- `logProjectsDiagnostics(container, label)` - logs key selector counts for debugging
- `normalizeProjectsListRoot(container)` - chooses one canonical Projects list root and strips duplicate `fs-list-element="list"` markers before Finsweet boots
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
2. **Finsweet Destroy**: Destroy stale Finsweet state from previous SPA page visit
3. **Finsweet Init**: Initialize Finsweet list/filter on projects roots (destroy + load-only init internally; restart remains available for later updates)
4. **Layout Settle**: Wait for Finsweet to render filter/pagination DOM and settle before binding features
5. **Post-Init Sync**: Apply card inset, rebind features, refresh triggers, and log selector diagnostics
6. **Tab State**: Set initial tab filter states
7. **Tab Observer**: Set up MutationObserver for tab changes
8. **Delayed Reflow**: Rebind features after content settles
9. **Search Handler**: Set up search clear functionality

## Important Notes

### Webflow Tier
Uses 'light' tier because the Projects page relies more on Finsweet and custom features than Webflow IX animations.

### Finsweet Root Contract
The page expects a `main` list instance for the filtered project grid and a standard `fs-list-element="filters"` form for search and filter inputs. If Webflow renders the filters form outside `fs-list-instance="main"`, the page module re-attaches that form and the filter scroll anchor to the `main` instance before Finsweet boots.

If multiple `fs-list-element="list"` nodes are present in the Projects container, the page module picks the canonical list root with the strongest main-list signal and strips the `list` marker from the rest before Finsweet initializes.

The page also supports both live scroll-anchor selector variants on staging and production deploys, so either `fs-list-element="scroll-anchor"` or `fs-list-element="scroll-anchor-filter"` can be used.

Empty facet filters are pruned from the DOM before the Projects filter UI is refreshed, and the same cleanup runs again after list restarts and when tab panes activate.

Projects waits for the Finsweet init path to settle before the first horizontal-scroll and ScrollTrigger refresh pass, which keeps the SPA entry contract aligned with the hard-load contract.

### Custom UI Contract
If the visible Projects filter or pagination UI does not use native Finsweet attributes directly, the page expects bridgeable wrappers such as `.filters__item` and optional `[data-pagination]` controls.

### Tab Change Detection
Uses MutationObserver on tab pane `class` attribute to detect when Webflow switches tabs. This allows triggering filter animations and layout rebinds when content changes.

### Filter Item Animation
Filter items are animated in with a staggered slide-in effect. They're hidden when tabs are inactive to prevent visual clutter.

### Search Clear
The search close button clears the input and triggers a fresh search pass.

### Cleanup
On unmount, the page removes bridge listeners and clears feature bindings.

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
