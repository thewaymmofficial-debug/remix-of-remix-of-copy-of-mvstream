

# Fix Mobile Bottom Navigation Layout

## Problem
The bottom navigation bar has two issues on Android (especially in the WebToApp wrapper):

1. **Too many items horizontally**: Admin users see 7 items (Home, Search, Watchlist, Downloads, Admin, Requests, Profile) all with `px-4` padding. This causes the nav to overflow or get cramped on narrow screens.

2. **Android system navigation overlap**: The `safe-area-bottom` CSS class uses `env(safe-area-inset-bottom, 0)` which falls back to `0px` in WebView wrappers that don't support safe-area-inset. Android's gesture bar or navigation buttons then overlap the app's bottom nav.

## Solution

### 1. Fix `src/components/MobileBottomNav.tsx`
- Reduce horizontal padding on nav items from `px-4` to `px-1` or `px-2` so all items fit
- Use `flex-1` or `min-w-0` on each nav item so they share space evenly instead of overflowing
- Reduce icon and text sizes slightly to fit more items comfortably

### 2. Fix `src/index.css` - Safe Area Bottom
- Add a minimum fallback padding to the `safe-area-bottom` class (e.g., `8px`) so even when the WebView doesn't report safe area insets, there's still some breathing room above Android's system buttons
- Update the `mobile-nav-spacing` to account for the extra padding

### Technical Details

| File | Change |
|------|--------|
| `src/components/MobileBottomNav.tsx` | Reduce padding from `px-4` to `px-2`, add `flex-1 min-w-0` to each nav item for even distribution, shrink icon/text sizes |
| `src/index.css` | Change `.safe-area-bottom` to use `padding-bottom: max(8px, env(safe-area-inset-bottom, 0px))` for Android fallback |

These changes ensure the bottom navigation fits all items on narrow screens and stays above Android's system navigation buttons.

