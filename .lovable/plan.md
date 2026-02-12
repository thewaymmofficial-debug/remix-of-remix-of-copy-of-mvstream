

## Plan: Add 11 New Channel Sources + Fix Admin Save Crash

### Part 1: Add your 11 URLs directly to the database

I'll update the `site_settings` table directly via SQL to append these 11 new source URLs to the existing 24, bringing the total to 35. No admin panel interaction needed.

URLs to add:
- Portugal, Russia, Spain, SpecialExcess, Thailand, Turkey, UK, USA, Venezuela, Vietnam, Worldwide

### Part 2: Fix the admin panel crash

**Root cause**: When you click "Save All Changes" in the admin Channels page, the mutation calls `queryClient.invalidateQueries({ queryKey: ['site-settings'] })`. This triggers a refetch of `useSiteSettings` across the entire app. If you're on a page that also renders the TvChannels component (or if the `live-tv-source-list` query gets stale), the `sourceUrls` array changes, which causes `useQueries` to create new query entries, triggering the batch-loading effect loop.

**Fix in `src/pages/admin/ChannelsAdmin.tsx`**:
- After saving, do NOT invalidate the `site-settings` query immediately -- instead just show the success toast
- Or better: the `useUpdateSiteSettings` hook's `onSuccess` already invalidates `site-settings`. The issue is that this also invalidates the `live-tv-source-list` query indirectly. We need to make the `ChannelsAdmin` save NOT trigger a full TvChannels re-fetch.

**Fix in `src/pages/TvChannels.tsx`**:
- The real bug: when `sourceUrls` changes (e.g., from 24 to 35 items), `loadedBatch` is still at its old value (e.g., 7 for 35 items). But `useQueries` creates 35 query objects, and the `enabled` flag limits which ones run. The `loadedCount` jumps because the new queries start as "not loading" (they're disabled), which makes `loadedCount >= enabledCount` true immediately, causing rapid batch increments.
- **Fix**: Only count queries that are enabled AND finished loading, not disabled queries (which are "not loading" by default).

**Updated logic**:
```
const enabledCount = Math.min(loadedBatch * BATCH_SIZE, sourceUrls.length);
const loadedCount = sourceQueries.slice(0, enabledCount).filter(q => !q.isLoading).length;
```

This ensures disabled queries don't falsely inflate the `loadedCount`.

### Part 3: How to add channels yourself next time

After the fix, the admin panel will work normally:
1. Go to Admin > Live TV Channels
2. Paste the GitHub JSON URL in the input field
3. Click "Add" -- this only adds it to the local list (not saved yet)
4. Repeat for all URLs you want to add
5. Click "Save All Changes" at the bottom
6. Done! The TV Channels page will pick up the new sources automatically

### Technical Details

**Files to modify:**
1. **Database** -- SQL UPDATE to append 11 URLs to `site_settings.value` where `key = 'live_tv_sources'`
2. **`src/pages/TvChannels.tsx`** -- Fix `loadedCount` calculation to only count enabled queries, and reset `loadedBatch` when `sourceUrls` changes
3. No other files need changes

