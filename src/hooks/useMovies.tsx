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
