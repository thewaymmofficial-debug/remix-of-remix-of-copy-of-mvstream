

## Fix: Blank Screen in APK and Admin Panel Flashing

### Problems Identified

**1. Blank screen in WebToApp APK (TV Channels page)**
- The `useNetworkRefresh` hook in `App.tsx` calls `window.location.reload()` whenever the device goes from offline to online. WebToApp APKs on mobile frequently trigger brief offline/online events (e.g. switching between WiFi and mobile data, or signal fluctuations). This causes constant page reloads, resulting in a blank/white screen.
- Additionally, if the edge function returns a 500 error, the `useQuery` in `TvChannels.tsx` throws but there is no error UI -- it just shows loading forever or crashes to a blank screen.

**2. Admin panel flashing when adding channels and scrolling**
- In `ChannelsAdmin.tsx`, the `useEffect` on line 40-45 syncs `settings.liveTvSources` into local `sources` state. After clicking "Save All Changes", the mutation's `onSuccess` invalidates the `site-settings` query, which re-fetches data and triggers the `useEffect` again, resetting the `sources` state. This causes a visible flash/re-render of the entire channel list.
- With 27 sources, every state change (add, toggle, edit) re-runs `parseCategoryFromUrl` for all items, adding unnecessary computation.

---

### Plan

**Fix 1: Prevent APK blank screen from network refresh**
- File: `src/hooks/useNetworkRefresh.tsx`
- Add a debounce/cooldown so the page does not reload more than once per 30 seconds. Also add a minimum offline duration check (e.g. must be offline for at least 3 seconds before triggering a reload on reconnect). This prevents rapid offline/online toggles in mobile APKs from causing constant blank-screen reloads.

**Fix 2: Add error handling to TvChannels**
- File: `src/pages/TvChannels.tsx`
- Capture the `error` and `isError` states from the `useQuery` hook and show a proper error UI with a retry button instead of a blank screen.

**Fix 3: Fix admin panel flashing**
- File: `src/pages/admin/ChannelsAdmin.tsx`
- Add a `useRef` flag (`initialLoadDone`) so the `useEffect` only syncs from server data on the initial load, not on every query refetch after saving. This prevents the flash caused by the mutation's `onSuccess` invalidation overwriting local state.

---

### Technical Details

**useNetworkRefresh.tsx changes:**
```typescript
// Add minimum offline duration check
const offlineAtRef = useRef<number>(0);

const handleOffline = () => {
  wasOfflineRef.current = true;
  offlineAtRef.current = Date.now();
};

const handleOnline = () => {
  if (wasOfflineRef.current) {
    const offlineDuration = Date.now() - offlineAtRef.current;
    wasOfflineRef.current = false;
    // Only reload if offline for more than 3 seconds
    if (offlineDuration > 3000) {
      window.location.reload();
    }
  }
};
```

**TvChannels.tsx changes:**
- Destructure `isError` from the channels query
- Show error fallback UI with retry button when `isError` is true

**ChannelsAdmin.tsx changes:**
```typescript
const initialLoadDone = useRef(false);

useEffect(() => {
  if (settings?.liveTvSources && !initialLoadDone.current) {
    const s = settings.liveTvSources;
    setSources(Array.isArray(s) ? s : []);
    initialLoadDone.current = true;
  }
}, [settings]);
```

This ensures the server data only populates local state once on mount, so subsequent saves don't cause a flash by resetting the list.

