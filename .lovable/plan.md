

# Advanced Cast System with Photos and Actor Pages

## Overview
This plan upgrades the cast system from simple text-based actor names to a full cast management system with profile photos, character names, and dedicated actor pages -- matching the reference app's design.

## What Changes

### 1. New Database Tables
Two new tables will be created:

**`cast_members` table** -- stores individual actors/cast members:
- `id` (uuid, primary key)
- `name` (text, required)
- `photo_url` (text, nullable)
- `created_at` (timestamp)

**`movie_cast` junction table** -- links cast members to movies with their character name:
- `id` (uuid, primary key)
- `movie_id` (uuid, references movies)
- `cast_member_id` (uuid, references cast_members)
- `character_name` (text, nullable) -- e.g., "Millie Calloway"
- `display_order` (integer, default 0)
- `created_at` (timestamp)

RLS policies will allow anyone to view cast data, and admins to insert/update/delete.

### 2. Storage for Cast Photos
Cast member photos will be uploaded to the existing `movie-posters` storage bucket under a `cast/` folder path, reusing the same infrastructure already in place.

### 3. Admin Movie Form -- Cast Management
The movie create/edit dialog in the admin panel will be updated:
- Replace the simple "Actors (comma separated)" text input with a dynamic cast section
- Each cast entry will have:
  - Actor name (text input, with auto-suggest from existing cast_members)
  - Character name (text input, e.g., "Nina Winchester")
  - Photo upload button (circular preview)
- Admins can add/remove cast entries
- When saving, the system will:
  - Create new `cast_members` records if the actor doesn't exist yet
  - Create `movie_cast` junction records linking the actor to the movie

### 4. Movie Details Page -- Cast Display
The "Cast and Actors" section on the movie detail page will be updated to:
- Show circular profile photos (not just initials)
- Display the actor's real name below the photo
- Display the character name in smaller muted text below
- Each cast member is clickable, navigating to `/actor/:id`

### 5. New Actor Detail Page (`/actor/:id`)
A new page matching the reference design:
- Header with actor name and back button
- Tabs for "Movies" and "Series"
- Grid of movie cards (2 columns on mobile) showing all movies/series the actor appears in
- Each card shows poster, title (year), and rating badge

### 6. New Route
Add `/actor/:id` route in App.tsx.

## Technical Details

### Database Migration SQL
```text
-- Create cast_members table
CREATE TABLE public.cast_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cast_members ENABLE ROW LEVEL SECURITY;

-- RLS: Anyone can view, admins can manage
CREATE POLICY "Anyone can view cast members"
  ON public.cast_members FOR SELECT USING (true);
CREATE POLICY "Admins can insert cast members"
  ON public.cast_members FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update cast members"
  ON public.cast_members FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete cast members"
  ON public.cast_members FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Create movie_cast junction table
CREATE TABLE public.movie_cast (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id uuid NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  cast_member_id uuid NOT NULL REFERENCES public.cast_members(id) ON DELETE CASCADE,
  character_name text,
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(movie_id, cast_member_id)
);

ALTER TABLE public.movie_cast ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view movie cast"
  ON public.movie_cast FOR SELECT USING (true);
CREATE POLICY "Admins can insert movie cast"
  ON public.movie_cast FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update movie cast"
  ON public.movie_cast FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete movie cast"
  ON public.movie_cast FOR DELETE
  USING (has_role(auth.uid(), 'admin'));
```

### Files to Create
- `src/pages/ActorDetail.tsx` -- new actor page with Movies/Series tabs and grid layout
- `src/hooks/useCast.tsx` -- hooks for fetching cast members, movie cast, and actor filmography

### Files to Modify
- `src/App.tsx` -- add `/actor/:id` route
- `src/pages/admin/MoviesAdmin.tsx` -- replace actors text input with advanced cast management UI (add/remove cast entries with name, character name, photo upload)
- `src/pages/MovieDetails.tsx` -- update cast section to show photos, character names, and make clickable
- `src/types/database.ts` -- add CastMember and MovieCast type interfaces

### Data Flow
```text
Admin adds movie:
  Admin Form --> enters cast name + character + uploads photo
       |
       v
  cast_members table (create if new actor)
       |
       v
  movie_cast table (link actor to movie with character_name)

User views movie details:
  MovieDetails --> query movie_cast JOIN cast_members
       |
       v
  Display circular photos + name + character name
       |
  Click on actor --> navigate to /actor/:id

Actor detail page:
  /actor/:id --> query movie_cast for this cast_member_id
       |
       v
  JOIN movies table --> filter by content_type (movie/series)
       |
       v
  Display in 2-column grid with Movies/Series tabs
```

### Backward Compatibility
The existing `actors` text array column on the `movies` table will remain untouched so no data is lost. The new cast system runs in parallel. The movie details page will prioritize the new `movie_cast` data when available, and fall back to the old `actors` array if no cast records exist.

