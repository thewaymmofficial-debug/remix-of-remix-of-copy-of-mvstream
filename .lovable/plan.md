

# Accordion-style Collapsible for TV Channel Categories

## Change
Update the `toggleSource` function in `TvChannels.tsx` so that opening one category automatically closes all others (accordion behavior).

## Technical Detail
In `src/pages/TvChannels.tsx`, replace the `toggleSource` function (currently toggles individual keys independently) with logic that sets only the clicked source as open:

```typescript
const toggleSource = (key: string) => {
  setOpenSources((prev) => ({
    [key]: !prev[key],  // close all others, toggle clicked one
  }));
};
```

This replaces the current spread (`...prev`) with a fresh object containing only the toggled key, ensuring only one category can be open at a time.

One file changed: `src/pages/TvChannels.tsx` (1 line edit).

