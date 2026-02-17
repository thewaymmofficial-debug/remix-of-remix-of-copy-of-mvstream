

# Fix Remaining Broken Features After Proxy Migration

## Issue 1: TV Channels Not Loading (Critical)
`src/pages/TvChannels.tsx` line 15 still has the OLD Cloudflare Worker URL hardcoded:
```
const SUPABASE_FUNCTIONS_URL = 'https://gentle-star-e538.thewayofthedragg.workers.dev/functions/v1';
```
This was missed during the proxy migration. It needs to be updated to:
```
const SUPABASE_FUNCTIONS_URL = 'https://proxies-lake.vercel.app/functions/v1';
```

## Issue 2: Slide Images Not Showing
The `proxyImageUrl` function in `src/lib/utils.ts` correctly replaces `supabase.co` with `proxies-lake.vercel.app`. However, the Vercel proxy needs to handle `/storage/v1/object/public/...` paths, which it should since it forwards all paths. This should work once the proxy CORS fix (from the previous message) is deployed. No code change needed here -- just confirm the proxy is updated.

## Issue 3: Movie Streaming Stuck on "Loading Video..."
Movie stream URLs like `https://tw.thewayofthedragg.workers.dev/watch/463/...` use a DIFFERENT `workers.dev` domain that is also blocked by Myanmar ISPs. This is NOT the Supabase proxy -- it's a separate streaming server.

This cannot be fixed in the Lovable app code alone. The streaming server domain (`tw.thewayofthedragg.workers.dev`) also needs a proxy or custom domain. Options:
- Add another rewrite in the Vercel proxy for streaming URLs
- Set up a custom domain on the streaming Cloudflare Worker

Since the streaming server is separate from Supabase, we can add a second Vercel serverless function to proxy it.

## Changes

### File 1: `src/pages/TvChannels.tsx`
- Line 15: Change `SUPABASE_FUNCTIONS_URL` from `https://gentle-star-e538.thewayofthedragg.workers.dev/functions/v1` to `https://proxies-lake.vercel.app/functions/v1`

### File 2: Vercel proxy update (user action)
The user needs to update their Vercel `api/proxy.js` to also handle streaming server proxying. Add a new file `api/stream.js` that proxies requests to `tw.thewayofthedragg.workers.dev`.

### File 3: `src/pages/Watch.tsx`
- Update streaming server URLs to route through the Vercel streaming proxy instead of directly to `tw.thewayofthedragg.workers.dev`

### File 4: `src/pages/MovieDetails.tsx` (if it constructs stream URLs)
- May need similar URL replacement for stream links

## Summary of Required Actions
1. **Lovable side**: Update hardcoded Cloudflare Worker URL in TvChannels.tsx
2. **User side**: Ensure the Vercel proxy CORS fix is deployed (from previous message)
3. **User side**: Add streaming proxy to Vercel (new `api/stream.js`)
4. **Lovable side**: Route streaming URLs through Vercel streaming proxy

