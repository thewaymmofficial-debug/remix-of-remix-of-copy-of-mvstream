

# Route Video Streaming Through Cloudflare Worker Proxy

## Problem
Streaming links from `tw.thewayofthedragg.workers.dev` are blocked by ISPs in Myanmar without a VPN. The browser fetches the watch page HTML and video source directly, which fails.

## Solution
Use the Cloudflare Worker's `/proxy/` route to relay both the HTML resolution fetch and the actual video stream. Since Cloudflare has no timeout on streaming responses and supports `Range` headers, this works for large files (2-5GB) without cutting off.

## How It Works

1. **HTML resolution** (extracting the real video URL): Instead of fetching `https://tw.thewayofthedragg.workers.dev/watch/544/file.mkv` directly, fetch it through `https://tw.thewayofthedragg.workers.dev/proxy/?url=<encoded_watch_url>`

2. **Video playback**: The resolved video source URL (e.g., `https://tw.thewayofthedragg.workers.dev/544/file.mkv`) is also wrapped: `https://tw.thewayofthedragg.workers.dev/proxy/?url=<encoded_video_url>`

3. **HLS streams**: For `.m3u8` sources, HLS.js will use a custom `xhrSetup` to route segment requests through the proxy as well.

## Changes

### `src/pages/Watch.tsx`

- Add a helper function `proxyUrl(url)` that wraps any URL through the Worker's `/proxy/` route
- In `resolveDirectUrl()`: fetch the watch page HTML through the proxy instead of directly
- After resolving the video source URL: wrap it through the proxy before setting it as `<video src>`
- For HLS: configure `xhrSetup` in HLS.js config to rewrite segment URLs through the proxy

### No other files need changes
The ServerDrawer already passes URLs to the Watch page, which will handle all proxying internally.

## Technical Detail

```text
Browser --> Cloudflare Worker /proxy/ --> Blocked origin server
   (not blocked)                          (blocked by ISP)
```

The proxy URL format:
```text
https://tw.thewayofthedragg.workers.dev/proxy/?url=<encodeURIComponent(original_url)>
```

This keeps all traffic flowing through Cloudflare's network (not blocked), with no timeout limits and full `Range` header support for seeking in large files.

