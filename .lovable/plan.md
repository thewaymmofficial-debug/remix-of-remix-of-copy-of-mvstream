
# Ceniverse Premium Enhancement Plan

This plan covers implementing a comprehensive set of features across user engagement, UI/UX animations, content discovery, social sharing, and admin analytics.

---

## Phase 1: Database Schema Updates

New tables and columns needed to support the features:

### New Tables

**`watch_history`** - Tracks viewing progress and history
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | References auth.users |
| movie_id | uuid | References movies |
| episode_id | uuid | References episodes (nullable) |
| progress_seconds | integer | Current playback position |
| duration_seconds | integer | Total duration |
| completed | boolean | Whether finished watching |
| watched_at | timestamp | Last watched time |

**`movie_views`** - Aggregated view counts for trending
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| movie_id | uuid | References movies |
| view_count | integer | Total views |
| week_views | integer | Views this week |
| last_updated | timestamp | When counts were updated |

**`ratings`** - User ratings for movies
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | References auth.users |
| movie_id | uuid | References movies |
| rating | integer | 1-5 stars |
| created_at | timestamp | When rated |

**Movies Table Updates**
- Add `average_rating` (decimal) column
- Add `rating_count` (integer) column

---

## Phase 2: User Engagement Features

### 2.1 Continue Watching & View History

**New Hook: `src/hooks/useWatchHistory.tsx`**
- `useWatchHistory()` - Fetch user's recent watch history
- `useContinueWatching()` - Fetch incomplete movies with progress
- `useUpdateProgress()` - Mutation to save playback position
- `useMarkCompleted()` - Mark a movie as finished

**Homepage Enhancement**
- Add "Continue Watching" row at the top (above My Watchlist)
- Display progress bar overlay on movie cards showing completion %
- Show "Resume" button instead of "Play" for in-progress content

**View History Page: `src/pages/History.tsx`**
- Full history list with timestamps
- "Clear History" option
- Filter by date range

### 2.2 Rating System

**New Hook: `src/hooks/useRatings.tsx`**
- `useMovieRating(movieId)` - Get average rating
- `useUserRating(movieId)` - Get user's rating
- `useRateMovie()` - Submit/update rating

**New Component: `src/components/StarRating.tsx`**
- Interactive 5-star rating component
- Shows average rating with count
- Allows user to rate (click stars)

**Integration Points**
- MovieCard: Show average rating badge
- MovieDetails: Full rating UI with user's rating
- MovieQuickPreview: Display rating

### 2.3 Personalized Recommendations

**New Hook: `src/hooks/useRecommendations.tsx`**
- Fetch movies similar to user's watch history
- Based on: same category, same director, same actors
- "Because you watched X" personalization

**Homepage Enhancement**
- Add recommendations row after Continue Watching
- Show "Because you watched [Movie Title]" label

---

## Phase 3: UI/UX & Animations

### 3.1 Skeleton Loading (Shimmer Effect)

**New Component: `src/components/SkeletonCard.tsx`**
```text
+-------------------+
|   ============   |  <- Shimmer animation
|   ============   |
|   ============   |
|   ======         |  <- Title placeholder
|   ===            |  <- Meta placeholder
+-------------------+
```

**Implementation**
- Animated gradient shimmer using CSS
- Replace gray boxes in loading states
- Apply to MovieRow, MovieCard, MovieDetails

**CSS Addition to `tailwind.config.ts`**
- Add shimmer keyframe animation (already exists, will enhance)
- Create `.skeleton-shimmer` utility class

### 3.2 Page Transitions

**Implementation using React Router**
- Wrap routes with transition container
- Fade-out/fade-in between pages
- Slide animations for detail pages

**New Component: `src/components/PageTransition.tsx`**
- AnimatePresence wrapper
- Uses existing Tailwind animation classes
- Smooth 300ms transitions

### 3.3 Parallax Hero Banner

