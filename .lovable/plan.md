

## Add Initial Loading Screen with Cineverse Logo Animation

### Problem
When the app first loads, users see a blank white/dark screen while React, Supabase, and other JavaScript bundles download and initialize. This is especially noticeable on slower networks or APK versions.

### Solution
Add an inline loading screen directly in `index.html` (inside the `#root` div) that displays the animated "CINEVERSE" logo text with the lamp effect -- identical to the existing `LoadingSpinner` component. Since it's pure HTML/CSS embedded in the HTML file, it renders instantly before any JavaScript loads. React will automatically replace it when it mounts.

### Changes

**1. Update `index.html`**
- Add inline CSS for the CINEVERSE letter animation (fade-up + lamp drop) inside a `<style>` tag in the `<head>`
- Add the animated logo HTML inside `<div id="root">...</div>` so it shows immediately
- The markup will be a centered container with 9 letter spans ("C","I","N","E","V","E","R","S","E") using the same looping animation keyframes from the existing `LoadingSpinner`
- Include the lamp SVG positioned over the "I" letter
- Add a "Loading..." text with pulse animation below
- React's `createRoot` will replace this content automatically when the app hydrates

**2. No other files need changes**
The loading screen is purely in `index.html` -- no React component changes needed. Once React mounts, it replaces the `#root` innerHTML with the actual app.

### What Users Will Experience
- App opened: Instantly see the animated CINEVERSE logo with letters fading in one by one and the lamp dropping onto the "I"
- After JS loads (1-3 seconds): App seamlessly takes over, no flash or jump
- Works in both light and dark mode (uses the theme detection script already in the HTML)
