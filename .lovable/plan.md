

## Fix: Unified Video Controls

### Problem
The custom overlay (rewind/play-pause/forward buttons) and the native browser video controls (timeline bar, volume, fullscreen) operate independently. Sometimes both appear together, sometimes only one shows -- creating an inconsistent experience.

### Solution
Sync the native `controls` attribute with the custom overlay visibility:
- When the custom overlay is **showing**: hide native controls (`video.controls = false`) so only the clean custom UI is visible
- When the custom overlay **hides**: restore native controls (`video.controls = true`) so users can still use the timeline/seekbar

This ensures a single, consistent control layer is visible at any time.

### Technical Details

**File: `src/components/VideoDoubleTapOverlay.tsx`**

1. Add a `useEffect` that toggles `videoRef.current.controls` based on `showControls` state:
   - `showControls === true` -> `video.controls = false` (hide native bar)
   - `showControls === false` -> `video.controls = true` (restore native bar)

2. Remove the bottom 56px exclusion (`style={{ bottom: '56px' }}`) from the overlay since native controls will be hidden when the overlay is active -- no need to leave space for them.

3. Keep the tap detection zone covering the full area when overlay is visible (since native controls are hidden), but restore the 56px exclusion when overlay is hidden (so native controls remain tappable).

**File: `src/pages/Watch.tsx`**
- No changes needed.

