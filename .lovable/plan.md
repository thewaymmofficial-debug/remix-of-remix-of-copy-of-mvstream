

## Remove Custom Video Overlay -- Use Native Controls Only

### What Changes
Remove the custom overlay component (rewind/play-pause/forward buttons) entirely. The video player will rely solely on the browser's native controls (timeline, volume, fullscreen, play/pause) which appear on tap.

### Technical Details

**File: `src/pages/Watch.tsx`**
- Remove the `VideoDoubleTapOverlay` import
- Remove the `<VideoDoubleTapOverlay>` component from the JSX
- Ensure `<video>` always has `controls` attribute set

**File: `src/components/VideoDoubleTapOverlay.tsx`**
- No deletion needed, but it will no longer be used (can be deleted for cleanup)

