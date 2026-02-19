
## Fix: Live TV Stream Buffering on Network Interruption

### Problem
When network drops during live TV streaming, the HLS player treats the network error as fatal -- it stops playback and shows an error. When the network returns, the stream jumps to the latest live position instead of continuing from where it buffered.

### Root Cause
In the current `LiveTvPlayer.tsx`, a fatal `NETWORK_ERROR` immediately sets an error state and stops playback. HLS.js has a built-in recovery mechanism (`hls.startLoad()`) that can retry loading segments, but it is not being used.

### Solution
Configure HLS.js to be resilient to network interruptions by:

1. **Auto-recovering from network errors** instead of showing an error immediately
2. **Showing a "buffering" spinner** during network loss (not an error screen)
3. **Only showing an error after multiple retry failures** (e.g., 3 retries)
4. **Keeping `lowLatencyMode: false`** so the player does not skip ahead to the live edge when segments resume

### Technical Changes

**File: `src/components/LiveTvPlayer.tsx`**

- Add a `buffering` state to show the loading spinner when the player is waiting for data
- Listen to video `waiting` and `playing` events to toggle the buffering overlay
- On fatal `NETWORK_ERROR`: instead of setting error state, call `hls.startLoad()` to retry. Track retry count with a ref
- Only show the error screen after 3+ consecutive failed recovery attempts
- Set `lowLatencyMode: false` to prevent HLS.js from jumping to the live edge after recovery
- Add `liveSyncDurationCount` and `liveMaxLatencyDurationCount` HLS config to allow larger buffer windows, keeping playback closer to where it paused
- Add `video.addEventListener('waiting', ...)` and `video.addEventListener('playing', ...)` to show/hide the buffering spinner during network stalls

### What Users Will Experience
- Network drops: buffering spinner appears (not an error screen)
- Network returns: stream resumes from the buffered position and continues playing
- Only after 3 consecutive failures: error message is shown with option to close
