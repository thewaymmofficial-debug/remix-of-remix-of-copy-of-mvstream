

# Add Custom Text Format Parser for TV Source

## What's Needed
The source URL uses a custom plain-text format with `Group:`, `Name:`, `URL:`, `Logo:` fields separated by dashed lines. The edge function currently only handles M3U and JSON -- this format needs a new parser.

## Changes

### 1. Add `parseCustomText()` function to edge function
**File: `supabase/functions/live-tv-proxy/index.ts`**

New function that:
- Splits text by `--------------------------------------------------` separator lines
- Extracts `Group:`, `Name:`, `URL:`, and `Logo:` fields from each block
- Carries `Group:` forward (it only appears once per group, subsequent entries inherit it)
- Returns the same `Record<string, GitHubChannel[]>` structure used by other parsers

### 2. Update format detection in `fetchSingleSource()`
Currently the else branch after the M3U check does `JSON.parse(text)` directly, which would throw on this text format. Change to:

1. Starts with `#EXTM3U` -- use M3U parser
2. Try `JSON.parse` -- if successful, use JSON parser
3. If JSON fails and text contains `Name:` and `URL:` lines -- use custom text parser
4. Otherwise -- empty result

### 3. Admin adds the source
After deploying, go to Channels Admin and add the URL with a label. No UI changes needed -- channels will appear and play like all others.

## Technical Detail

```typescript
function parseCustomText(text: string): Record<string, GitHubChannel[]> {
  const channels: Record<string, GitHubChannel[]> = {};
  let currentGroup = 'Other';

  for (const block of text.split(/^-{5,}$/m)) {
    const lines = block.trim().split('\n');
    if (!lines[0]) continue;
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

Format detection change in `fetchSingleSource` (lines 160-190):
```typescript
let validChannels: Record<string, GitHubChannel[]>;
if (text.trimStart().startsWith('#EXTM3U')) {
  validChannels = filterChannels(parseM3U(text), brokenUrls);
} else {
  let json: any = null;
  try { json = JSON.parse(text); } catch {}

  if (json && json.channels && typeof json.channels === 'object' && !Array.isArray(json.channels)) {
    validChannels = filterChannels(json.channels, brokenUrls);
  } else if (json && Array.isArray(json)) {
    // existing array format handling...
  } else if (/^Name:/m.test(text) && /^URL:/m.test(text)) {
    validChannels = filterChannels(parseCustomText(text), brokenUrls);
  } else {
    validChannels = {};
  }
}
```

One file changed: `supabase/functions/live-tv-proxy/index.ts`

