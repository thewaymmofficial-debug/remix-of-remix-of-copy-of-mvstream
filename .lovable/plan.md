

## Plan: External Link Loading Overlay + APK-Compatible Redirect (ServerDrawer)

### Problem
1. When users tap External Server / Telegram / MEGA / Direct Download in the ServerDrawer, there is no visual feedback -- the page seems frozen for a moment then suddenly blinks to the external site.
2. In the WebToApp APK, `window.location.href` does not always work for external URLs. The WebView silently ignores clicks, and users see nothing happening.
3. There is no "back to app" hint after redirecting.

### Solution

#### 1. `src/components/ServerDrawer.tsx` -- Full rewrite of `handleOpen` for external links

**Loading overlay**: When an external (non in-app) link is tapped:
- Show a full-screen overlay with a spinner and message: "Opening external link..."
- Close the drawer immediately so users see the overlay

**APK-compatible redirect with fallback chain**:
```text
1. Detect WebView → try Android intent:// URL
2. If not WebView → use window.location.href
3. After 3 seconds, if still on page → show error toast with "Open in browser" fallback
```

The intent URL format for generic URLs:
```
intent://{host}{path}{search}#Intent;scheme={http/https};action=android.intent.action.VIEW;end
```

**Back-to-app toast**: After initiating the redirect, show a toast: "Tap back to return to Cineverse" that persists for 5 seconds.

**New state**: Add `redirecting` state + `redirectLabel` to track which server is being opened. Render a fixed overlay when `redirecting` is true.

#### 2. WebView detection utility

Add a small helper function `isWebView()` inside ServerDrawer (or reuse from DownloadContext if already exported):
```typescript
function isWebView(): boolean {
  const ua = navigator.userAgent || '';
  return /wv|WebView/i.test(ua) || (ua.includes('Android') && ua.includes('Version/'));
}
```

#### 3. Intent URL builder

```typescript
function buildIntentUrl(url: string): string {
  const parsed = new URL(url);
  return `intent://${parsed.host}${parsed.pathname}${parsed.search}#Intent;scheme=${parsed.protocol.replace(':', '')};action=android.intent.action.VIEW;end`;
}
```

#### 4. Redirect flow detail

```typescript
const handleOpen = (url: string, inApp: boolean) => {
  if (inApp) {
    // existing navigate to /watch
    onOpenChange(false);
    return;
  }
  if (type === 'download' && movieInfo) {
    // existing download flow
    onOpenChange(false);
    return;
  }

  // External link flow
  setRedirecting(true);
  setRedirectLabel(url);
  onOpenChange(false); // close drawer, show overlay

  // Show "back to app" toast
  toast({ title: "Opening external link...", description: "Tap back to return to Cineverse" });

  setTimeout(() => {
    if (isWebView()) {
      // Try intent first for WebView/APK
      window.location.href = buildIntentUrl(url);
    } else {
      window.location.href = url;
    }

    // Safety timeout: if still on page after 3s, hide overlay and show error
    setTimeout(() => {
      setRedirecting(false);
      // If we're still here, the redirect may have failed
      toast({ title: "Couldn't open link", description: "Try opening in your browser", variant: "destructive" });
    }, 3000);
  }, 300); // small delay so overlay renders first
};
```

#### 5. Overlay UI (inside ServerDrawer return)

A fixed full-screen overlay rendered when `redirecting === true`:
- Black semi-transparent background
- Centered spinner icon (Loader2 from lucide, spinning)
- Text: "Opening external link..."
- Subtext: "You'll be redirected to your browser"

### Files Changed

| File | Change |
|------|--------|
| `src/components/ServerDrawer.tsx` | Add loading overlay, WebView detection, intent fallback, back-to-app toast |

### No other files need changes. The Sonner toaster is already in App.tsx. The overlay is self-contained within ServerDrawer.

