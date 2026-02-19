

## Make Initial Loading Screen Match App's Loading Animation

### Problem
Two issues with the current `index.html` loading screen:
1. **Animation plays once and stops** -- uses `forwards` fill mode instead of looping, so if the app takes longer to load, the animation freezes
2. **Different visual style** -- the `index.html` loader uses blueish colors (`hsl(222 47% 6%)` background, `hsl(222 47% 11%)` text) while the actual app uses pure black/white (`hsl(0 0% 4%)` dark bg, `hsl(0 0% 96%)` text). This creates a visual mismatch/flash when React takes over

### Solution
Update `index.html` inline styles to:
1. Use the same **looping keyframes** already defined in `index.css` for the `LoadingSpinner` component (`logo-fade-up-loop`, `logo-squish-loop`, `logo-lamp-loop` -- all 2s infinite)
2. Match the **exact colors** from the app's CSS variables (dark: `hsl(0 0% 4%)` bg, `hsl(0 0% 96%)` text; light: `hsl(40 20% 94%)` bg, `hsl(30 10% 15%)` text)

### Changes

**File: `index.html`** (only file changed)

Replace the inline `<style>` block keyframes and styles:

- **Background colors**: Light mode `hsl(40 20% 94%)`, dark mode `hsl(0 0% 4%)` (matching `--background`)
- **Text colors**: Light mode `hsl(30 10% 15%)`, dark mode `hsl(0 0% 96%)` (matching `--foreground`)
- **Loading text colors**: Light mode `hsl(30 10% 40%)`, dark mode `hsl(0 0% 60%)` (matching `--muted-foreground`)
- **Replace `il-fade` keyframe** with the looping version from `index.css`:
  - Letters fade up, hold, then fade out and repeat (2s infinite, staggered delays)
- **Replace `il-drop` keyframe** with the looping lamp version
- **Add squish animation** on the "I" letter (2nd span) to match the `LoadingSpinner`
- Remove `forwards` fill mode, use `infinite` on all letter/lamp animations

### What Users Will Experience
- Initial load shows the same continuously looping CINEVERSE animation as the in-app loading spinner
- Colors match perfectly -- no visual flash when React takes over
- Animation keeps running indefinitely until the app loads, even on very slow networks
