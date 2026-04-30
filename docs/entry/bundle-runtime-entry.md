# bundle-runtime-entry.js

## Purpose
This is the build entry point for creating the bundled production file (`dist/mbc.runtime.js`). It imports all modules in the correct order so they can be bundled into a single JavaScript file for production deployment.

## What It Does

### Bundled Runtime Flag
- Sets `window.__MBC_BUNDLED_RUNTIME__ = true` to signal that all modules are pre-loaded
- This flag tells loader.js to skip actual script loading since everything is already in the bundle

### Module Imports
Imports all modules in dependency order:
1. Loader (must be first)
2. Core modules (state, utils, cleanup, registry, webflow, lifecycle)
3. Feature modules (including Finsweet integration)
4. Page modules (all 6 pages)
5. Main entry point (must be last)

### Build Process
- This file is used by the build script in package.json
- The bundler (likely Rollup or Webpack) processes this file
- Output is written to `dist/mbc.runtime.js`
- The output file is what gets deployed to production

## Why This Exists
- In development, modules are loaded dynamically for faster iteration
- In production, bundling everything into one file improves performance
- Single file reduces HTTP requests and improves load times
- The bundled file is served via CDN (jsDelivr) in production

## Important Notes
- This file is only used during the build process
- It is not loaded directly in the browser
- Changes to any module require rebuilding the bundle
- The bundle must be rebuilt after any JavaScript changes before deploying
- Temporary debug banners can be added here while tracking an active bug; remove them once the issue is merged to main
- The production bundle currently installs a temporary console filter so only the build banner is shown while the home animation bug is being debugged
