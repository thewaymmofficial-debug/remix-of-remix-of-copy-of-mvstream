

# UI Layout and Theme Update Plan

## Overview
Update the Ceniverse app to match the CineGeek reference design, featuring a consistently dark cinematic theme throughout the entire app (removing the light content section), an enhanced navbar with always-visible search and filter dropdowns, and showing the user's watchlist on the homepage.

## Key Changes

### 1. Theme Updates (CSS Variables)
- Remove the hybrid light/dark approach (dark hero + light content)
- Make the entire app consistently dark in dark mode
- Update CSS variables in `src/index.css`:
  - Dark mode: Deep cinematic black/olive tones throughout
  - Light mode: Keep the current warm beige theme for users who prefer it
  - Remove the separate `--content-bg` variable usage for dark mode

### 2. Navbar Enhancements (`src/components/Navbar.tsx`)
- Add always-visible search input field with search icon placeholder
- Add Category dropdown filter (select component)
- Add Year dropdown filter (select component)  
- Style theme toggle with red ring/border when in dark mode (matching reference)
- Make navbar more compact and streamlined
- Pass filter state up to parent via props/context

### 3. Hero Banner Updates (`src/components/HeroBanner.tsx`)
- Add director information display (already in database as `director` field)
- Format as: "Year - Category - 4K - Dir. Director Name"
- Ensure consistent styling with the reference

### 4. Homepage Layout (`src/pages/Index.tsx`)
- Remove the separate `bg-black` and `bg-content-bg` wrapper divs
- Make entire page use theme-aware background
- Add "My Watchlist" section at the top of movie rows (when user is logged in)
- Integrate filter state from navbar to filter displayed movies

### 5. Mobile Bottom Navigation (`src/components/MobileBottomNav.tsx`)
- Update icon styling to match reference (filled when active)
- Ensure consistent dark theme styling

### 6. Search and Filter Integration
- Create a new context or lift state to share search/filter between Navbar and Index page
- Implement Category and Year filtering for movie rows

---

## Technical Implementation Details

### File: `src/index.css`
- Simplify dark mode to be consistently dark throughout
- Keep the light mode beige theme as-is for preference
- Remove complex hero vs content background splitting in dark mode

### File: `src/components/Navbar.tsx`
- Replace the expandable search button with an always-visible search input
- Add two Select dropdowns for Category and Year
- Add visual styling for theme toggle (red ring in dark mode)
- Accept callback props for search/filter changes

### File: `src/components/HeroBanner.tsx`
- Add director info display after category
- Format: `{year} - {category} - {resolution} - Dir. {director}`

### File: `src/pages/Index.tsx`
- Remove hybrid background approach
- Use single theme-aware background
- Add watchlist section at top when user is logged in and has watchlist items
- Implement filtering based on navbar selections

### File: `src/components/MobileBottomNav.tsx`
- Style active icons with fill for better visual feedback

### New File: `src/contexts/FilterContext.tsx` (optional)
- Context to share filter state between Navbar and content
- Stores: searchQuery, selectedCategory, selectedYear

---

## Component Structure After Changes

```text
Index Page
+-- Navbar (dark, fixed)
|   +-- Logo + Premium badge
|   +-- Search Input (always visible)
|   +-- Category Dropdown
|   +-- Year Dropdown
|   +-- Theme Toggle (red ring in dark)
|   +-- User Menu
+-- HeroBanner
|   +-- Movie backdrop
|   +-- Premium badge
|   +-- Title
|   +-- Year - Category - 4K - Dir. Name
|   +-- Description
|   +-- Play/Info buttons
+-- Content Section (theme-aware bg)
|   +-- My Watchlist Row (if logged in)
|   +-- Movie Category Rows (filtered)
+-- Footer
+-- MobileBottomNav
```

---

## Summary of Files to Modify
1. `src/index.css` - Unify dark theme, remove content-bg splitting
2. `src/components/Navbar.tsx` - Add search input, dropdowns, themed toggle
3. `src/components/HeroBanner.tsx` - Add director info display
4. `src/pages/Index.tsx` - Unified bg, add watchlist row, filtering
5. `src/components/MobileBottomNav.tsx` - Active state styling
6. `tailwind.config.ts` - May need minor adjustments for new utilities

