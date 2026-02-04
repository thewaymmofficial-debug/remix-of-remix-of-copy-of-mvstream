-- ============================================
-- CENIVERSE DATABASE SCHEMA
-- Complete schema for fresh Supabase projects
-- 
-- USAGE: Copy and paste this entire file into
-- your Supabase SQL Editor and execute it.
-- ============================================

-- ============================================
-- 1. ENUMS
-- ============================================

CREATE TYPE public.app_role AS ENUM ('admin', 'premium', 'free_user');

-- ============================================
-- 2. CORE TABLES
-- ============================================

-- Profiles table for user information
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'free_user',
    premium_type TEXT DEFAULT NULL,
    premium_started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    premium_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

COMMENT ON COLUMN public.user_roles.premium_type IS 'Values: monthly, yearly, lifetime, or NULL for non-premium users';

-- Movies table
CREATE TABLE public.movies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    director TEXT,
    actors TEXT[] DEFAULT '{}',
    year INTEGER,
    category TEXT NOT NULL DEFAULT 'Action',
    resolution TEXT DEFAULT '1080p',
    file_size TEXT,
    poster_url TEXT,
    backdrop_url TEXT,
    stream_url TEXT,
    telegram_url TEXT,
    mega_url TEXT,
    is_premium BOOLEAN NOT NULL DEFAULT false,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    content_type TEXT NOT NULL DEFAULT 'movie' CHECK (content_type IN ('movie', 'series')),
    average_rating DECIMAL(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Categories table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- 3. CONTENT TABLES
-- ============================================

-- Seasons table for series
CREATE TABLE public.seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movie_id UUID NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
    season_number INTEGER NOT NULL,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(movie_id, season_number)
);

-- Episodes table
CREATE TABLE public.episodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
    episode_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    duration TEXT,
    air_date DATE,
    thumbnail_url TEXT,
    stream_url TEXT,
    telegram_url TEXT,
    mega_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(season_id, episode_number)
);

-- Watchlist table
CREATE TABLE public.watchlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    movie_id UUID NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, movie_id)
);

-- ============================================
-- 4. ENGAGEMENT TABLES
-- ============================================

-- Watch History - Tracks viewing progress and history
CREATE TABLE public.watch_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE NOT NULL,
    episode_id UUID REFERENCES public.episodes(id) ON DELETE CASCADE,
    progress_seconds INTEGER DEFAULT 0,
    duration_seconds INTEGER,
    completed BOOLEAN DEFAULT false,
    watched_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, movie_id, episode_id)
);

-- Movie Views for Trending
CREATE TABLE public.movie_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE UNIQUE NOT NULL,
    view_count INTEGER DEFAULT 0,
    week_views INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ratings table
CREATE TABLE public.ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, movie_id)
);

-- ============================================
-- 5. SETTINGS TABLE
-- ============================================

CREATE TABLE public.site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- 6. FUNCTIONS
-- ============================================

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role
    FROM public.user_roles
    WHERE user_id = _user_id
    LIMIT 1
$$;

-- Trigger function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger to create profile and assign default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'free_user');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to check if premium has expired
CREATE OR REPLACE FUNCTION public.is_premium_active(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = 'premium'
          AND (
            premium_type = 'lifetime'
            OR premium_expires_at IS NULL
            OR premium_expires_at > now()
          )
    )
$$;

-- Validation trigger for ratings (1-5 range)
CREATE OR REPLACE FUNCTION public.validate_rating()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.rating < 1 OR NEW.rating > 5 THEN
        RAISE EXCEPTION 'Rating must be between 1 and 5';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Function to update movie average rating
