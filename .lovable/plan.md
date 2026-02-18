
# Direct Cloudflare Worker Streaming with Supabase Fallback

## Goal

Try streaming directly from the Cloudflare worker first (free, no bandwidth limits). Only fall back to the Supabase proxy if the direct connection fails (e.g., ISP blocks it). This saves Supabase edge function bandwidth for users who don't need it.

## How It Works

```text
User taps Play
  |
  v
Fetch /watch/ HTML page (via Vercel proxy) -> extract real video URL
  |
  v
Attempt 1: Set video.src = real Cloudflare worker URL directly
  |
  Wait up to 8 seconds for "loadedmetadata" event
  |
  +-- Success? -> Play video (no Supabase bandwidth used)
  |
  +-- Fails (timeout or error)? -> ISP likely blocking
        |
        v
      Attempt 2: Set video.src = Supabase proxy URL (current behavior)
        |
        +-- Success? -> Play video via Supabase proxy
        +-- Fails? -> Show error with retry button
```

## Technical Changes

### File: `src/pages/Watch.tsx`

**1. Update `resolveRealVideoUrl` to return both URLs**

Instead of returning only the Supabase-proxied URL, the function will return an object with two URLs:
- `directUrl`: the real Cloudflare worker URL (e.g., `tw.thewayofthedragg.workers.dev/485/Movie.mp4?hash=X`)
- `proxyUrl`: the Supabase-proxied version (current behavior, `download-proxy?url=...&stream=1`)

**2. Add a `tryDirectFirst` helper function**

A new helper that:
1. Sets `video.src` to the direct Cloudflare URL
2. Listens for `loadedmetadata` (success) or `error` event
3. Also sets an 8-second timeout as a safety net (some ISP blocks cause silent hangs rather than errors)
4. Returns `true` if direct playback started, `false` if it failed

**3. Update the `setupVideo` flow**

For `/watch/` URLs:
1. Resolve both URLs (direct + proxy) from the HTML page
2. Try the direct URL first using `tryDirectFirst`
3. If it fails, fall back to the Supabase proxy URL
4. For non-watch URLs, keep current behavior unchanged

### What This Saves

- Users without ISP blocks: zero Supabase bandwidth used (streams directly from Cloudflare)
- Users with ISP blocks: automatic fallback to Supabase proxy (same as current behavior)
- The fallback adds only ~8 seconds of delay for blocked users on first load
