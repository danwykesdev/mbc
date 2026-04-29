---
feature: projects
last_updated: 2026-04-29
open_count: 0
resolved_count: 1
---

# Bug Tracker — Projects Feature

## Active

_No active bugs._

## Resolved

### BUG-001 · pagination-spa-reload-fail
**Status:** resolved
**Severity:** high
**Reported:** 2026-04-29
**Resolved:** 2026-04-29
**Files:** `main.js`, `pages/projects.js`, `features/finsweet.js`, `core/webflow-manager.js`

**Symptom:**
Projects SPA entry left pagination broken and multiplied `w-dyn-list` / `w-dyn-item` wrappers on some routes even though direct hard load worked.

**Resolution:**
The remaining SPA-only failure was caused by document-wide reinit seeing stale source-page DOM during Barba transitions. The working fix combined the init-safe Finsweet load path, the stronger Webflow reset, body-state synchronization from `next.html`, and explicit removal of the old Barba container in `afterLeave` before Projects mounted.

**Files changed:**
`features/finsweet.js`, `pages/projects.js`, `core/webflow-manager.js`, `main.js`, `docs/entry/main.md`, `docs/core/webflow-manager.md`
