# utils.js

## Purpose
This module provides utility functions used throughout the MBC runtime. It includes timing helpers, namespace normalization, safe function execution, and performance tracing tools.

## What It Does

### Timing Helpers
- `wait(ms)` - creates a promise that resolves after a delay
- `raf2()` - waits for two requestAnimationFrame cycles (for DOM layout settling)
- `waitForLayout()` - waits for layout to settle (raf2 + fonts + additional delay)

### Namespace Handling
- `normalizeNamespace(ns)` - normalizes namespace strings with alias support
- `isHome(ns)` - checks if a namespace is the home page

### Safe Execution
- `safeCall(fn, label)` - executes a function with error handling and logging

### Performance Tracing
- `traceAsync(label, promiseFactory)` - traces async operations with timing
- `traceSync(label, fn)` - traces synchronous operations with timing

### Debouncing
- `debounce(fn, ms)` - creates a debounced version of a function

## Key Functions

### `wait(ms)`
Simple promise-based delay. Used throughout the codebase for timing control.

### `raf2()`
Waits for two requestAnimationFrame cycles. This is commonly used to wait for browser layout to settle after DOM changes.

### `waitForLayout()`
Comprehensive layout settling wait:
1. Waits for two RAF cycles
2. Waits for fonts to load (with timeout)
3. Waits an additional 30ms buffer

### `normalizeNamespace(ns)`
Normalizes namespace strings:
- Converts to lowercase
- Trims whitespace
- Applies aliases (project → projects, project_detail → project-detail, zine_detail → zine-detail)
- Returns 'default' for empty strings

### `isHome(ns)`
Convenience function that checks if a normalized namespace equals 'home'.

### `safeCall(fn, label)`
Wraps a function call in try-catch. Logs warnings with the provided label if the function throws. Returns null on error.

### `traceAsync(label, promiseFactory)`
Measures and logs the duration of async operations:
- Logs start time with label
- Executes the promise factory
- Logs completion time with duration in ms
- Logs failure if promise rejects
- Re-throws errors for upstream handling

### `traceSync(label, fn)`
Measures and logs the duration of synchronous operations:
- Logs start time with label
- Executes the function
- Logs completion time with duration in ms
- Logs failure if function throws
- Re-throws errors for upstream handling

### `debounce(fn, ms)`
Creates a debounced function that delays execution until after ms milliseconds have elapsed since the last invocation.

## Namespace Aliases
The following namespace variations are normalized:
- `project` → `projects`
- `project_detail` → `project-detail`
- `zine_detail` → `zine-detail`

## Usage Pattern

```javascript
// Timing control
await MBC.core.utils.wait(100);
await MBC.core.utils.waitForLayout();

// Namespace handling
var ns = MBC.core.utils.normalizeNamespace('Project_Detail'); // 'project-detail'
if (MBC.core.utils.isHome(ns)) { /* ... */ }

// Safe execution
MBC.core.utils.safeCall(function() {
  riskyOperation();
}, 'risky operation failed');

// Performance tracing
await MBC.core.utils.traceAsync('my operation', function() {
  return doSomethingAsync();
});

MBC.core.utils.traceSync('my sync operation', function() {
  return doSomethingSync();
});
```

## Important Notes
- Tracing functions are used extensively for debugging performance issues
- The RAF-based timing is critical for DOM-dependent operations
- Namespace normalization ensures consistent handling across the codebase
- SafeCall prevents single errors from breaking the entire application
