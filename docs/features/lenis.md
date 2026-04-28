# lenis.js

## Purpose
This module initializes Lenis smooth scrolling. Lenis provides smooth, momentum-based scrolling that feels more natural than native browser scrolling.

## What It Does

### Lenis Initialization
- Creates a Lenis instance with optimized settings
- Stores the instance in global state for access by other modules
- Also stores it on `window.lenis` for external access

### Configuration
- `lerp: 0.1` - Linear interpolation factor for responsive, smooth scrolling
- `wheelMultiplier: 1.2` - Slightly boosted wheel response for natural feel
- `gestureOrientation: "vertical"` - Only vertical gestures
- `normalizeWheel: true` - Normalizes wheel events for consistent cross-device behavior
- `smoothTouch: false` - Disable smooth scrolling on touch devices

### GSAP Integration
- Adds Lenis to the GSAP ticker
- Updates Lenis on every GSAP tick (using RAF time)
- Disables GSAP lag smoothing for consistent smooth scrolling

### ScrollTrigger Integration
- Binds Lenis scroll events to ScrollTrigger updates
- Ensures ScrollTrigger recalculates when Lenis scrolls

## Key Functions

### `initLenis()`
Initializes Lenis and sets up integrations. Returns the Lenis instance. If already initialized, returns the existing instance.

## Important Notes

### Single Instance
The module ensures only one Lenis instance exists. If called multiple times, it returns the existing instance.

### Global Access
The Lenis instance is stored in both `MBC.core.state.lenis` and `window.lenis` for easy access by other modules and external scripts.

### GSAP Ticker
The GSAP ticker integration is critical. It ensures Lenis updates synchronously with GSAP animations, preventing conflicts between smooth scrolling and GSAP animations.

### Touch Devices
Smooth scrolling is disabled on touch devices (`smoothTouch: false`) because touch scrolling is already smooth on mobile devices and adding Lenis can cause conflicts.

### SPA Navigation
After a Barba page transition, the main.js `settleAfterMount` function calls `lenis.resize()` immediately and again after a 200ms delay. The delayed resize ensures Lenis recalculates content height after the new container's layout has fully painted.

## Dependencies
- Lenis library (must be loaded before this module)
- GSAP (for ticker integration)
- ScrollTrigger (for scroll update integration)

## Usage Pattern

```javascript
// In main.js or early in initialization:
if (MBC.features.lenis) {
  MBC.features.lenis.init();
}

// Later, access the instance:
var lenis = MBC.core.state.lenis;
lenis.scrollTo(0, { immediate: true });
```
