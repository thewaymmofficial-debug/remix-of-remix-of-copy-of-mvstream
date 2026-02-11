

## Fix Downloads to Save Files on All Platforms (Telegram Mini App, WebToApp APK, etc.)

### The Problem

The current download completion code creates an in-memory `Blob`, generates a temporary `URL.createObjectURL()`, and programmatically clicks an `<a download>` link. This works in regular Chrome/Safari browsers but **fails silently in WebView environments** (Telegram mini apps, WebToApp APKs) because:

- WebViews often ignore the `download` attribute on `<a>` tags
- `URL.createObjectURL` blobs are sandboxed and don't trigger the system download manager
- The file stays in memory and is immediately garbage-collected -- it never reaches the filesystem

### The Solution

Replace the blob-based save with a **multi-strategy approach** that tries the best method for each platform:

1. **Strategy 1 - Direct navigation**: Redirect `window.location.href` to the original file URL. This hands the download off to the **system download manager** (Android/iOS), which works universally in WebViews, Telegram, and wrapped APKs.

2. **Strategy 2 - Fallback `<a>` click**: For regular browsers where direct fetch + streaming progress is working, keep the current blob approach as it provides a better UX with the custom filename.

3. **Platform detection**: Detect if running inside a WebView/mini-app (via `navigator.userAgent` checks for Telegram, WebView indicators) and choose the right strategy.

### Technical Changes

**File: `src/contexts/DownloadContext.tsx`**

- Add a `isWebView()` helper that checks the user agent for WebView indicators (e.g., `wv`, `Telegram`, `FBAN`, `Instagram`, `Line`, `MiniApp`)
- Modify the download completion handler (`done` branch in `pump()`):
  - **If WebView detected**: Skip the blob approach entirely. Instead, open the original file URL via `window.location.href = url` or `window.open(url, '_system')` to trigger the native system download manager. The system will handle saving to the Downloads folder.
  - **If regular browser**: Keep the existing `Blob` + `createObjectURL` + `<a download>` approach (it works well and supports custom filenames)
- For WebView mode, an alternative is to skip the streaming fetch entirely and just hand the URL to the system -- but this loses progress tracking. A hybrid approach: stream for progress UI, then on completion, trigger a **second native download** of the same URL via the system manager, which saves the file properly.

**Recommended hybrid for best UX on WebView:**
- Stream the file as now (showing progress, speed, ETA in the UI)
- On completion, instead of blob save, call `window.location.href = url` to trigger the system's native download of the same file
- The system download manager will save it to the device's Downloads folder
- Mark the entry as "complete" in the UI

This means the file downloads twice (once for progress tracking, once for actual save), but ensures reliable file saving. For efficiency, we can also offer a "direct download" mode for WebViews that skips streaming and just hands the URL to the system immediately.

### Files to Modify

1. **`src/contexts/DownloadContext.tsx`** - Add WebView detection, modify completion handler, add direct-download fallback for WebView environments

