# cleanup.js

## Purpose
This module provides a cleanup management system for the MBC runtime. It allows page modules and features to register cleanup functions that will be executed when a page is unmounted, preventing memory leaks and ensuring proper resource cleanup during SPA transitions.

## What It Does

### Cleanup Stacks
- Maintains two cleanup stacks in the global state:
  - `pageCleanupStack` - for page-specific cleanup (event listeners, observers, timers)
  - `globalCleanupStack` - for global cleanup (features that persist across pages)

### Registration
- `addPage(fn)` - registers a cleanup function for the current page
- `addGlobal(fn)` - registers a cleanup function for global scope
- `add(fn)` - alias for `addPage` (for backward compatibility)

### Execution
- `runPage()` - executes all page cleanup functions in reverse order (LIFO)
- `runGlobal()` - executes all global cleanup functions in reverse order
- `runAll()` - alias for `runPage`

### Error Handling
- Wraps each cleanup function execution in a try-catch block
- Logs warnings if a cleanup function fails
- Continues executing remaining cleanup functions even if one fails
- Clears the stack after execution

## Key Functions

### `addToStack(stackName, fn)`
Internal helper that pushes a function onto a specified cleanup stack. Validates that the input is a function before adding.

### `runStack(stackName)`
Internal helper that executes all functions on a specified stack in reverse order. Handles errors gracefully and clears the stack after execution.

## Usage Pattern

```javascript
// In a page module's mount function:
function mount(ctx) {
  var cleanup1 = someFeature.init();
  var cleanup2 = anotherFeature.init();

  // Register cleanup functions
  MBC.core.cleanup.addPage(cleanup1);
  MBC.core.cleanup.addPage(cleanup2);

  // Or return a single cleanup function that the lifecycle will register
  return function cleanup() {
    cleanup1();
    cleanup2();
  };
}
```

## Important Notes
- Cleanup functions are executed in reverse order (last added, first executed)
- This ensures dependencies are cleaned up in the correct order
- The lifecycle system automatically calls `runPage()` during unmount
- Global cleanup is typically used for features that persist across page transitions
- Always register cleanup for event listeners, observers, and timers to prevent memory leaks
