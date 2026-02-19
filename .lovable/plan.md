

## Fix: Single Back Press to Exit Video Player

### Problem
On mobile, when you press the browser's back button while watching a video in fullscreen, two things happen sequentially:
1. First back press: The browser exits fullscreen mode (browser's native behavior consumes this press)
2. Second back press: Actually navigates back to the movie details page

You want a single back press to exit both fullscreen AND navigate back.

### Solution
Listen for the `fullscreenchange` event in `Watch.tsx`. When fullscreen exits (which happens on the first back press), immediately trigger navigation back. This way, the browser's native fullscreen exit automatically chains into a page navigation -- making it feel like one action.

### Technical Details

**File: `src/pages/Watch.tsx`**
- Add a `useEffect` that listens for `fullscreenchange` on the document
- When `document.fullscreenElement` becomes `null` (fullscreen exited), call `goBack()` to navigate away
- Use a small flag/ref to distinguish between "user exited fullscreen via back button" vs "component unmounting cleanup" to avoid double-navigation
- The existing back arrow button (`goBack`) will also exit fullscreen first (via the hook cleanup) and navigate, so it continues to work as-is

**File: `src/hooks/useFullscreenLandscape.tsx`**
- Remove the automatic `document.exitFullscreen()` call from the cleanup function, since `Watch.tsx` will now handle the navigation on fullscreen exit -- having the hook also exit fullscreen during unmount could cause conflicts

