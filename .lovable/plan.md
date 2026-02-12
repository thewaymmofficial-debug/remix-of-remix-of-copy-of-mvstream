

## Fix: Infinite Re-render Loop Crashing App at 27+ Sources

### Root Cause

In `src/pages/TvChannels.tsx`, the batch-loading `useEffect` (line 100-108) lists `sourceQueries` as a dependency. However, `useQueries()` returns a **new array reference on every render**. This creates an infinite re-render cycle:

1. A query finishes loading, triggering a re-render
2. `sourceQueries` is a new array reference, so the `useEffect` fires
3. The effect calls `setLoadedBatch(prev => prev + 1)`, triggering another re-render
4. The new render produces another new `sourceQueries` reference, firing the effect again
5. This loops until all batches are loaded or the device runs out of memory

With 26 sources (5 batches + 1 leftover), the loop resolves quickly. With 27+ sources, the cascading re-renders overwhelm the browser and freeze/crash the app.

### Fix

**File: `src/pages/TvChannels.tsx`**

Replace the unstable `sourceQueries` dependency with a **stable derived value** -- a simple count of how many queries have finished loading. A number (e.g., `23`) is the same across renders and won't trigger unnecessary effect executions.

```text
// BEFORE (broken):
useEffect(() => {
  ...
}, [sourceQueries, sourceUrls, loadedBatch]);

// AFTER (fixed):
const loadedCount = sourceQueries.filter(q => !q.isLoading).length;

useEffect(() => {
  if (!sourceUrls || sourceUrls.length === 0) return;
  const enabledCount = Math.min(loadedBatch * BATCH_SIZE, sourceUrls.length);
  if (loadedCount >= enabledCount && enabledCount < sourceUrls.length) {
    setLoadedBatch(prev => prev + 1);
  }
}, [loadedCount, sourceUrls, loadedBatch]);
```

This single change:
- Stops the infinite re-render loop entirely
- The effect only fires when `loadedCount` actually changes (a query finishes)
- Works correctly for any number of sources (27, 50, 100+)
- No other files need to change

