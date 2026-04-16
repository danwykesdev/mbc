# horizontal-scroll.js

## Purpose
This module creates horizontal scrolling sections using GSAP ScrollTrigger. It's primarily used on the Projects page to create a horizontally scrolling project card section.

## What It Does

### Horizontal Scroll Setup
- Detects panels within a horizontal scroll wrapper
- Calculates the total scroll distance (wrapper width minus viewport width)
- Creates a GSAP tween that translates panels horizontally based on scroll position
- Pins the wrapper to create the horizontal scroll effect

### Responsive Padding
- Sets right padding on the wrapper based on viewport width:
  - Mobile (<768px): 20px
  - Tablet (768-991px): 40px
  - Desktop (≥992px): 80px
- Ensures panels don't touch the edge of the viewport

### Gap Calculation
- Automatically detects the gap between panels by measuring their positions
- Falls back to computed margin-right if measurement fails
- Uses the measured gap for scroll distance calculations

### Retry Logic
- Implements a retry mechanism for initialization
- Retries up to 12 times with increasing delays
- Handles cases where layout isn't ready immediately
- Useful for dynamic content or delayed rendering

### Resize Handling
- Listens for window resize events
- Uses ResizeObserver to detect container size changes
- Reflows the scroll trigger on resize
- Debounces resize handling with requestAnimationFrame

### Cleanup
- Kills the GSAP tween
- Removes ScrollTrigger by ID
- Disconnects ResizeObserver
- Removes event listeners
- Clears panel transforms

## Key Functions

### `initHorizontalScroll(container)`
Main initialization function. Sets up the horizontal scroll with all its features. Returns a cleanup function.

### `reflow()`
Recalculates and recreates the scroll trigger. Called on resize or when layout changes.

## Important Notes

### Single Instance
The module maintains a single active instance. If initialized again, it cleans up the previous instance first. This prevents conflicts.

### Panel Requirements
- Requires at least 2 panels to create a horizontal scroll effect
- Panels must have `[data-horizontal-scroll-panel]` attribute
- Wrapper must have `[data-horizontal-scroll-wrap]` attribute

### Scroll Distance Calculation
Scroll distance = wrapper scroll width - window width. If this is 0 or negative, horizontal scroll is disabled.

### Delayed Reflow
The module schedules delayed reflows at 700ms and 2000ms after initialization. This handles cases where layout settles after initial load (e.g., images loading, fonts loading).

### Trigger ID
Uses a fixed ID 'horizontal-pin' for the ScrollTrigger. This allows targeted cleanup and prevents conflicts with other triggers.

## Dependencies
- GSAP (for animations)
- ScrollTrigger (for scroll-based animations)
- ResizeObserver (for container size detection)

## Usage Pattern

```javascript
// In a page module:
var horizontalScrollCleanup = MBC.features.horizontalScroll.init(container);
cleanups.push(horizontalScrollCleanup);

// Later, if needed:
MBC.features.horizontalScroll.reflow();
```

## DOM Structure Required

```html
<div data-horizontal-scroll-wrap>
  <div data-horizontal-track>
    <div data-horizontal-scroll-panel>Panel 1</div>
    <div data-horizontal-scroll-panel>Panel 2</div>
    <div data-horizontal-scroll-panel>Panel 3</div>
  </div>
</div>
```
