

# Fix 4-Tier Fallback Chain + Add SessionStorage Caching

## Root Cause

The relay CF Worker (`tiny-river-1bfb.thewayofthedragg.workers.dev`) is on the **same parent domain** as the original worker (`tw.thewayofthedragg.workers.dev`). Myanmar ISPs likely block `*.thewayofthedragg.workers.dev` using a wildcard rule, so the relay gets blocked too. This means the fallback skips Direct, skips Relay, and likely also fails on Vercel before landing on Supabase every time.

**Important**: For the relay to actually bypass ISP blocks, it needs to be deployed on a completely different domain (not `*.thewayofthedragg.workers.dev`). For example, `stream-relay.some-other-domain.workers.dev`. This is an action you would need to take outside of Lovable by creating a new Cloudflare Workers project under a different account or custom domain.

## Changes to `src/pages/Watch.tsx`

### 1. Add detailed console logging to `tryDirectStream`

Log the tier name, URL, and the specific reason for failure (error event details, timeout) so you can see in the browser console exactly which tiers fail and why.

### 2. Add sessionStorage caching

- After a tier succeeds, save it to `sessionStorage` as `preferredStreamTier`
- On subsequent video loads, try the cached tier first before falling through the full chain
- If the cached tier fails, clear the cache and do a full cascade

### 3. Improve the fallback cascade logic

- Pass the tier name into `tryDirectStream` for logging
- Log the actual video error code (`video.error?.code`, `video.error?.message`) when a tier fails
- Reduce timeout to 6 seconds per tier (18s worst-case instead of 24s for 3 non-supabase tiers)

### 4. Keep relay URL as-is but add a note

The relay URL stays in the code since it may work for some ISPs that only block the exact subdomain (not wildcard). A comment will note that for full bypass, a different root domain is needed.

## Technical Details

### SessionStorage caching flow

```text
Video Play requested
  |
  v
Check sessionStorage for "preferredStreamTier"
  |
  +-- Found "relay"? -> Try relay first
  |     +-- Success -> Play, keep cache
  |     +-- Fail -> Clear cache, run full cascade
  |
  +-- Not found? -> Run full 4-tier cascade
        +-- Tier succeeds -> Cache it, play
```

### Enhanced logging output (example)

```text
[Watch] Resolving URLs from: https://tw.../watch/485/...
[Watch] Resolved direct: https://tw.../485/Movie.mp4?hash=X
[Watch] Resolved relay: https://tiny-river.../485/Movie.mp4?hash=X
[Watch] Resolved vercel: https://proxies-lake.vercel.app/stream?url=...
[Watch] Resolved supabase: https://...supabase.co/functions/v1/download-proxy?url=...
[Watch] Trying direct: https://tw.../485/Movie.mp4?hash=X
[Watch] direct FAILED: error code=2 (MEDIA_ERR_NETWORK) after 3200ms
[Watch] Trying relay: https://tiny-river.../485/Movie.mp4?hash=X
[Watch] relay FAILED: timed out after 6000ms
[Watch] Trying vercel: https://proxies-lake.vercel.app/stream?url=...
[Watch] vercel FAILED: error code=4 (MEDIA_ERR_SRC_NOT_SUPPORTED) after 1500ms
[Watch] Using supabase proxy (last resort)
```

This logging will be visible in the browser DevTools console and will help identify exactly why each tier fails on the APK/WebView.

## No other files change

Only `src/pages/Watch.tsx` is modified.

