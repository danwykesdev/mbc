---
status: complete
created: 2026-04-29
updated: 2026-04-29
related_bugs: [pagination-spa-reload-fail (resolved)]
---

# Feature: Projects Page — Finsweet Pagination SPA Reload Fix

## Context

The Projects page uses Finsweet Attributes V2 (`fs-list-load="all"`) to load all CMS items at once, with filter and horizontal scroll support. The page fully works on hard load (direct URL). On SPA reload (Barba transition from any other page into Projects), the list fails to load all items — only the default Webflow page-1 subset is rendered, leaving pagination broken and the full item set invisible.

### Architecture Summary

- `main.js` — Barba hooks: `beforeEnter` → (leave animation) → `afterLeave` (old container removed, unmountCurrent) → `afterEnter` (mountRoute → mount())
- `core/lifecycle.js` — `mountNext()` calls `pageModule.mount(ctx)` from within `afterEnter`; by this point the old Barba container is already removed from the DOM.
- `pages/projects.js` — `mount()` calls `MBC.features.finsweet.init()` with `finsweetModules = ['list', 'filter']`
- `features/finsweet.js` — `initFinsweet()` → `destroyModule(fs, 'list')` → `restartModule(fs, 'list', 2000, { init: true })` on fresh init, while `restartFinsweet()` still uses `restartModule(fs, 'list', 2000)` for live updates

### Root Cause

`restartModule` executes this sequence after `destroyModule`:

```
1. fs.load('list')         ← Finsweet re-scans document, creates fresh list instance,
                              detects fs-list-load="all", begins async CMS fetch chain
2. await modules.list.loading (if present)
3. fs.modules.list.restart()  ← Re-renders list with current filter state
                                  **This fires immediately after load() resolves,
                                  BEFORE the async "load all" fetch chain completes**
```

`fs.load('list')` initiates the `fs-list-load="all"` fetch sequence asynchronously.
`fs.modules.list.restart()` is a render-only call — it re-renders items currently in
the list's internal store. When called before all pages have been fetched, it commits
a partial render (page-1 only) and the subsequent fetch completions may be silently
discarded or cause conflicting state in the module.

On hard load this does not happen: the Finsweet script loads natively, `fs.load()`
runs once uninterrupted without a follow-up `restart()`, and the "load all" sequence
completes without conflict.

### Blockers

None. Root cause is confirmed analytically; no external unknowns.

## Resolution

The final working fix was a combination of the earlier Finsweet and Webflow alignment changes plus one last Barba-boundary correction:

- keep the init-safe Finsweet path in `features/finsweet.js`
- wait for `loadingPaginatedItems` before downstream layout refreshes run
- restore Projects to `webflowTier: 'strong'`
- sync body state from `next.html` during `beforeEnter`
- remove the old Barba container in `afterLeave` so document-wide reinit cannot scan stale source-page DOM

The last step was the turning point for the remaining `home -> projects` and `zine -> projects` failures. User retest confirmed the Projects SPA entry now loads the full list consistently.

## Agent Notes

- [2026-04-29] Began implementation. Fixing the Finsweet list init path so SPA reloads do not call `restart()` immediately after `load()`.
- [2026-04-29] Reopened the issue after browser evidence showed extra `w-dyn-item` wrappers still being created on SPA reload.
- [2026-04-29] Tightened Projects sync so it only stamps external controls to the resolved list instance and no longer falls back to `document` or rewrites the list root itself.
- [2026-04-29] Added global Finsweet destroy on route leave so stale list observers and generated wrappers cannot survive into the next page.
- [2026-04-29] Restored Projects list-load normalization so the list root is forced into the documented mode before Finsweet init.
- [2026-04-29] User rejected the restored load-mode hypothesis because it broke hard-load filtering/pagination. Added route-state debug logging in lifecycle, Projects, and Zine so the next verification pass can compare what persists across routes before changing behavior again.
- [2026-04-29] Implemented the init-safe Finsweet load path so fresh Projects entry skips the render-only restart phase and waits briefly after `load()` before layout rebinds. Verified with `npm run build`.
- [2026-04-29] Reopened the bug after full route logs showed the previous init-safe load change did not fix SPA Projects. Added canonical Projects list-root normalization so Finsweet only sees one `fs-list-element="list"` root before init. Verified with `npm run build`.
- [2026-04-29] Latest route logs showed the real SPA difference is stale `fs.modules.list` surviving into the next Projects entry. Updated Finsweet destroy so destroyed modules are removed from `fs.modules` before the next init. Verified with `npm run build`.
- [2026-04-29] Confirmed from the Attributes v2 runtime that `fs.modules.list.loading` resolves before `load="all"` finishes fetching paginated pages. Updated fresh list init to wait for each list instance's `loadingPaginatedItems` promise before returning, so downstream layout refreshes do not run mid-fetch. Verified with `npm run build`.
- [2026-04-29] Route comparison showed the only successful entry (`about -> projects`) came from the one page mounted with `webflowTier: 'strong'`, while `projects` itself was still configured as `light` despite the Webflow manager docs marking Projects as a strong-tier page. Restored Projects to `webflowTier: 'strong'` so SPA entry gets the full Webflow/IX reset before Finsweet init. Verified with `npm run build`.
- [2026-04-29] Audited the linked Barba advanced docs. Landed the first safe framework-alignment change by syncing `body` state from `next.html` during `beforeEnter`, matching Barba's guidance that `body` sits outside the swapped container. Verified with `npm run build`.
- [2026-04-29] Applied the next Barba-alignment fix after confirming from the docs that Barba can keep both containers in the DOM during transition. `afterLeave` now explicitly removes the old container before the next page mounts, so document-wide Finsweet/Webflow reinit cannot scan stale source-page DOM. Verified with `npm run build`.
- [2026-04-29] User confirmed the Projects SPA reload is now working on the previously failing routes. Closed out the Projects record with the combined fix set: init-safe Finsweet load, stronger Webflow reset, body sync, and explicit old-container removal in the Barba transition. No regression reported on hard load.

