

## Dynamic Live TV Sources with Admin Management

### Overview

Allow admins to add/remove GitHub JSON source URLs from the admin panel. The system auto-categorizes each source by parsing the URL path (e.g., `/LiveTV/Thailand/` becomes "Live TV - Thailand", `/Movies/Bollywood/` becomes "Movies - Bollywood"). The TV Channels page groups channels by these country/type categories.

### Architecture

```text
Admin Panel (Settings)
    |
    v
site_settings table (key: "live_tv_sources")
    |
    v
Edge Function reads sources from DB
    |
    v
Fetches each GitHub URL, tags channels with parsed category
    |
    v
Frontend groups by country/type tabs
```

### Changes

**1. Database: Insert `live_tv_sources` setting**

Insert a new row in `site_settings` with key `live_tv_sources` and a default JSON value containing the existing Arabic source URL. Structure:

```json
[
  {
    "url": "https://raw.githubusercontent.com/.../LiveTV/Arabic/LiveTV.json",
    "enabled": true
  }
]
```

The category label is auto-derived from the URL path at runtime -- no need to store it.

**2. Edge Function: `supabase/functions/live-tv-proxy/index.ts`**

Major update:
- Instead of hardcoded DEFAULT_SOURCES, fetch the source list from `site_settings` table using Supabase client
- Parse each source URL to extract category: take the two path segments before the filename (e.g., `LiveTV/Arabic`, `Movies/Bollywood`) and format as "Live TV - Arabic", "Movies - Bollywood"
- Tag every channel with a `country` field based on the parsed category
- Return response grouped by country/type instead of by the JSON's internal `group` field
- Response format changes to: `{ date, sources: { "Live TV - Arabic": { channels: {...} }, "Live TV - Thailand": { channels: {...} } } }`
- Keep the 5-minute cache, but key it on the source URLs so cache invalidates when admin changes sources

**3. Admin Panel: `src/pages/admin/SettingsAdmin.tsx`**

Add a new collapsible "Live TV Sources" section with:
- List of current source URLs with their auto-detected category label shown as a badge
- Input field to add a new GitHub raw URL
- URL preview showing the auto-parsed category (e.g., typing a URL instantly shows "Live TV - Thailand" badge)
- Enable/disable toggle per source
- Delete button per source
- Save button that updates `site_settings` key `live_tv_sources`

**4. Site Settings Hook: `src/hooks/useSiteSettings.tsx`**

Add the `live_tv_sources` type to the settings hook so the admin page can read/write it.

**5. Frontend: `src/pages/TvChannels.tsx`**

Update to handle the new response format:
- Show country/type tabs or accordion sections (e.g., "Live TV - Arabic", "Live TV - Thailand", "Movies - Bollywood")
- Each section contains its own channel categories (General, News, Sports, etc.) from the JSON
- Search works across all sources
- Collapsible country sections for cleaner navigation

### URL Parsing Logic

```text
URL: https://raw.githubusercontent.com/.../LiveTV/Thailand/LiveTV.json
Path segments: ["LiveTV", "Thailand", "LiveTV.json"]
Category: "Live TV - Thailand"

URL: https://raw.githubusercontent.com/.../Movies/Bollywood/Movies.json
Path segments: ["Movies", "Bollywood", "Movies.json"]  
Category: "Movies - Bollywood"

Rule: Take the two segments before the filename, format first as title case with spaces.
```

### What Admins Will See

1. Go to Admin > Settings
2. Open "Live TV Sources" section
3. See existing sources with auto-detected labels
4. Paste a new URL like `https://raw.githubusercontent.com/.../LiveTV/Thailand/LiveTV.json`
5. Instantly see "Live TV - Thailand" badge appear
6. Click Save
7. TV Channels page automatically shows the new country section

### What Users Will See

1. Open TV Channels page
2. See channels grouped by country/type: "Live TV - Arabic", "Live TV - Thailand", etc.
3. Each country section has sub-categories (General, News, Sports) from the JSON
4. Search works across all countries and categories

### Files to Create/Edit

- `supabase/functions/live-tv-proxy/index.ts` -- read sources from DB, parse URL categories
- `src/pages/admin/SettingsAdmin.tsx` -- add Live TV Sources management section
- `src/hooks/useSiteSettings.tsx` -- add `live_tv_sources` type
- `src/pages/TvChannels.tsx` -- update for country-grouped response format
- Database: insert `live_tv_sources` row into `site_settings`

