import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Rating {
  id: string;
  user_id: string;
  movie_id: string;
  rating: number;
  created_at: string;
}

// Get user's rating for a specific movie
export function useUserRating(movieId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-rating', movieId, user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('ratings')
        .select('*')
        .eq('movie_id', movieId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Rating | null;
    },
    enabled: !!user && !!movieId,
  });
}

// Get all ratings for a movie (for display purposes)
export function useMovieRatings(movieId: string) {
  return useQuery({
    queryKey: ['movie-ratings', movieId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ratings')
        .select('rating')
        .eq('movie_id', movieId);

      if (error) throw error;
      
      const ratings = data || [];
      const total = ratings.length;
      const average = total > 0 
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / total 
        : 0;

      return { total, average };
    },
    enabled: !!movieId,
  });
}

// Rate a movie (insert or update)
export function useRateMovie() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ movieId, rating }: { movieId: string; rating: number }) => {
      if (!user) throw new Error('Must be logged in to rate');

      // Validate rating
      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      const { error } = await supabase
        .from('ratings')
        .upsert({
          user_id: user.id,
          movie_id: movieId,
          rating,
        }, {
          onConflict: 'user_id,movie_id',
        });

      if (error) throw error;
    },
    onSuccess: (_, { movieId }) => {
      queryClient.invalidateQueries({ queryKey: ['user-rating', movieId] });
      queryClient.invalidateQueries({ queryKey: ['movie-ratings', movieId] });
      queryClient.invalidateQueries({ queryKey: ['movies'] }); // To refresh average_rating
      queryClient.invalidateQueries({ queryKey: ['movie'] }); // For movie details
    },
  });
}

// Delete user's rating for a movie
export function useDeleteRating() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (movieId: string) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('ratings')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', movieId);

      if (error) throw error;
    },
    onSuccess: (_, movieId) => {
      queryClient.invalidateQueries({ queryKey: ['user-rating', movieId] });
      queryClient.invalidateQueries({ queryKey: ['movie-ratings', movieId] });
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      queryClient.invalidateQueries({ queryKey: ['movie'] });
    },
  });
}
