
## Live Data Sync: Real-time Updates Without Refresh

### Problem
Currently, when an admin makes changes (adds movies, updates settings, changes categories, etc.), users need to manually refresh or wait up to 5 minutes (the staleTime) to see updates. In an APK version, this is especially problematic since users can't easily clear cache.

### Solution
Create a centralized **Realtime Listener** component that subscribes to Supabase Postgres Changes on key tables and automatically invalidates the relevant React Query caches when data changes. This means users will see admin changes within seconds -- no refresh needed.

### How It Works

```text
Admin makes a change (e.g., adds a movie)
        |
        v
Supabase Database updated
        |
        v
Supabase Realtime broadcasts change event
        |
        v
User's app receives event via WebSocket
        |
        v
React Query cache invalidated for that table
        |
        v
UI auto-refetches and re-renders with new data
```

### Changes

**1. New file: `src/hooks/useRealtimeSync.tsx`**
A single hook that subscribes to Postgres changes on these key tables:
- `movies` -- invalidates `['movies']`, `['movie']`, `['trending-movies']`, `['most-viewed-movies']`, `['related-movies']`, `['featured-all']`
- `site_settings` -- invalidates `['site-settings']`
- `categories` -- invalidates `['categories']`
- `tv_channels` -- invalidates `['channels']`, `['broken-channels']`
- `direct_channels` -- invalidates `['direct-channels']`, `['direct-channels-active']`
- `football_videos` -- invalidates `['football-videos']`, `['football-categories']`
- `info_slides` -- invalidates `['info-slides']`
- `pricing_plans` -- invalidates `['pricing-plans']`
- `payment_methods` -- invalidates `['payment-methods']`

Each table subscription uses a single Supabase channel that listens for INSERT, UPDATE, and DELETE events. On any change, the corresponding React Query keys are invalidated, triggering a background refetch.

**2. New file: `src/components/RealtimeSyncProvider.tsx`**
A component that wraps the hook and is placed in `App.tsx`. It calls `useRealtimeSync()` to activate all subscriptions when the app loads.

**3. Update: `src/App.tsx`**
Add `<RealtimeSyncProvider />` inside the QueryClientProvider so it has access to the query client.

**4. App Version Check (for code deployments)**
Add a simple version check using `site_settings`:
- Store an `app_version` key in `site_settings` (admin can bump it when deploying)
- The Realtime subscription on `site_settings` will detect the version change
- If the version doesn't match what the app loaded with, show a toast/banner: "New update available" with a "Refresh" button
- This handles code changes (new JS bundles) that can't be hot-swapped

### What Users Will Experience
- Movie added by admin? Appears on home page within seconds
- Settings changed? Announcement banner, prices, contacts update live
- New TV channel added? Shows up immediately
- App code updated? Users get a gentle "Update available" prompt

### Technical Notes
- Uses a single Supabase Realtime connection with multiple channel subscriptions (efficient)
- Only invalidates cache (doesn't force re-render if user isn't viewing that data)
- No impact on performance -- WebSocket is lightweight and already used for notifications
- The `staleTime` of 5 minutes still applies for initial loads, but Realtime events override it when changes happen
