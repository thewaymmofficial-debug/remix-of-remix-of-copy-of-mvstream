

## Remove Page Transition Animations

### What will change
Remove the `PageTransition` component wrapper from the app so route changes happen instantly without any fade/scale animations.

### Changes

**`src/App.tsx`**
- Remove the `import { PageTransition }` line
- Remove the `<PageTransition>` and `</PageTransition>` wrapper around `<Routes>`

**`src/components/PageTransition.tsx`**
- Delete this file entirely (no longer used)

### Result
Route navigation will be instant with no animation delay, which can actually feel snappier on fast connections.

