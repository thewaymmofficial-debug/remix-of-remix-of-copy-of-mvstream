

# CineGeek Premium - Streaming Platform Plan

## Overview
A Netflix-style premium streaming platform with role-based access control, an admin dashboard for content management, and responsive design that works across mobile, desktop, and TV devices.

---

## 🎨 Design & Theme

### Visual Identity
- **Color Palette**: Deep dark mode (#0a0a0a background) with rich accent colors for premium feel
- **Cards**: Netflix-style movie cards with hover zoom effects and gradient overlays
- **Typography**: Clean, modern fonts with strong hierarchy
- **Glass Effects**: Subtle glass-morphism on sidebar and modals
- **Animations**: Smooth hover states, card expansions, and page transitions

### Layout Structure
- **Hero Section**: Full-width cinematic banner featuring a featured movie with backdrop image
- **Content Rows**: Horizontal scrolling carousels for categories (Latest, Action, K-Drama, etc.)
- **Sidebar**: Collapsible navigation on desktop, bottom navigation on mobile
- **Focus States**: High-contrast borders for TV/D-pad navigation support

---

## 👤 Authentication & Access Control

### User Roles (4 Tiers)
| Role | Permissions |
|------|-------------|
| **Guest** | View homepage only. Clicking any movie opens login modal |
| **Free User** | Browse catalog + view movie details. Cannot play videos |
| **Premium** | Full access to stream all content |
| **Admin** | All premium features + access to /admin dashboard |

### Implementation
- Supabase Auth for email/password login & signup
- Secure `user_roles` table (separate from profiles) to prevent privilege escalation
- Protected routes that redirect based on user role
- Login modal appears when guests try to access content

---

## 🗄️ Database Structure

### Movies Table
- **Basic Info**: Title, description, director, actors array, year, category
- **Quality**: Resolution (720p/1080p/4K), file size
- **Media**: Poster URL, backdrop URL
- **Streaming Links**: 
  - `stream_url` - Direct HLS/MP4 link for in-app player
  - `telegram_url` - External link (opens new tab)
  - `mega_url` - External link (opens new tab)
- **Flags**: `is_premium` boolean

### Profiles Table
- User ID, email, display name, avatar

### User Roles Table (Security-Focused)
- Separate table with user_id and role enum
- RLS policies using security-definer functions

---

## 📺 Core Features

### Home Page (Public)
- Hero banner with featured movie
- Category rows: Latest Releases, Action, K-Drama, Hollywood, etc.
- Each movie card shows poster, title, year, and premium badge if applicable
- Clicking a card → Login modal for guests, details page for logged-in users

### Movie Details Page (Logged In)
- Full backdrop image with gradient overlay
- Movie info: Title, year, director, actors, description
- Quality badges (4K, 1080p, etc.)
- **Play Button**: Opens video player for premium users, shows "Premium Only" modal for free users
- Alternative links: Telegram and MEGA buttons (open in new tabs)

### Video Player
- Custom HTML5 player supporting HLS (.m3u8) and MP4
- Standard controls: play/pause, volume, fullscreen, progress bar
- Resume from where you left off (optional enhancement)

### User Profile
- View account details
- View current plan status (Free vs Premium)

---

## ⚙️ Admin Dashboard (/admin)

### Movie Management
- Add new movie form with all fields
- Edit existing movies
- Delete movies
- Toggle premium/free status

### User Management
- View all registered users
- Toggle user status: Free ↔ Premium
- See user registration date and last activity

### Dashboard Stats (Optional)
- Total movies count
- Total users count
- Premium users count

---

## 📱 Responsive Design

| Device | Layout |
|--------|--------|
| **Mobile** | Bottom navigation bar, stacked cards, full-width player |
| **Desktop** | Collapsible sidebar, horizontal scroll rows, inline player |
| **TV** | Large focus states, D-pad keyboard navigation support |

---

## 🛡️ Security

- Row-Level Security (RLS) on all tables
- Anyone can view movies (SELECT)
- Only admins can modify movies (INSERT/UPDATE/DELETE)
- Roles stored in separate secure table with security-definer functions
- Protected admin routes with server-side role validation

---

## Pages Summary

1. **/** - Home page (public hero + movie grids)
2. **/auth** - Login & signup page
3. **/movie/:id** - Movie details page (requires login)
4. **/profile** - User profile page (requires login)
5. **/admin** - Admin dashboard (admin only)
6. **/admin/movies** - Movie management (admin only)
7. **/admin/users** - User management (admin only)

