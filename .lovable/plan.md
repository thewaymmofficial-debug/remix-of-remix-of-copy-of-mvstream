

# Simplify Watch.tsx: Direct-Only Playback

## Problem
CF Proxy and Supabase tiers cause audio issues (disappearing audio, delays). Direct playback works perfectly.

## What Changes

Strip all multi-tier cascade logic from `src/pages/Watch.tsx` and use the direct URL only.

### Remove
- `StreamTier` type, `ResolvedUrls` interface
- `SUPABASE_PROXY`, `TIER_TIMEOUT_MS`, `CACHE_KEY` constants
- `probeUrl()`, `tryDirectStream()`, `tryHlsStream()`, `getCachedTier()`, `setCachedTier()`, `clearCachedTier()`, `getTierUrl()` functions
- `runCascade()`, `runHlsCascade()` logic inside `setupVideo()`
- `TIER_CONFIG` object, `streamSource` / `showSourceBadge` state, source badge UI
- Unused imports: `Shield`, `Cloud`, `Wifi`

### Keep
- `STREAM_WORKER_ORIGIN` and `getOriginalWorkerUrl()` (still needed to normalize URLs)
- `resolveVideoUrls()` but simplified: only extracts and returns the direct URL (single string, no proxy URLs)
- HLS.js support for `.m3u8` files (using direct URL only)
- Native Safari HLS fallback (using direct URL only)
- Non-HLS `<video>` playback (using direct URL only)
- Buffer progress bar, back button, error/retry UI, fullscreen rotation

### Simplified Flow

```text
1. If /watch/ URL -> resolve HTML page to extract direct video URL
2. If .m3u8 -> use HLS.js (or Safari native) with direct URL
3. If regular video -> set video.src = direct URL
4. On error -> show retry button
```

No cascade, no probes, no tier badges, no session caching.
