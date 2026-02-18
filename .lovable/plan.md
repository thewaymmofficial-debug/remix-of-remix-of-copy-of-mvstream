

# Fix: Remove All Proxies from Watch.tsx

## Problem
The `resolveDirectUrl()` function (line 25-28) still prioritizes the Supabase proxy when resolving `/watch/` URLs. The `SUPABASE_PROXY` constant and the Vercel proxy rewriting in `getOriginalWorkerUrl()` are still present.

## Changes to `src/pages/Watch.tsx`

### 1. Remove `SUPABASE_PROXY` constant (line 10)
Delete the Supabase proxy URL entirely.

### 2. Remove Vercel proxy rewriting from `getOriginalWorkerUrl()` (lines 13-18)
The Vercel `proxies-lake.vercel.app` rewrite is no longer needed. Simplify to just return the URL as-is, or remove the function if not used elsewhere.

### 3. Simplify `resolveDirectUrl()` (lines 21-67)
Remove the `fetchSources` array that tries Supabase first. Only fetch directly from the original URL:

```
async function resolveDirectUrl(watchUrl: string): Promise<string> {
  // Strip any Vercel proxy prefix to get the real URL
  let originalUrl = watchUrl;
  if (originalUrl.includes('proxies-lake.vercel.app/stream')) {
    originalUrl = originalUrl.replace('https://proxies-lake.vercel.app/stream', STREAM_WORKER_ORIGIN);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  const res = await fetch(originalUrl, { signal: controller.signal });
  clearTimeout(timer);

  if (!res.ok) throw new Error('Could not fetch watch page');

  const html = await res.text();
  // ... extract <source> or <video> src as before ...
}
```

No Supabase proxy, no Vercel proxy, no Cloudflare proxy -- just the direct fetch to the worker origin.

### 4. Everything else stays the same
- HLS.js playback for `.m3u8` files (direct URL)
- Native Safari HLS fallback (direct URL)
- Non-HLS `<video>` playback (direct URL)
- Buffer bar, back button, error/retry UI, fullscreen rotation

## Summary of removals
| Item | Status |
|------|--------|
| `SUPABASE_PROXY` constant | Remove |
| Vercel `proxies-lake.vercel.app` rewrite | Remove |
| Supabase-first fetch in `resolveDirectUrl` | Remove |
| Direct fetch to worker origin | Keep (only source) |
| HLS.js / native playback | Keep |
| UI (buffer bar, error, back) | Keep |

