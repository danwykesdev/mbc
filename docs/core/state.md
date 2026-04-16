# state.js

## Purpose
This module provides the global state object for the MBC runtime. It holds all shared state that needs to be accessible across modules, including navigation state, current page information, and cleanup stacks.

## What It Does

### Global State Storage
- Maintains a single state object that all modules can access
- Stores navigation-related state (navToken, currentNamespace, currentContainer)
- Stores page-related state (currentPageModule, initialLoadComplete)
- Stores feature instances (lenis, heroAnimating)
- Stores cleanup stacks (pageCleanupStack, globalCleanupStack)

### Navigation Token System
- `navToken` - incrementing counter that tracks navigation operations
- `nextToken()` - generates a new token and increments the counter
- `isStale(token)` - checks if a token is outdated (doesn't match current navToken)

### Token-Based Stale Detection
- Each navigation operation gets a unique token
- Async operations check if their token is still valid before proceeding
- Prevents race conditions when rapid navigation occurs
- If a new navigation starts, old operations are aborted

## State Properties

### Navigation State
- `navToken` - current navigation token number
- `currentNamespace` - normalized namespace of current page
- `currentContainer` - DOM container for current page

### Page State
- `currentPageModule` - the currently mounted page module object
- `initialLoadComplete` - boolean flag set after first page load

### Feature Instances
- `lenis` - the Lenis smooth scroll instance
- `heroAnimating` - boolean flag indicating hero animation is in progress

### Cleanup Stacks
- `pageCleanupStack` - array of cleanup functions for current page
- `globalCleanupStack` - array of cleanup functions for global scope

## Key Functions

### `nextToken()`
Increments the navToken and returns the new value. This should be called at the start of any navigation operation.

### `isStale(token)`
Compares the provided token with the current navToken. Returns true if they don't match, indicating the operation is stale and should be aborted.

## Usage Pattern

```javascript
// In lifecycle.js during mount:
var token = state.nextToken();
// ... async operations ...
if (state.isStale(token)) return; // Abort if new navigation started
```

## Important Notes
- The state object is shared across all modules
- Direct mutation of state should be minimized
- Use the provided functions for token operations
- The token system is critical for SPA reliability
- Feature instances (like lenis) are stored here for global access
