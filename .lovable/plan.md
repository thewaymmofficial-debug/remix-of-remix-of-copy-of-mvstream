

## Fix: Admin Channels Panel - Mobile Responsive Layout

### Issues Identified

1. **Source card action buttons overflow on mobile**: The Switch, Edit (Pencil), and Delete (Trash) buttons sit inline with two badges, causing horizontal overflow on narrow screens (< 390px).
2. **Glass/backdrop-filter on mobile WebView**: Per project conventions, admin elements should use solid backgrounds instead of `backdrop-filter` for touch reliability in Telegram/APK WebViews.
3. **Long URLs overflow cards**: URLs like `https://raw.githubusercontent.com/bugsfreeweb/LiveTVCollector/refs/heads/main/LiveTV/SpecialExcess/LiveTV.json` are extremely long and can push card content beyond its bounds.
4. **Edit mode input + buttons cramped**: When editing a URL, the input field plus two icon buttons barely fit on mobile.

### Changes

**File: `src/pages/admin/ChannelsAdmin.tsx`**

1. **Reorganize source card layout for mobile**: Split the badge row and action buttons into two separate rows on mobile. Badges on the first row, action controls (Switch + Edit + Delete) on the second row aligned right.

2. **Replace `glass` class with solid backgrounds**: Use `bg-card` instead of `glass` on all Cards to avoid WebView touch issues.

3. **Truncate URLs**: Use `truncate` with a max-width wrapper instead of `break-all`, and show full URL on tap/hover via a tooltip or title attribute.

4. **Stack "Add" input vertically on mobile**: Change the input + Add button from `flex` row to `flex-col` on small screens so the button doesn't squeeze the input.

### Technical Details

**Source card layout change (each source item):**
```text
// BEFORE: Single flex row with everything
<div className="flex items-center gap-2 flex-wrap">
  <Badge>...</Badge>
  <Badge>...</Badge>
  <div className="flex-1" />
  <Switch />
  <Button (edit) />
  <Button (delete) />
</div>

// AFTER: Two rows - badges top, actions bottom
<div className="flex items-center justify-between gap-2">
  <div className="flex items-center gap-2 flex-wrap min-w-0">
    <Badge>...</Badge>
    <Badge>...</Badge>
  </div>
  <div className="flex items-center gap-1 shrink-0">
    <Switch />
    <Button (edit) />
    <Button (delete) />
  </div>
</div>
```

**Glass to solid background:**
```text
// BEFORE
<Card className="glass mb-6">

// AFTER
<Card className="bg-card border border-border mb-6">
```

**URL display with truncation:**
```text
// BEFORE
<p className="text-xs text-muted-foreground break-all flex-1">{source.url}</p>

// AFTER
<p className="text-xs text-muted-foreground truncate flex-1" title={source.url}>{source.url}</p>
```

**Add input stacking:**
```text
// BEFORE
<div className="flex gap-2">

// AFTER
<div className="flex flex-col sm:flex-row gap-2">
```

Only one file needs changes: `src/pages/admin/ChannelsAdmin.tsx`
