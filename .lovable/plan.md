

## Problem

When tapping "External Server" in the WebToApp APK, nothing happens. This is because the code uses `window.open(url, '_blank', 'noopener,noreferrer')` (line 65), which is **blocked by Android WebView**. WebView does not support `window.open` for new tabs/popups — it silently fails.

## Solution

Replace `window.open()` with `window.location.href = url` for external URLs. This tells the WebView to navigate to the URL, which Android will intercept and open in the device's default browser (Chrome, etc.).

To avoid disrupting the in-app flow for other servers (Telegram, MEGA, Direct Download), only the external navigation path needs this fix.

## Changes

### `src/components/ServerDrawer.tsx` (line 65)

Replace:
```js
window.open(url, '_blank', 'noopener,noreferrer');
```

With:
```js
window.location.href = url;
```

This single-line change makes all external links (External Server, Telegram, MEGA, Direct Download) work correctly in both the browser preview and the WebToApp APK. In a regular browser, it navigates the current tab to the URL. In the APK, Android intercepts the navigation and opens it in the default browser app.

### No other files need changes.

