

## Plan: Centralized External Link Handling for WebToApp APK Compatibility

### Problem
External links throughout the app (External Server, share buttons, episode play, info carousel, download player) do nothing when the app runs as a WebToApp APK. The WebView intercepts all navigation attempts (`window.open`, `window.location.href`) and keeps them in-app.

### Solution
Create a centralized utility module `src/lib/externalLinks.ts` with robust multi-strategy redirect functions, then replace all scattered `window.open` calls across 5 files.

---

### File 1: NEW `src/lib/externalLinks.ts`

Utility module with the following exports:

- **`isAndroidWebView()`** — Detects WebView via user agent (`wv`, `WebView`, Android `Version/` pattern)
- **`buildBrowserIntentUrl(url)`** — Builds `intent://` URL with `action=android.intent.action.VIEW`, `category=android.intent.category.BROWSABLE`, and `S.browser_fallback_url`
- **`buildVideoIntentUrl(videoUrl, title)`** — Builds intent URL with `type=video/*` for generic video player chooser
- **`buildPlayerIntentUrl(videoUrl, player, title)`** — Builds intent URL targeting specific packages:
  - MX Player: `com.mxtech.videoplayer.ad`
  - VLC: `org.videolan.vlc`
  - PlayIt: `com.playit.videoplayer`
- **`openExternalUrl(url, options?)`** — Main function with 4-strategy chain:
  1. Anchor element with `target="_system"`, dispatch click event (preserves user gesture)
  2. Android Intent URL with `browser_fallback_url` via `window.location.href`
  3. `window.open(url, '_blank')` fallback
  4. Direct `window.location.href = url` as last resort
  - Accepts optional `{ useIntent, strategyDelay, onFail }` options
  - Each strategy checks `document.visibilityState` before proceeding
- **`openVideoExternal(videoUrl, options?)`** — For opening videos in external player apps using `buildVideoIntentUrl`, with fallback to `openExternalUrl`

---

### File 2: UPDATE `src/components/ServerDrawer.tsx`

- Import `openExternalUrl` from `@/lib/externalLinks`
- Remove the local `isWebView()`, `buildIntentUrl()`, and `openExternal()` functions (lines 14-60)
- In `handleOpen`, replace `openExternal(url)` call with `openExternalUrl(url, { useIntent: true, strategyDelay: 400, onFail: () => { setRedirecting(false); toast error } })`
- Remove the separate `setTimeout` error handler at line 148-156 since `onFail` handles it

---

### File 3: UPDATE `src/pages/Downloads.tsx`

- Import `openVideoExternal` from `@/lib/externalLinks`
- Replace the external player button's onClick handler (lines 152-163) with: `openVideoExternal(dl.url, { player: 'generic', title: dl.title })`
- This removes the inline intent URL building and provides proper fallback

---

### File 4: UPDATE `src/components/ShareButton.tsx`

- Import `openExternalUrl` from `@/lib/externalLinks`
- Replace `window.open(twitterUrl, '_blank', 'noopener,noreferrer')` in `shareToTwitter` with `openExternalUrl(twitterUrl)`
- Replace `window.open(facebookUrl, '_blank', 'noopener,noreferrer')` in `shareToFacebook` with `openExternalUrl(facebookUrl)`
- Replace `window.open(whatsappUrl, '_blank', 'noopener,noreferrer')` in `shareToWhatsApp` with `openExternalUrl(whatsappUrl)`

---

### File 5: UPDATE `src/components/SeasonEpisodeList.tsx`

- Import `openExternalUrl` from `@/lib/externalLinks`
- In `handlePlay` (line 60), replace `window.open(episode.stream_url, '_blank', 'noopener,noreferrer')` with `openExternalUrl(episode.stream_url)`

---

### File 6: UPDATE `src/components/InfoCarousel.tsx`

- Import `openExternalUrl` from `@/lib/externalLinks`
- In `handleClick` (line 84), replace `window.open(link, '_blank', 'noopener,noreferrer')` with `openExternalUrl(link)`

---

### Strategy Details

The 4-strategy chain in `openExternalUrl`:

```text
User clicks button
    │
    ▼
Strategy 1: Create <a href=url target="_system">, dispatchEvent(click)
    │ (immediate, synchronous — best chance to preserve gesture context)
    │
    ├── visibilityState !== 'visible' → Success, stop
    │
    ▼ (after strategyDelay ms, default 400)
Strategy 2: window.location.href = intent://...browser_fallback_url
    │ (Android-specific, tells OS to open in browser)
    │
    ├── visibilityState !== 'visible' → Success, stop
    │
    ▼ (after another delay)
Strategy 3: window.open(url, '_blank')
    │
    ├── returns Window → Success, stop
    │
    ▼ (after another delay)
Strategy 4: window.location.href = url
    │ (last resort — may navigate in-app but at least loads the URL)
    │
    ▼ (after final timeout)
onFail callback or silent fail
```

### Intent URL Formats

**Browser intent:**
```
intent://{host}{pathname}{search}#Intent;scheme={protocol};action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;S.browser_fallback_url={encodedUrl};end
```

**Video player intent (generic):**
```
intent:{videoUrl}#Intent;action=android.intent.action.VIEW;type=video/*;S.browser_fallback_url={encodedUrl};end
```

**Video player intent (specific app):**
```
intent:{videoUrl}#Intent;package={packageName};type=video/*;S.browser_fallback_url={encodedUrl};end
```

### Files Changed Summary

| File | Action |
|------|--------|
| `src/lib/externalLinks.ts` | **Create** — centralized external link utilities |
| `src/components/ServerDrawer.tsx` | **Update** — use `openExternalUrl`, remove local helpers |
| `src/pages/Downloads.tsx` | **Update** — use `openVideoExternal` for player button |
| `src/components/ShareButton.tsx` | **Update** — use `openExternalUrl` for share links |
| `src/components/SeasonEpisodeList.tsx` | **Update** — use `openExternalUrl` for episode play |
| `src/components/InfoCarousel.tsx` | **Update** — use `openExternalUrl` for slide links |

