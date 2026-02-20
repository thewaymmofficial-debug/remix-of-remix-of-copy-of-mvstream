

## Fix: Show "Continue Watching" on the Home Page

### Problem
The "Continue Watching" section already exists in the code (along with Trending, Recommendations, Watchlist, and category rows), but it is wrapped inside an `{isFiltering && (...)}` block. Additionally, each of these sections has a `!isFiltering` guard. This means they **never display** -- the outer condition requires filtering to be active, while the inner condition requires it to be inactive.

### Solution
Move the "Continue Watching" row (and the other always-visible rows like Trending, Recommendations, Watchlist, and category rows) **outside** the `isFiltering` conditional block so they render on the default home page.

### Changes

**`src/pages/Index.tsx`**
1. After the `<CategoryGrid />` component (and before the existing `{isFiltering && ...}` block), add a new section that renders when the user is NOT filtering:
   - Continue Watching row (for logged-in users with in-progress movies)
   - Trending This Week row
   - Personalized Recommendations row
   - My Watchlist row
   - All category rows (sorted by preference)
2. Keep the existing `{isFiltering && ...}` block for search/filter results only, but remove the duplicate sections from inside it (they had `!isFiltering` guards anyway and never showed).

**No other file changes needed** -- `ContinueWatchingCard`, `useContinueWatching`, and `useRemoveFromHistory` are already implemented and imported.

### Technical Details

The restructured render logic will be:

```text
<InfoCarousel />
<CategoryGrid />

{/* Default home view (not filtering) */}
{!isFiltering && (
  <>
    {/* Continue Watching */}
    {/* Trending */}
    {/* Recommendations */}
    {/* Watchlist */}
    {/* Category Rows */}
  </>
)}

{/* Filtered results (only when searching/filtering) */}
{isFiltering && (
  <> ... filtered category rows only ... </>
)}
```

- The Continue Watching card already has a progress bar built in
- The `useContinueWatching` hook filters for movies with >30 seconds of progress and caps progress at 95%
- No database or migration changes needed -- the `watch_history` table and hooks are already in place
