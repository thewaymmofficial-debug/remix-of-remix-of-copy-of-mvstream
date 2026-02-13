

# Add Support for Custom Text Format TV Source

## What's Needed
The URL `https://raw.githubusercontent.com/bugsfreeweb/LiveTVCollector/refs/heads/main/Movies/SecretWorld/Movies.txt` uses a custom plain-text format that looks like:

```
Group: Adult TV
Name: Blowjob
URL: http://live.adultiptv.net/blowjob.m3u8
Logo: https://...
Source: https://...
--------------------------------------------------
Name: Teen
URL: http://live.adultiptv.net/teen.m3u8
...
```

The `live-tv-proxy` edge function currently only parses M3U playlists and JSON formats. This new text format needs a parser so these channels work like all other sources.

## Changes

### 1. Add text format parser to edge function
**File: `supabase/functions/live-tv-proxy/index.ts`**

Add a `parseCustomText()` function that:
- Splits the text by the `--------------------------------------------------` separator
- Extracts `Group:`, `Name:`, `URL:`, and `Logo:` fields from each block
- Groups channels by their `Group` value (carries forward from the last seen `Group:` line)
- Returns the same `Record<string, GitHubChannel[]>` structure used by the other parsers

### 2. Integrate parser into fetch logic
In the `fetchSingleSource()` function, add detection for this format. If the text is not M3U and not valid JSON, attempt to parse it as the custom text format before returning empty.

Detection: if the text contains `Name:` and `URL:` lines (and is not M3U/JSON), use the new parser.

### 3. Admin adds the source URL
After deploying, the admin simply adds this URL via the existing Channels Admin page with a label like "Secret World Movies". No other UI changes needed -- the channels will appear and play like all existing ones.

---

## Technical Detail

New function in the edge function:

```typescript
function parseCustomText(text: string): Record<string, GitHubChannel[]> {
  const channels: Record<string, GitHubChannel[]> = {};
  let currentGroup = 'Other';

  for (const block of text.split(/^-{5,}$/m)) {
    const lines = block.trim().split('\n');
    let name = '', url = '', logo = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('Group:')) currentGroup = trimmed.slice(6).trim() || 'Other';
      else if (trimmed.startsWith('Name:')) name = trimmed.slice(5).trim();
      else if (trimmed.startsWith('URL:')) url = trimmed.slice(4).trim();
      else if (trimmed.startsWith('Logo:')) logo = trimmed.slice(5).trim();
    }

    if (name && url) {
      if (!channels[currentGroup]) channels[currentGroup] = [];
      channels[currentGroup].push({ name, logo, url, group: currentGroup });
    }
  }
  return channels;
}
```

In `fetchSingleSource`, the format detection order becomes:
1. Starts with `#EXTM3U` -> M3U parser
2. Valid JSON -> JSON parser
3. Contains `Name:` and `URL:` -> Custom text parser
4. Otherwise -> empty result

One file changed: `supabase/functions/live-tv-proxy/index.ts`
