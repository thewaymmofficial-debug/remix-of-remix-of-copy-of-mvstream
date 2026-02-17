

# Fix WebToApp APK -- Not Loading Without VPN

## Root Cause

Your app works in all browsers (phone and desktop) without VPN, but fails in the WebToApp APK. The difference is that WebToApp uses **Android WebView**, which handles CORS (Cross-Origin Resource Sharing) differently from regular browsers:

- Your Cloudflare Worker currently returns `Access-Control-Allow-Headers: *` (wildcard)
- Regular browsers accept this wildcard and allow all headers
- **Android WebView does NOT accept the wildcard** -- it requires each header to be explicitly listed
- Result: every API call (login, fetch movies, fetch channels) is silently blocked by the WebView

This is why you see "invalid credentials" and "loading" -- the requests never actually reach the server.

## Solution

### Step 1: You Update Your Cloudflare Worker (Manual -- Outside Lovable)

Go to your Cloudflare dashboard and update the Worker code at `gentle-star-e538.thewayofthedragg.workers.dev` with this:

```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url);
    url.hostname = "icnfjixjohbxjxqbnnac.supabase.co";

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, accept, accept-profile, prefer, range, x-supabase-api-version",
      "Access-Control-Expose-Headers": "content-range, x-supabase-api-version",
      "Access-Control-Max-Age": "86400",
    };

    // Handle preflight -- MUST return explicit headers for WebView
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const newHeaders = new Headers(request.headers);
    newHeaders.set("Host", "icnfjixjohbxjxqbnnac.supabase.co");

    const newRequest = new Request(url.toString(), {
      method: request.method,
      headers: newHeaders,
      body: request.body,
      redirect: "follow",
    });

    const response = await fetch(newRequest);
    const respHeaders = new Headers(response.headers);

    // Inject CORS headers into every response
    for (const [key, value] of Object.entries(corsHeaders)) {
      respHeaders.set(key, value);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: respHeaders,
    });
  }
};
```

The critical change is replacing `Access-Control-Allow-Headers: *` with the explicit list of headers that Supabase uses. This makes Android WebView happy.

### Step 2: Rewrite Watch.tsx (Code Change by Me)

Replace the current redirect-based video player (`window.location.href = url`) with an in-app embedded player:

- For streaming server URLs (containing `/watch/`): embed in a full-screen `<iframe>`
- For direct `.mp4` / `.m3u8` URLs: use `<video>` element with `hls.js` (already installed)
- Add a floating back button so users can always return to the app
- Show loading spinner and error states with timeout handling

This prevents the WebView from navigating away from the app entirely when playing videos.

### Step 3: Publish and Rebuild APK

1. After I make the Watch.tsx change, **publish the app**
2. **Rebuild your WebToApp APK** (it needs to pick up the new published version)
3. Test without VPN

## What Each Fix Solves

| Problem | Cause | Fix |
|---------|-------|-----|
| "Invalid credentials" / can't login | WebView blocks fetch due to CORS wildcard | Explicit CORS headers in Cloudflare Worker |
| Movies/channels not loading | Same CORS issue blocking all API calls | Same Cloudflare Worker fix |
| Video player shows dead page | `window.location.href` navigates away | In-app iframe/video player |

## Files to Modify (by me)

- `src/pages/Watch.tsx` -- Rewrite with in-app player

## Your Action Required

- Update the Cloudflare Worker code (copy-paste the code above into your Cloudflare dashboard)
- After changes, publish the app and rebuild the APK

