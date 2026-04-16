# nav.js

## Purpose
This module manages the navigation bar's visual state. It handles theme (dark/light), background (solid/none), and blur settings, and coordinates mobile-specific styling.

## What It Does

### Navigation State Management
- `setState(config)` - sets the navigation's visual state
- Accepts theme, background, and blur configuration
- Applies state as data attributes on the nav element

### State Attributes
- `data-nav-theme` - 'dark' or 'light'
- `data-nav-bg` - 'solid', 'none', or other values
- `data-nav-blur` - 'true' or 'false'

### Mobile Style Coordination
- Updates mobile-specific styling when menu is open/closed
- Changes logo and menu button colors on mobile when menu opens
- Updates hamburger menu bar colors
- Listens for window resize to re-apply mobile styles

### Style Synchronization
- `syncMobileMenuBars()` - updates mobile menu bar colors
- `syncMobileOpenStateStyles()` - updates logo and button colors when menu is open
- `refreshMobileStyles()` - public API for triggering style updates

## Key Functions

### `setState(config)`
Main function for setting navigation state. Normalizes the config and applies attributes.

### `syncMobileMenuBars()`
Updates the hamburger menu bar colors based on viewport and menu state.

### `syncMobileOpenStateStyles()`
Updates logo and menu button colors when the mobile menu is open.

### `ensureMobileBarListener()`
Ensures the resize listener for mobile style updates is bound only once.

## State Normalization

### Theme
- Defaults to 'dark' if not specified
- Accepts 'dark' or 'light'

### Background
- If blur is false, background is set to 'none'
- If blur is true and background not specified, defaults to 'solid'
- Can be 'solid', 'none', or custom values

### Blur
- Defaults to true for dark theme, false for light theme
- Can be explicitly set via config
- Accepts boolean or string values ('true', 'false', '0', 'none', 'no-blur')

## Important Notes

### Mobile vs Desktop
The module handles different styling for mobile devices. When the mobile menu is open, the logo and menu button colors change to dark for visibility against the light menu background.

### Resize Listener
The resize listener is bound only once (checked via `mobileBarListenerBound` flag) to prevent duplicate listeners.

### CSS Data Attributes
The state is applied as data attributes which are used by CSS to style the navigation. This allows CSS to handle the actual styling based on these attributes.

## Usage Pattern

```javascript
// Set navigation state:
MBC.features.nav.setState({
  theme: 'dark',
  bg: 'solid',
  blur: true
});

// Refresh mobile styles (e.g., after menu open/close):
MBC.features.nav.refreshMobileStyles();
```

## Dependencies
- None (self-contained)