**HeroBanner Enhancement**
- Track scroll position with `useEffect`
- Apply `translateY` transform to backdrop based on scroll
- Subtle parallax effect (slower backdrop movement)

### 3.4 Enhanced Movie Card Hover

**MovieCard Enhancements**
```text
Normal State:          Hover State:
+--------+            +----------+
| Poster |   ->       | Poster   |
| Title  |            | Rating   |
+--------+            | + Actions|
                      +----------+
```

- Scale up smoothly (already exists)
- Show rating stars on hover
- Quick action buttons (Play, Watchlist, Info)
- Delayed tooltip with description

### 3.5 Pull-to-Refresh (Mobile)

**New Hook: `src/hooks/usePullToRefresh.tsx`**
- Detect pull-down gesture on mobile
- Show refresh indicator
- Trigger data refetch

**Homepage Integration**
- Add pull-to-refresh to main content area
- Visual pull indicator with animation

### 3.6 Infinite Scroll

**MovieRow Enhancement**
- Detect when user scrolls near end
- Load more movies in category
- Add pagination to `useMoviesByCategory`

---

## Phase 4: Content Discovery

### 4.1 Advanced Search

**FilterContext Enhancement**
- Add: `selectedDirector`, `selectedActor`, `ratingRange`
- Add: `sortBy` (newest, oldest, popular, rating)

**Navbar/Search Enhancement**
- Add sort dropdown
- Add advanced filter panel (expandable)
- Actor/Director autocomplete search

### 4.2 Related Content Section

**New Component: `src/components/RelatedMovies.tsx`**
- Fetch movies with same category
- Exclude current movie
- Display as horizontal scroll row

**MovieDetails Enhancement**
- Add "You Might Also Like" section below episodes

### 4.3 Trending Section

**New Hook: `src/hooks/useTrending.tsx`**
- Fetch movies sorted by weekly view count
- Update view counts when movie is watched

**Homepage Enhancement**
- Add "Trending This Week" row
- Show view count or fire icon indicator

### 4.4 New Arrivals Badge

**MovieCard Enhancement**
- Check if `created_at` is within last 7 days
- Show animated "NEW" badge
- Distinct styling from Premium badge

---

## Phase 5: Social Features

### 5.1 Share Content

**New Component: `src/components/ShareButton.tsx`**
- Copy link to clipboard
- Share to social media (Twitter, Facebook, WhatsApp)
- Native share API on mobile

**Integration Points**
- MovieDetails page
- MovieQuickPreview modal
- Mobile bottom sheet option

---

## Phase 6: Admin Analytics

### 6.1 View Analytics Dashboard

**New Page: `src/pages/admin/Analytics.tsx`**
- Most viewed movies (bar chart)
- Views over time (line chart)
- Popular categories (pie chart)
- Peak viewing times (heatmap)

**Using Recharts (already installed)**
- BarChart for top movies
- LineChart for trends
- PieChart for categories

### 6.2 User Engagement Dashboard

**Dashboard Enhancement**
- Active users (last 7 days, 30 days)
- Average watch time per user
- Retention metrics
- New vs returning users

### 6.3 Bulk Import

**New Component: `src/components/admin/BulkImport.tsx`**
- CSV/Excel file upload
- Column mapping interface
- Preview before import
- Progress indicator

**Required Fields Mapping**
```text
CSV Column      ->  Database Field
title           ->  title
description     ->  description
category        ->  category
year            ->  year
poster_url      ->  poster_url
stream_url      ->  stream_url
...
```

---

## Technical Implementation Details

