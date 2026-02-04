

# Database Portability - Easy Supabase Project Switching

This plan enables you to easily switch to a new Supabase project and have all tables, functions, and configurations automatically created.

---

## Current Situation

Your project has **10 migration files** in `supabase/migrations/` that define:
- 11 database tables (profiles, user_roles, movies, watchlist, categories, seasons, episodes, site_settings, watch_history, movie_views, ratings)
- 8 database functions (has_role, get_user_role, update_updated_at_column, handle_new_user, is_premium_active, validate_rating, update_movie_rating, increment_view_count, reset_weekly_views)
- Multiple triggers and RLS policies
- Storage bucket configuration
- Default data (categories, site settings, sample movies)

---

## Solution: Combined Migration Script + Admin Setup Tool

### Phase 1: Create Master Migration File

Consolidate all migrations into a single comprehensive SQL file that can be run on any fresh Supabase project.

**New File: `supabase/migrations/complete_schema.sql`**

This file will contain:
1. All table definitions in correct order (respecting dependencies)
2. All enum types
3. All functions and triggers
4. All RLS policies
5. Storage bucket setup
6. Default seed data (categories, site settings)

### Phase 2: Create Setup Documentation

**New File: `docs/SUPABASE_SETUP.md`**

Clear instructions for switching databases:
1. Create new Supabase project
2. Run the master migration via SQL Editor
3. Update environment variables
4. Create first admin user

### Phase 3: Admin Database Setup Tool

**New Component: `src/pages/admin/DatabaseSetup.tsx`**

A protected admin page that:
- Shows current database status (which tables exist)
- Displays missing tables/functions
- Provides one-click setup for missing components
- Validates the database is properly configured

### Phase 4: Automatic Schema Validation

**New Hook: `src/hooks/useDatabaseHealth.tsx`**

Checks database connectivity and table existence on app load:
- Verifies required tables exist
- Shows helpful error if database isn't configured
- Links to setup instructions

---

## Technical Implementation

### File 1: Complete Schema Migration

```text
supabase/complete_schema.sql
```

Contains the consolidated SQL with sections:
1. **Enums** - app_role type
2. **Core Tables** - profiles, user_roles, movies, categories
3. **Content Tables** - seasons, episodes, watchlist
4. **Engagement Tables** - watch_history, movie_views, ratings
5. **Settings Tables** - site_settings
6. **Functions** - All utility functions
7. **Triggers** - Updated_at triggers, rating triggers, user creation
8. **RLS Policies** - All row-level security
9. **Storage** - Bucket creation
10. **Seed Data** - Default categories and settings

### File 2: Setup Documentation

```text
docs/SUPABASE_SETUP.md
```

Step-by-step guide:
- Prerequisites (Supabase account)
- Creating a new project
- Running the migration
- Updating .env file
- Testing the connection
- Creating the first admin

### File 3: Database Health Hook

```typescript
// src/hooks/useDatabaseHealth.tsx
- Query to check if core tables exist
- Returns { isReady, missingTables, error }
- Used by App.tsx to show setup message if needed
```

### File 4: Environment Configuration

```text
.env.example
```

Template file showing required variables:
- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_KEY

---

## Switching Process (After Implementation)

When you want to use a new Supabase database:

1. **Create New Supabase Project**
   - Go to supabase.com and create project
   - Note the project URL and anon key

2. **Run Schema Migration**
   - Open SQL Editor in Supabase dashboard
   - Paste contents of `complete_schema.sql`
   - Execute the migration

3. **Update Environment Variables**
   - Edit `.env` file with new credentials
   - Restart the development server

4. **Create Admin User**
   - Sign up with your email
   - Run SQL to promote to admin:
   ```sql
   UPDATE public.user_roles 
   SET role = 'admin' 
   WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your@email.com');
   ```

5. **Verify**
   - Check admin panel access
   - Import your content

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/complete_schema.sql` | Master migration with all schema |
| `docs/SUPABASE_SETUP.md` | Step-by-step setup guide |
| `.env.example` | Template for environment variables |
| `src/hooks/useDatabaseHealth.tsx` | Connection and schema validator |
| `src/components/DatabaseSetupGuide.tsx` | UI for setup instructions |

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add database health check on startup |

---

## Master Schema SQL Structure

The complete_schema.sql will be organized as:

```sql
-- ============================================
-- CENIVERSE DATABASE SCHEMA
-- Run this SQL on a fresh Supabase project
-- ============================================

-- 1. ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'premium', 'free_user');

-- 2. CORE TABLES
CREATE TABLE public.profiles (...);
CREATE TABLE public.user_roles (...);
CREATE TABLE public.movies (...);
CREATE TABLE public.categories (...);

-- 3. CONTENT TABLES
CREATE TABLE public.seasons (...);
CREATE TABLE public.episodes (...);
CREATE TABLE public.watchlist (...);

-- 4. ENGAGEMENT TABLES
CREATE TABLE public.watch_history (...);
CREATE TABLE public.movie_views (...);
CREATE TABLE public.ratings (...);

-- 5. SETTINGS
CREATE TABLE public.site_settings (...);

-- 6. FUNCTIONS
CREATE OR REPLACE FUNCTION public.has_role(...);
CREATE OR REPLACE FUNCTION public.get_user_role(...);
-- ... more functions

-- 7. TRIGGERS
CREATE TRIGGER on_auth_user_created ...;
-- ... more triggers

-- 8. RLS POLICIES
-- All table policies...

-- 9. STORAGE
INSERT INTO storage.buckets (...);

-- 10. SEED DATA
INSERT INTO public.categories (...);
INSERT INTO public.site_settings (...);
```

---

## Benefits

- **One-Command Setup**: Copy-paste single SQL file to set up entire database
- **Version Controlled**: Schema file stays in your repository
- **Self-Documenting**: Clear documentation for future reference
- **Validation**: App checks database health on startup
- **Flexibility**: Easy to move between Supabase projects

---

## Important Notes

1. **Data Migration**: This setup is for **schema only**. Your actual content (movies, users, etc.) will not transfer automatically. You would need to export/import data separately.

2. **Auth Trigger**: The `on_auth_user_created` trigger uses `auth.users` table which is managed by Supabase. This will work automatically on any Supabase project.

3. **Storage Policies**: Storage bucket policies reference the same bucket name, so they'll work on any project.

4. **Environment Security**: Never commit actual credentials to `.env` - only the `.env.example` template.

