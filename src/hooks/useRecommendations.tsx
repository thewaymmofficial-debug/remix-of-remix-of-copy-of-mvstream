import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Movie } from '@/types/database';

interface RecommendationResult {
  movie: Movie;
  reason: string;
  basedOnTitle: string;
}

// Get personalized recommendations based on watch history
export function useRecommendations(limit = 10) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recommendations', user?.id, limit],
    queryFn: async () => {
      if (!user) return [];

      // Get user's watch history
      const { data: historyData, error: historyError } = await supabase
        .from('watch_history')
        .select('movie_id, movie:movies(*)')
        .eq('user_id', user.id)
        .order('watched_at', { ascending: false })
        .limit(5);

      if (historyError) throw historyError;
      if (!historyData || historyData.length === 0) return [];

      // Extract categories, directors from watched movies
      const watchedMovieIds = new Set(historyData.map((h) => h.movie_id));
      const categories = [...new Set(
        historyData
          .map((h) => (h.movie as Movie)?.category)
          .filter(Boolean)
      )];
      const directors = [...new Set(
        historyData
          .map((h) => (h.movie as Movie)?.director)
          .filter(Boolean)
      )];

      // Find similar movies
      let query = supabase
        .from('movies')
        .select('*')
        .limit(limit * 2); // Get extra to filter out watched

      // Filter by category or director
      if (categories.length > 0 && directors.length > 0) {
        query = query.or(`category.in.(${categories.join(',')}),director.in.(${directors.join(',')})`);
      } else if (categories.length > 0) {
        query = query.in('category', categories);
      }

      const { data: recommendations, error: recError } = await query;

      if (recError) throw recError;

      // Filter out already watched movies and map with reasons
      const results: RecommendationResult[] = [];
      const baseMovie = historyData[0]?.movie as Movie;

      for (const movie of recommendations || []) {
        if (watchedMovieIds.has(movie.id)) continue;
        if (results.length >= limit) break;

        let reason = '';
        if (movie.category === baseMovie?.category) {
          reason = `Similar to ${baseMovie.title}`;
        } else if (movie.director === baseMovie?.director) {
          reason = `Also directed by ${movie.director}`;
        } else {
          reason = 'You might like';
        }

        results.push({
          movie: movie as Movie,
          reason,
          basedOnTitle: baseMovie?.title || '',
        });
      }

      return results;
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Get related movies for a specific movie
export function useRelatedMovies(movieId: string, category?: string, limit = 10) {
  return useQuery({
    queryKey: ['related-movies', movieId, category, limit],
    queryFn: async (): Promise<Movie[]> => {
      if (!category) return [];

      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .eq('category', category)
        .neq('id', movieId)
        .limit(limit);

      if (error) throw error;
      return (data || []) as Movie[];
    },
    enabled: !!movieId && !!category,
  });
}
