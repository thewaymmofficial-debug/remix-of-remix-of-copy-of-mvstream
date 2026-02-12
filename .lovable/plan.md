

## Fix: App Crashing with 26+ Channel Sources

### Root Cause

The `live-tv-proxy` edge function fetches ALL sources and returns ALL channels in a single massive JSON response. With 26 sources, the response is already **541,000+ lines of JSON (10-20+ MB)**. Adding more sources makes this even worse. Mobile browsers and WebToApp APKs run out of memory parsing and rendering this data, causing crashes and blank screens.

This is NOT a limit of 26 channels — it's a memory/payload size problem that gets worse with each source added.

### Plan

**Fix 1: Fetch sources individually on the client (split the load)**
- Instead of one giant edge function call returning everything, fetch each source category separately
- The edge function will accept an optional `sourceUrl` parameter to fetch just one source
- The client will make parallel requests per source, so each response is small (~500KB instead of 20MB)
- Failed sources won't break the entire page — only that category shows an error

**Fix 2: Lazy-load channel categories (render only what's visible)**
- Currently ALL channels are rendered in the DOM even when categories are collapsed
- Only render channel cards when a category is expanded (already using Collapsible, but `allChannels` memo processes everything upfront)
- Move the heavy `allChannels` flattening to only run when searching, not on every render

**Fix 3: Add pagination/virtualization for large channel lists**
- When a category has 100+ channels, only show the first 30 with a "Show more" button
- This prevents the DOM from being overwhelmed when expanding a large category

---

### Technical Details

**Edge function changes (`supabase/functions/live-tv-proxy/index.ts`):**
- Add a `sourceUrl` query parameter to fetch a single source
- When provided, fetch only that one source and return its channels
- When not provided (backward compatible), return all sources as before but with a size warning
- This allows the client to split the load across multiple smaller requests

**TvChannels.tsx changes:**
- Replace the single `useQuery` for all channels with individual queries per source
- Use `useQueries` from TanStack Query to fetch each enabled source in parallel
- Each source loads independently — fast sources appear immediately, slow ones show loading
- The `allChannels` memo for search only computes when the user actually types a search query
- Add a "Show more" limit (30 channels per group) with expand button

**ChannelsAdmin.tsx — no changes needed** (already fixed in previous plan)

**Estimated impact:**
- Each individual source response: ~500KB-1MB (manageable)
- DOM nodes reduced by 80%+ (only expanded categories render cards)
- Mobile APK will no longer crash since memory usage stays bounded
- Progressive loading gives faster perceived performance

