

## Fix Dark Mode Flash on Initial Load

### Problem
The `index.html` file has `class="dark"` hardcoded on the `<html>` tag. This means regardless of the user's saved theme preference, the page always renders in dark mode first, then flips to light mode once JavaScript loads and `next-themes` applies the correct theme -- causing a visible flash/blink.

### Solution
Add an inline script in `<head>` that reads the user's saved theme preference from `localStorage` **before** any rendering happens, and sets the correct class immediately. This eliminates the flash entirely.

### Technical Details

**File: `index.html`**

1. Remove `class="dark"` from the `<html>` tag (change to just `<html lang="en">`)
2. Add a small inline `<script>` block in the `<head>` (before any CSS loads) that:
   - Reads the `next-themes` stored value from `localStorage` (key: `theme`)
   - If `"dark"`, adds `class="dark"` to `<html>`
   - If `"light"`, ensures no `dark` class
   - If `"system"` or missing, checks `window.matchMedia('(prefers-color-scheme: dark)')` and sets accordingly

This is a single-file, 8-line fix. No other files need to change.

