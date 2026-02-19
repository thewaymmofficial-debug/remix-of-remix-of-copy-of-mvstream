

## Fix View Count and Add Interactive Rating on Movie Details Page

### Problem 1: View Count Shows Wrong Data
The Eye icon currently displays `movie.rating_count` (number of ratings), not actual view count. The `movie_views` table exists but isn't being queried. Also, views should increment when a user clicks Play, not just when visiting the page.

### Problem 2: No Interactive Rating
A `StarRating` component already exists with full functionality (tap to rate 1-5 stars, shows user's rating, shows average). But the MovieDetails page only shows a static gold star with "N/A" text instead of using this component.

---

### Changes

**1. Create a new hook: `src/hooks/useMovieViews.tsx`**
- `useMovieViews(movieId)` -- fetches `view_count` from `movie_views` table for a given movie
- `useIncrementView(movieId)` -- calls the existing `increment_view_count` database function when user plays

**2. Update `src/pages/MovieDetails.tsx`**

- Import `useMovieViews` and `useIncrementView` hooks
- Import the existing `StarRating` component
- Replace the static Eye count (`movie.rating_count`) with the actual `view_count` from `movie_views`
- Call `increment_view_count` when the user clicks Play (inside `handlePlay`, after premium check passes)
- Replace the static star + "N/A" rating display (lines 197-202) with the interactive `StarRating` component, passing `movieId`, `averageRating`, and `ratingCount`

### Technical Details

**New hook (`useMovieViews`):**
```typescript
// Fetch view count
const { data } = supabase.from('movie_views').select('view_count').eq('movie_id', movieId).maybeSingle();

// Increment view (call existing DB function)
await supabase.rpc('increment_view_count', { _movie_id: movieId });
```

**MovieDetails changes:**
- Eye icon line: `{viewCount || 0}` instead of `{movie.rating_count || 0}`
- Rating section: Replace static star with `<StarRating movieId={movie.id} averageRating={movie.average_rating} ratingCount={movie.rating_count} size="md" />`
- Call `incrementView` inside `handlePlay` when the play drawer opens (premium user clicks play)

