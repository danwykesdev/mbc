# GitHub Copilot Instructions for MBC Runtime

This repository is a modular front-end runtime for a Webflow site. It uses **Barba.js** for page transitions, **Webflow IX2/IX3** for interactions, **GSAP/ScrollTrigger** for animations, and **Finsweet Attributes v2** for UI logic (lists/filters/modals).

When generating code or answering questions in this repository, you must follow these strict architectural and coding rules.

## Core Architecture
- **`main.js`**: Main runtime entry, handles environment detection, Barba.js transitions, and nav state.
- **`loader.js`**: Dynamically resolves and loads required modules and external scripts based on DOM presence.
- **`core/`**: Infrastructure logic (State, Utilities, Page Registry, Cleanup Stacks, Webflow Manager).
- **`features/`**: Shared behaviors used across multiple pages (e.g., `finsweet.js`, `horizontal-scroll.js`, `videos.js`, `nav.js`).
- **`pages/`**: Route-specific modules exporting `webflowTier`, `mount(ctx)`, and `unmount()`.
- **`docs/`**: Detailed documentation for every module. ALWAYS consult this folder first if you need to understand how a specific file works.
- **`agent.md`**: The master guide for agents. Consult this for high-level architectural understanding.

## What to IGNORE (Extremely Important)
- **DO NOT** read or modify files in `legacy/`. This folder contains deprecated monolith code (`script.js`, `app.js`).
- **DO NOT** attempt to modify `dist/`. This is built output.
- Only operate within `core/`, `features/`, `pages/`, `main.js`, and `loader.js`.

## Coding Rules & Conventions

### 1. The Page Mount/Unmount Lifecycle
Every page module in `pages/` executes `mount(ctx)` upon entry and `unmount()` upon leave.
- **Always query the DOM using `ctx.container`** (e.g., `ctx.container.querySelectorAll(...)`). Only fall back to `document` if the element exists strictly outside the Barba wrapper (like the global navigation).
- **Always return a cleanup function** from `mount(ctx)`. If you add event listeners, GSAP tweens, timeouts, or observers, you must return a function that destroys/kills them.

### 2. State & DOM Stability During Transitions
Webflow, Barba, and Finsweet constantly mutate the DOM.
- **Avoid stale references:** If a feature depends on the DOM after a Webflow or Finsweet reinitialization, query the elements *live* inside the function. Do not cache `document.querySelectorAll` globally outside of the lifecycle functions.
- Use `core/utils.js` for helpers like `debounce`, `waitForLayout`, `traceAsync`, and `traceSync`.
- Use `core/state.js` for global context (`MBC.core.state`).

### 3. GSAP & ScrollTrigger
- Use `matchMedia` when making responsive timelines.
- Always kill tweens or call `ScrollTrigger.kill()` within the cleanup function of a feature or page module.
- For horizontal scrolling, always recalculate scroll distance dynamically on resize using `ResizeObserver`.

### 4. External Dependencies (Finsweet & Vimeo)
- Do not instantiate Finsweet or Vimeo globally. They are dynamically loaded via `loader.js`.
- Use the helpers exposed in `features/finsweet.js` (e.g., `restartFinsweet`, `destroyFinsweet`) when navigating via Barba.
- Videos are managed via `features/videos.js`. The DOM replaces original `#video` elements with a stable wrapper so Finsweet modals don't break them during transitions.

### 5. Task & Workflow Management
- When you make a structural change or fix a bug, update `task.md` following this exact format:
  - Add a new entry in the "Commit History" section with:
    - Commit SHA (7 characters)
    - Date in ISO format (YYYY-MM-DD HH:mm:ssZ)
    - Changes: bullet list of what was modified
    - Related to: issue number or description
  - If the change addresses an active issue, update the "Active Issues" section with current status
  - Update the "Last updated" timestamp at the top of the file
- If making changes to JS runtime, always remind the user to rebuild the bundle using `npm run build:runtime`.

### 6. Communication Style
- Output clean, modular JavaScript (ES5/ES6 depending on the file).
- Do not add arbitrary comments unless explaining complex custom logic.
- Prefer explicit variable names and keep functions small.
