# about.js

## Purpose
This is the page module for the About page. It handles the minimal initialization needed for the About page, which primarily consists of setting the navigation state.

## What It Does

### Navigation State
- Sets navigation to dark theme with solid background and blur
- Uses `webflowTier: 'strong'` for full Webflow reinitialization

### Minimal Initialization
- Does not load videos or Finsweet (not needed on About page)
- Only sets navigation state via traceSync for performance tracking

## Module Definition

```javascript
{
  webflowTier: 'strong',
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
Uses 'strong' tier which performs the most thorough Webflow reinitialization. This is appropriate for pages that rely heavily on Webflow IX2/IX3 animations.

### No Features
The About page doesn't need videos, Finsweet, or other complex features. It only needs navigation state and Webflow animations.

### Namespace
Registered as 'about' in the page registry.

## Dependencies
- MBC.features.nav (for navigation state)
- MBC.core.utils (for traceSync)
