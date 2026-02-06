

# Fix Plan: Device Limiting, Profile Name, Logout Redirect, Admin Welcome, and Admin Notifications

This plan addresses 5 distinct issues found in the current codebase.

---

## Issue 1: Profile Name Showing "User" Instead of Actual Name

**Root cause found:** In `src/hooks/useAuth.tsx` line 88, the profile query uses `.eq('id', userId)` but the `profiles` table has a separate `id` (auto-generated UUID) and `user_id` (auth user UUID). Since `id` never matches the auth user ID, the profile always returns null, causing the display name to fall back to "User" everywhere.

**Fix:**
- Change `.eq('id', userId)` to `.eq('user_id', userId)` in `useAuth.tsx`
- Also update existing profiles that have NULL display_name by pulling the name from `auth.users` metadata via a one-time migration

---

## Issue 2: Logout Not Redirecting to Auth Page

**Root cause:** Two places still navigate to `/` after sign out:
- `src/components/Navbar.tsx` line 50: `navigate('/')`
- `src/components/MobileBottomNav.tsx` line 26: `navigate('/')`

**Fix:**
- Change both to `navigate('/auth')`

---

## Issue 3: Admin Sees Normal User Welcome Page (VIP Button)

**Root cause:** The Welcome page currently shows the same "VIP" and "browse" buttons for everyone. There is no conditional check for admin or premium roles.

**Fix:**
- Add role-based conditional rendering:
  - **Admin / Premium users:** Show "Movie ကြည့်ရန်" button (navigate to homepage), "သက်တမ်းတိုးရန်" (renewal), and "Active Devices" -- the premium welcome view
  - **Normal (free) users:** Show "VIP လျှောက်ရန်" and "ဘာတွေရှိလဲကြည့်မယ်" -- the current normal view
- Admin plan label will show "Administrator" with a gold badge instead of "Normal Member"

---

## Issue 4: Admin Notification Icon in Mobile Bottom Nav

**Fix:**
- Add a Bell icon tab in the mobile bottom navigation bar, visible only for admin users
- Show the pending premium request count as a badge on the bell icon
- Clicking it navigates to `/admin/premium-requests`
- Create a new hook `usePendingRequestCount` that counts premium_requests where status = 'pending'

---

## Issue 5: Device Login Limiting by Plan

This is the biggest change. We need to track which devices a user is logged into and enforce limits based on their plan tier.

**Database changes (new migration):**
- Create a `user_devices` table:
  - `id` (uuid, PK)
  - `user_id` (uuid, FK to auth.users)
  - `device_name` (text) -- browser/OS info from user agent
  - `device_id` (text, unique) -- fingerprint generated from browser
  - `last_active_at` (timestamptz)
  - `created_at` (timestamptz)
  - Unique constraint on (user_id, device_id)
- Add RLS policies: users can only see/manage their own devices
- Add a `max_devices` column to `user_roles` table (default 1 for free, configurable per plan)

**Plan-based device limits:**
- Free users: 1 device
- Gold premium: 2 devices
- Platinum premium: 3 devices
- Admin: unlimited (no limit enforced)

**Login flow changes:**
- On successful login, register the current device (browser fingerprint + user agent)
- Before allowing access, check if the device count exceeds the plan limit
- If limit is reached, show a modal explaining the limit and listing active devices with an option to remove one
- The Welcome page "Active Devices" modal will now show real data from this table

**Files involved:**

| Action | File | Purpose |
|--------|------|---------|
| Modify | `src/hooks/useAuth.tsx` | Fix `.eq('id')` to `.eq('user_id')`, add device registration on login, add device limit check |
| Modify | `src/components/Navbar.tsx` | Change logout redirect to `/auth` |
| Modify | `src/components/MobileBottomNav.tsx` | Change logout redirect to `/auth`, add admin notification bell tab |
| Modify | `src/pages/Welcome.tsx` | Role-based UI (admin/premium vs normal), real device data from DB, device removal |
| Create | `src/hooks/useDevices.tsx` | Hook for managing user_devices table (fetch, register, remove) |
| Create | `src/hooks/usePendingRequests.tsx` | Hook to count pending premium requests for admin badge |
| Migration | New SQL migration | Create `user_devices` table, add `max_devices` to `user_roles`, update existing display_names |

---

## Technical Details

### Device Fingerprinting
Since this is a web app (not native), we will generate a simple device fingerprint using:
- `navigator.userAgent` for device name (parsed to "Chrome on Windows", "Safari on iPhone", etc.)
- A randomly generated UUID stored in `localStorage` as the device_id (persists per browser)

### Device Limit Enforcement Flow

```text
User logs in
    |
    v
Register device in user_devices table
    |
    v
Count user's active devices
    |
    v
[Count <= max_devices?] --Yes--> Allow access, go to Welcome
    |
    No
    v
Show "Device Limit Reached" modal
    - List all active devices
    - User must remove a device to continue
    - Or log out
```

### Migration SQL Summary
1. Create `user_devices` table with RLS
2. Add `max_devices` integer column to `user_roles` (default 1)
3. Update existing admin roles to have `max_devices = 99` (unlimited)
4. Update existing premium roles: set `max_devices` based on `premium_type`
5. Fix NULL display_names in profiles by copying from auth.users metadata

