

# Fix Relay and Vercel Tiers + Add Session Caching

## Root Causes Identified

### 1. Relay CF Worker - Broken SSL
The worker at `second.asdfjkllkfsdfdklfnvbfjcbfjebdw-781.workers.dev` has a broken SSL/TLS certificate, causing all connections to time out. This needs to be fixed in your Cloudflare dashboard -- you need to redeploy the worker or check its SSL settings.

**Action needed outside Lovable**: Go to your Cloudflare dashboard for the `second.asdfjkllkfsdfdklfnvbfjcbfjebdw-781` worker and verify:
- The worker is properly deployed and responding
- SSL/TLS is correctly configured
- The worker code properly proxies requests (same code as `tw.thewayofthedragg.workers.dev`)

### 2. Vercel Proxy - Format Error
The Vercel proxy endpoint (`/stream?url=...`) returns a response the browser can't play (likely an error page or wrong content-type). The URL has double-encoded percent characters (`%255B` instead of `%5B`) which the proxy may not handle. We need to decode the URL before passing it to `encodeURIComponent`, or use the Vercel proxy differently -- passing the path directly instead of as a query parameter.

### 3. Direct CF Worker - ISP Blocked
This is expected behavior in Myanmar. No code fix needed.

## Code Changes to `src/pages/Watch.tsx`

### Fix 1: Fix Vercel URL double-encoding

The `realUrl` from the CF worker already contains percent-encoded characters like `%5B`. When we pass this through `encodeURIComponent`, the `%` gets re-encoded to `%25`, creating `%255B`. The Vercel proxy likely doesn't handle this.

**Fix**: Decode the URL first before re-encoding:
```
const vercelUrl = `${PROXY_STREAM_ORIGIN}?url=${encodeURIComponent(decodeURIComponent(realUrl))}`;
const supabaseUrl = `${SUPABASE_PROXY}?url=${encodeURIComponent(decodeURIComponent(realUrl))}&stream=1`;
```

Alternatively, construct the Vercel URL as a path-based proxy (like it's done for the initial watch page fetch) instead of a query parameter, since the Vercel proxy at `proxies-lake.vercel.app/stream` also supports path-based routing:
```
const vercelUrl = realUrl.replace(urlObj.origin, PROXY_STREAM_ORIGIN);
```

### Fix 2: Add a `fetch`-based probe for relay and vercel tiers

Instead of relying only on `<video>` element to test tiers (which gives vague errors), add a quick HTTP HEAD/GET probe before setting the video source. This will give better error diagnostics and faster failure detection:
- Send a `fetch()` HEAD request first with a 4-second timeout
- If it returns a non-2xx status or wrong content-type, skip immediately
- Only set `video.src` if the fetch probe succeeds

### Fix 3: Session caching (already mostly implemented)

The caching logic is already in place. Just ensure `clearCachedTier()` is called when the retry button is pressed (already done).

## Summary of Changes

| Change | File | Purpose |
|--------|------|---------|
| Fix double-encoding in Vercel/Supabase URLs | Watch.tsx line 47-48 | Fix `MEDIA_ERR_SRC_NOT_SUPPORTED` |
| Add fetch-based tier probe | Watch.tsx `tryDirectStream` | Faster failure detection, better logs |
| Log HTTP status codes | Watch.tsx | Diagnose relay SSL issues |

## What You Need to Do (Outside Lovable)

1. **Fix the relay worker SSL**: Go to Cloudflare dashboard and redeploy the `second.asdfjkllkfsdfdklfnvbfjcbfjebdw-781` worker. Make sure it's actually running and accessible via HTTPS.
2. **Test the relay worker directly**: Open `https://second.asdfjkllkfsdfdklfnvbfjcbfjebdw-781.workers.dev/` in your browser to see if it loads. If it shows an SSL error, the worker needs to be redeployed.

