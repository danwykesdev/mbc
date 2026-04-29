# webflow-manager.js

## Purpose
This module manages Webflow integration for the SPA system. It handles Webflow's IX2/IX3 animation systems, reinitializes Webflow modules after page transitions, and coordinates with GSAP ScrollTrigger.

## What It Does

### Page ID Updates
- `updatePageIdFromBarba(data)` - extracts the Webflow page ID from Barba's next page HTML
- Updates the document's data-wf-page attribute so IX2/IX3 targets the correct page config
- Also syncs `body` classes and runtime body data attributes from `next.html`, because `body` lives outside the Barba container and is not replaced automatically
- Critical for ensuring animations work correctly after SPA transitions

### ScrollTrigger Cleanup
- `killScrollTriggers()` - kills all GSAP ScrollTrigger instances
- Called before page transitions to prevent conflicts
- Ensures clean state for the new page

### Webflow Module Reinitialization
- `moduleReady(name)` - runs a Webflow module's ready/init/redraw method
- `runModules()` - runs all standard Webflow modules (links, scroll, tabs, dropdown, navbar, slider, forms)

### IX2/IX3 Animation Systems
- `initIX()` - initializes both IX2 and IX3 animation systems
- Follows the "stop → init" pattern (simple, no multi-pass)
- Stops existing IX2 instances before reinitializing

### Tiered Reinitialization
- `reinit(tier)` - reinitializes Webflow with different levels of depth
- Supports four tiers: strong, full, ix, light
- Each tier provides different levels of cleanup and reinitialization

### UI Refresh
- `refreshUI()` - refreshes Webflow UI without full reinit
- `refreshIX()` - quick IX refresh for minor DOM updates

## Reinitialization Tiers

### "strong" (Nuclear Reset)
Use for pages where IX3 must bind reliably (home, projects, about):
1. Destroys Webflow
2. Runs ready → modules → IX
3. Dispatches readystatechange event (IX3 listens for this)
4. Forces resize for ScrollTrigger recalculation
5. Runs ready → IX again
6. Dispatches readystatechange again
7. This "double-pass with readystatechange" ensures IX3 calculates correct bounding boxes

### "full"
For full page transitions:
1. Destroys Webflow
2. Runs ready → modules → IX
3. Standard double-pass (ready → IX → resize)

### "ix"
For partial updates:
1. Destroys Webflow
2. Runs ready → modules → IX
3. Standard double-pass

### "light"
For minimal updates:
1. Only runs modules (no IX reinitialization)
2. Fastest option, suitable for simple pages

## Key Functions

### `updatePageIdFromBarba(data)`
Parses the next page HTML from Barba data, extracts the data-wf-page attribute, and syncs body state that Barba leaves outside the container swap. This ensures Webflow's animation system targets the correct page configuration while preventing stale body classes/data attributes from leaking across routes.

### `killScrollTriggers()`
Iterates through all ScrollTrigger instances and kills them. This prevents scroll-based animations from the previous page interfering with the new page.

### `reinit(tier)`
Main reinitialization function. Dispatches to the appropriate tier logic based on the tier parameter. Handles the complex timing and event dispatching required for reliable IX3 binding.

### `refreshIX()`
Quick refresh of IX2/IX3 without destroying Webflow. Useful for minor DOM updates where a full reinit would be overkill.

## Why the "Strong" Tier is Complex
IX3 (Webflow's newer animation system) uses GSAP internally and listens for the `readystatechange` event to calculate element bounding boxes. In an SPA context:
- The DOM changes but the browser doesn't naturally fire readystatechange
- IX3 may calculate positions based on stale layout information
- The "strong" tier manually fires readystatechange to force IX3 to recalculate
- The double-pass ensures IX3 has time to process the layout changes

## Usage Pattern

```javascript
// In lifecycle.js:
await MBC.core.webflow.reinit(tier); // tier comes from page module

// In a page module:
var moduleDef = {
  webflowTier: 'strong', // or 'full', 'ix', 'light'
  mount: mount,
  unmount: unmount
};
```

## Important Notes
- The tier system is critical for balancing performance and reliability
- "strong" is safest but slowest; "light" is fastest but least thorough
- IX3 requires the readystatechange trick for reliable SPA behavior
- Always kill ScrollTriggers before page transitions
- Barba does not replace `body`, so any page-level body classes or body-scoped data attributes must be synchronized manually from `next.html`
- The page module's webflowTier property determines which tier to use
