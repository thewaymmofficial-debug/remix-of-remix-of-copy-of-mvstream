import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Movie } from '@/types/database';

interface MovieWithViews extends Movie {
  view_count: number;
  weekly_views: number;
}

// Get trending movies based on weekly views
export function useTrendingMovies(limit = 10) {
  return useQuery({
    queryKey: ['trending-movies', limit],
    queryFn: async () => {
      // First get movie_views sorted by weekly_views
      const { data: viewsData, error: viewsError } = await supabase
        .from('movie_views')
        .select('movie_id, view_count, weekly_views')
        .order('weekly_views', { ascending: false })
        .limit(limit);

      if (viewsError) throw viewsError;
      if (!viewsData || viewsData.length === 0) {
        // If no view data, return latest movies instead
        const { data: latestMovies, error: latestError } = await supabase
          .from('movies')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (latestError) throw latestError;
        return (latestMovies || []).map((m) => ({
          ...m,
          view_count: 0,
          weekly_views: 0,
        })) as MovieWithViews[];
      }

      // Get movie details for the trending movies
      const movieIds = viewsData.map((v: any) => v.movie_id);
      const { data: movies, error: moviesError } = await supabase
        .from('movies')
        .select('*')
        .in('id', movieIds);

      if (moviesError) throw moviesError;

      // Combine movie data with view counts and maintain order
      const movieMap = new Map((movies || []).map((m) => [m.id, m]));
      return viewsData
        .map((v: any) => {
          const movie = movieMap.get(v.movie_id);
          if (!movie) return null;
          return {
            ...movie,
            view_count: v.view_count,
            weekly_views: v.weekly_views,
          };
        })
        .filter(Boolean) as MovieWithViews[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get most viewed movies of all time
export function useMostViewedMovies(limit = 10) {
  return useQuery({
    queryKey: ['most-viewed-movies', limit],
    queryFn: async () => {
      const { data: viewsData, error: viewsError } = await supabase
        .from('movie_views')
        .select('movie_id, view_count, weekly_views')
        .order('view_count', { ascending: false })
        .limit(limit);

      if (viewsError) throw viewsError;
      if (!viewsData || viewsData.length === 0) return [];

      const movieIds = viewsData.map((v: any) => v.movie_id);
      const { data: movies, error: moviesError } = await supabase
        .from('movies')
        .select('*')
        .in('id', movieIds);

      if (moviesError) throw moviesError;

      const movieMap = new Map((movies || []).map((m) => [m.id, m]));
      return viewsData
        .map((v: any) => {
          const movie = movieMap.get(v.movie_id);
          if (!movie) return null;
          return {
            ...movie,
            view_count: v.view_count,
            weekly_views: v.weekly_views,
          };
        })
        .filter(Boolean) as MovieWithViews[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Admin: Get view analytics
export function useViewAnalytics() {
  return useQuery({
    queryKey: ['view-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movie_views')
        .select(`
          movie_id,
          view_count,
          weekly_views,
          last_viewed_at
        `)
        .order('view_count', { ascending: false })
        .limit(50);

      if (error) throw error;

      const totalViews = (data || []).reduce((sum, m: any) => sum + m.view_count, 0);
      const weeklyViews = (data || []).reduce((sum, m: any) => sum + m.weekly_views, 0);

      return {
        topMovies: data || [],
        totalViews,
        weeklyViews,
      };
    },
  });
}
