

## Fix React forwardRef Warnings

Two non-blocking console warnings need to be resolved for a cleaner production console.

### Changes

**1. `src/components/ui/sheet.tsx`**
- Update the `SheetPortal` usage. The Radix UI `DialogPortal` component no longer accepts a `ref` in newer versions. We'll remove the intermediate variable and use `SheetPrimitive.Portal` directly (which is already what's happening, but we need to ensure no ref is being forwarded to it).

**2. `src/components/MobileBottomNav.tsx`**
- The `SheetTrigger` wraps a plain `<button>` element via `asChild`. The warning occurs because the inner `<button>` is not wrapped with `forwardRef`. We'll convert the inline button into a proper `forwardRef` component, or simply use a `Button` component (already imported) which already supports ref forwarding.

### Technical Details

- In `MobileBottomNav.tsx`, replace the raw `<button>` inside `<SheetTrigger asChild>` with the existing `<Button>` component (which uses `forwardRef` via Radix Slot). This will apply `variant="ghost"` and matching styles.
- In `sheet.tsx`, the `SheetPortal` alias currently just re-exports `SheetPrimitive.Portal`. Since newer Radix versions may not support ref on Portal, we'll keep the alias as-is (it's already not using `forwardRef`) -- the real fix is ensuring no parent passes a ref to it. We'll verify and clean up any stale ref usage.

These are minimal, safe changes with zero impact on functionality or appearance.

