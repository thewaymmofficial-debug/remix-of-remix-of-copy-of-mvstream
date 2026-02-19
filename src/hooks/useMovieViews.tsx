import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useMovieViews(movieId: string) {
  return useQuery({
    queryKey: ['movie-views', movieId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movie_views')
        .select('view_count')
        .eq('movie_id', movieId)
        .maybeSingle();

      if (error) throw error;
      return data?.view_count ?? 0;
    },
    enabled: !!movieId,
  });
}

export function useIncrementView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (movieId: string) => {
      const { error } = await supabase.rpc('increment_view_count', { _movie_id: movieId });
      if (error) throw error;
    },
    onSuccess: (_, movieId) => {
      queryClient.invalidateQueries({ queryKey: ['movie-views', movieId] });
    },
  });
}
