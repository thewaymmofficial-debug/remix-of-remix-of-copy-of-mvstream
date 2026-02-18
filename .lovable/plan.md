

# Fix: Large File (2.5GB+) Streaming via Supabase Edge Function Proxy

## Problem

The Vercel proxy (`proxies-lake.vercel.app`) cannot stream large video files. It times out because Vercel serverless functions have response size and execution time limits. Small files (music videos, short clips) work because they finish before the timeout. A 2.5GB movie never finishes, so it shows "Loading Video..." forever.

The original server (your Cloudflare worker) plays the same file perfectly because it supports streaming natively with no size limits.

## Solution

Your project already has a `download-proxy` Supabase Edge Function that supports:
- Range request forwarding (essential for progressive video playback)
- Response body streaming (no size limit)
- Proper CORS headers

The fix is to route the actual video data through this edge function instead of the Vercel proxy. The edge function runs on Deno Deploy infrastructure which can stream unlimited response sizes.

```text
Current flow (fails for large files):
  Fetch /watch/ HTML via Vercel proxy (OK, small)
    -> Extract real video URL
    -> Proxy video through Vercel (FAILS - timeout/size limit)

New flow:
  Fetch /watch/ HTML via Vercel proxy (OK, small)  
    -> Extract real video URL
    -> Proxy video through Supabase download-proxy edge function (streams with Range support)
    -> Browser plays video progressively
```

## Technical Changes

### 1. File: `supabase/functions/download-proxy/index.ts`

Currently the edge function always sets `Content-Disposition: attachment`, which forces the browser to download instead of play inline. Add a `stream` query parameter that skips this header so the browser plays the video in the native `<video>` element.

- When `stream=1` is in the query: skip `Content-Disposition` header entirely, allowing inline playback
- When `stream` is absent: keep current behavior (download mode)

### 2. File: `src/pages/Watch.tsx`

Modify the `resolveRealVideoUrl` function so that after extracting the real video URL from the HTML page, instead of routing it through the Vercel proxy, it builds a URL pointing to the Supabase `download-proxy` edge function with `stream=1`.

The resolved URL will look like:
`https://icnfjixjohbxjxqbnnac.supabase.co/functions/v1/download-proxy?url=<encoded-real-video-url>&stream=1`

This keeps the initial HTML page fetch going through the Vercel proxy (which works fine for small HTML pages), but routes the actual 2.5GB video data through the Supabase edge function which can handle it.

### What This Fixes

- 2.5GB+ movies play correctly because the edge function streams with Range request support
- Small files continue to work (they also go through the edge function now)
- Works without VPN because the edge function fetches from the Cloudflare worker server-side (no ISP blocking)
- Progressive playback with seeking support (Range requests forwarded properly)

### No Changes Needed To

- Cloudflare worker
- Vercel proxy (still used for initial HTML page fetch)
- ServerDrawer component
- WebToApp settings

