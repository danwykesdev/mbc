---
id: feat-barba-alignment
title: "Barba Lifecycle Alignment"
status: in-progress
priority: high
created: 2026-04-29
updated: 2026-04-29
agent: agentic-app-implementer
docs_ref: /docs/entry/main.md
related_bugs: []
---

## Overview
> Align the runtime with Barba's documented lifecycle patterns so route transitions are less fragile around Webflow, Finsweet, ScrollTrigger, and page-scoped state.

## Context
- **Docs:** `/docs/entry/main.md`, `/docs/core/webflow-manager.md`, Barba advanced docs (`third-party`, `hooks`, `transitions`, `views`, `strategies`, `utils`, `router`, `prefetch`)
- **Affected scripts:** `main.js`, `core/lifecycle.js`, `core/webflow-manager.js`, `loader.js`, `pages/*.js`
- **Dependencies:** `@barba/core`, Webflow IX2/IX3, GSAP ScrollTrigger, Lenis, Finsweet Attributes
- **Blockers:** Changes need to stay incremental because the Projects SPA bug is still under active verification.

---

## Tasks

Progress: 0 / 3 tasks complete

### Phase 1: Audit And Stabilize Barba Boundaries

1. **Normalize out-of-container page state**: Confirm all page state outside `data-barba="container"` is explicitly synchronized.
   - [ ] Audit `html` and `body` classes/attributes against `next.html`
   - [ ] Validate the new body-sync patch against failing SPA routes
   - **Resources:** `/docs/core/webflow-manager.md`, `core/webflow-manager.js`, `main.js`
   - **Acceptance:** Route debug shows expected page-level state before page mount on all tested routes

2. **Constrain namespace-specific logic**: Compare the current page-module lifecycle to Barba `views` guidance and reduce global hook burden where justified.
   - [ ] Decide whether to keep the custom lifecycle adapter or wrap page modules with Barba views
   - [ ] Identify namespace logic that should move out of global hooks
   - **Resources:** `/docs/entry/main.md`, `main.js`, `core/lifecycle.js`, `pages/*.js`
   - **Acceptance:** Documented decision with at least one reduced global hook responsibility

3. **Harden transition strategies**: Review request, cache, and prefetch behavior against Barba's strategies/plugins docs.
   - [ ] Evaluate `requestError`, `cacheIgnore`, and `prefetchIgnore` for this runtime
   - [ ] Assess whether router/prefetch plugins are compatible with the current loader model
   - **Resources:** `main.js`, `loader.js`, Barba `strategies`, `router`, and `prefetch` docs
   - **Acceptance:** Runtime strategy documented with only safe options enabled in code

---

## Agent Notes
> [2026-04-29] Created from the Barba docs audit after landing the first safe alignment change: syncing `body` state from `next.html` during `beforeEnter`.
> [2026-04-29] Added the second safe lifecycle fix after confirming Barba can keep both containers in the DOM during transition. `afterLeave` now removes the old container before the next mount so document-wide reinit cannot scan stale source-page DOM. The broader `views` and `strategies` audit remains open.

---

## Completion Checklist
- [ ] All tasks marked complete
- [ ] Bug references resolved or logged in bug.md
- [ ] /docs updated if behaviour changed
- [ ] Feature moved to /plan/archive/ after sign-off