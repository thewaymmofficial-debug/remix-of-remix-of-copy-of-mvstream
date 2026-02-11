

## WebView-Compatible Download Fix

### What This Fixes

Downloads work in regular browsers but files vanish in Telegram mini-apps and WebToApp APKs. These WebView environments sandbox blob URLs and ignore the `<a download>` attribute, so files never reach the device filesystem.

### How It Works

**Platform Detection**: A helper function checks `navigator.userAgent` for WebView indicators (Telegram, FBAN, Instagram, Android WebView `wv` flag, etc.).

**Two Save Strategies**:
- **Regular browsers**: Keep the current blob + `<a download>` approach (supports custom filenames, works great)
- **WebView environments**: On download completion, instead of saving a blob, redirect to the original file URL via `window.location.href`. This hands the file to the system's native download manager, which saves it to the device's Downloads folder

**Bonus -- "Direct Download" mode for WebView**: For very large files where streaming in-memory is wasteful in a WebView (since the blob won't be used), add a direct handoff option that skips streaming entirely and immediately triggers the system download manager.

### Technical Details

**File 1: `src/contexts/DownloadContext.tsx`**
- Add `isWebView()` utility function checking user agent for: `Telegram`, `TelegramBot`, `wv` (Android WebView flag), `FBAN` (Facebook), `Instagram`, `Line`, `MiniApp`, `WebView`
- Modify the `pump()` completion branch (line 145-166):
  - If `isWebView()` is true: skip blob creation, call `window.location.href = url` to trigger native system download, then mark as complete
  - If regular browser: keep existing blob + `<a download>` logic
- Clean up unused `pendingStarts` ref (leftover from previous refactor)

**File 2: `supabase/config.toml`**
- Restore the `[functions.download-proxy]` section with `verify_jwt = false` (lost during remix)

