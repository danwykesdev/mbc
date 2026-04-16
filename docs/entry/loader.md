# loader.js

## Purpose
This is the dynamic module loader for the MBC system. It manages dependency resolution, loads internal modules and external scripts on demand, and determines which features and pages are needed based on the current page's namespace and DOM content.

## What It Does

### Module Registry
- Maintains a registry of all available modules (core, features, pages)
- Defines dependencies for each module
- Specifies DOM-based conditions for loading feature modules
- Maps page modules to Barba namespaces

### Dependency Resolution
- Resolves module dependencies in the correct order
- Prevents circular dependencies
- Ensures dependencies are loaded before the modules that need them

### Script Loading
- Dynamically loads internal JavaScript modules via script tags
- Loads external scripts (Finsweet, Vimeo) with proper attributes
- Caches loaded scripts to prevent duplicate loading
- Supports both classic scripts and ES modules

### Page-Specific Loading
- `loadForPage(container, namespace)` determines what's needed for a specific page
- Detects DOM features to decide which feature modules to load
- Loads external scripts based on DOM presence (Finsweet, Vimeo)
- Filters deferred features on home page for performance

### Namespace Handling
- Normalizes namespace names (e.g., "project" → "projects")
- Provides aliases for common namespace variations
- Maps namespaces to page modules

### External Script Management
- Manages loading of Finsweet Attributes (full library)
- Manages loading of Finsweet Modal (standalone ES module)
- Manages loading of Finsweet A11y (accessibility module)
- Manages loading of Vimeo Player API
- Tracks which external scripts are already loaded

### Bundled Runtime Mode
- When `window.__MBC_BUNDLED_RUNTIME__` is true, all modules are considered pre-loaded
- This mode is used in production where everything is bundled into a single file
- Skips actual script loading in this mode

## Key Functions

### `loadForPage(container, namespace)`
Main entry point for loading modules for a page. Detects needed features, loads external scripts, then loads all required modules in dependency order.

### `loadModule(moduleId)`
Loads a single module and its dependencies. Resolves the dependency graph and loads each dependency sequentially.

### `resolveDeps(moduleId, resolved, resolving)`
Recursively resolves the dependency graph for a module. Returns an ordered array of module IDs.

### `detectFeatures(container)`
Scans a container's DOM to determine which feature modules are needed based on `domCheck` selectors.

### `loadExternalScript(name, urlOrConfig)`
Loads an external script by name. Supports both string URLs and config objects with type and attributes.

### `waitForExternalScript(name, windowGlobal, timeout)`
Polls for a window global to become available (e.g., waiting for Vimeo.Player to be defined).

## Module Registry Structure

### Core Modules
- `core/state` - No dependencies
- `core/utils` - No dependencies
- `core/cleanup` - No dependencies
- `core/registry` - Depends on `core/state`
- `core/webflow` - Depends on `core/state`, `core/utils`
- `core/lifecycle` - Depends on `core/state`, `core/cleanup`, `core/registry`, `core/webflow`

### Feature Modules
- `features/lenis` - Depends on `core/state`, DOM check: none
- `features/nav` - No dependencies, DOM check: none
- `features/mobile-nav` - No dependencies, DOM check: none
- `features/scroll-direction` - Depends on `core/state`, DOM check: none
- `features/load-animations` - Depends on `core/state`, `core/utils`, DOM check: none
- `features/stagger-hover` - No dependencies, DOM check: `[data-stagger="projects"]`
- `features/tabs` - No dependencies, DOM check: `.project_component`
- `features/hero` - Depends on `core/state`, DOM check: `.hero-animate`
- `features/videos` - No dependencies, DOM check: `#videoLoad, #video, [data-video], [data-vimeo-id], [fs-modal-element]`
- `features/finsweet` - No dependencies, DOM check: `[fs-list-element], [fs-modal-element], [fs-slider-element], [fs-filter-element]`
- `features/horizontal-scroll` - Depends on `core/state`, DOM check: `[data-horizontal-scroll], [data-horizontal-scroll-wrap], [data-horizontal-track], [data-horizontal-scroll-panel]`

### Page Modules
- `pages/home` - Namespace: `home`, Depends on many features
- `pages/projects` - Namespace: `projects`, Depends on many features
- `pages/project-detail` - Namespace: `project-detail`, Depends on many features
- `pages/about` - Namespace: `about`, Minimal dependencies
- `pages/zine` - Namespace: `zine`, Minimal dependencies
- `pages/default` - Namespace: `default`, Minimal dependencies

## Important Notes
- The loader is initialized before main.js runs
- In bundled runtime mode, all modules are pre-loaded and this file just provides the API
- External scripts are loaded with specific attributes (e.g., `fs-list` for Finsweet)
- The loader uses performance tracing for debugging module load times
