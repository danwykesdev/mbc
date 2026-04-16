# finsweet.js

## Purpose
This module integrates Finsweet Attributes into the MBC runtime. It handles initialization, restart, and cleanup of Finsweet modules (List, Modal, Slider, Filter) for both the full Finsweet library and standalone modal scripts.

## What It Does

### Module Detection
- `detectModules(container)` - scans DOM for Finsweet attributes
- Detects which modules are present based on attribute selectors:
  - `[fs-list-element]` → list module
  - `[fs-modal-element]` → modal module
  - `[fs-slider-element]` → slider module
  - `[fs-filter-element]` → filter module

### Module Resolution
- `resolveModules(container, requestedModules)` - normalizes module requests
- Maps 'filter' and 'slider' to 'list' (they're part of the list module)
- Handles modal as a separate standalone module
- Removes duplicates from the module list

### Initialization Paths
Two different initialization paths based on what's needed:

#### Modal-Only Path (Standalone Scripts)
- Uses standalone Finsweet Modal and A11y ES modules
- Does NOT load the full Finsweet library
- Re-injects scripts with cache-busting for SPA transitions
- Used on pages that only need modals (home, project-detail)

#### Full Library Path
- Uses the full Finsweet Attributes library
- Loads and restarts list, slider, and filter modules
- Used on pages with lists, filters, or sliders (projects, zine)

### Cache-Busting for SPA Transitions
- `reinjectStandaloneModal()` - removes old modal/a11y script tags
- Adds unique timestamp query parameter to script URLs
- Forces browser to re-fetch and re-evaluate ES modules
- Critical for ensuring modal works after SPA transitions

### Module Restart
- `restartModule(fs, moduleName, maxWait)` - safely restarts a Finsweet module
- Waits for module loading to complete
- Loads module if not already loaded
- Calls the module's restart method
- Handles timeouts and errors gracefully

### Module Destruction
- `destroyModule(fs, moduleName)` - destroys a Finsweet module
- Calls the module's destroy method if available
- Used for cleanup before reinitialization

### Diagnostic Inspection
- `inspect(container, label)` - logs diagnostic information
- Counts elements with each Finsweet attribute
- Lists active modules
- Useful for debugging initialization issues

## Key Functions

### `initFinsweet(container, options)`
Main initialization function. Determines which path to take (modal-only vs full library) and orchestrates the initialization process.

### `restartFinsweet(container, options)`
Restarts Finsweet modules without full destruction. Useful for SPA transitions when you want to refresh the list module.

### `destroyFinsweet(options)`
Destroys specified Finsweet modules. Maps filter/slider to list for destruction.

### `waitForFinsweet(timeout)`
Polls for the Finsweet Attributes global to become available. Times out after the specified duration.

## Important Notes

### Modal-Only vs Full Library
- **Modal-only**: Uses standalone ES modules from different CDN URLs. Self-initializes on load. Requires cache-busting for SPA transitions.
- **Full library**: Uses the main Finsweet Attributes library. Requires explicit module loading and restart.

### Cache-Busting Critical for SPA
Browser ES module caching prevents re-execution even if script tags are re-appended. Adding a unique query parameter (`?mbc_reload=timestamp`) forces the browser to treat each load as a new resource.

### Module Mapping
- 'filter' and 'slider' are not separate modules - they're features of the 'list' module
- When requesting filter or slider, the code actually requests and restarts the list module

### Busy Flag
The `fsBusy` flag prevents concurrent initialization attempts. If Finsweet is already initializing, new init calls are skipped to prevent race conditions.

## Usage Pattern

```javascript
// Initialize with auto-detection
MBC.features.finsweet.init(container);

// Initialize specific modules
MBC.features.finsweet.init(container, { modules: ['modal'] });
MBC.features.finsweet.init(container, { modules: ['list', 'filter'] });

// Restart after DOM changes
MBC.features.finsweet.restart(container, { modules: ['list'] });

// Destroy before cleanup
MBC.features.finsweet.destroy({ modules: ['list'], timeout: 300 });

// Inspect for debugging
MBC.features.finsweet.inspect(container, 'my label');
```

## Dependencies
- Finsweet Attributes CDN (full library): `https://cdn.jsdelivr.net/npm/@finsweet/attributes@2/attributes.js`
- Finsweet Modal CDN (standalone): `https://cdn.jsdelivr.net/npm/@finsweet/attributes-modal@1/modal.js`
- Finsweet A11y CDN (standalone): `https://cdn.jsdelivr.net/npm/@finsweet/attributes-a11y@1/a11y.js`
