

## Fix: Confusing "Starting..." Label on WebView/APK Downloads

### Problem

The Download Manager UI shows two conflicting messages for WebView downloads:
- **Size line**: "Starting..." (because `fileSize` is null and `downloadedBytes` is 0)
- **Status line**: "Sent to system downloader"

The file was already downloaded and saved by the system, but the web UI still shows "Starting..." which is confusing.

### Root Cause

The size info line (line 112 in Downloads.tsx) has a fallback chain: if there are no downloaded bytes and no `fileSize` metadata, it defaults to "Starting..." -- this is intended for in-browser downloads that haven't received their first chunk yet, but it also triggers for completed WebView handoffs where bytes are always 0.

### Fix

**File: `src/pages/Downloads.tsx`**

Update the size info display (line 107-113) to check for WebView handoff scenarios:

- When `status === 'complete'` and `downloadedBytes === 0`: show the `fileSize` if available, or "Downloaded via system" instead of "Starting..."
- When `status === 'downloading'` and `downloadedBytes === 0`: show `fileSize` if available, or "Preparing..." instead of "Starting..."

This way, WebView downloads will show:
- During handoff: file size (e.g. "1.2 GB") or "Preparing..."
- After handoff: file size or "Downloaded via system"

The status line beneath the progress bar remains unchanged ("Handing off to system..." then "Sent to system downloader").

### Result

Before (broken):
```
Steel.Thunder.2023.4K.Web-Dl(cineverse).mkv
Starting...                        <-- confusing
[=========progress bar=========]
Sent to system downloader
```

After (fixed):
```
Steel.Thunder.2023.4K.Web-Dl(cineverse).mkv
Downloaded via system              <-- clear
[=========progress bar=========]
Sent to system downloader
```

### Technical Details

Single change in `src/pages/Downloads.tsx`, lines 107-113. Replace the size info fallback logic to account for the `status` field when `downloadedBytes` is 0.
