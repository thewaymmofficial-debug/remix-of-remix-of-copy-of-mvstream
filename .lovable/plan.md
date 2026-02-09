

# In-App Download Manager (No Server Proxy)

## Problem

The current download system tries to stream video files through a Supabase Edge Function proxy, which crashes with `WORKER_LIMIT` errors because video files are too large for edge function resource limits. Meanwhile, `window.open()` opens a new browser tab, which doesn't feel "in-app."

## Solution: Direct Browser Download with In-App Tracking

Since the download URLs are on external HTTP servers (no CORS support), JavaScript `fetch()` cannot access them directly from the browser. Instead, we'll trigger downloads using a **hidden anchor tag** -- this works without CORS restrictions and doesn't open a new tab. The browser's native download manager handles the actual file transfer (saving to the device's Downloads folder), while we show an **in-app download tracking UI** with a toast notification.

### How it works for the user:
1. User taps "Download" on a movie or episode
2. The ServerDrawer opens showing available download sources (Main Server, Telegram, MEGA)
3. User picks a source
4. A toast notification appears: "Download started - Movie.Name.2024.HD.mkv"
5. The browser starts downloading the file natively (saves to Downloads folder)
6. User can go to the Downloads page to see their download history
7. User never leaves the app

## Changes

### 1. Simplify `DownloadContext` (`src/contexts/DownloadContext.tsx`)

Remove the fetch/proxy/streaming logic entirely. Replace with:
- **`startDownload()`**: Creates a hidden `<a>` element with `href` pointing to the source URL, clicks it to trigger a native browser download, then records the download entry as "complete"
- **Remove**: `pauseDownload`, `resumeDownload`, `chunksRef`, `controllersRef`, `speedSamplesRef`, proxy URL logic
- **Keep**: Download history tracking in localStorage, `removeDownload`, `clearDownloads`
- **Add**: Toast notification when download starts (using sonner toast)

The download entry will immediately be marked "complete" since the browser handles the actual transfer natively -- we can't track byte-level progress without a proxy, but the file reliably downloads.

### 2. Re-integrate `ServerDrawer` with Download Manager (`src/components/ServerDrawer.tsx`)

- Import `useDownloadManager` back
- When type is `'download'` and `movieInfo` is provided, call `startDownload()` (which now uses the anchor-tag approach instead of the broken proxy)
- This makes both movie and episode downloads go through the same in-app flow

### 3. Update Downloads Page (`src/pages/Downloads.tsx`)

- Remove pause/resume buttons (not applicable with direct browser downloads)
- Show download history as a list of completed/started downloads
- Keep the "Remove" and "Clear All" functionality
- Show a helpful message explaining that files are saved to the device's Downloads folder

### 4. Clean Up Edge Function

- The `download-proxy` edge function is no longer needed for downloads
- Keep it in case it's useful for other purposes, but it won't be called for downloads anymore

## Technical Details

### Files to modify:

**`src/contexts/DownloadContext.tsx`**
- Strip out fetch/proxy/streaming logic (lines 95-217)
- Replace `performDownload` with a simple function that:
  - Creates a hidden `<a href="url">` element
  - Sets the download attribute with a formatted filename
  - Clicks it programmatically (triggers native browser download)
  - Records the entry as "complete" in state
- Remove `pauseDownload`, `resumeDownload` from the context type
- Remove `controllersRef`, `chunksRef`, `speedSamplesRef`
- Add toast import from sonner for "Download started" notification

**`src/components/ServerDrawer.tsx`**
- Re-import `useDownloadManager`
- In `handleOpen()`, when `type === 'download'` and `movieInfo` exists, call `startDownload({ ...movieInfo, url })` instead of `window.open()`
- For Telegram and MEGA links (external services), keep `window.open()` since those have their own download UIs

**`src/pages/Downloads.tsx`**
- Remove pause/resume button logic
- Simplify the download card to show: filename, file size, timestamp, and a "saved to Downloads folder" message
- Keep remove/clear functionality
- Add a retry button that re-triggers the anchor download

**`src/components/SeasonEpisodeList.tsx`**
- No changes needed -- it already uses `ServerDrawer` which will now work with the updated download manager

**`src/pages/MovieDetails.tsx`**
- No changes needed -- it already uses `ServerDrawer` for movie downloads

### Download flow diagram (text):

```text
User taps "Download"
       |
       v
 ServerDrawer opens
 (shows Main Server, Telegram, MEGA)
       |
       v
 User picks "Main Server"
       |
       v
 startDownload() called
       |
       v
 Hidden <a> element created
 with href = download URL
       |
       v
 a.click() triggers native
 browser download
       |
       v
 Toast: "Download started!"
 Entry saved to Downloads page
       |
       v
 File saves to device's
 Downloads folder automatically
```

