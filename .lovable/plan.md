

## Fix: Myanmar Source Category Name + Alphabetical Sorting

### Problem 1: Myanmar source shows as "heads - main"

The `parseCategoryFromUrl` function extracts a category from the URL path segments. For the standard sources like `.../LiveTV/India/LiveTV.json`, it correctly produces "Live TV - India". But for the Myanmar URL (`/tztturbo/Myanmar-TV-Channels/refs/heads/main/Myanmar%20TV%20Channels`), it produces "heads - main" because the last segments are `heads/main/Myanmar TV Channels`.

**Fix**: Add an optional `label` field to `LiveTvSource`. When present, the edge function uses it as the category name instead of auto-parsing. Then update the Myanmar entry in the database to include `label: "Myanmar TV"`.

### Problem 2: Sources are not sorted alphabetically

Currently sources appear in the order they were added to the database. The user wants them sorted A-Z.

**Fix**: Sort `Object.entries(loadedSources)` alphabetically by category name in `TvChannels.tsx`.

### Changes

**1. `src/hooks/useSiteSettings.tsx`**
- Add optional `label` field to `LiveTvSource` interface

**2. `supabase/functions/live-tv-proxy/index.ts`**
- Pass source metadata (label) through `listSources` response
- Use label as category when available in `fetchSingleSource`

**3. `src/pages/TvChannels.tsx`**
- Pass label to edge function when fetching individual sources
- Sort source categories alphabetically before rendering

**4. `src/pages/admin/ChannelsAdmin.tsx`**
- Add optional "Label" input when adding/editing sources (for custom category names)
- Show the label in the source card if set

**5. Database**
- Update the Myanmar entry to include `"label": "Myanmar TV"`

### Technical Details

**LiveTvSource interface change:**
```
export interface LiveTvSource {
  url: string;
  enabled: boolean;
  label?: string;  // Optional custom category name
}
```

**Edge function `listSources` response change:**
```
// Current: { sources: ["url1", "url2", ...] }
// New:     { sources: [{ url: "url1", label: "Arabic" }, { url: "url2", label: "Myanmar TV" }, ...] }
```

This way TvChannels.tsx can pass the label as a query param: `?sourceUrl=...&label=Myanmar%20TV`

**Edge function `fetchSingleSource` change:**
```
// Accept optional label parameter
// If label is provided, use it as category instead of parseCategoryFromUrl
const category = label || parseCategoryFromUrl(sourceUrl);
```

**TvChannels.tsx sorting:**
```
// Before rendering, sort alphabetically:
{Object.entries(loadedSources)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([sourceCategory, sourceData]) => { ... })}
```

**Database update for Myanmar entry:**
```json
{"url": "https://raw.githubusercontent.com/tztturbo/Myanmar-TV-Channels/refs/heads/main/Myanmar%20TV%20Channels", "enabled": true, "label": "Myanmar TV"}
```

**Files to modify:**
1. `src/hooks/useSiteSettings.tsx` -- add `label` to interface
2. `supabase/functions/live-tv-proxy/index.ts` -- support label in listSources and fetchSingleSource
3. `src/pages/TvChannels.tsx` -- pass labels, sort alphabetically
4. `src/pages/admin/ChannelsAdmin.tsx` -- add label input field
5. Database -- update Myanmar entry with label
