# Supabase Database Setup Guide

This guide explains how to set up a new Supabase project for Ceniverse or switch to a different database.

## Prerequisites

- A [Supabase](https://supabase.com) account
- Access to the project source code

---

## Quick Setup (5 minutes)

### Step 1: Create a New Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Enter a project name (e.g., "ceniverse")
4. Set a secure database password (save this!)
5. Choose your preferred region
6. Click **Create new project**
7. Wait for the project to be provisioned (~2 minutes)

### Step 2: Run the Schema Migration

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Open the file `supabase/complete_schema.sql` from this repository
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Verify all statements executed successfully (green checkmarks)

### Step 3: Update Environment Variables

1. In your Supabase dashboard, go to **Settings > API**
2. Copy the **Project URL** (looks like `https://xxxxx.supabase.co`)
3. Copy the **anon/public** key
4. Update your `.env` file:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
VITE_SUPABASE_PROJECT_ID=your-project-id
```

### Step 4: Create Your Admin Account

1. Start the development server: `npm run dev`
2. Open the app and **Sign Up** with your email
3. Verify your email (check inbox/spam)
4. Run this SQL in the Supabase SQL Editor to promote yourself to admin:

```sql
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your@email.com');
```

### Step 5: Verify Setup

1. Refresh the app
2. Check that you can access the Admin panel (`/admin`)
3. Try adding a movie to verify write permissions

---

## What Gets Created

The schema migration creates:

### Tables (11)
| Table | Purpose |
|-------|---------|
| `profiles` | User profile information |
| `user_roles` | User roles (admin, premium, free_user) |
| `movies` | Movies and series metadata |
| `categories` | Content categories |
| `seasons` | Series seasons |
| `episodes` | Series episodes |
| `watchlist` | User watchlists |
| `watch_history` | Viewing progress tracking |
| `movie_views` | View counts for trending |
| `ratings` | User ratings (1-5 stars) |
| `site_settings` | Admin-configurable settings |

### Functions (8)
- `has_role()` - Check if user has a role
- `get_user_role()` - Get user's role
- `update_updated_at_column()` - Auto-update timestamps
- `handle_new_user()` - Create profile on signup
- `is_premium_active()` - Check premium status
- `validate_rating()` - Ensure ratings are 1-5
- `update_movie_rating()` - Calculate average ratings
- `increment_view_count()` - Track movie views

### Storage
- `movie-posters` bucket (public)

### Default Data
- 12 default categories
- Admin contact settings
- Subscription price settings

---

## Troubleshooting

### "Permission denied" errors
- Make sure you're logged in
- Verify your user has the admin role
- Check that RLS policies were created correctly

### "Table does not exist" errors
- The migration may have failed partially
- Check the SQL Editor output for errors
- Try running sections of the migration separately

### Auth not working
- Ensure the `on_auth_user_created` trigger was created
- Check Supabase Auth settings (Email provider should be enabled)

### Storage upload fails
- Verify the `movie-posters` bucket exists
- Check storage policies were created

---

## Data Migration

The schema migration only creates the structure. To migrate data from another project:

### Export Data (from old project)
```sql
-- Export movies
COPY (SELECT * FROM public.movies) TO STDOUT WITH CSV HEADER;

-- Export categories
COPY (SELECT * FROM public.categories) TO STDOUT WITH CSV HEADER;
```

### Import Data (to new project)
Use the Supabase Table Editor's CSV import feature, or use the Admin panel's Bulk Import tool.

---

## Security Notes

1. **Never commit `.env` files** - Use `.env.example` as a template
2. **Service role key** - Never expose this in frontend code
3. **RLS policies** - All tables have Row Level Security enabled
4. **Admin role** - Only grant admin to trusted users

---

## Updating the Schema

If you need to modify the database schema:

1. Create a new migration file in `supabase/migrations/`
2. Update `complete_schema.sql` to include the changes
3. For existing databases, run only the new migration
4. For new databases, the complete schema already includes all changes

---

## Quick Reference

### Promote User to Admin
```sql
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@email.com');
```

### Demote Admin to Free User
```sql
UPDATE public.user_roles 
SET role = 'free_user' 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@email.com');
```

### Grant Premium Access (1 year)
```sql
UPDATE public.user_roles 
SET role = 'premium',
    premium_type = 'yearly',
    premium_started_at = now(),
    premium_expires_at = now() + interval '1 year'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@email.com');
```

### Reset Weekly Trending
```sql
SELECT public.reset_weekly_views();
```
