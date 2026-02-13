
# Add Direct Channel Links via Admin Panel

## Overview
You already have a `tv_channels` database table with columns for `name`, `stream_url`, `thumbnail_url`, `category`, `is_active`, and `display_order` -- but it's empty and not wired up. This plan connects everything so you can add individual .m3u8 links from the admin panel and they appear alongside your other channels.

## Changes

### 1. New Admin Page: Direct Channels Manager
**New file: `src/pages/admin/DirectChannelsAdmin.tsx`**

A CRUD admin page where you can:
- Add a new channel with: Name, Stream URL (.m3u8), Logo URL (optional), Category (text input)
- See all direct channels listed in a table/card layout
- Toggle channels active/inactive
- Edit or delete channels
- Data is stored in the existing `tv_channels` database table

### 2. Add Route and Nav Link
**Files: `src/App.tsx`, `src/pages/admin/AdminLayout.tsx`**

- Add a new admin route `/admin/direct-channels` pointing to the new page
- Add a nav item "Direct Ch." with a Link icon in the admin sidebar

### 3. Integrate Direct Channels into TV Channels Page
**File: `src/pages/TvChannels.tsx`**

- Fetch active channels from the `tv_channels` table using Supabase client
- Group them by `category` column
- Merge them into `loadedSources` as an additional source category called "Direct Channels" (or grouped by their individual categories)
- They appear in the same collapsible accordion UI as proxy-fetched channels
- The HLS player already handles .m3u8 links, so playback works automatically

### 4. Create a Hook for Direct Channels
**New file: `src/hooks/useDirectChannels.tsx`**

- `useDirectChannels()` - fetches all active channels from `tv_channels` table
- Returns them grouped by category in the same `Record<string, Channel[]>` format

## How It Works End-to-End

```text
Admin Panel                    Database              TV Channels Page
+-----------------+           +------------+         +------------------+
| Add channel:    |  INSERT   | tv_channels|  SELECT | Merged into      |
| - Name          | --------> | - name     | ------> | loadedSources    |
| - Stream URL    |           | - stream_url|        | alongside proxy  |
| - Category      |           | - category |         | channels         |
| - Logo URL      |           | - is_active|         +------------------+
+-----------------+           +------------+
```

## Technical Details

- No database changes needed -- `tv_channels` table already has RLS policies for admin CRUD and public SELECT
- No edge function needed -- direct Supabase client queries work since RLS is configured
- The existing `LiveTvPlayer` component with hls.js handles .m3u8 playback
- Direct channels appear as their own categories in the accordion, sorted alphabetically with other sources
