

# Auto-Hide Broken/CORS Channels

## Problem
Some channels in the list have stream URLs that are blocked by CORS or are offline. When users try to play them, they see an error, which is confusing.

## Approach
Track channels that fail to play on the client side, then automatically hide them from the list. This is fast, doesn't slow down the edge function, and gives users a clean experience.

## Changes

### 1. Edge Function: Server-side URL validation (`supabase/functions/live-tv-proxy/index.ts`)
- After fetching channel data from GitHub sources, perform a quick HEAD request (2-second timeout) on each channel URL
- Filter out channels whose URLs return errors or are unreachable
- This happens server-side (no CORS issues) and results are cached for 5 minutes, so performance impact is minimal

### 2. Client-side fallback: Track failed channels (`src/pages/TvChannels.tsx`)
- When a channel fails to play (CORS or network error in the player), add its URL to a local "broken channels" set stored in React state
- Filter those channels out of the displayed list so users don't see them again during the session
- Pass an `onError` callback from TvChannels into the LiveTvPlayer

### 3. Player error callback (`src/components/LiveTvPlayer.tsx`)
- Add an optional `onError` prop that fires when a fatal network/CORS error occurs
- This lets the parent component (TvChannels) know which channel failed

## Technical Details

**Edge function validation (server-side):**
```text
For each channel URL:
  - Send HEAD request with 2s timeout
  - If request fails or returns error status -> exclude channel
  - Results cached with existing 5-min cache
```

**Client-side tracking:**
```text
- State: brokenUrls = Set<string>
- On player error: add channel URL to brokenUrls
- Filter channel lists to exclude brokenUrls
- Player closes automatically on error
```

**Files to modify:**
- `supabase/functions/live-tv-proxy/index.ts` - Add URL validation
- `src/components/LiveTvPlayer.tsx` - Add onError callback prop
- `src/pages/TvChannels.tsx` - Track broken channels and filter them out

