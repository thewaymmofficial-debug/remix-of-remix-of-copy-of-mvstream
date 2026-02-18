

# Fix: Large File (2.5GB) Streaming Not Playing

## Root Cause

When a user taps Play, the current code strips `/watch/` from the stream URL and sets it directly as the native video source. This fails for large files because:

1. The `/watch/` endpoint on your backend resolves the **real video URL** (with correct filename and MP4 format). Without `/watch/`, the raw "AV_File" URL may not serve the file correctly for all sizes.
2. The Vercel proxy may struggle with initial buffering of very large files when the browser doesn't know the content type.
3. The browser sees a `.mkv` extension and may not attempt progressive MP4 playback optimizations.

**How the backend works** (verified by fetching the actual `/watch/` page):
- `/watch/485/AV_File.mkv?hash=X` returns an HTML page containing the **real** video URL
- The real URL has the correct filename and `.mp4` extension
- Example: `tw.thewayofthedragg.workers.dev/485/The.Housemaid.2025.1080p.mp4?hash=X`

## Solution

Instead of stripping `/watch/` and hoping the raw URL works, **fetch the `/watch/` HTML page first, extract the real video source URL, then play that through the proxy with the native video player**.

This gives us:
- The correct file URL that the backend resolves (proper filename + MP4 format)
- End-to-end proxying through Vercel (bypasses ISP blocking)
- Browser-native Range request support for progressive loading (essential for 2.5GB files)
- Proper content-type detection (MP4, not MKV)

## Technical Changes

### File: `src/pages/Watch.tsx`

**Change 1: Add a function to resolve the real video URL**

Add an async function that:
1. Fetches the `/watch/` HTML page (small request, just a few KB) through the proxy
2. Parses the HTML response to extract the `<source src="...">` URL
3. Rewrites that URL to go through the Vercel proxy
4. Returns the proxied real video URL

```text
Flow:
  User taps Play
    |
    v
  Stream URL: proxies-lake.vercel.app/stream/watch/485/file.mkv?hash=X
    |
    v
  Fetch HTML page (small ~1KB request)
    |
    v
  Extract real source: tw.thewayofthedragg.workers.dev/485/RealMovie.mp4?hash=X
    |
    v
  Proxy it: proxies-lake.vercel.app/stream/485/RealMovie.mp4?hash=X
    |
    v
  Set as <video> src (native player with Range request support)
    |
    v
  Browser progressively loads & plays (works for 2.5GB+)
```

**Change 2: Update the video setup effect**

Modify the useEffect to:
1. Check if the raw URL contains `/watch/` (streaming server URL)
2. If yes: fetch the HTML page, extract the real video URL, proxy it, then set as video source
3. If no: use the URL directly as before (for non-streaming-server URLs like direct MP4 links)
4. Add a timeout (15 seconds) so if the HTML fetch fails, show an error instead of infinite loading

**Change 3: Add error handling for the HTML fetch**

If the fetch fails (network error, proxy down), show a user-friendly error with a retry button. Also add a `stale` event listener on the video element to detect when playback stalls.

### File: `src/lib/utils.ts`

No changes needed. The existing `proxyStreamUrl()` function will be used to proxy the extracted real video URL.

### What This Fixes

- 2.5GB+ movies play correctly because the browser gets the real MP4 URL with proper Range request support
- Works without VPN because all traffic (both the HTML fetch and video streaming) goes through the Vercel proxy
- Small music videos continue to work as before
- Proper content-type handling (browser sees `.mp4` not `.mkv`)

### What Stays The Same

- No changes to Cloudflare worker
- No changes to Vercel proxy
- No changes to ServerDrawer (it already proxies URLs before passing to Watch)
- Download functionality unchanged

