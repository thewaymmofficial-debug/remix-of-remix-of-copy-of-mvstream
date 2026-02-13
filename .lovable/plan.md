

# Speed Up TV Channel Category Opening

## Problem
When opening a category, all channel cards render at once (some categories have 100+ channels across groups). Additionally, the `ChannelCard` component re-renders on every state change because it's not memoized.

## Solution

### 1. Memoize `ChannelCard` with `React.memo`
Wrap the `ChannelCard` function component in `React.memo` so it only re-renders when its props actually change. This prevents unnecessary re-renders of all visible cards when toggling categories or interacting with one card.

### 2. Reduce initial channel render per group
Lower `CHANNELS_PER_GROUP` from 30 to 12 so fewer cards render on first open. Users can still tap "Show all" to see the rest. This cuts initial DOM nodes by ~60%.

### 3. Virtualize nothing (keep it simple)
Since we already cap per-group rendering and the accordion ensures only one category is open, these two changes should be sufficient without adding a virtualization library.

---

## Technical Details

**File: `src/pages/TvChannels.tsx`**

- Change `CHANNELS_PER_GROUP` from `30` to `12`
- Wrap `ChannelCard` with `React.memo`:
  ```typescript
  const ChannelCard = React.memo(function ChannelCard({ ... }) {
    return ( ... );
  });
  ```
- Memoize `handlePlay` and `handleToggleFavorite` callbacks with `useCallback` so memo'd cards don't receive new function references each render

One file changed, ~10 lines modified.