CREATE OR REPLACE FUNCTION public.update_movie_rating()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE public.movies
        SET average_rating = COALESCE((
            SELECT AVG(rating)::decimal(3,2) FROM public.ratings WHERE movie_id = OLD.movie_id
        ), 0),
        rating_count = (SELECT COUNT(*) FROM public.ratings WHERE movie_id = OLD.movie_id)
        WHERE id = OLD.movie_id;
        RETURN OLD;
    ELSE
        UPDATE public.movies
        SET average_rating = COALESCE((
            SELECT AVG(rating)::decimal(3,2) FROM public.ratings WHERE movie_id = NEW.movie_id
        ), 0),
        rating_count = (SELECT COUNT(*) FROM public.ratings WHERE movie_id = NEW.movie_id)
        WHERE id = NEW.movie_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_view_count(p_movie_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.movie_views (movie_id, view_count, week_views, last_updated)
    VALUES (p_movie_id, 1, 1, now())
    ON CONFLICT (movie_id) DO UPDATE
    SET view_count = movie_views.view_count + 1,
        week_views = movie_views.week_views + 1,
        last_updated = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to reset weekly views (to be called by a cron job)
CREATE OR REPLACE FUNCTION public.reset_weekly_views()
RETURNS VOID AS $$
BEGIN
    UPDATE public.movie_views SET week_views = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 7. TRIGGERS
-- ============================================

-- Updated_at triggers
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_movies_updated_at
BEFORE UPDATE ON public.movies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auth trigger for new user registration
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Rating validation trigger
CREATE TRIGGER validate_rating_trigger
BEFORE INSERT OR UPDATE ON public.ratings
FOR EACH ROW EXECUTE FUNCTION public.validate_rating();

-- Auto-update movie rating trigger
CREATE TRIGGER update_movie_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.ratings
FOR EACH ROW EXECUTE FUNCTION public.update_movie_rating();

-- ============================================
-- 8. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movie_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 9. RLS POLICIES
-- ============================================

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view their own role"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Movies policies
CREATE POLICY "Anyone can view movies"
ON public.movies FOR SELECT
USING (true);

CREATE POLICY "Admins can insert movies"
ON public.movies FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update movies"
ON public.movies FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete movies"
ON public.movies FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Categories policies
CREATE POLICY "Anyone can view categories"
ON public.categories FOR SELECT
USING (true);

CREATE POLICY "Admins can insert categories"
ON public.categories FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update categories"
ON public.categories FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete categories"
ON public.categories FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Seasons policies
CREATE POLICY "Anyone can view seasons"
ON public.seasons FOR SELECT
USING (true);

CREATE POLICY "Admins can insert seasons"
ON public.seasons FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update seasons"
ON public.seasons FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete seasons"
ON public.seasons FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Episodes policies
CREATE POLICY "Anyone can view episodes"
ON public.episodes FOR SELECT
USING (true);

CREATE POLICY "Admins can insert episodes"
ON public.episodes FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update episodes"
ON public.episodes FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete episodes"
ON public.episodes FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Watchlist policies
CREATE POLICY "Users can view their own watchlist"
ON public.watchlist FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their own watchlist"
ON public.watchlist FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their own watchlist"
ON public.watchlist FOR DELETE
USING (auth.uid() = user_id);

-- Watch history policies
CREATE POLICY "Users can view own history"
ON public.watch_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history"
ON public.watch_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own history"
ON public.watch_history FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own history"
ON public.watch_history FOR DELETE
USING (auth.uid() = user_id);

-- Movie views policies
CREATE POLICY "Anyone can view counts"
ON public.movie_views FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert views"
ON public.movie_views FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update views"
ON public.movie_views FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Ratings policies
CREATE POLICY "Anyone can view ratings"
ON public.ratings FOR SELECT
USING (true);

CREATE POLICY "Users can rate"
ON public.ratings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rating"
ON public.ratings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own rating"
ON public.ratings FOR DELETE
USING (auth.uid() = user_id);

-- Site settings policies
CREATE POLICY "Anyone can read site settings"
ON public.site_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can update site settings"
ON public.site_settings FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert site settings"
ON public.site_settings FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete site settings"
ON public.site_settings FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 10. INDEXES
-- ============================================

CREATE INDEX idx_watchlist_user_id ON public.watchlist(user_id);
CREATE INDEX idx_watchlist_movie_id ON public.watchlist(movie_id);
CREATE INDEX idx_seasons_movie_id ON public.seasons(movie_id);
CREATE INDEX idx_episodes_season_id ON public.episodes(season_id);

-- ============================================
-- 11. STORAGE BUCKET
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('movie-posters', 'movie-posters', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view movie posters"
ON storage.objects FOR SELECT
USING (bucket_id = 'movie-posters');

CREATE POLICY "Authenticated users can upload movie posters"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'movie-posters' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update movie posters"
ON storage.objects FOR UPDATE
USING (bucket_id = 'movie-posters' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete movie posters"
ON storage.objects FOR DELETE
USING (bucket_id = 'movie-posters' AND auth.role() = 'authenticated');

-- ============================================
-- 12. SEED DATA - Default Categories
-- ============================================

INSERT INTO public.categories (name, display_order) VALUES
    ('Latest', 1),
    ('Action', 2),
    ('K-Drama', 3),
    ('Hollywood', 4),
    ('Thriller', 5),
    ('Comedy', 6),
    ('Romance', 7),
    ('Horror', 8),
    ('Sci-Fi', 9),
    ('Documentary', 10),
    ('Animation', 11),
    ('Drama', 12);

-- ============================================
-- 13. SEED DATA - Default Site Settings
-- ============================================

INSERT INTO public.site_settings (key, value) VALUES
('admin_contacts', '{
    "telegram": {"handle": "@onedove", "url": "https://t.me/onedove"},
    "viber": {"number": "09883249943", "url": "viber://chat?number=09883249943"},
    "email": {"address": "thewaymmofficial@gmail.com", "url": "mailto:thewaymmofficial@gmail.com?subject=Premium%20Subscription%20Inquiry"}
}'::jsonb),
('subscription_prices', '{
    "monthly": {"mmk": 2000, "usd": 0.5, "label": "1 Month"},
    "yearly": {"mmk": 20000, "usd": 5, "label": "1 Year"},
    "lifetime": {"mmk": 40000, "usd": 10, "label": "Lifetime"}
}'::jsonb);

-- ============================================
-- SETUP COMPLETE!
-- 
-- Next steps:
-- 1. Create an admin user by signing up
-- 2. Run this SQL to promote to admin:
--    UPDATE public.user_roles 
--    SET role = 'admin' 
--    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your@email.com');
-- ============================================
