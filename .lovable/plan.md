

## Fix Lamp Position and Add Smooth Fade-Out Transition

### Issues
1. **Lamp is centered in the middle of the entire logo** (`left: calc(50% - 9px)`) instead of being positioned over the "I" (2nd letter)
2. **Abrupt switch** when React takes over -- the loader disappears instantly with no transition

### Changes

**File: `index.html`**

**Fix lamp position over "I":**
- Remove the static `left: calc(50% - 9px)` from the `.il-lamp` CSS
- Add a small inline `<script>` right after the loader HTML that dynamically calculates the "I" letter's center position and sets the lamp's `left` value accordingly -- this is the same approach the React `LoadingSpinner` component uses
- The script finds the 2nd `.il-letter` span, gets its bounding rect center relative to the `.il-logo` container, and positions the lamp SVG over it

**Add fade-out transition:**
- Add a CSS class `.il-fade-out` with `opacity: 0` and `transition: opacity 0.4s ease-out`
- The `.il-wrap` element gets a base `transition: opacity 0.4s ease-out` so it can fade

**File: `src/main.tsx`**

**Trigger fade-out before React renders:**
- Before calling `createRoot().render()`, check if the `.il-wrap` loader element exists inside `#root`
- If it exists, add the `.il-fade-out` class to trigger the CSS transition
- Wait for the transition to complete (400ms) using a `setTimeout`, then proceed with React rendering
- This ensures the loader smoothly fades out before React replaces the DOM content

### Result
- Lamp will be correctly positioned directly above the "I" letter, matching the in-app `LoadingSpinner` and `CineverseLogo` components
- When React finishes loading, the initial loader will smoothly fade out over 0.4 seconds before the app appears -- no abrupt switch

