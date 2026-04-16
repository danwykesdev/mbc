# lifecycle.js

## Purpose
This module manages the page lifecycle for the SPA system. It coordinates the mounting and unmounting of page modules, ensuring proper initialization and cleanup during transitions.

## What It Does

### Page Unmounting
- Calls the current page module's `unmount` function if it exists
- Executes all registered page cleanup functions
- Resets the current page state in the global state
- Uses safe error handling to prevent unmount failures from breaking the app

### Page Mounting
- Generates a unique navigation token for each mount operation
- Normalizes the page namespace
- Retrieves the page module from the registry
- Waits for layout to settle before Webflow reinitialization
- Reinitializes Webflow with the appropriate tier (strong, full, ix, light)
- Calls the page module's `mount` function with context
- Registers the page's cleanup function
- Updates the global state with the current page information

### Stale Detection
- Uses a token-based system to detect stale operations
- If a new navigation starts before the current one completes, the old operation is aborted
- Prevents race conditions during rapid navigation

### Webflow Integration
- Coordinates with the webflow manager to reinitialize Webflow modules
- Passes the appropriate tier based on the page module's requirements
- Waits for layout to settle before and after Webflow reinit

## Key Functions

### `unmountCurrent(token)`
Unmounts the currently active page. Calls the page's unmount function, runs cleanup, and resets state. Includes safe error handling.

### `mountNext(data, opts)`
Mounts the next page. This is the main orchestration function that:
- Generates a navigation token
- Normalizes the namespace
- Gets the page module from registry
- Waits for layout
- Reinitializes Webflow
- Mounts the page module
- Registers cleanup
- Returns the mount result

### `addPageCleanup(fn)`
Helper function that registers a page cleanup function using the cleanup API. Handles different API versions for backward compatibility.

## Lifecycle Flow

1. **Before Navigation**: Barba triggers `beforeLeave` hook
2. **Unmount**: `unmountCurrent` is called
   - Page module's `unmount` function runs
   - Page cleanup stack runs
   - State is reset
3. **Transition**: Barba performs page transition animations
4. **After Navigation**: Barba triggers `afterEnter` hook
5. **Mount**: `mountNext` is called
   - Token generated
   - Namespace normalized
   - Page module retrieved
   - Layout settles
   - Webflow reinitialized
   - Page module mounted
   - Cleanup registered
   - State updated

## Important Notes
- The token system is critical for preventing race conditions
- Always check `state.isStale(token)` after async operations
- Page modules must define a `mount` function
- Page modules can optionally define an `unmount` function
- The `webflowTier` property on page modules determines reinitialization depth
- Cleanup functions returned by `mount` are automatically registered
