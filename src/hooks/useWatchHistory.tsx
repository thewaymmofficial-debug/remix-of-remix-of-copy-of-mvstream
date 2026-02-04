import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Movie } from '@/types/database';

interface WatchHistoryEntry {
  id: string;
  user_id: string;
  movie_id: string;
  episode_id: string | null;
  progress_seconds: number;
  duration_seconds: number | null;
  completed: boolean;
  watched_at: string;
  movie: Movie;
}

interface ContinueWatchingEntry extends WatchHistoryEntry {
  progress_percent: number;
}

// Fetch user's watch history (most recent first)
export function useWatchHistory(limit = 20) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['watch-history', user?.id, limit],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('watch_history')
        .select(`
          *,
          movie:movies(*)
        `)
        .eq('user_id', user.id)
        .order('watched_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as WatchHistoryEntry[];
    },
    enabled: !!user,
  });
}

// Fetch movies that are in-progress (not completed)
export function useContinueWatching() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['continue-watching', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('watch_history')
        .select(`
          *,
          movie:movies(*)
        `)
        .eq('user_id', user.id)
        .eq('completed', false)
        .gt('progress_seconds', 30) // Only show if watched more than 30 seconds
        .order('watched_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return (data || []).map((entry) => ({
        ...entry,
        progress_percent: entry.duration_seconds 
          ? Math.min((entry.progress_seconds / entry.duration_seconds) * 100, 95)
          : 0,
      })) as ContinueWatchingEntry[];
    },
    enabled: !!user,
  });
}

// Update watch progress
export function useUpdateProgress() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      movieId,
      episodeId = null,
      progressSeconds,
      durationSeconds,
    }: {
      movieId: string;
      episodeId?: string | null;
      progressSeconds: number;
      durationSeconds?: number;
    }) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('watch_history')
        .upsert({
          user_id: user.id,
          movie_id: movieId,
          episode_id: episodeId,
          progress_seconds: progressSeconds,
          duration_seconds: durationSeconds,
          completed: durationSeconds ? progressSeconds >= durationSeconds * 0.9 : false,
          watched_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,movie_id,episode_id',
        });

      if (error) throw error;

      // Increment view count
      await supabase.rpc('increment_view_count', { p_movie_id: movieId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watch-history'] });
      queryClient.invalidateQueries({ queryKey: ['continue-watching'] });
    },
  });
}

// Mark a movie as completed
export function useMarkCompleted() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      movieId,
      episodeId = null,
    }: {
      movieId: string;
      episodeId?: string | null;
    }) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('watch_history')
        .upsert({
          user_id: user.id,
          movie_id: movieId,
          episode_id: episodeId,
          completed: true,
          watched_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,movie_id,episode_id',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watch-history'] });
      queryClient.invalidateQueries({ queryKey: ['continue-watching'] });
    },
  });
}

// Clear all watch history
export function useClearHistory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('watch_history')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watch-history'] });
      queryClient.invalidateQueries({ queryKey: ['continue-watching'] });
    },
  });
}

// Remove a single item from history
export function useRemoveFromHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (historyId: string) => {
      const { error } = await supabase
        .from('watch_history')
        .delete()
        .eq('id', historyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watch-history'] });
      queryClient.invalidateQueries({ queryKey: ['continue-watching'] });
    },
  });
}
