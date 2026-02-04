import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['watchlist', user?.id],
    queryFn: async () => {
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
    enabled: !!user,
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
  });
}

export function useIsInWatchlist(movieId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['watchlist', user?.id, movieId],
    queryFn: async () => {
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
    enabled: !!user && !!movieId,
  });
}

export function useAddToWatchlist() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (movieId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('watchlist')
        .insert({ user_id: user.id, movie_id: movieId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (movieId) => {
      if (!user) return;
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['watchlist', user.id, movieId] });
      
      // Snapshot previous value
      const previousValue = queryClient.getQueryData(['watchlist', user.id, movieId]);
      
      // Optimistically update to show in watchlist immediately
      queryClient.setQueryData(['watchlist', user.id, movieId], true);
      
      return { previousValue };
    },
    onError: (err, movieId, context) => {
      if (!user) return;
      // Rollback on error
      queryClient.setQueryData(['watchlist', user.id, movieId], context?.previousValue);
    },
    onSettled: (_, __, movieId) => {
      if (!user) return;
      queryClient.invalidateQueries({ queryKey: ['watchlist', user.id] });
      queryClient.invalidateQueries({ queryKey: ['watchlist', user.id, movieId] });
    },
  });
}

export function useRemoveFromWatchlist() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (movieId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', movieId);

      if (error) throw error;
    },
    onMutate: async (movieId) => {
      if (!user) return;
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['watchlist', user.id, movieId] });
      
      // Snapshot previous value
      const previousValue = queryClient.getQueryData(['watchlist', user.id, movieId]);
      
      // Optimistically update to show removed immediately
      queryClient.setQueryData(['watchlist', user.id, movieId], false);
      
      return { previousValue };
    },
    onError: (err, movieId, context) => {
      if (!user) return;
      // Rollback on error
      queryClient.setQueryData(['watchlist', user.id, movieId], context?.previousValue);
    },
    onSettled: (_, __, movieId) => {
      if (!user) return;
      queryClient.invalidateQueries({ queryKey: ['watchlist', user.id] });
      queryClient.invalidateQueries({ queryKey: ['watchlist', user.id, movieId] });
    },
  });
}
