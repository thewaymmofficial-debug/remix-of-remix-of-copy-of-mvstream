

## Why It Still Doesn't Work

The current `<a href="https://..." target="_blank">` is still being intercepted by the WebToApp WebView. WebToApp converters override **all** URL loading — including `target="_blank"` anchor taps — and keep navigation inside the WebView.

The one thing Android WebView **cannot** intercept is an `intent://` URL set directly as the `href` attribute of a real anchor tag. When the user physically taps an anchor with `href="intent://..."`, the Android system handles it before the WebView can intercept it.

## Solution: Use Intent URL as the Actual href

For External Server, set the `<a>` tag's `href` to the `intent://` URL (built by `buildBrowserIntentUrl`) instead of the raw `https://` URL. This forces Android to route the tap to the system browser.

## Changes

### `src/components/ServerDrawer.tsx`

1. Import `buildBrowserIntentUrl` from `@/lib/externalLinks`
2. In the `realHref` anchor tag (line 170), change `href={server.url}` to `href={buildBrowserIntentUrl(server.url)}`
3. Keep the raw URL as a data attribute for fallback display

```tsx
// Before
<a href={server.url} target="_blank" rel="noopener noreferrer" ...>

// After
<a href={buildBrowserIntentUrl(server.url)} rel="noopener noreferrer" ...>
```

The `target="_blank"` is removed since intent URLs don't use it — Android handles intent URLs at the OS level.

### No other files changed

| File | Change |
|------|--------|
| `src/components/ServerDrawer.tsx` | Use `buildBrowserIntentUrl(url)` as `href` for External Server anchor |

