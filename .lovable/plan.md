

## Plan: Use Real Anchor Tags for External Server Button

### Why Current Approach Fails
All 4 strategies use **programmatic** navigation (creating elements in JS and calling `.click()` or `.dispatchEvent()`). Android WebView's `shouldOverrideUrlLoading` distinguishes between **real user taps** and **programmatic** navigations. Programmatic clicks are silently swallowed. No amount of fallback strategies will work if they're all programmatic.

### Solution
For the **External Server** button specifically, render it as a **real `<a href target="_blank">` HTML element** instead of a `<button>` with an `onClick` handler. When the user physically taps a real anchor tag, Android WebView processes it through `shouldOverrideUrlLoading` which most WebToApp builders configure to open `_blank` links in the system browser.

### Changes

**`src/components/ServerDrawer.tsx`**

1. Add a `realHref` property to server items — only set for External Server (`mxPlayerUrl`)
2. For servers with `realHref`, render an `<a href={url} target="_blank" rel="noopener noreferrer">` element instead of a `<button>` with `onClick`
3. The anchor tag gets the same styling as the button
4. Keep the `onClick` on the anchor to still handle the overlay/toast UX, but **do not `preventDefault`** — let the browser handle the actual navigation natively
5. All other servers (Main Server, Telegram, MEGA, Direct Download) keep their current `<button>` behavior unchanged

```text
Before (External Server):
  <button onClick={() => handleOpen(url, false)}>External Server</button>
  └── JS creates anchor → dispatchEvent → blocked by WebView

After (External Server):
  <a href={url} target="_blank" onClick={() => showOverlay()}>External Server</a>
  └── Real user tap on real anchor → WebView opens system browser
```

No changes to `src/lib/externalLinks.ts` or any other file.

