# zine.md

## Purpose
This is the page module for the Zine page. It handles Finsweet list integration, custom pagination, and tab shortcuts for the zine layout.

## What It Does

### Finsweet Integration
- Detects and initializes Finsweet list module
- Excludes modal module (not used on zine page)
- Supports Finsweet list-tabs roots by marking them for IX reset before init
- Inspects Finsweet state before and after initialization for debugging

### Custom Pagination
- Intercepts pagination button clicks
- Triggers hidden Finsweet pagination controls
- Updates arrow visual state (active/inactive)
- Supports both next and previous navigation

### Tab Shortcuts
- Binds custom triggers to Webflow tabs or list-tabs generated tab links
- Clicking a trigger activates a tab
- Scrolls to list anchor after tab activation
- Used for "anatomy", "head", and "luxury" sections

### Scroll to Anchor
- Scrolls to `[fs-list-element='scroll-anchor']` on load
- Uses Lenis smooth scrolling if available
- Falls back to native scrollIntoView if Lenis not available

### Query Helper
- `queryOne(container, selector, fallbackGlobal)` - searches container first, then falls back to global document

## Key Functions

### `mount(ctx)`
Main mount function with Finsweet, pagination, and tab handling.

### Internal Functions
- `scrollToAnchor()` - scrolls to list anchor on load
- `onBodyClick(e)` - handles pagination button clicks
- `bindTabShortcut(triggerSelector, tabValue)` - binds custom tab triggers

## Module Definition

```javascript
{
  webflowTier: 'ix',
  mount: mount,
  unmount: unmount
}
```

## Initialization Sequence

1. **Finsweet Inspect**: Log state before init
2. **List Tabs Prep**: Mark list-tabs roots for IX reset
3. **Finsweet Init**: Initialize list module
4. **Wait for Tabs**: Allow generated list-tabs markup to settle
5. **Scroll to Anchor**: Scroll to list anchor
6. **Pagination Handler**: Set up pagination click handler
7. **Tab Shortcuts**: Bind custom tab triggers
8. **Cleanup**: Return lifecycle cleanup handlers

## Important Notes

### Webflow Tier
Uses 'ix' tier which destroys Webflow and reinitializes modules + IX. This is appropriate for pages that use Webflow IX animations.

### Custom Pagination
The zine uses custom pagination buttons that trigger hidden Finsweet pagination controls. This allows custom styling while using Finsweet's list functionality.

### Tab Shortcuts
Custom buttons (marked with `data="anatomy"`, `data="head"`, `data="luxury"`) activate specific Webflow tabs or Finsweet list-tabs tabs. This provides a custom UI for tab switching.

List-tabs tabs should use `fs-list-element="tabs"`, `fs-list-element="tab-link"`, and `fs-list-resetix="true"` on the Tabs component so generated tabs keep Webflow IX behavior.

### Lenis Scroll
The page uses Lenis smooth scrolling if available, falling back to native scrolling otherwise.

### Finsweet Inspect
The page logs Finsweet state before and after initialization for debugging. This helps identify initialization issues.

## Dependencies
- MBC.features.finsweet (for list functionality)
- MBC.core.utils (for traceAsync, traceSync)
- Lenis (for smooth scrolling, if available)

## Namespace
Registered as 'zine' in the page registry.
