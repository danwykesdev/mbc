# hero2.js

## Purpose
This module provides the `home-2` variant of the home hero animation. It keeps the original crisp-loader mobile layout on a separate namespace so the default home page can evolve without affecting the client-facing comparison route.

## What It Does

### Hero Animation
- Reuses the home hero matchMedia/timeline structure
- Keeps the original mobile flex layout with three `crisp-loader` panels filling `100svh`
- Preserves the desktop and tablet reveal sequencing
- Keeps the nav reveal and `heroAnimating` state contract intact

### Namespace Isolation
- Registers only as `MBC.features.hero2`
- Is loaded by the `home-2` page module dependency chain
- Does not run on other pages unless that namespace is mounted

### Mobile Layout
- Sets the mobile loader parent to flex
- Gives each `.crisp-loader` a `33.333svh` height
- Uses the original reveal spacing and resizing behavior from the earlier home animation version

## Dependencies
- GSAP (for animations and matchMedia)
- MBC.core.state (for `heroAnimating`)

## Usage Pattern

```javascript
// In the home-2 page module:
var heroCleanup = MBC.features.hero2.init(container);
cleanups.push(heroCleanup);
```
