

## Fix Video Seeking: Switch to Supabase Download Proxy

### Root Cause
The Vercel Edge Function proxy (`proxies-lake.vercel.app/api/stream`) is breaking HTTP Range request handling, causing the video to reset to 0:00 when seeking or skipping. Despite multiple fix attempts, Vercel's edge runtime appears to strip or mangle the `Content-Length`, `Content-Range`, and `Accept-Ranges` headers needed for partial content (206) responses.

### Solution
Your Supabase `download-proxy` edge function **already handles Range headers correctly** -- it forwards `Range` from the request, preserves the upstream `206` status code, and passes through `Content-Length`, `Content-Range`, and `Accept-Ranges` headers. We just need to use it for video streaming instead of the Vercel proxy.

### Changes

#### 1. Update `Watch.tsx` -- Switch video streaming to Supabase download-proxy

- Keep the Vercel proxy **only** for the initial HTML page fetch (resolving `/watch/` URLs to get the real video URL)
- Route the actual video stream through the Supabase `download-proxy` with `stream=1` parameter (which skips the `Content-Disposition: attachment` header so the browser plays inline)
- The proxy URL becomes: `https://icnfjixjohbxjxqbnnac.supabase.co/functions/v1/download-proxy?stream=1&url=ENCODED_URL`

#### 2. Update `download-proxy` edge function -- Always advertise Range support

- Add `Accept-Ranges: bytes` to the response even if upstream doesn't include it (the CF worker supports it, as confirmed by user testing)
- Add `HEAD` method support to CORS and request handling so the browser can probe file size

#### 3. Double-tap skip overlay -- Already working

The `VideoDoubleTapOverlay` component is already implemented and uses `video.currentTime` programmatically. Once the proxy correctly supports Range requests, both double-tap skip AND timeline dragging will work.

### No Vercel changes needed
This approach completely bypasses the broken Vercel proxy for video streaming, so you don't need to change or delete any Vercel files. The Vercel proxy is still used only for the one-time HTML page fetch to resolve watch URLs.

### Technical Details

**File: `src/pages/Watch.tsx`**
- Add a new `streamProxyUrl()` function that routes through Supabase download-proxy
- Keep `proxyUrl()` for HTML fetching only
- Update `setupVideo()` to use `streamProxyUrl()` for the video source
- Update HLS `xhrSetup` to also use the Supabase proxy for segment requests

**File: `supabase/functions/download-proxy/index.ts`**
- Add `HEAD` to allowed methods in CORS headers
- Handle `HEAD` requests by forwarding them upstream
- Always set `Accept-Ranges: bytes` in responses
- Add `Range` to `Access-Control-Allow-Headers` (already present)

