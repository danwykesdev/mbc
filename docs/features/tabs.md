# tabs.js

## Purpose
This module implements custom hover-activated tabs for the home page project categories. It replaces Webflow's default tab behavior with hover-based switching and staggered content animations.

## What It Does

### Hover-Based Tab Switching
- Tabs activate on mouse hover instead of click
- Also supports click for touch devices
- Staggers content reveal when switching tabs

### Tab Content Management
- Manages tab panes and their associated content
- Shows/hides image grid items with staggered delays
- Shows/hides text lists with staggered delays
- Maintains active tab state

### Animation Timing
- Image items: 0ms, 80ms, 160ms, 240ms delays
- Text items: 120ms start + 0ms, 35ms, 75ms, 125ms, 185ms delays
- Creates a cascading reveal effect

### State Management
- Tracks currently active tab
- Handles tab switching logic
- Prevents unnecessary re-activation of current tab

### Responsive
- Uses flex display on mobile (≤992px)
- Uses block display on desktop
- Adjusts layout based on viewport

### Cleanup
- Clears all timers
- Removes event listeners
- Resets all tab and pane states
- Clears inline styles

## Key Functions

### `initTabs(container)`
Initializes the custom tabs system. Sets up event listeners, initial state, and animations. Returns a cleanup function.

### Internal Functions
- `activate(name)` - switches to a tab with animations
- `resetAll()` - resets all tabs and panes to hidden state
- `keepCurrentVisible()` - ensures current tab content is visible
- `animateTextItems(list)` - staggers text item reveal
- `getPane(name)` - gets pane element by name
- `getList(pane, name)` - gets list element by name

## DOM Structure Required

```html
<div class="project_component">
  <div class="project__link" data-w-tab="event-production">Event Production</div>
  <div class="project__link" data-w-tab="another-tab">Another Tab</div>
  
  <div class="project__tab-pane" data-w-tab="event-production">
    <div class="images_grid-item">Image 1</div>
    <div class="images_grid-item">Image 2</div>
    <div class="project_url-list" data-projects="event-production">
      <a class="service-item-mask">Project 1</a>
      <a class="service-item-mask">Project 2</a>
    </div>
  </div>
</div>
```

## Important Notes

### Webflow Integration
The module works alongside Webflow's tab system but overrides the behavior. It uses Webflow's `data-w-tab` attributes for identification.

### Timer Management
The module uses multiple timers for staggered animations. All timers are cleared on cleanup and when switching tabs to prevent orphaned animations.

### Visibility Classes
Uses CSS classes (`is-visible`, `is-active`) combined with inline styles for controlling visibility. This provides both CSS transition support and JavaScript control.

### Accessibility
- Maintains proper ARIA attributes (aria-selected, tabindex)
- Supports keyboard navigation via click handler
- Preserves Webflow's tab semantic structure

### Initial State
On initialization, the module:
- Detects the current tab (via `w--current` class or first tab)
- Makes that tab's content visible
- Sets up event listeners for hover/click

## Dependencies
- None (uses vanilla JavaScript and DOM APIs)

## Usage Pattern

```javascript
// In a page module (e.g., home.js):
var tabsCleanup = MBC.features.tabs.init(container);
cleanups.push(tabsCleanup);
```
