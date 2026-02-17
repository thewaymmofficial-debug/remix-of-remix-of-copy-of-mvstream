

# Fix Movie Streaming - Wrong Player Type Detection

## Problem
The streaming URL (`/stream/watch/468/AV_File_1770874672.mkv?hash=AgAD1h`) contains `/watch/` in the path, so `Watch.tsx` incorrectly treats it as an iframe-based streaming server. But it's actually a direct video file being proxied through Vercel -- it needs the HTML5 `<video>` player, not an iframe.

The broken image icon in the screenshot confirms the iframe is receiving raw video bytes instead of an HTML page.

## Solution
Update the player type detection in `Watch.tsx` to prioritize video file extension checks over the `/watch/` path check. If a URL contains `.mkv`, `.mp4`, or `.webm` anywhere (not just at the end, since query params like `?hash=` come after), treat it as a direct video.

## Changes

### File: `src/pages/Watch.tsx`

**Lines 22-25** - Update detection logic:

```typescript
// Determine player type - check file extensions FIRST (even with query params)
const isHls = url.includes('.m3u8');
const isDirectVideo = url.includes('.mp4') || url.includes('.webm') || url.includes('.mkv');
const isStreamingServer = url.includes('/watch/') && !isDirectVideo && !isHls;
```

This ensures:
- `.mkv` files routed through `/stream/watch/...` use the native HTML5 video player
- `.m3u8` streams use the HLS player
- Only URLs with `/watch/` that are NOT direct video files fall back to the iframe player

No other files need changes.

