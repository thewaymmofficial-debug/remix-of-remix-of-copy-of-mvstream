

# Fix Myanmar Access Issues

## Problem Analysis

After investigation, the proxy code changes are correctly in place. There are **two remaining issues**:

### Issue 1: App Not Published
The proxy changes only exist in the preview build. You need to **publish the app** for the live URL (`shimmer-flix.lovable.app`) to use the proxy. However, `lovable.app` itself may also be blocked by Myanmar ISPs — you may need to use a custom domain through Cloudflare.

### Issue 2: Storage/Image URLs Still Direct
Movie posters and slide images stored in Supabase Storage use direct URLs like:
`https://icnfjixjohbxjxqbnnac.supabase.co/storage/v1/object/public/slide-images/...`

These URLs are stored **in the database**, not in the code. When the browser tries to load these images, they go directly to `supabase.co` which is blocked.

## Solution

### Step 1: Proxy Storage URLs at Runtime
Add a utility function that rewrites any `supabase.co` storage URL to go through the Cloudflare proxy. Apply it wherever images are rendered.

**New utility in `src/lib/utils.ts`:**
```typescript
export function proxyImageUrl(url: string | null | undefined): string {
  if (!url) return '/placeholder.svg';
  return url.replace(
    'https://icnfjixjohbxjxqbnnac.supabase.co',
    'https://gentle-star-e538.thewayofthedragg.workers.dev'
  );
}
```

### Step 2: Apply to Image Components
Update components that display images from Supabase storage:
- `MovieCard.tsx` (poster images)
- `HeroBanner.tsx` (backdrop images)
- `MovieDetails.tsx` (poster and backdrop)
- `InfoCarousel.tsx` (slide images)
- `FootballVideoCard.tsx` (thumbnails)
- `ContinueWatchingCard.tsx`
- Any other component rendering `poster_url`, `backdrop_url`, or `image_url`

### Step 3: Fix Auth GoTrue URL
The Supabase JS client uses the base URL for auth calls (`/auth/v1/token`). Since we already changed `SUPABASE_URL` to the proxy, auth should work. But we should verify the Cloudflare Worker properly proxies POST requests with JSON bodies (for login).

**Update the Cloudflare Worker** to ensure it forwards request bodies correctly:
```javascript
const newRequest = new Request(url.toString(), {
  method: request.method,
  headers: newHeaders,
  body: request.body,  // This must stream the body for POST/PUT
  redirect: "follow",
});
```

Note: The current Worker script uses `request.method !== "GET" && request.method !== "HEAD" ? request.body : null` which should work, but verify it handles `Content-Type: application/json` properly.

### Step 4: Publish and Test
After applying changes, publish the app and test from Myanmar without VPN.

## Files to Modify
1. **`src/lib/utils.ts`** -- Add `proxyImageUrl` helper
2. **`src/components/MovieCard.tsx`** -- Use `proxyImageUrl` for poster
3. **`src/components/HeroBanner.tsx`** -- Use `proxyImageUrl` for backdrop
4. **`src/pages/MovieDetails.tsx`** -- Use `proxyImageUrl` for images
5. **`src/components/InfoCarousel.tsx`** -- Use `proxyImageUrl` for slide images
6. **`src/components/ContinueWatchingCard.tsx`** -- Use `proxyImageUrl`
7. **`src/components/FootballVideoCard.tsx`** -- Use `proxyImageUrl`
8. **`src/components/RelatedMovies.tsx`** -- Use `proxyImageUrl`
9. **`src/components/MovieQuickPreview.tsx`** -- Use `proxyImageUrl`

## Important Note for the User
Even after these changes, the **published URL** (`shimmer-flix.lovable.app`) may itself be blocked by Myanmar ISPs since `lovable.app` could be blocked. If so, you would need to set up a **custom domain** through Cloudflare for the frontend as well.

