

# Embed Streaming Server Player via iframe

## Problem
The current `/watch` page uses a custom HTML5 `<video>` player which cannot play MKV files or HTTP sources from an HTTPS app. But the streaming server already has its own working video player UI -- we just need to display it.

## Solution
Replace the custom `<video>` player on the `/watch` page with a **fullscreen iframe** that loads the streaming server's own player. Keep the auto-landscape behavior and add a close/back button overlay.

## Changes

### 1. Rewrite `src/pages/Watch.tsx`
- Remove the `VideoPlayer` component usage
- Replace with a fullscreen page containing:
  - An `<iframe>` that loads the streaming URL directly
  - A floating back/close button in the top-left corner
  - Auto-landscape using the existing `useFullscreenLandscape` hook
  - CSS rotation fallback for devices that don't support fullscreen API

### 2. Simplify `src/components/VideoPlayer.tsx` (or remove)
- Since the iframe approach replaces the custom player, the `VideoPlayer` component is no longer needed for streaming playback
- We can keep it as a fallback or remove it entirely -- the Watch page will handle everything itself

### 3. Keep `src/hooks/useFullscreenLandscape.tsx` as-is
- The hook already handles fullscreen + orientation lock + CSS rotation fallback
- It will be used directly in the Watch page

## What the Watch page will look like

```text
+------------------------------------------+
| [X Back]                                 |
|                                          |
|          (iframe fills screen)           |
|     Streaming server's own player        |
|     handles video controls, seek,        |
|     play/pause, etc.                     |
|                                          |
+------------------------------------------+
```

- Fullscreen black background
- iframe takes 100% width and height
- Small back button floats in the top-left corner
- On mobile: auto-enters fullscreen and locks to landscape (same as before)
- No custom video controls needed -- the streaming server provides them

## Technical Details

| File | Change |
|------|--------|
| `src/pages/Watch.tsx` | Replace VideoPlayer with fullscreen iframe + back button + useFullscreenLandscape hook |
| `src/components/VideoPlayer.tsx` | Can be deleted (no longer used) |

The iframe approach works because:
- The streaming server handles format decoding (MKV, etc.)
- No mixed content issue since the iframe loads HTTP content directly
- The server's own player UI provides all controls (play, pause, seek, volume)
- We just wrap it in a fullscreen landscape container with a back button
