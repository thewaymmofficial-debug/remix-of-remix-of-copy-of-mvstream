

# Fix Movie Streaming - Wrong Player Type Detection

## Problem
The streaming URL (e.g., `/stream/watch/468/AV_File_1770874672.mkv?hash=AgAD1h`) contains `/watch/` in the path, so `Watch.tsx` incorrectly treats it as an iframe-based streaming server. It's actually a direct video file that needs the HTML5 video player.

## Solution
Reorder the detection logic in `Watch.tsx` to check for video file extensions **before** checking for `/watch/` in the path.

## Change

### File: `src/pages/Watch.tsx` (lines 22-25)

**Before:**
```typescript
const isStreamingServer = url.includes('/watch/');
const isHls = url.endsWith('.m3u8') || url.includes('.m3u8');
const isDirectVideo = url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mkv');
```

**After:**
```typescript
const isHls = url.includes('.m3u8');
const isDirectVideo = url.includes('.mp4') || url.includes('.webm') || url.includes('.mkv');
const isStreamingServer = url.includes('/watch/') && !isDirectVideo && !isHls;
```

This is a 4-line change in a single file. It ensures `.mkv` files use the native HTML5 video player even when the URL contains `/watch/`.

