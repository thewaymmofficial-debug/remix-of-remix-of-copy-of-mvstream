

# Fix Mobile Bottom Nav Overflow for Admin Users

## Problem
Admin users see 7 navigation items in the bottom bar: Home, Search, Watchlist, Downloads, Admin, Requests, and Profile. This exceeds what can fit on narrow mobile screens (especially Android devices ~360px wide), causing the rightmost items ("Requests" and "Profile") to be cut off or invisible.

## Solution
Reduce the bottom nav to a maximum of **5 items** for all user types by merging the "Requests" notification badge into the "Admin" tab icon, and ensuring the nav container doesn't overflow.

### Item count per user role (after fix):
- **Not logged in**: 3 items (Home, Search, Login)
- **Regular user**: 5 items (Home, Search, Watchlist, Downloads, Profile)
- **Admin user**: 5 items (Home, Search, Downloads, Admin with badge, Profile)

For admins, "Watchlist" is removed from the bottom nav (still accessible from the profile sheet or navbar) to keep the count at 5. The pending requests badge moves onto the Admin icon so nothing is lost.

## Changes

### `src/components/MobileBottomNav.tsx`

1. **Remove the separate "Requests" (Bell) nav item** -- it currently takes its own slot as a 6th/7th item
2. **Add the pending request count badge to the Admin (Crown) icon** -- the notification badge that was on the Bell icon moves onto the Admin tab
3. **Limit admin nav to 5 items**: For admin users, show Home, Search, Downloads, Admin (with badge), Profile. Remove Watchlist for admins to stay at 5 items.
4. **Ensure the nav container has `overflow-hidden`** to prevent any horizontal scroll or layout breakage
5. **Keep the Profile sheet** as-is -- it already contains links to Admin Dashboard, so "Requests" can be accessed from Admin pages

### No CSS changes needed
The existing `safe-area-bottom`, `flex-1 min-w-0`, and sizing classes are fine -- the root cause is purely the item count.

## Result
All user types will see at most 5 bottom nav items, fitting comfortably on any mobile screen width without cutoff.

