

## Add "Recently Watched" Section and Pagination to Browse Pages

### Overview
Add a "Recently Watched" row showing the last 5 watched items at the top of the Browse page (for both `/browse/movie` and `/browse/series`), and paginate the main movie/series grid with responsive page sizes (20 on mobile, 30 on desktop) with Previous/Next buttons.

### Changes

**1. New hook: `useRecentlyWatched` in `src/hooks/useWatchHistory.tsx`**
- Add a new exported hook that fetches the last 5 watch history entries filtered by content type (`movie` or `series`)
- Joins with `movies` table to get full movie data
- Distinct from "Continue Watching" -- this shows any recently watched content regardless of progress

**2. Update `src/pages/Browse.tsx`**
- Import `useRecentlyWatched` and `useIsMobile`
- Add pagination state (`page`) with items per page: 20 on mobile, 30 on desktop
- Slice the `movies` array based on current page
- Show a "Recently Watched" horizontal row (last 5 items) at the top of the page, only when filter is `movie` or `series` and user is logged in
- Add Previous/Next pagination buttons below the grid
- Show page indicator (e.g., "Page 1 of 5")

**3. Recently Watched row UI**
- Horizontal scrollable row of 5 `MovieCard` components
- Section title: "Recently Watched" with a small clock icon
- Only visible when the user has watch history for that content type
- Clicking a card opens the movie quick preview (same as existing behavior)

### Technical Details

**`src/hooks/useWatchHistory.tsx`** -- add new hook:
```typescript
export function useRecentlyWatched(contentType: 'movie' | 'series', limit = 5) {
  // Query watch_history joined with movies, filtered by content_type
  // Order by last_watched_at DESC, limit to 5
}
```

**`src/pages/Browse.tsx`** -- add pagination + recently watched:
- `const isMobile = useIsMobile()` to determine page size
- `const pageSize = isMobile ? 20 : 30`
- `const [page, setPage] = useState(1)` for current page
- Reset page to 1 when filter changes
- Compute `totalPages = Math.ceil(movies.length / pageSize)`
- Slice movies: `movies.slice((page - 1) * pageSize, page * pageSize)`
- Render Previous/Next buttons at the bottom with disabled states at boundaries
- Render "Recently Watched" section above the grid when `activeFilter` is `movie` or `series`

