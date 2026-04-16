# default.js

## Purpose
This is the default page module used as a fallback for pages without specific implementations (e.g., Contact page). It handles minimal initialization for pages that don't require complex features.

## What It Does

### Navigation State
- Sets navigation to dark theme with solid background and no blur
- Uses `webflowTier: 'light'` for minimal Webflow reinitialization

### Minimal Initialization
- Does not load videos (not needed on default pages)
- Only sets navigation state via traceSync for performance tracking

## Module Definition

```javascript
{
  webflowTier: 'light',
  mount: mount,
  unmount: unmount
}
```

## Key Functions

### `mount(ctx)`
Async function that sets the navigation state. Returns an empty cleanup function.

### `unmount()`
Empty function - no cleanup needed.

## Important Notes

### Webflow Tier
Uses 'light' tier which only runs Webflow modules without reinitializing IX. This is appropriate for simple pages that don't rely heavily on Webflow animations.

### Fallback Page
This module serves as the fallback for any page that doesn't have a specific module implementation. It's registered as 'default' in the page registry.

### No Features
Default pages don't need videos, Finsweet, or other complex features. They only need basic navigation state.

## Dependencies
- MBC.features.nav (for navigation state)
- MBC.core.utils (for traceSync)
