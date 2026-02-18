

# 4-Tier Video Streaming Fallback Chain

## Overview

Integrate the new Cloudflare Worker relay (`tiny-river-1bfb.thewayofthedragg.workers.dev`) into a 4-tier cascading fallback strategy in the video player.

## Fallback Order

```text
Tier 1: Direct CF Worker (tw.thewayofthedragg.workers.dev) -- free, unlimited
   |  8s timeout
   v
Tier 2: Relay CF Worker (tiny-river-1bfb.thewayofthedragg.workers.dev) -- free, 100k req/day
   |  8s timeout  (bypasses domain-specific ISP blocks)
   v
Tier 3: Vercel Proxy (proxies-lake.vercel.app/stream) -- 100GB/mo free
   |  8s timeout
   v
Tier 4: Supabase Proxy (download-proxy edge function) -- 2-250GB/mo (last resort)
```

## Changes to `src/pages/Watch.tsx`

**1. Add constants**

- Add `CF_RELAY_ORIGIN = 'https://tiny-river-1bfb.thewayofthedragg.workers.dev'`

**2. Update `resolveVideoUrls`**

Return 4 URLs instead of 2:
- `directUrl` -- original CF worker path
- `relayUrl` -- same path on the relay worker domain
- `vercelUrl` -- via `proxies-lake.vercel.app/stream?url=<encoded>`
- `supabaseUrl` -- via Supabase edge function (current `proxyUrl`)

**3. Update `setupVideo` fallback chain**

For non-HLS `/watch/` URLs, cascade through all 4 tiers using `tryDirectStream` with 8s timeouts. Set `streamSource` to the tier that succeeded.

For HLS (`.m3u8`), skip directly to Supabase proxy (needs CORS headers).

**4. Expand the source badge**

Update `streamSource` type from `'direct' | 'proxy'` to `'direct' | 'relay' | 'vercel' | 'supabase'` with 4 distinct colors/icons:
- Direct: green, Wifi icon
- Relay: blue, Globe icon
- Vercel: purple, Server icon
- Supabase: amber, Shield icon

## No other files change

All proxy infrastructure already exists. Only `Watch.tsx` is modified.

## Worst-case latency

If all three initial tiers fail (full ISP block), the user waits ~24 seconds before Supabase kicks in. This only happens on first play -- subsequent videos could cache the working tier in session storage (future enhancement).

