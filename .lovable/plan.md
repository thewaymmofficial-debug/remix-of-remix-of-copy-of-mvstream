

## Live TV Streaming Module

### What This Does

Transforms the existing TV Channels page from a static Supabase-based list into a dynamic live streaming hub that fetches channels from GitHub JSON sources and plays them inline using HLS.js -- no external apps needed.

### Architecture

```text
User Browser
    |
    v
Edge Function: "live-tv-proxy"
    |
    v
GitHub Raw JSON (multiple source URLs)
    |
    v
Returns merged channel list with 5-min cache
```

A Supabase Edge Function acts as the backend proxy (since Lovable cannot run Node.js). This avoids CORS issues, GitHub rate limits, and allows caching.

### Changes Overview

1. **New Edge Function**: `supabase/functions/live-tv-proxy/index.ts`
2. **New Component**: `src/components/LiveTvPlayer.tsx` (HLS.js video player)
3. **Updated Page**: `src/pages/TvChannels.tsx` (fetch from edge function, inline player)
4. **New Dependency**: `hls.js` for .m3u8 stream playback
5. **Config Update**: `supabase/config.toml` (add function entry)

### Detailed Plan

**Step 1 -- Edge Function: `live-tv-proxy`**

- Accepts GET requests with an optional `sources` query param (comma-separated GitHub raw URLs)
- Has a default list of source URLs (the Arabic one provided, plus any others you add later)
- Fetches each source URL, parses JSON, merges all channels into a single response grouped by category
- Returns `{ date, channels: { "Category": [...] } }` format
- Adds `Cache-Control: public, max-age=300` (5-min cache) so repeated requests don't hit GitHub
- Full CORS headers for web app access
- No JWT required (`verify_jwt = false`)

**Step 2 -- HLS Video Player Component**

- New `LiveTvPlayer` component using `hls.js`
- Accepts a stream URL prop
- Auto-detects HLS support (native Safari vs hls.js polyfill)
- Fullscreen-capable, with controls
- Error detection with user-friendly message if stream is offline
- Close button to dismiss player

**Step 3 -- Rewrite TvChannels Page**

- Replace Supabase query with edge function fetch via React Query
- Keep existing search and category grouping logic (already works well)
- Add inline video player at the top when a channel is selected (instead of opening external URL)
- Show channel logo from GitHub JSON `logo` field
- Display channel count per category
- Loading skeletons (already exist)
- Netflix-style grid layout (already exists, kept as-is)

**Step 4 -- Config and Dependencies**

- Add `[functions.live-tv-proxy]` with `verify_jwt = false` to `supabase/config.toml`
- Install `hls.js` package

### Data Mapping

GitHub JSON channel fields map to the UI as follows:

```text
GitHub JSON        -->  UI Usage
-----------             --------
name               -->  Channel name label
logo               -->  Channel thumbnail image
group              -->  Category section header
url                -->  HLS stream URL (passed to player)
source             -->  Not displayed (internal reference)
```

### What Users Will See

1. Open TV Channels page
2. Channels load dynamically from GitHub (with 5-min cache)
3. Channels grouped by category (General, News, Sports, etc.)
4. Search works across names and categories
5. Tap a channel -- inline video player appears at top and starts streaming
6. Tap X or another channel to switch
7. If a stream fails, a friendly error message appears

### Adding More Sources Later

To add more GitHub JSON sources, simply update the default source URLs array in the edge function. The system merges all sources automatically. No frontend changes needed.

### Technical Notes

- HLS.js handles .m3u8 streams on all browsers (Safari uses native HLS)
- Some streams may fail due to their own CORS restrictions -- this is expected and the player will show an error state
- The edge function caches responses for 5 minutes, so GitHub updates reflect within that window
- Existing Supabase `tv_channels` table is NOT removed -- it can coexist for manually-added channels if desired

