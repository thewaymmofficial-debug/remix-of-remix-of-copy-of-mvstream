

# Fix: Movie Streaming Without VPN in WebToApp APK

## Problem

The previous fix (removing `sandbox`) didn't fully solve the issue. The real root cause is deeper:

1. When you tap Play, the stream URL (e.g., `tw.thewayofthedragg.workers.dev/watch/463/file.mkv`) gets proxied through your Vercel proxy (`proxies-lake.vercel.app/stream/watch/463/file.mkv`)
2. The `/watch/` path on your Cloudflare worker returns an **HTML page** containing a built-in video player
3. That HTML page's video element tries to load the actual video file **directly from the Cloudflare worker domain** -- not through the proxy
4. Without VPN, Myanmar ISPs block the Cloudflare worker domain, so the video inside the iframe never loads

The Vercel proxy only proxies the initial HTML page -- it cannot rewrite the internal video URLs inside that HTML.

## Solution

Stop using the Cloudflare worker's HTML player entirely. Instead, extract the **direct file URL** from the stream URL and play it with the native HTML5 video player, routed through the Vercel proxy.

URL transformation:
- Stream URL: `/watch/463/AV_File.mkv?hash=X` (returns HTML page)
- Direct URL: `/463/AV_File.mkv?hash=X` (returns raw video file)

The only difference is removing the `/watch` prefix.

## Technical Changes

### File: `src/pages/Watch.tsx`

**Change 1: Add a function to convert streaming server URLs to direct file URLs**

Add a helper that strips `/watch` from the path, converting the HTML player URL into a direct video file URL that can be played natively.

**Change 2: Remove the iframe path entirely**

Instead of the current logic:
- `/watch/` URL -> iframe (loads Cloudflare HTML player)
- Direct URL -> native video player

Change to:
- `/watch/` URL -> strip `/watch`, proxy the direct file URL -> native video player
- Direct URL -> native video player

This means the `isStreamingServer` flag and the iframe code block are no longer needed. All videos play through the native `<video>` element.

**Change 3: Update the video setup effect**

The effect that sets up HLS / direct video playback will now also handle the converted streaming URLs (which are just direct .mkv files after transformation).

### File: `src/lib/utils.ts`

**No changes needed.** The existing `proxyStreamUrl()` function already rewrites the domain to go through the Vercel proxy. After stripping `/watch`, the URL flows through the same proxy path.

### What This Fixes

- Videos play through the Vercel proxy end-to-end (no direct connections to blocked domains)
- No iframe means no nested cross-origin issues
- Native video controls work properly in Android WebView
- The `android-webview-video-poster` CORS error disappears (it was caused by the iframe)
- Works without VPN because all traffic goes through `proxies-lake.vercel.app`

### No Changes Needed To

- Cloudflare worker (it already serves direct files on non-`/watch/` paths)
- Vercel proxy configuration
- WebToApp settings
- ServerDrawer component (it already proxies URLs before passing to Watch)

