

# Implement 3-Tier Streaming Cascade in Watch.tsx

## What's Changing

Now that the Cloudflare Worker `/proxy/` route is deployed, we update the video player to use a 3-tier fallback:

```text
Tier 1: Direct (free, fastest)
Tier 2: CF Worker Proxy (free, safe fallback)
Tier 3: Supabase Proxy (emergency only, 2GB/month limit)
```

## Changes (Single File: `src/pages/Watch.tsx`)

### 1. Add `Cloud` icon import from lucide-react

### 2. Update types
- `StreamTier` becomes `'direct' | 'cfproxy' | 'supabase'`
- `ResolvedUrls` gets a new `cfProxyUrl: string` field

### 3. Update `resolveVideoUrls()`
After extracting the real video URL, construct the CF proxy URL:
```
const cfProxyUrl = `${STREAM_WORKER_ORIGIN}/proxy/?url=${encodeURIComponent(decodedUrl)}`;
```
Return all three URLs: `{ directUrl, cfProxyUrl, supabaseUrl }`

### 4. Add `cfproxy` to `TIER_CONFIG`
- Label: "CF Proxy"
- Color: blue badge (`bg-blue-500/20 text-blue-300 border-blue-500/30`)
- Icon: `Cloud`

### 5. Update `getTierUrl()` to handle `'cfproxy'`

### 6. Update `getCachedTier()` to accept `'cfproxy'` as valid

### 7. Update `runCascade()` -- 3-tier sequence
- `['direct', 'cfproxy', 'supabase']`
- Direct and cfproxy use probe + loadedmetadata test (6s timeout each)
- Supabase remains last-resort with no probe

### 8. HLS fix (critical)
For `.m3u8` streams, skip `HEAD` probe entirely (HLS manifests often block HEAD/return 403). Instead:
- Try direct playback with HLS.js immediately
- On fatal error, try cfproxy with HLS.js
- On fatal error, fall to supabase with HLS.js

### No other files change.

## Technical Details

| Aspect | Value |
|--------|-------|
| CF Worker free tier | 100k req/day, no bandwidth cap |
| Streaming method | `Response(upstream.body)` -- no buffering |
| Supabase usage after change | Emergency only (~0% of traffic) |
| Badge colors | Direct=green, CF Proxy=blue, Supabase=amber |
| Timeout per tier | 6 seconds (unchanged) |

