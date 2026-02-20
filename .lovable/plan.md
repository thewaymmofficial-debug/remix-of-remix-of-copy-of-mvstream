

## Fix: Make "Continue Watching" Actually Work

### The Problem
The "Continue Watching" row never appears because **no playback progress is ever saved**. Here's the chain of issues:

1. The video player page (`Watch.tsx`) receives only `url` and `title` -- it has no `movieId`, so it cannot save progress
2. The only call to `updateProgress` is in `MovieDetails.tsx` with `progressSeconds: 0` on page load -- which never meets the 30-second threshold
3. The `useContinueWatching` hook filters for `progress > 30`, so zero-progress entries are always excluded

### The Fix (3 changes)

**1. Pass `movieId` to the Watch page via URL params**

In `ServerDrawer.tsx`, update the navigation to include `movieId`:
```
navigate(`/watch?url=...&title=...&movieId=${movieInfo.movieId}`)
```

Also pass `movieId` from `MovieDetails.tsx` into `ServerDrawer` via the existing `movieInfo` prop (already done for download -- just needs to also be used for play mode).

**2. Save progress periodically in `Watch.tsx`**

- Read `movieId` from search params
- Import `useUpdateProgress` from the watch history hook
- Add a `timeupdate` event listener on the video element that saves progress every ~10 seconds (throttled)
- Save final progress on component unmount (when user exits the player)
- This writes the current `currentTime` (seconds) and `duration` (seconds) to the `watch_history` table

**3. Filter out completed movies from "Continue Watching"**

In `useContinueWatching` (inside `useWatchHistory.tsx`):
- Keep the existing `progress > 30` filter (only show if watched more than 30 seconds)
- Also filter out entries where progress is >= 95% of duration (already completed)
- This ensures finished movies don't clutter the Continue Watching row

### Technical Details

**`src/components/ServerDrawer.tsx`**
- When `type === 'play'` and using in-app player, include `movieId` in the navigation URL

**`src/pages/MovieDetails.tsx`**
- Ensure `movieInfo` prop is passed to the play-mode `ServerDrawer` (currently only passed to download drawer)

**`src/pages/Watch.tsx`**
- Extract `movieId` from `useSearchParams`
- Import and use `useUpdateProgress`
- Add throttled `timeupdate` listener that calls `updateProgress.mutate()` every ~10 seconds with current `currentTime` and `duration`
- Save progress on unmount via a cleanup ref

**`src/hooks/useWatchHistory.tsx`**
- In `useContinueWatching`, add a client-side filter to exclude entries where `progress_percent >= 95` (completed)

### Result
- When a user watches a video and exits partway through, their progress is saved
- The "Continue Watching" row appears on the homepage showing in-progress movies with a progress bar
- Tapping a Continue Watching card navigates back to the movie details page
- Completed movies (watched to the end) are excluded from the row

