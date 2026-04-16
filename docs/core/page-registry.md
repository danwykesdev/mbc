# page-registry.js

## Purpose
This module provides a simple registry for page modules. It allows page modules to register themselves with a namespace, and allows the lifecycle system to retrieve the appropriate page module for a given namespace.

## What It Does

### Registration
- `register(namespace, moduleDef)` - registers a page module with a namespace
- Normalizes the namespace using the utils module if available
- Stores the module definition in an internal registry object

### Retrieval
- `get(namespace)` - retrieves a page module by namespace
- Normalizes the namespace before lookup
- Returns the registered module or falls back to the 'default' module
- Returns null if neither the requested nor default module exists

### Access to All Pages
- `all` - provides access to the entire registry object
- Useful for debugging or introspection

## Key Functions

### `normalize(namespace)`
Internal helper that normalizes a namespace string. Uses `MBC.core.utils.normalizeNamespace` if available, otherwise falls back to simple lowercasing and trimming.

## Usage Pattern

Page modules self-register when they load:

```javascript
// In a page module file (e.g., pages/home.js):
var moduleDef = {
  webflowTier: 'light',
  mount: mount,
  unmount: unmount
};

MBC.pages.home = moduleDef;

if (MBC.core && MBC.core.registry) {
  MBC.core.registry.register('home', moduleDef);
}
```

The lifecycle system retrieves modules:

```javascript
// In lifecycle.js:
var pageModule = registry.get(namespace);
```

## Namespace Normalization
The registry normalizes namespaces to handle variations:
- Lowercase conversion
- Whitespace trimming
- Alias resolution (via utils module)
- Default fallback

## Important Notes
- The registry is a simple key-value store
- Namespaces are case-insensitive after normalization
- The 'default' module serves as a fallback for unknown namespaces
- Page modules should register themselves immediately after definition
