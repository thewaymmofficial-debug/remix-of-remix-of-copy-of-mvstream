

# Cloudflare Worker Proxy Setup for Myanmar Access

## Problem
Myanmar ISPs block `supabase.co`, making the entire app non-functional without a VPN. We need to route all Supabase traffic through an unblocked proxy.

## Solution Overview

```text
User in Myanmar --> Cloudflare Worker (not blocked) --> Supabase (blocked directly)
```

## Part 1: You Do This (Outside Lovable)

### Step 1: Create a Cloudflare Account
- Go to [cloudflare.com](https://cloudflare.com) and sign up (free)

### Step 2: Create a Worker
- Go to **Workers and Pages** in the Cloudflare dashboard
- Click **Create** > **Create Worker**
- Name it something like `cineverse-proxy`
- Replace the default code with this:

```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url);
    url.hostname = "icnfjixjohbxjxqbnnac.supabase.co";

    const newHeaders = new Headers(request.headers);
    newHeaders.set("Host", "icnfjixjohbxjxqbnnac.supabase.co");

    const newRequest = new Request(url.toString(), {
      method: request.method,
      headers: newHeaders,
      body: request.method !== "GET" && request.method !== "HEAD" ? request.body : null,
      redirect: "follow",
    });

    const response = await fetch(newRequest);
    const respHeaders = new Headers(response.headers);
    respHeaders.set("Access-Control-Allow-Origin", "*");
    respHeaders.set("Access-Control-Allow-Headers", "*");
    respHeaders.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: respHeaders });
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: respHeaders,
    });
  }
};
```

- Click **Deploy**
- You will get a URL like `https://cineverse-proxy.YOUR_NAME.workers.dev`

### Step 3: Tell Me the URL
- Share the Worker URL with me (e.g., `https://cineverse-proxy.yourname.workers.dev`)

## Part 2: I Do This (Inside Lovable)

Once you give me the Worker URL, I will update these files:

### 1. `src/integrations/supabase/client.ts`
- Change `SUPABASE_URL` from `https://icnfjixjohbxjxqbnnac.supabase.co` to your Cloudflare Worker URL

### 2. `src/pages/TvChannels.tsx`
- Update the hardcoded `SUPABASE_FUNCTIONS_URL` to use the proxy URL

### 3. `src/contexts/DownloadContext.tsx`
- Update the two hardcoded `supabase.co` URLs for the download proxy to use the Cloudflare Worker URL

### 4. `.env`
- Add `VITE_SUPABASE_PROXY_URL` so it's easy to change in the future

## Cost and Limits
- Cloudflare Workers **free tier**: 100,000 requests/day (sufficient for most apps)
- No credit card required
- If you outgrow the free tier, the paid plan is $5/month for 10 million requests

## What This Fixes
- Movie listings and details
- Authentication (login/signup)
- TV channels loading
- Downloads
- All edge function calls
- Storage/image loading