---

## Tasks

### Task 1 — Remove the `restart()` call from `restartModule` in the full-init path

**File:** `features/finsweet.js`

**Problem:** `restartModule` always calls `fs.modules[moduleName].restart()` immediately after `fs.load()`. For the initial mount case (post-destroy), `fs.load()` alone is the correct and complete initialization — it creates a fresh instance, scans the DOM, and starts the `fs-list-load` sequence. The subsequent `restart()` is a render-phase-only call that fires before the async "load all" fetch completes and corrupts the partially-fetched state.

**Change:** Split the behavior so `restartModule` accepts an `options` object. Add an `init: true` flag meaning "this is a fresh init call — do not call restart() after load()". Update the call-site in `initFinsweet` to pass `{ init: true }`.

```
// features/finsweet.js — restartModule signature change
async function restartModule(fs, moduleName, maxWait, options) {
  options = options || {};
  ...
  // After fs.load() and loading promise settles:
  if (!options.init && typeof fs.modules[moduleName]?.restart === 'function') {
    await Promise.resolve(fs.modules[moduleName].restart());
  }
}

// initFinsweet call-site:
await restartModule(fs, moduleName, 2000, { init: true });
```

**Acceptance:** On SPA transition to Projects, the list renders all CMS items (not just page-1 subset). No regression on `restartProjectsList()` calls (which still use `restartFinsweet` → `restartModule` without `init: true`, so `restart()` still fires for filter/tab updates).

---

### Task 2 — Add a post-load settle wait in `restartModule` for init path

**File:** `features/finsweet.js`

**Problem:** Even after removing the premature `restart()`, the `load()` operation returns a resolved promise when the module is instantiated, but the `fs-list-load="all"` fetch chain is asynchronous and ongoing. Downstream code in `projects.js` calls `refreshProjectsBindings()` which triggers `ScrollTrigger.refresh(true)` — this forces layout recalc while Finsweet is mid-fetch, potentially resetting element heights and causing the fetch callbacks to operate on stale measurements.

**Change:** When `options.init === true`, add a `wait(150)` after `fs.load()` resolves (and after the `loading` promise settles) before returning from `restartModule`. This gives the "load all" fetch chain time to fire at least the first network request and for Finsweet to register its internal fetch state before any `ScrollTrigger.refresh` runs.

```
// Inside restartModule, after the second loading wait, before the restart() block:
if (options.init) {
  await wait(150);
}
```

**Acceptance:** The console shows Finsweet loading items progressively after mount, and `ScrollTrigger.refresh` does not interrupt the load sequence. The horizontal scroll track renders at full width (all panels present) within 1s of page enter.

---

## Testing Matrix

| Scenario | Expected after fix |
|---|---|
| Hard load (direct URL to /projects) | All items load, horizontal scroll works — **no regression** |
| SPA reload (home → projects) | All items load, horizontal scroll works |
| SPA reload (project-detail → projects) | All items load, filters work |
| SPA reload (projects → other → projects) | All items reload cleanly, no stale state |
| Filter tab switch after SPA reload | `restartProjectsList` fires, layout rebinds correctly |
| `restartProjectsList` triggered manually | `restart()` still fires (no `init: true` flag) — **no regression** |