### New Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useWatchHistory.tsx` | Watch history and continue watching |
| `src/hooks/useRatings.tsx` | Movie ratings |
| `src/hooks/useRecommendations.tsx` | Personalized suggestions |
| `src/hooks/useTrending.tsx` | Trending movies |
| `src/hooks/usePullToRefresh.tsx` | Mobile refresh gesture |
| `src/components/SkeletonCard.tsx` | Shimmer loading placeholder |
| `src/components/StarRating.tsx` | Interactive rating component |
| `src/components/RelatedMovies.tsx` | Similar content section |
| `src/components/ShareButton.tsx` | Social sharing |
| `src/components/PageTransition.tsx` | Route animations |
| `src/components/admin/BulkImport.tsx` | CSV import |
| `src/components/admin/AnalyticsCharts.tsx` | Dashboard charts |
| `src/pages/History.tsx` | Watch history page |
| `src/pages/admin/Analytics.tsx` | Analytics dashboard |

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Add Continue Watching, Trending, Recommendations rows |
| `src/components/MovieCard.tsx` | Rating badge, NEW badge, enhanced hover |
| `src/components/HeroBanner.tsx` | Parallax scroll effect |
| `src/components/MovieRow.tsx` | Infinite scroll, skeleton loading |
| `src/pages/MovieDetails.tsx` | Rating UI, Related Movies, Share button |
| `src/contexts/FilterContext.tsx` | Advanced filter state |
| `src/components/Navbar.tsx` | Sort options, advanced filters |
| `src/pages/admin/Dashboard.tsx` | Analytics widgets |
| `src/pages/admin/AdminLayout.tsx` | Analytics nav link |
| `src/App.tsx` | New routes, page transitions |
| `tailwind.config.ts` | Enhanced animations |
| `src/index.css` | Shimmer and transition styles |

### Database Migration

```sql
-- Watch History
CREATE TABLE watch_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  movie_id uuid REFERENCES movies NOT NULL,
  episode_id uuid REFERENCES episodes,
  progress_seconds integer DEFAULT 0,
  duration_seconds integer,
  completed boolean DEFAULT false,
  watched_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, movie_id, episode_id)
);

-- Movie Views for Trending
CREATE TABLE movie_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id uuid REFERENCES movies UNIQUE NOT NULL,
  view_count integer DEFAULT 0,
  week_views integer DEFAULT 0,
  last_updated timestamp with time zone DEFAULT now()
);

-- Ratings
CREATE TABLE ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  movie_id uuid REFERENCES movies NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, movie_id)
);

-- Add rating columns to movies
ALTER TABLE movies ADD COLUMN average_rating decimal(2,1) DEFAULT 0;
ALTER TABLE movies ADD COLUMN rating_count integer DEFAULT 0;

-- RLS Policies
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE movie_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Watch history: users can manage their own
CREATE POLICY "Users can view own history" ON watch_history 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own history" ON watch_history 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own history" ON watch_history 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own history" ON watch_history 
  FOR DELETE USING (auth.uid() = user_id);

-- Movie views: anyone can read, system updates
CREATE POLICY "Anyone can view counts" ON movie_views 
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage views" ON movie_views 
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Ratings: users manage own, anyone can read
CREATE POLICY "Anyone can view ratings" ON ratings 
  FOR SELECT USING (true);
CREATE POLICY "Users can rate" ON ratings 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rating" ON ratings 
  FOR UPDATE USING (auth.uid() = user_id);
```

---

## Implementation Order

1. **Database Migration** - Create tables and RLS policies
2. **Core Hooks** - Watch history, ratings, trending
3. **UI Components** - Skeleton, StarRating, ShareButton
4. **Page Updates** - Homepage rows, MovieDetails sections
5. **Animations** - Shimmer, transitions, parallax
6. **Admin Features** - Analytics, bulk import
7. **Polish** - Pull-to-refresh, infinite scroll, NEW badges

---

## Estimated Scope

- **Database**: 1 migration file with 3 new tables
- **New Components**: 8-10 new files
- **Modified Files**: 12-15 existing files
- **New Pages**: 2 (History, Analytics)

This comprehensive enhancement will transform Ceniverse into a fully-featured streaming platform with modern engagement features, smooth animations, and powerful admin tools.
