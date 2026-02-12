

## Fix: App Crash When Adding Channel Sources

### Root Cause

Three issues combine to crash the entire app:

1. **Data serialization bug** in `useUpdateSiteSettings`: The mutation saves raw JavaScript arrays/objects to a `text` column (`site_settings.value`) without calling `JSON.stringify()`. Depending on how PostgreSQL casts the JSON value to text, this can produce malformed data. When `useSiteSettings` later tries to `JSON.parse()` the corrupted value, it fails -- and since `useSiteSettings` is used on multiple pages (AnnouncementBanner, Profile, SettingsAdmin, ChannelsAdmin), one bad parse crashes the whole app.

2. **No Error Boundary**: There's no React Error Boundary wrapping the app or admin panel. Any unhandled render error cascades upward and kills the entire React tree, showing a blank screen.

3. **26+ parallel fetch requests**: When visiting TvChannels after adding sources, `useQueries` fires 26+ simultaneous requests to the edge function. On mobile devices with limited memory, this overwhelms the browser.

### Plan

**Fix 1: Always JSON.stringify when saving to site_settings**
- File: `src/hooks/useSiteSettings.tsx`
- Wrap the `value` in `JSON.stringify()` before saving: `.update({ value: JSON.stringify(value) })`
- This ensures the text column always receives a clean JSON string, preventing any casting issues

**Fix 2: Add React Error Boundary**
- File: `src/components/ErrorBoundary.tsx` (new file)
- Create a simple Error Boundary component that catches render errors and shows a "Something went wrong" message with a reload button
- Wrap the admin layout's `Outlet` and the main app routes with this boundary so a crash in one section doesn't kill the entire app

**Fix 3: Limit concurrent source fetches in TvChannels**
- File: `src/pages/TvChannels.tsx`
- Add `enabled: false` initially and load sources in batches of 5 instead of all 26+ at once
- This prevents memory exhaustion on mobile devices

**Fix 4: Add guard to SettingsAdmin useEffect**
- File: `src/pages/admin/SettingsAdmin.tsx`
- Add `initialLoadDone` ref (same pattern as ChannelsAdmin) to prevent the `useEffect` at line 58-72 from re-running on every settings refetch, which causes unnecessary state resets

### Technical Details

**useSiteSettings.tsx mutation change:**
```text
// Before (bug):
.update({ value })

// After (fix):
.update({ value: typeof value === 'string' ? value : JSON.stringify(value) })
```

**ErrorBoundary.tsx (new component):**
- Class component implementing `componentDidCatch`
- Renders children normally, shows fallback UI on error
- Includes "Reload" button to recover

**TvChannels.tsx batching:**
- Instead of enabling all 26+ queries at once, batch them in groups of 5
- Use a `loadedBatch` state counter that increments as batches complete
- Each query gets `enabled: index < loadedBatch * 5`

**SettingsAdmin.tsx guard:**
- Same `useRef(false)` pattern used in ChannelsAdmin to prevent useEffect from running after initial load

