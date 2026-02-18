

# Fix: Route Video Through Unblocked Vercel Proxy

## Root Cause
The CF Worker domain `tw.thewayofthedragg.workers.dev` is completely blocked by Myanmar ISPs. Putting a `/proxy/` route on the same blocked domain doesn't help because the browser can't reach the domain at all.

## Solution
Route video proxy requests through `proxies-lake.vercel.app` (which is NOT blocked) instead of directly to the CF Worker. The Vercel proxy already forwards `/stream` requests to the CF Worker.

The flow becomes:
```text
Browser --> proxies-lake.vercel.app/stream/proxy/ --> tw.thewayofthedragg.workers.dev/proxy/ --> backend
  (not blocked)                                        (server-to-server, no ISP block)
```

## Changes

### 1. Vercel Proxy Config (user action)
Make sure your `proxies-lake.vercel.app` Vercel project has a rewrite rule that forwards `/stream/*` to `https://tw.thewayofthedragg.workers.dev/*`. This likely already exists since the code references it. If not, add to your Vercel project's `vercel.json`:

```json
{
  "rewrites": [
    { "source": "/stream/:path*", "destination": "https://tw.thewayofthedragg.workers.dev/:path*" }
  ]
}
```

### 2. `src/pages/Watch.tsx` - Use Vercel proxy as the origin

Change `STREAM_WORKER_ORIGIN` from the blocked CF Worker domain to the unblocked Vercel proxy:

```typescript
const STREAM_WORKER_ORIGIN = 'https://proxies-lake.vercel.app/stream';
```

Remove the line that strips the Vercel proxy prefix (lines 19-21), since we now WANT to use the Vercel proxy.

Also in `resolveDirectUrl`, when the extracted video src is a relative path like `/544/file.mkv`, prepend the Vercel proxy origin instead of the CF Worker origin.

### 3. No other file changes needed
ServerDrawer passes raw URLs to the Watch page. Watch.tsx handles all proxying internally.

## Why This Works
- `proxies-lake.vercel.app` is not blocked by Myanmar ISPs (already proven working for Supabase)
- Vercel rewrites stream responses without timeout limits (they're edge-level, not serverless functions)
- The CF Worker's `/proxy/` route handles Range headers for seeking in large files
- Server-to-server communication (Vercel to CF Worker) is never blocked by ISPs

## Optional: Better Long-Term Fix
Add a **custom domain** to your Cloudflare Worker (e.g., `stream.yourdomain.com`). ISPs typically don't block custom domains. This removes the Vercel hop and gives better performance. You can do this in Cloudflare Dashboard > Workers > your worker > Settings > Domains & Routes.

