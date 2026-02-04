import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Movie, MovieInsert, MovieUpdate } from '@/types/database';

export function useMovies(category?: string) {
  return useQuery({
    queryKey: ['movies', category],
    queryFn: async () => {
      let query = supabase
        .from('movies')
        .select('*')
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Movie[];
    },
  });
}

export function useFeaturedMovie() {
  return useQuery({
    queryKey: ['movies', 'featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .eq('is_featured', true)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as Movie | null;
    },
  });
}

export function useFeaturedMovies() {
  return useQuery({
    queryKey: ['movies', 'featured-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .eq('is_featured', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Movie[];
    },
  });
}

export function useMovie(id: string) {
  return useQuery({
    queryKey: ['movie', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Movie;
    },
    enabled: !!id,
  });
}

export function useMoviesByCategory() {
  return useQuery({
    queryKey: ['movies', 'by-category'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by category
      const grouped = (data as Movie[]).reduce((acc, movie) => {
        const cat = movie.category || 'Other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(movie);
        return acc;
      }, {} as Record<string, Movie[]>);

      return grouped;
    },
  });
}

export function useCreateMovie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (movie: MovieInsert) => {
      const { data, error } = await supabase
        .from('movies')
        .insert(movie)
        .select()
        .single();

      if (error) throw error;
      return data as Movie;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movies'] });
    },
  });
}

export function useUpdateMovie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...movie }: MovieUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('movies')
        .update(movie)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Movie;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      queryClient.invalidateQueries({ queryKey: ['movie', data.id] });
    },
  });
}

export function useDeleteMovie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('movies')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movies'] });
    },
  });
}

// Watchlist hooks
export function useWatchlist() {
  return useQuery({
    queryKey: ['watchlist'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('watchlist')
        .select(`
          id,
          movie_id,
          created_at,
          movie:movies(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Array<{
        id: string;
        movie_id: string;
        created_at: string;
        movie: Movie;
      }>;
    },
  });
}

export function useIsInWatchlist(movieId: string) {
  return useQuery({
    queryKey: ['watchlist', movieId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('watchlist')
        .select('id')
        .eq('user_id', user.id)
        .eq('movie_id', movieId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!movieId,
  });
}

export function useAddToWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (movieId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('watchlist')
        .insert({ user_id: user.id, movie_id: movieId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, movieId) => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      queryClient.invalidateQueries({ queryKey: ['watchlist', movieId] });
    },
  });
}

export function useRemoveFromWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (movieId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', movieId);

      if (error) throw error;
    },
    onSuccess: (_, movieId) => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      queryClient.invalidateQueries({ queryKey: ['watchlist', movieId] });
    },
  });
}
