

## Fix: Carousel Tap Navigates Instead of Sliding

### Problem
When you tap a carousel slide, it changes to the next slide instead of opening the redirect link. This happens because:

1. `touchEndX` is never reset when a new touch begins
2. On a simple tap (no finger movement), `touchMove` never fires, so `touchEndX` still holds the value from a **previous** swipe
3. `handleTouchEnd` calculates the diff using the stale `touchEndX`, exceeds the 50px threshold, and triggers `next()` or `prev()`
4. The `handleClick` function never gets a chance to run the redirect

### Fix

**`src/components/InfoCarousel.tsx`** -- two small changes:

1. **Reset `touchEndX` in `handleTouchStart`** so a tap without movement results in a zero diff:
   ```tsx
   const handleTouchStart = (e: React.TouchEvent) => {
     touchStartX.current = e.touches[0].clientX;
     touchEndX.current = e.touches[0].clientX; // <-- add this line
     isSwiping.current = false;
   };
   ```

2. **Guard `handleTouchEnd`** to only trigger slide changes when a swipe actually occurred:
   ```tsx
   const handleTouchEnd = () => {
     if (!isSwiping.current) return; // <-- add this line
     const diff = touchStartX.current - touchEndX.current;
     const minSwipe = 50;
     if (Math.abs(diff) > minSwipe) {
       if (diff > 0) next();
       else prev();
     }
   };
   ```

### Result
- **Tap**: `isSwiping` stays `false`, `handleTouchEnd` exits early, `handleClick` fires and navigates to the redirect link
- **Swipe**: `isSwiping` becomes `true` (finger moved >10px), `handleTouchEnd` processes the swipe direction normally, `handleClick` is blocked by the `isSwiping` check

No other files need changes.

