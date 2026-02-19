

## Fix Video Seeking (Skip/Timeline) Through Proxy

### Problem
When you skip forward or use the timeline scrubber, the video jumps back to the start. This happens because:
1. The Vercel proxy doesn't explicitly advertise `Accept-Ranges: bytes` on the initial response
2. The browser doesn't know the video is seekable, so seeking fails and resets to 0

### Solution
Two changes are needed:

#### 1. Update your Vercel `api/stream.js` (in your proxies-lake repo)
The proxy needs to **always** include `Accept-Ranges: bytes` in responses so the browser knows it can seek. Update the response headers section:

```javascript
// Add this line in the responseHeaders building section:
responseHeaders['Accept-Ranges'] = 'bytes';
```

Also ensure the initial (non-Range) request returns `Content-Length` so the browser knows the total file size for the seek bar. Your code already does this, but we should make sure it's not being stripped.

#### 2. Update `Watch.tsx` in this project
For non-HLS (MP4) videos, add `preload="metadata"` to the video element so the browser fetches file size/duration info upfront, which is required for seeking to work. Currently the video element has no preload attribute.

### Technical Details

**File: `api/stream.js` (Vercel proxies-lake repo)**
Update the response headers block to always include:
```javascript
responseHeaders['Accept-Ranges'] = 'bytes';
```

**File: `src/pages/Watch.tsx`**
- Add `preload="auto"` to the `<video>` element so the browser can determine the full file length and enable seeking
- This tells the browser the resource supports byte-range requests

### What This Fixes
- Timeline scrubbing will jump to the correct position instead of resetting
- The "skip 10 seconds" forward/back buttons will work correctly
- The seek bar will show accurate buffered ranges

