

# Fix: Direct and CF Proxy Tiers Always Failing

## Root Cause

The `tryDirectStream()` function performs a `fetch()` HEAD probe with `mode: 'cors'` before attempting video playback. This fails because:

1. **Direct tier**: The backend server (`fi5.bot-hosting.net`) does not return CORS headers, so the browser blocks the `fetch()` HEAD request
2. **CF Proxy tier**: The HEAD request is forwarded to the upstream which may not support HEAD for video files, causing timeouts

Since both probes fail, the cascade always falls through to Supabase (the last-resort tier that skips probing).

**Key insight**: The HTML `<video>` element does NOT require CORS headers to play cross-origin media. Only `fetch()`/`XMLHttpRequest` requires CORS. So the HEAD probe is unnecessary and actively harmful.

## Fix (Single File: `src/pages/Watch.tsx`)

### 1. Remove HEAD probe from `tryDirectStream()`

Replace the probe-then-play logic with direct `video.src` assignment + `loadedmetadata`/`error` event listening. No `fetch()` call at all.

```text
Before:
  tryDirectStream() -> probeUrl(HEAD, cors) -> if ok -> video.src -> wait loadedmetadata
  Result: probe fails (no CORS) -> skip tier

After:
  tryDirectStream() -> video.src -> wait loadedmetadata or error
  Result: video element loads directly (no CORS needed) -> tier works
```

### 2. Keep the timeout

Still use the 6-second timeout per tier. If `loadedmetadata` doesn't fire within 6 seconds, move to the next tier.

### 3. No other changes needed

The HLS cascade already skips HEAD probes (it uses HLS.js directly), so it's unaffected.

## Technical Details

| Aspect | Detail |
|--------|--------|
| File changed | `src/pages/Watch.tsx` |
| Function modified | `tryDirectStream()` -- remove `probeUrl()` call |
| Why it works | `<video>` element ignores CORS for media loading |
| Risk | None -- removing an unnecessary check that was blocking playback |
| Expected result | Direct (green badge) should work when VPN is on; CF Proxy (blue) as fallback |

