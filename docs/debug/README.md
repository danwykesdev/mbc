# Debug Commands

Use these browser-console helpers when you need the full runtime trace or want to compare state across SPA routes.

## Route History Helpers

Run these in the browser DevTools console after the runtime has loaded:

- `window.__MBC_ROUTE_DEBUG_COPY()` - copies the full in-memory route history to the clipboard and returns the JSON string.
- `window.__MBC_ROUTE_DEBUG_EXPORT()` - returns the full route history as formatted JSON without copying it.
- `window.__MBC_ROUTE_DEBUG_CLEAR()` - clears the stored route history before the next test run.

## Debug Flags

Set these before reloading the page if you want diagnostics from the first route event:

- `window.MBC_DEBUG = true` - enables shared `[MBC Trace]` logs.
- `window.MBC_ROUTE_DEBUG = true` - enables route-state snapshots even if you do not want the broader trace noise.
- `window.MBC_HORIZONTAL_SCROLL_DEBUG = true` - enables horizontal-scroll diagnostics.

## Quick Workflow

1. Open the page in DevTools.
2. Run `window.MBC_DEBUG = true; window.MBC_ROUTE_DEBUG = true;` if you want live route logs on the next reload.
3. Reproduce the issue.
4. Run `await window.__MBC_ROUTE_DEBUG_COPY()` or `window.__MBC_ROUTE_DEBUG_EXPORT()` if clipboard access is blocked.
5. Paste the JSON into chat for comparison.

## Notes

- The copy helper uses the clipboard API when available, so it may require a user gesture in some browsers.
- `__MBC_ROUTE_DEBUG_CLEAR()` is useful when you want to capture one clean route sequence at a time.