
# Implementation Plan: Search Page, Welcome Screen, Download Manager, and Login Warning

This plan covers 4 features based on the reference screenshots you shared from the M-Sub Movie app.

---

## 1. Full-Page Search Page

A dedicated search page with list-style results matching the reference screenshot.

**What you'll see:**
- A new `/search` page with a header ("Search Movies"), back arrow, and theme toggle
- A search input with a search icon on the left and clear (X) button on the right, bordered in red like the reference
- Results displayed as horizontal cards: movie poster on the left (with rating badge overlay), title, year, and resolution text in green on the right
- Real-time filtering as you type
- Mobile bottom nav updated with a Search tab

**Files involved:**
- **New: `src/pages/Search.tsx`** -- Full search page with list-style results
- **Modify: `src/components/MobileBottomNav.tsx`** -- Add Search tab icon between Home and Watchlist
- **Modify: `src/components/Navbar.tsx`** -- Mobile search button navigates to `/search` instead of opening a sheet
- **Modify: `src/App.tsx`** -- Add `/search` route

---

## 2. Welcome Screen After Login

A welcome/profile screen shown immediately after login, before entering the homepage.

**What you'll see:**
- A green success banner at the top saying "Login Successful"
- User avatar/logo in the center with edit icon
- User display name and email below
- A card showing Plan (Free/Premium/Admin) and expiry date
- Action buttons: "Browse Movies", "Refresh News", "Active Devices"
- Social media links (Facebook, TikTok, Telegram) at the bottom
- Version number at the very bottom
- Auto-redirects to homepage after 5 seconds, or user can tap "Browse Movies"

**Files involved:**
- **New: `src/pages/Welcome.tsx`** -- Post-login welcome screen
- **Modify: `src/pages/Auth.tsx`** -- Navigate to `/welcome` instead of `/` after login
- **Modify: `src/components/LoginModal.tsx`** -- Same redirect change
- **Modify: `src/App.tsx`** -- Add `/welcome` as a protected route

---

## 3. Download Manager Page

A download tracking page that records movies the user has clicked to download.

**What you'll see:**
- A `/downloads` page with header "Download Manager", back arrow, and theme toggle
- Each download entry displayed as a card with:
  - A file/document icon (red) on the left
  - Movie filename (formatted like "Title.Year.Resolution.Web-Dl(cineverse).mkv")
  - "Waiting for size..." or file size text
  - A dark progress bar
  - Status text ("Paused" / "Complete")
  - Play button icon on the right
- Downloads tracked in localStorage (since this is a web app, not native)
- Empty state when no downloads exist

**Files involved:**
- **New: `src/hooks/useDownloads.tsx`** -- Custom hook managing download history in localStorage
- **New: `src/pages/Downloads.tsx`** -- Download manager page UI
- **Modify: `src/components/ServerDrawer.tsx`** -- When download link is clicked, save movie to download history
- **Modify: `src/components/MobileBottomNav.tsx`** -- Add Downloads tab
- **Modify: `src/App.tsx`** -- Add `/downloads` route (protected)

---

## 4. Login Warning for Guest Users

Show a login-required modal when non-authenticated users click on movie cards, matching the reference screenshot with the lock icon.

**What you'll see:**
- When a guest taps any movie card on the homepage, a centered modal appears
- Lock icon (red/primary colored) in a circular background at the top
- "Login Required" heading
- Description text explaining login is needed
- Two buttons: "Cancel" (ghost) and "Register Now" (primary/red)
- The existing `LoginRequiredModal` component already matches this design

**Files involved:**
- **Modify: `src/pages/Index.tsx`** -- Replace `LoginModal` with `LoginRequiredModal` for guest movie card clicks

---

## 5. Translation Keys

- **Modify: `src/contexts/LanguageContext.tsx`** -- Add new keys: `searchMovies`, `welcome`, `loginSuccess`, `browseMoviesBtn`, `downloadManager`, `noDownloads`, `welcomeBack`, `plan`, `expiresOn`, `refreshNews`, `activeDevicesBtn`

---

## Summary of All Changes

| Action | File | Purpose |
|--------|------|---------|
| Create | `src/pages/Search.tsx` | Full-page search with list-style results |
| Create | `src/pages/Welcome.tsx` | Post-login welcome/profile screen |
| Create | `src/pages/Downloads.tsx` | Download manager page |
| Create | `src/hooks/useDownloads.tsx` | LocalStorage download tracking hook |
| Modify | `src/App.tsx` | Add 3 new routes (/search, /welcome, /downloads) |
| Modify | `src/components/MobileBottomNav.tsx` | Add Search and Downloads nav tabs |
| Modify | `src/components/Navbar.tsx` | Mobile search navigates to /search |
| Modify | `src/pages/Index.tsx` | Use LoginRequiredModal for guest card clicks |
| Modify | `src/pages/Auth.tsx` | Redirect to /welcome after login |
| Modify | `src/components/LoginModal.tsx` | Redirect to /welcome after login |
| Modify | `src/components/ServerDrawer.tsx` | Track downloads in history |
| Modify | `src/contexts/LanguageContext.tsx` | Add new translation keys |

No database changes are needed -- downloads are stored in localStorage and all other features use existing data.
