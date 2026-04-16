# videos.js

## Purpose
This module handles video playback, specifically Vimeo videos embedded in the site. It manages both background videos and modal videos, coordinating with Finsweet modals for video playback.

## What It Does

### Background Videos
- Initializes background videos (autoplay, loop, muted)
- Creates stable wrapper elements for video players
- Handles Vimeo Player API integration
- Ensures videos are visible and playing

### Modal Videos
- Initializes videos inside Finsweet modals
- Creates stable wrappers to survive DOM changes
- Loads Vimeo Player when modal opens
- Destroys player when modal closes
- Handles multiple close triggers (click, escape, overlay click)

### DOM Stability
- Replaces video elements with stable wrapper divs
- This prevents Finsweet from losing references during SPA transitions
- Maintains video ID and class attributes on wrappers

### Player Lifecycle
- Creates Vimeo Player instances with proper configuration
- Handles player ready state and errors
- Sets volume and unmutes for modal videos
- Properly destroys players to prevent memory leaks

### Modal Detection
- Uses multiple methods to detect modal close:
  - Click on close buttons
  - Click on modal overlay
  - Escape key press
  - Transition end events
  - Animation end events
  - MutationObserver on modal attributes

## Key Functions

### `initBackgroundVideos(container)`
Initializes background videos. Returns a cleanup function.

### `initModalVideos(container)`
Initializes modal videos. Sets up open/close handlers and modal detection. Returns a cleanup function.

### `initStandaloneVideos(context)`
Main entry point. Initializes both background and modal videos. Returns a cleanup function.

### `createVimeoPlayer(element)`
Creates a Vimeo Player from an element. Handles both existing iframes and creating new ones from data attributes.

### Internal Functions
- `destroyPlayer(player, wrapper)` - destroys player and clears wrapper
- `isModalHidden(modal)` - checks if modal is hidden using multiple methods
- `resolveModalTarget(modalId)` - finds the video element for a modal
- `ensureStableWrapper(targetEl)` - creates or reuses stable wrapper

## Video Configuration

### Background Videos
- autoplay: true
- loop: true
- muted: true
- background: true (hides controls)
- autopause: false

### Modal Videos
- autoplay: true
- loop: true
- controls: false
- muted: false (sound on)
- autopause: false

## Important Notes

### Stable Wrapper Pattern
The module replaces video elements with stable wrapper divs. This is critical because:
- Finsweet may modify the DOM during SPA transitions
- The Vimeo Player needs a stable element to attach to
- Without this, players would be lost or duplicated

### Modal Close Detection
The module uses multiple detection methods because:
- Finsweet may use different methods to close modals
- Different animations may trigger different events
- MutationObserver provides a fallback for attribute changes

### Player Destruction
Players are destroyed with multiple queued timeouts (0ms, 120ms, 300ms) to ensure:
- Immediate cleanup attempt
- Cleanup after CSS transition completes
- Final cleanup as a safety net

### Volume Control
Modal videos are unmuted and set to full volume after the player is ready. This ensures sound plays when the modal opens.

## Dependencies
- Vimeo Player API (must be loaded)
- Finsweet Attributes (for modal integration)

## Usage Pattern

```javascript
// In a page module:
var videoCleanup = MBC.features.videos.initStandalone({
  container: container,
  includeBackground: true,
  includeModal: true
});
cleanups.push(videoCleanup);

// Or initialize separately:
var bgCleanup = MBC.features.videos.initBackground(container);
var modalCleanup = MBC.features.videos.initModal(container);
```

## DOM Structure Required

```html
<!-- Background video -->
<div id="videoLoad" data-video="VIDEO_ID"></div>

<!-- Modal video -->
<div fs-modal-element="modal" data-modal-id="my-modal">
  <div id="video" data-video="VIDEO_ID"></div>
</div>

<!-- Modal triggers -->
<button fs-modal-element="open" data-modal-id="my-modal">Open</button>
<button fs-modal-element="close">Close</button>
```
