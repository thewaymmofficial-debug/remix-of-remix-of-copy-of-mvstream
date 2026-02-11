

## Web UI Improvement: "Sent to System Downloader" Status

### Overview

The native Android changes (public Downloads folder, permissions) are all done on your side in Android Studio. On the web side, two small improvements are needed:

1. Better status messaging for WebView downloads
2. Ensure the proxy forwards `Content-Length` (already done -- verified in the edge function code)

### Changes

**File: `src/contexts/DownloadContext.tsx`**

Update the WebView download entry creation (lines 253-254):
- Change `status: 'complete'` to `status: 'downloading'`
- Change `progress: 100` to `progress: 0`
- After `window.location.href = proxyUrl`, add a 3-second `setTimeout` that updates the entry status to `'complete'` -- this gives users a brief "handing off" visual before marking it done

**File: `src/pages/Downloads.tsx`**

Update the status text display (around line 127-128):
- When `status === 'complete'` and `downloadedBytes === 0` (meaning it was a native handoff, not an in-browser download), show **"Sent to system downloader"** instead of "Complete"
- When `status === 'downloading'` and `downloadedBytes === 0`, show **"Handing off to system..."** instead of "Starting..."

**File: `supabase/functions/download-proxy/index.ts`**

No changes needed -- the proxy already forwards `Content-Length`, `Content-Type`, and `Content-Disposition` headers correctly. Verified in the existing code.

### What Users Will See (WebView/APK)

1. Tap Download
2. Web UI shows "Handing off to system..." for ~3 seconds
3. Web UI changes to "Sent to system downloader"
4. Android system notification shows real progress (bar, speed, ETA, pause/resume)
5. File saved to **Internal Storage > Download/**

### What Users Will See (Regular Browser)

No change -- full in-app progress tracking with speed, ETA, and percentage continues working as before.

