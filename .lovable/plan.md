

## Problem

The `intent://` href approach is also blocked by the WebToApp APK (com.w2a.bmob). The `onClick` fires (showing the loading overlay), but the WebView swallows the `intent://` navigation, so the user sees an infinite "Opening external link..." spinner with nothing happening.

**Root cause**: This specific WebToApp converter intercepts ALL URL schemes including `intent://`. No code-only approach can force the system browser from inside this locked WebView.

## Solution: Fallback Dialog with Copy Link

Since we cannot force the browser open, we add a **timeout-based fallback**. If the user is still on the page 2 seconds after tapping "External Server", we replace the loading overlay with a dialog offering:
- **Copy Link** button (uses `navigator.clipboard.writeText`)  
- The URL displayed as selectable text (manual copy fallback)
- A "Try Again" button that retries `window.location.href = intentUrl`

The intent href stays as-is (it works on some devices), but we gracefully handle failure.

## Changes

### `src/components/ServerDrawer.tsx`

1. Add state: `fallbackUrl` (string | null) — when set, shows the fallback dialog instead of the loading spinner
2. In the `realHref` anchor's `onClick`, start a 2-second timeout. If `document.visibilityState` is still `'visible'` after 2s, set `fallbackUrl = server.url` and `setRedirecting(false)`
3. In the existing `useEffect` for `redirecting`, also clear `fallbackUrl` when visibility changes to `'visible'` (user came back from browser)
4. Add a fallback dialog UI (rendered when `fallbackUrl` is set):

```text
┌──────────────────────────────┐
│  Couldn't open browser       │
│                              │
│  Copy the link below and     │
│  paste it in your browser:   │
│                              │
│  [https://av-f2l-bot...]     │  ← selectable text, truncated
│                              │
│  [ 📋 Copy Link ]            │  ← primary button
│  [ 🔄 Try Again ]  [ Close ] │
└──────────────────────────────┘
```

- **Copy Link**: `navigator.clipboard.writeText(fallbackUrl)`, show success toast
- **Try Again**: retry `window.location.href = buildBrowserIntentUrl(fallbackUrl)`
- **Close**: set `fallbackUrl = null`

5. Clean up the timeout on unmount or if visibility changes

### No other files changed

| File | Change |
|------|--------|
| `src/components/ServerDrawer.tsx` | Add timeout fallback dialog with Copy Link when intent:// fails |

