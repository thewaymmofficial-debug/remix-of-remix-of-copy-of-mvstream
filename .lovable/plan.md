

# Code Cleanup and Error Fixes

## Issues Found

### 1. Unused `LoginModal` in `MobileBottomNav.tsx`
The `showLoginModal` state and `<LoginModal>` are declared but never triggered -- `setShowLoginModal(true)` is never called anywhere in the component. This also causes the console warning: *"Function components cannot be given refs"* because the `LoginModal` is rendered unnecessarily.

**Fix**: Remove the `showLoginModal` state, the `LoginModal` import, and the `<LoginModal>` render from `MobileBottomNav.tsx`.

### 2. `FadeIn` component missing `forwardRef`
Console warning: *"Function components cannot be given refs"*. The `FadeIn` component is used in contexts where a ref is passed to it but it doesn't use `React.forwardRef`.

**Fix**: Wrap `FadeIn` with `React.forwardRef` so it properly forwards refs.

### 3. Unused re-export file `src/hooks/useDownloads.tsx`
This file re-exports `useDownloadManager` as `useDownloads` for "backward compatibility," but nothing in the codebase imports from it. It is dead code.

**Fix**: Delete `src/hooks/useDownloads.tsx`.

### 4. Placeholder test file `src/test/example.test.ts`
Contains only a trivial `expect(true).toBe(true)` test that provides no value.

**Fix**: Delete `src/test/example.test.ts`.

---

## Technical Details

### File changes:

| File | Action |
|---|---|
| `src/components/MobileBottomNav.tsx` | Remove unused `showLoginModal` state, `LoginModal` import, and its render |
| `src/components/FadeIn.tsx` | Wrap with `React.forwardRef` to fix ref warning |
| `src/hooks/useDownloads.tsx` | Delete (unused) |
| `src/test/example.test.ts` | Delete (placeholder only) |

