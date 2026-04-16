# stagger-hover.js

## Purpose
This module creates staggered hover effects for project cards on the projects page. When hovering over a project card, its content items (text, images, overlays) animate in with a staggered sequence.

## What It Does

### Hover Animation
- Detects hover on elements with `[data-stagger="projects"]`
- Animate items in when hovering over a card
- Animate items out when hovering away
- Supports both mouse and keyboard focus

### Staggered Content
- Text items (marked with `[data-stagger="item"]`) stagger in
- Images scale up slightly on hover
- Overlays fade in on hover
- All animations use GSAP for smooth performance

### Active State Management
- Tracks which card is currently active
- Only one card can be active at a time
- Smoothly transitions between cards when moving mouse

### Responsive
- Checks for hover capability using `matchMedia('(hover: hover) and (pointer: fine)')`
- On touch devices, shows all content immediately without hover animations
- Falls back gracefully for devices without hover

### Cleanup
- Kills all GSAP tweens on cleanup
- Clears transform and opacity properties
- Removes event listeners
- Clears the trigger map

## Key Functions

### `init(container)`
Initializes stagger hover effects. Scans for triggers, sets up animations, and binds event listeners. Returns a cleanup function.

### Internal Functions
- `animateIn(entry)` - animates content in for a card
- `animateOut(entry)` - animates content out for a card
- `setActiveTrigger(nextTrigger)` - switches active card
- `getTriggerFromTarget(target)` - finds trigger from event target

## Animation Timing

### Animate In
- Items: 0.2s duration, power2.out, 0.1s total stagger
- Image: 0.2s duration, power1.out, scale to 1.05
- Overlay: 0.2s duration, power1.out

### Animate Out
- Items: 0.18s duration, power2.out, 0.08s total stagger, from end
- Image: 0.35s duration, power2.out, scale to 1
- Overlay: 0.2s duration, power1.out

## Important Notes

### DOM Structure Required
```html
<div data-stagger="projects">
  <div data-stagger="item">Item 1</div>
  <div data-stagger="item">Item 2</div>
  <img class="u-img-cover" />
  <div data-stagger="overlay"></div>
</div>
```

### Touch Device Handling
On touch devices (no hover capability), the module:
- Shows all items immediately (opacity 1, y 0)
- Shows images at scale 1
- Shows overlays immediately
- Skips hover event listeners

### Event Handling
- Uses mouseover/mouseout for mouse interaction
- Uses focusin/focusout for keyboard accessibility
- Properly handles relatedTarget to prevent flickering when moving between child elements

### Force 3D
Images use `force3D: true` for GPU acceleration and smoother scaling.

## Dependencies
- GSAP (for animations)

## Usage Pattern

```javascript
// In a page module (e.g., projects.js):
var staggerHoverCleanup = MBC.features.staggerHover.init(container);
cleanups.push(staggerHoverCleanup);
```
