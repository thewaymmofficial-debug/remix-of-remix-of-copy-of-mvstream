

## Add M3U Playlist Source Support

The URL you shared (`https://raw.githubusercontent.com/tztturbo/Myanmar-TV-Channels/refs/heads/main/Myanmar%20TV%20Channels`) is an **M3U playlist file**, not JSON. The current system only knows how to parse JSON sources. This plan adds M3U parsing support so you can add M3U/M3U8 playlist URLs as channel sources -- they'll be auto-detected and parsed correctly.

### What Changes

**1. Edge Function -- Add M3U parser (`supabase/functions/live-tv-proxy/index.ts`)**

The `fetchSingleSource` function currently assumes every source is JSON. We'll add auto-detection:
- If the fetched content starts with `#EXTM3U`, parse it as an M3U playlist
- Otherwise, parse it as JSON (existing behavior)

The M3U parser will extract from each `#EXTINF` line:
- `tvg-name` -> channel name
- `tvg-logo` -> channel logo
- `group-title` -> group/category within the source
- The next non-comment line -> stream URL

Channels are grouped by their `group-title` value (e.g., "Myanmar Channels", "Live", "Sports Channels").

**2. Admin Panel -- Update label and auto-detect (`src/pages/admin/ChannelsAdmin.tsx`)**

- Change the label from "GitHub JSON Source URL" to "Source URL (JSON or M3U)"
- Update placeholder to show both formats are accepted
- Auto-detect badge: show "M3U Playlist" when URL doesn't end in `.json`

**3. Add the Myanmar TV source to the database**

Insert the URL directly into the `site_settings` table alongside the existing 35 sources.

### Technical Details

**M3U Parser (added to edge function):**

```text
function parseM3U(text: string): Record<string, GitHubChannel[]> {
  const lines = text.split('\n');
  const channels: Record<string, GitHubChannel[]> = {};
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('#EXTINF:')) continue;
    
    // Extract metadata from #EXTINF line
    const name = line.match(/tvg-name="([^"]*)"/)?.[1] || 
                 line.split(',').pop()?.trim() || 'Unknown';
    const logo = line.match(/tvg-logo="([^"]*)"/)?.[1] || '';
    const group = line.match(/group-title="([^"]*)"/)?.[1] || 'Other';
    
    // Next non-empty, non-comment line is the URL
    let streamUrl = '';
    for (let j = i + 1; j < lines.length; j++) {
      const next = lines[j].trim();
      if (next && !next.startsWith('#')) {
        streamUrl = next;
        break;
      }
    }
    
    if (streamUrl) {
      if (!channels[group]) channels[group] = [];
      channels[group].push({ name, logo, url: streamUrl, group });
    }
  }
  return channels;
}
```

**Modified `fetchSingleSource`:**

```text
// Instead of always doing res.json(), check content first:
const text = await res.text();

if (text.trimStart().startsWith('#EXTM3U')) {
  // Parse as M3U playlist
  const channels = filterChannels(parseM3U(text), brokenUrls);
  result = { category, channels };
} else {
  // Parse as JSON (existing behavior)
  const json = JSON.parse(text) as GitHubResponse;
  const channels = filterChannels(json.channels || {}, brokenUrls);
  result = { category, channels };
}
```

**Files to modify:**
1. `supabase/functions/live-tv-proxy/index.ts` -- add M3U parser + auto-detection
2. `src/pages/admin/ChannelsAdmin.tsx` -- update labels to reflect both formats
3. Database -- append the Myanmar TV Channels URL to `live_tv_sources`

No changes needed to `TvChannels.tsx` -- the frontend already handles the `{ category, channels }` format regardless of how the edge function parsed the source.
