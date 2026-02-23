

## Fix MX Player: Route Through Download Proxy

### Problem
The `mx_player_url` points to a Cloudflare Workers domain (`tw.thewayofthedragg.workers.dev`) which is blocked by Myanmar ISPs. MX Player on the user's device cannot reach it directly, causing "Can't play this link."

### Solution
Instead of passing the raw CF Workers URL to MX Player, construct a **Supabase download-proxy URL** that streams the video server-side. The download-proxy already supports `stream=1` mode which serves raw video bytes without `Content-Disposition: attachment` -- perfect for external players.

The proxy URL format:
```text
https://icnfjixjohbxjxqbnnac.supabase.co/functions/v1/download-proxy?url=<encoded_cf_url>&stream=1
```

MX Player receives this URL, which serves a standard HTTP video stream it can play.

### Changes

#### File: `src/components/ServerDrawer.tsx`
- Update `handleMxPlayer` to wrap the video URL in the download-proxy with `stream=1`
- The proxy URL becomes the video source for MX Player's intent URI
- Keep the movie title in `S.title` extra data
- Add a loading state while constructing the URL (instant, no async needed)

```text
Before: intent:<cf-workers-url>#Intent;...
After:  intent:<supabase-proxy-url>?url=<encoded-cf-url>&stream=1#Intent;...
```

#### No other files need changes
- The download-proxy edge function already handles streaming perfectly
- The admin panel, MovieDetails, and database remain unchanged

### Technical Details

The `handleMxPlayer` function will:
1. Take the original video URL (CF Workers proxy)
2. Construct the Supabase download-proxy URL: `https://<project>.supabase.co/functions/v1/download-proxy?url=${encodeURIComponent(originalUrl)}&stream=1`
3. Pass this proxy URL to MX Player via the Android intent
4. MX Player makes a standard HTTP GET to the proxy, which fetches from CF Workers server-side (bypassing ISP blocks) and streams the video back

This leverages the existing infrastructure without any new edge functions or database changes.

