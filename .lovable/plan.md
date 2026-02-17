

# Fix: Movie Streaming in WebToApp APK

## Root Cause

The issue is the `sandbox` attribute on the iframe in `Watch.tsx` (line 169):

```html
sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
```

Android WebView (used by WebToApp) has stricter security policies than regular browsers. The `sandbox` attribute **blocks media playback** inside the iframe because it's missing the `allow-modals`, `allow-presentation`, and critically -- WebView doesn't fully support sandboxed cross-origin media. The broken image icon you see is the video element inside the Cloudflare worker's HTML page failing to load media due to sandbox restrictions.

Your Cloudflare worker is fine -- the problem is purely on the app side.

## How the Flow Works

1. User taps "Play" -> URL goes through `proxyStreamUrl()` which rewrites the domain
2. The URL contains `/watch/` so `isStreamingServer = true`
3. The page loads the URL in a sandboxed iframe
4. The Cloudflare worker returns an HTML page with a `<video>` element inside
5. In browser: sandbox allows enough for playback. In WebView: sandbox blocks media loading

## Changes

### File: `src/pages/Watch.tsx`

**Change 1**: Remove the `sandbox` attribute from the iframe entirely. Since the content comes from your own Cloudflare worker (a trusted source), sandboxing is unnecessary and causes WebView breakage.

**Change 2**: Add `referrerPolicy="no-referrer"` to prevent referrer-related blocking in WebView.

**Change 3**: Expand the `allow` attribute to include more permissions needed by WebView.

Replace the iframe block (lines 163-171):
```typescript
{!error && isStreamingServer && (
  <iframe
    src={url}
    className="w-full h-full border-0"
    allow="autoplay; fullscreen; encrypted-media; picture-in-picture; accelerometer; gyroscope"
    allowFullScreen
    referrerPolicy="no-referrer"
    onLoad={() => setLoading(false)}
  />
)}
```

Key differences:
- Removed `sandbox` attribute (the main fix)
- Added `referrerPolicy="no-referrer"` for WebView compatibility
- Expanded `allow` to include `accelerometer` and `gyroscope` for fullscreen video controls

### No changes needed to:
- Cloudflare worker (CORS headers are already correct)
- WebToApp settings (your current config looks correct with JavaScript, DOM Storage, and Fullscreen Video enabled)

## Why This Is Safe

The `sandbox` attribute is a security measure for untrusted third-party content. Since the iframe only loads content from your own Cloudflare worker (`tw.thewayofthedragg.workers.dev` or the Vercel proxy), removing it poses no security risk. The worker is already under your control.

