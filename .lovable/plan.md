

## Plan: Force "External Server" to Open in Device's Default Browser

### Problem
All three redirect strategies (anchor click, `window.location.href`, `intent://`) are being silently swallowed by the WebToApp WebView. The anchor click with `target="_blank"` doesn't work because the WebView is configured to handle all navigations internally. Nothing actually leaves the app.

### Root Cause
WebToApp APKs override `shouldOverrideUrlLoading` to keep everything in-app. Programmatic anchor clicks and `window.location.href` are both intercepted. The intent URL format we're using (`action=android.intent.action.VIEW`) should theoretically work, but the WebView may not be forwarding intents at all.

### Solution: Use `window.open()` as Primary Strategy

The key insight is that many WebToApp configurations **do** respect `window.open(url, '_system')` or `window.open(url, '_blank')` because it triggers a different WebView callback (`onCreateWindow`) which is often configured to open the system browser. We'll restructure the fallback chain:

**New fallback chain for External Server only:**

1. **`window.open(url, '_blank')`** — This triggers `onCreateWindow` in WebView, which most WebToApp builders configure to open the system browser. This is synchronous and preserves the user gesture.
2. **Anchor click fallback** (500ms) — If still visible, try the existing anchor-click approach.
3. **Intent URL fallback** (1.5s) — If still visible, try `intent://` with `S.browser_fallback_url` parameter (tells Android to fall back to opening the URL in a browser if no app handles the intent).
4. **Final error** (3s) — Show error toast with a "Copy Link" option so user can manually paste in browser.

### Changes: `src/components/ServerDrawer.tsx`

**Update `openExternal` function:**

```typescript
function openExternal(url: string): void {
  // Strategy 1: window.open — triggers onCreateWindow in WebView
  // which most WebToApp APKs route to the system browser
  try {
    const win = window.open(url, '_blank');
    if (win) return; // Success — new window/tab opened
  } catch { /* continue */ }

  // Strategy 2: Anchor click (300ms delay)
  setTimeout(() => {
    if (document.visibilityState !== 'visible') return;
    try {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch { /* continue */ }

    // Strategy 3: Intent with browser_fallback_url (1s later)
    setTimeout(() => {
      if (document.visibilityState !== 'visible') return;
      try {
        const parsed = new URL(url);
        const intentUrl = `intent://${parsed.host}${parsed.pathname}${parsed.search}#Intent;scheme=${parsed.protocol.replace(':', '')};action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(url)};end`;
        window.location.href = intentUrl;
      } catch { /* continue */ }
    }, 1000);
  }, 300);
}
```

Key differences from current code:
- **`window.open` is now first** — this is the most likely to work in WebToApp because it uses a different WebView callback path
- **Added `S.browser_fallback_url`** to the intent URL — this tells Android "if no app handles this intent, open this URL in a browser instead"
- **`window.open` returns a reference** — if it returns a Window object, we know it worked and skip the rest
- Timing tightened: 300ms → 1.3s → 3s total before error

**No changes to the overlay, toast, or visibility listener logic** — those stay exactly as they are.

### Scope
- **External Server button only** (play mode, `inApp: false`, icon `external`)
- All other buttons (Telegram, MEGA, Direct Download, Main Server) keep current behavior
- Loading overlay remains

### Files Changed

| File | Change |
|------|--------|
| `src/components/ServerDrawer.tsx` | Rewrite `openExternal()` with `window.open` as primary strategy, add `S.browser_fallback_url` to intent |

