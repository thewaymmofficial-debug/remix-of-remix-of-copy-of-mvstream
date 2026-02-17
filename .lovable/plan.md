

# Switch Supabase Proxy from Cloudflare Workers to Vercel

## Why
The Cloudflare Workers domain (`*.workers.dev`) is blocked by Myanmar ISPs. The Vercel proxy at `proxies-lake.vercel.app` is deployed and working -- it just needs to be wired into the app.

## Changes

### 1. `src/integrations/supabase/client.ts`
- Change `SUPABASE_URL` from `https://gentle-star-e538.thewayofthedragg.workers.dev` to `https://proxies-lake.vercel.app`

### 2. `src/lib/utils.ts`
- Update the `proxyImageUrl` function to replace `https://icnfjixjohbxjxqbnnac.supabase.co` with `https://proxies-lake.vercel.app` instead of the old Cloudflare Worker URL

### 3. After publishing
- Rebuild the WebToApp APK
- Test without VPN

## What stays the same
- The `SUPABASE_PUBLISHABLE_KEY` (anon key) stays the same
- All app code stays the same -- only the base URL changes
- The Cloudflare Worker can remain as a backup

