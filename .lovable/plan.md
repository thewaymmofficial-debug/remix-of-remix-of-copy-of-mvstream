

## Plan: Fix External Server Redirect in APK

### Problem
The current redirect chain (intent:// → direct URL → error) is failing entirely in the WebToApp APK's WebView. Both `window.location.href` with intent:// and direct URLs are being silently blocked, resulting in the "Couldn't open link" error every time.

### Root Cause
WebToApp APKs typically configure their WebView to intercept all navigations and keep them in-app. Both `window.location.href` and intent:// schemes get swallowed. However, **programmatic anchor tag clicks** with `target="_blank"` are often handled differently by WebView — they trigger the `shouldOverrideUrlLoading` callback which can open the system browser.

### Solution
For the **External Server** button only, use a multi-strategy redirect approach:

1. **Strategy 1**: Create a temporary `<a>` element with `target="_blank"`, append it to the DOM, and `.click()` it. This is the most reliable method for WebView because Android's `shouldOverrideUrlLoading` intercepts anchor navigations differently.
2. **Strategy 2** (fallback): Try `window.location.href` with the direct URL.
3. **Strategy 3** (fallback): Try intent:// URL.
4. **Final fallback**: If all fail after 2.7 seconds, hide the overlay and show the error toast.

Keep the full-screen loading overlay for visual feedback during the attempt.

### Changes: `src/components/ServerDrawer.tsx`

Update `handleOpen` to use a new helper `openExternal(url)` that runs the multi-strategy chain:

```typescript
function openExternal(url: string): void {
  // Strategy 1: Anchor click (most reliable in WebView)
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

  // Strategy 2: Direct location (1.5s delay)
  setTimeout(() => {
    if (document.visibilityState !== 'visible') return;
    try { window.location.href = url; } catch { /* continue */ }

    // Strategy 3: Intent URL (another 1.2s)
    setTimeout(() => {
      if (document.visibilityState !== 'visible') return;
      try { window.location.href = buildIntentUrl(url); } catch { /* continue */ }
    }, 1200);
  }, 1500);
}
```

The existing `handleOpen` function changes only for the external link path (non-inApp, non-download). Instead of the current primary/fallback logic, call `openExternal(url)`.

The overlay, toast, visibility listener, and final error timeout all remain as-is.

### No other files change.

