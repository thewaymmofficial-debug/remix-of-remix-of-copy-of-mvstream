

# Support .mp4 Links and Bulk .txt Upload for Channels

## Overview
Three changes: (1) make the player handle `.mp4` links natively alongside HLS streams, (2) update the edge function to support `.mp4` URLs in parsed sources, and (3) add a bulk import feature via `.txt` file upload in the Direct Channels admin page.

## Changes

### 1. Update LiveTvPlayer to Support .mp4 Links
**File: `src/components/LiveTvPlayer.tsx`**

Currently the player always tries to use hls.js. For `.mp4` (and other non-HLS URLs), it should set `video.src` directly instead.

- Detect if the URL ends with `.mp4` (or doesn't contain `.m3u8`/`.m3u`)
- If it's a plain video URL, skip hls.js entirely and set `video.src = url` with native HTML5 playback
- If it's HLS (`.m3u8`/`.m3u`), use hls.js as before
- Handle error and loading states for both paths

### 2. Update Edge Function to Pass Through .mp4 URLs
**File: `supabase/functions/live-tv-proxy/index.ts`**

The M3U parser already extracts any stream URL from playlists. No change needed for parsing -- `.mp4` URLs inside M3U/JSON sources are already captured. The proxy doesn't filter by extension, so this already works for source playlists containing `.mp4` links.

No changes needed here.

### 3. Add Bulk .txt File Upload to Direct Channels Admin
**File: `src/pages/admin/DirectChannelsAdmin.tsx`**

Add a "Bulk Import" section that accepts a `.txt` file with the following simple format (one channel per line):

```
ChannelName | https://example.com/stream.m3u8
ChannelName | https://example.com/video.mp4
```

Or an extended format with optional logo:

```
ChannelName | https://example.com/stream.m3u8 | https://logo.png
```

Implementation:
- Add a file input (`<input type="file" accept=".txt">`) and a category input for the batch
- Parse each line by splitting on `|`
- Preview parsed channels in a list before confirming import
- Insert all channels into `tv_channels` table at once using the existing `addChannel` mutation
- Show success/error count after import

### 4. Update Admin UI Labels
**File: `src/pages/admin/DirectChannelsAdmin.tsx`**

- Change subtitle from "Add .m3u8 stream links directly" to "Add .m3u8 or .mp4 stream links directly"
- Update placeholder text for Stream URL input to show both formats

### 5. Fix Mutation Cache Invalidation
**File: `src/hooks/useDirectChannels.tsx`**

- After add/update/delete, also invalidate `['direct-channels-active']` so TV page updates immediately

### 6. Exempt Direct Channels from Broken Filter
**File: `src/pages/TvChannels.tsx`**

- In the rendering filter (line 471), skip broken URL check for channels with `source === 'direct'`
- This prevents admin-curated links from being auto-hidden

## Technical Details

**Player detection logic (LiveTvPlayer):**
```typescript
const isHLS = /\.(m3u8?)([\?#]|$)/i.test(url);

if (isHLS) {
  // Use hls.js as before
} else {
  // Native HTML5 video: video.src = url
  video.src = url;
  video.addEventListener('canplay', ...);
  video.addEventListener('error', ...);
}
```

**Bulk import .txt format:**
```
Channel Name | stream_url
Channel Name | stream_url | logo_url
```

Lines starting with `#` are treated as comments and skipped. Empty lines are skipped.

