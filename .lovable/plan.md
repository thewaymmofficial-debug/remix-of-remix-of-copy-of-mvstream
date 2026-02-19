
## Add Skeleton Placeholder for InfoCarousel During Loading

### Problem
When the page first loads, the InfoCarousel returns `null` while slide data is being fetched from Supabase. This causes the page to render without the carousel area, then suddenly shift everything down when slides appear -- creating a jarring layout jump on mobile.

### Solution
Show a shimmer/skeleton placeholder that matches the carousel's exact dimensions while data is loading. Once slides are loaded, smoothly transition to the real carousel content.

### Technical Details

**File: `src/components/InfoCarousel.tsx`**

1. Destructure `isLoading` from the `useInfoSlides()` hook (TanStack Query already provides this)
2. Replace the early `return null` with a loading check:
   - If `isLoading` is true, render a skeleton placeholder with the same dimensions (`min-h-[220px]`, `rounded-2xl`) and a shimmer animation
   - If loading is done but no slides exist, then return `null`
3. The skeleton will be a simple rounded rectangle with `animate-pulse` and `bg-muted` styling, matching the existing skeleton patterns used in `SkeletonCard`

**Changes summary:**
- Only `src/components/InfoCarousel.tsx` needs to be modified
- No new files or dependencies required
- Uses existing Tailwind `animate-pulse` and `bg-muted` classes already used elsewhere in the project
