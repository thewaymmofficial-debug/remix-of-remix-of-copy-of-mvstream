

# Fix: Revert Player Detection Logic

## What Went Wrong

The previous change made URLs containing `/watch/` AND `.mkv` get treated as direct video files. But the `/watch/` endpoint on the Cloudflare worker returns an **HTML page with an embedded video player** -- it's not a raw video stream. The `.mkv` in the URL is just a filename reference.

Additionally, browsers cannot natively play `.mkv` format, so treating it as a direct `<video>` source will always fail.

## Solution

Revert the detection priority: `/watch/` URLs should **always** be treated as iframe-based streaming servers, regardless of file extensions in the URL path.

## Changes

### File: `src/pages/Watch.tsx` (lines 22-25)

Replace:
```typescript
// Determine player type - check file extensions FIRST (even with query params)
const isHls = url.includes('.m3u8');
const isDirectVideo = url.includes('.mp4') || url.includes('.webm') || url.includes('.mkv');
const isStreamingServer = url.includes('/watch/') && !isDirectVideo && !isHls;
```

With:
```typescript
// Determine player type - /watch/ URLs are streaming server pages (HTML player)
const isStreamingServer = url.includes('/watch/');
const isHls = !isStreamingServer && url.includes('.m3u8');
const isDirectVideo = !isStreamingServer && (url.includes('.mp4') || url.includes('.webm') || url.includes('.mkv'));
```

This ensures:
- URLs with `/watch/` always use the iframe player (the server returns an HTML page)
- Direct `.mp4`/`.webm` files (without `/watch/`) use the HTML5 video player
- `.m3u8` streams (without `/watch/`) use the HLS player

## Why It Was Broken Before (The Original Issue)

The original screenshot showed a broken image icon inside the iframe. That was likely caused by the Vercel stream proxy (`api/stream.js`) not being deployed yet or not properly forwarding the HTML response. Since you confirmed the proxy files are now deployed and working, reverting to iframe mode should work correctly now.

