

## Fix Theme Toggle and Language Toggle Visibility

### Root Cause
Both toggles use the `ghost` button variant, which applies `hover:text-accent-foreground` on hover. In light mode, `accent-foreground` is a dark brown color (`hsl(30 10% 15%)`). Since the navbar is always `bg-black/95`, the icon/text becomes invisible against the black background when hovered or clicked.

Additionally, the theme toggle only shows a visual "active" ring in dark mode (`theme-toggle-ring` class), giving no click feedback in light mode.

### Changes

**File: `src/components/Navbar.tsx`**

1. **Theme toggle button**: Replace the current classes with ones that ensure white text/icon stays white on hover and has clear visual feedback in both modes:
   - Add `hover:text-white` to force white icon on hover
   - Replace the dark-mode-only `theme-toggle-ring` with a subtle always-visible active indicator (e.g., a semi-transparent white background `bg-white/10` when in light mode, ring when in dark mode)

2. **Language toggle**: Same fix — add `hover:text-white` to the className prop passed from Navbar to ensure the label stays visible on hover

**File: `src/components/LanguageToggle.tsx`**

3. Improve the toggle styling:
   - Add a subtle background highlight for the active state so users can clearly see it's a tappable element
   - Ensure `hover:text-white` is not overridden by the ghost variant's hover styles by using `!` (important) modifier or restructuring classes

### Summary
- Two files changed: `Navbar.tsx` and `LanguageToggle.tsx`
- No new dependencies
- Fix ensures both toggles remain clearly visible and give proper tap/click feedback on the always-black navbar in both light and dark themes

