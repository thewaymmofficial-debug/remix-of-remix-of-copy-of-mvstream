

## Native Android Download Handling + Web-Side Integration

### Overview

This requires changes in **two places**:
1. **Web side (Lovable)** -- Ensure the download trigger properly signals the WebView so Android's `DownloadListener` can intercept it
2. **Android side (your APK project)** -- Add `DownloadManager` code in your Android Studio project (you do this yourself, we provide the code)

### What Lovable Will Change

**File: `src/contexts/DownloadContext.tsx`**

Update the WebView download trigger to use `window.location.href` directly (most reliable way to trigger Android WebView's `DownloadListener`):

- Remove the `<a>` tag click approach (WebView `DownloadListener` does not reliably intercept programmatic `<a>` clicks)
- Use `window.location.href = url` as the primary trigger -- this is what Android WebView's `onDownloadStart` listens for
- Add the download filename as a URL fragment hint so the native side can extract it
- Keep the proxy URL approach for regular browsers unchanged

**File: `supabase/functions/download-proxy/index.ts`**

Add a `Content-Disposition: attachment; filename="..."` header to the proxy response. This is critical because Android's `DownloadManager` reads this header to determine the saved filename. Without it, files get saved as random hashes.

### What You Must Do in Android Studio (Your APK Project)

These are native Android changes that cannot be made in Lovable. Add this to your APK project:

**1. `AndroidManifest.xml`** -- Add internet and storage permissions:
```text
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
```
Inside `<application>` tag, add:
```text
android:requestLegacyExternalStorage="true"
```

**2. `MainActivity.java`** -- Add `DownloadListener` to your WebView:
```text
webView.setDownloadListener(new DownloadListener() {
    @Override
    public void onDownloadStart(String url, String userAgent,
                                String contentDisposition,
                                String mimeType,
                                long contentLength) {

        DownloadManager.Request request =
                new DownloadManager.Request(Uri.parse(url));

        request.setMimeType(mimeType);
        request.addRequestHeader("User-Agent", userAgent);
        request.setDescription("Downloading file...");

        // Extract filename from Content-Disposition or URL
        String filename = URLUtil.guessFileName(url, contentDisposition, mimeType);
        request.setTitle(filename);

        request.allowScanningByMediaScanner();
        request.setNotificationVisibility(
                DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);

        // Save to app-specific Downloads folder
        request.setDestinationInExternalFilesDir(
                MainActivity.this,
                Environment.DIRECTORY_DOWNLOADS,
                filename);

        DownloadManager dm =
                (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
        dm.enqueue(request);

        Toast.makeText(getApplicationContext(),
                "Downloading...",
                Toast.LENGTH_LONG).show();
    }
});
```

**3. Required imports** for `MainActivity.java`:
```text
import android.app.DownloadManager;
import android.content.Context;
import android.net.Uri;
import android.os.Environment;
import android.webkit.DownloadListener;
import android.webkit.URLUtil;
import android.widget.Toast;
```

### How It Works End-to-End

1. User taps Download in the web app
2. Web code detects WebView, calls `window.location.href = downloadUrl`
3. Android WebView intercepts this navigation as a download (because the URL returns `Content-Disposition: attachment`)
4. WebView fires `onDownloadStart()` in your Java code
5. Your `DownloadManager` saves the file to `Android/data/your.package.name/files/Download/`
6. Android shows a notification with download progress
7. File is saved permanently on device

### Files Saved Location

```text
Internal Storage > Android > data > your.package.name > files > Download > Movie.Name.2024.HD.Web-Dl(cineverse).mkv
```

### Summary of Lovable Changes

| File | Change |
|------|--------|
| `src/contexts/DownloadContext.tsx` | Use `window.location.href` for WebView trigger; cleaner handoff to native layer |
| `supabase/functions/download-proxy/index.ts` | Add `Content-Disposition: attachment` header with proper filename so Android `DownloadManager` saves with correct name |

### Important Notes

- Regular browser downloads (Chrome, Safari) continue working exactly as before with in-app progress tracking
- The proxy's `Content-Disposition` header ensures the native `DownloadManager` knows the filename
- No storage permission needed on Android 10+ when saving to app-specific directory
- Works with large files (5GB+) since `DownloadManager` handles the actual download natively

