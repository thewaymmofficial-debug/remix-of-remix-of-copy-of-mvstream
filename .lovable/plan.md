

## Two Fixes: Persistent Continue Watching + Smart Back Navigation

### Issue 1: Continue Watching Should Show Only the Last 1 Video (Persistent)

Currently the "Continue Watching" row fetches up to 10 in-progress videos and can disappear when you re-enter from watching. The fix:

- Change `useContinueWatching` to `.limit(1)` -- only fetch the single most recently watched in-progress video
- This makes it persistent: even after tapping "Continue Watching" and coming back, that same video stays visible (as long as it's not 95%+ completed)
- The card will show the timestamp badge and progress bar as before, with the resume button taking the user directly to the saved position

### Issue 2: Back Button on Movie/Series Details Should Return to Browse Page

Currently the back arrow on `MovieDetails.tsx` always navigates to `/` (homepage). The fix:

- Change `navigate('/')` to `navigate(-1)` so the back button goes to the previous page in browser history
- This means if you entered from `/browse/series`, you go back to `/browse/series`; if from `/browse/movie`, back to `/browse/movie`; if from homepage, back to homepage
- The fallback (if there's no history) will be `/` (homepage)

### Technical Details

**File: `src/hooks/useWatchHistory.tsx`**
- In `useContinueWatching`, change `.limit(10)` to `.limit(1)` so only the last played video appears

**File: `src/pages/MovieDetails.tsx`**
- Change the back button from `navigate('/')` to `navigate(-1)` with a fallback to `'/'` if history length is <= 1

**File: `src/pages/Index.tsx`**
- Since only 1 item shows, remove the left/right scroll buttons from the Continue Watching section (they're unnecessary for a single card)

