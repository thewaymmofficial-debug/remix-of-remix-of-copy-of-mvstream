

# Fix Video Player Landscape Mode on Mobile

## The Problem

The `screen.orientation.lock('landscape')` API only works when the page is already in **fullscreen mode** on mobile browsers. The current code tries to lock orientation on mount but fullscreen hasn't been requested yet, so it silently fails and the video stays in portrait mode.

## The Fix

Redesign the video player's mount behavior to properly enter fullscreen first, then lock orientation. Add a CSS-based fallback for browsers that don't support the Fullscreen API.

## Changes to `src/components/VideoPlayer.tsx`

### 1. Auto-enter fullscreen on mount (mobile only)
- On mount, immediately request fullscreen on the container element
- Once fullscreen is confirmed (via `fullscreenchange` event), lock orientation to landscape
- On unmount, exit fullscreen and unlock orientation

### 2. CSS rotation fallback
- If fullscreen request fails (some browsers restrict it), apply a CSS `transform: rotate(90deg)` with swapped width/height to force landscape layout
- Detect portrait orientation using `window.matchMedia('(orientation: portrait)')` and apply the rotation only when needed

### 3. Touch support for mobile controls
- Add `onTouchStart` handler alongside `onMouseMove` for showing/hiding controls on mobile (mouse events don't fire on touch devices)
- Add `playsInline` attribute to the `<video>` element to prevent iOS from auto-entering its native fullscreen player

### 4. Improved fullscreen + orientation flow
- Combine the separate fullscreen and orientation effects into one coordinated effect
- Chain: mount -> request fullscreen -> on fullscreen granted -> lock orientation
- Cleanup: unlock orientation -> exit fullscreen -> restore

## Technical Details

```text
Mount sequence:
  1. Component mounts
  2. Request fullscreen on container div
  3. Listen for fullscreenchange event
  4. On fullscreen confirmed -> screen.orientation.lock('landscape')
  5. Video displays in landscape

Unmount sequence:
  1. screen.orientation.unlock()
  2. document.exitFullscreen()
  3. Navigate back
```

The CSS fallback rotation handles cases where the browser blocks fullscreen (e.g., user hasn't interacted with the page yet, or API not available):

```text
If fullscreen fails AND device is in portrait:
  - Container gets transform: rotate(90deg)
  - Width becomes viewport height, height becomes viewport width
  - Controls are repositioned accordingly
```

## Files Modified

| File | Change |
|------|--------|
| `src/components/VideoPlayer.tsx` | Auto-fullscreen on mount, orientation lock after fullscreen, CSS rotation fallback, touch event support, playsInline attribute |

