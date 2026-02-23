

## Fix MX Player "Can't play this link" Issue

### Problem
MX Player opens via the Android intent but shows "Can't play this link." The video URL (`https://tw.thewayofthedragg.workers.dev/watch/...`) is a Cloudflare Workers proxy that likely requires browser-specific headers (cookies, referer) or performs redirects that MX Player cannot follow. MX Player needs a **direct video file URL** that serves the raw video stream without web-based authentication.

### Solution (Two Parts)

#### Part 1: Improve the Intent URI Format
Update `handleMxPlayer` in `src/components/ServerDrawer.tsx` to use a cleaner intent format and pass the movie title as extra data so MX Player shows it:

```text
intent://<full-url>#Intent;
  action=android.intent.action.VIEW;
  type=video/*;
  package=com.mxtech.videoplayer.ad;
  S.title=<movie-title>;
end
```

Also add a fallback to try MX Player Pro (`com.mxtech.videoplayer.pro`) package if the free version is not installed.

#### Part 2: Admin Guidance on URL Requirements
The MX Player URL field in the admin panel must contain a **direct video file link** (ending in .mp4, .mkv, .m3u8, etc.) that serves raw video bytes -- not a web proxy page. If the current Workers proxy requires browser headers, the admin should:
- Use the Telegram direct file URL instead, or
- Configure the Workers proxy to serve the file without authentication when accessed from external apps

### Technical Changes

**File: `src/components/ServerDrawer.tsx`**
- Update `handleMxPlayer` to pass the full URL directly using `S.url` extra and the movie title via `S.title`
- Pass `movieInfo` into the handler for the title
- Add helper text in admin panel for the MX Player URL field explaining it must be a direct video link

**File: `src/pages/admin/MoviesAdmin.tsx`**
- Add placeholder/helper text to the MX Player URL input: "Direct video link (.mp4, .mkv, .m3u8) -- must be a direct file URL, not a proxy page"

