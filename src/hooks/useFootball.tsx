import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FootballVideo {
  id: string;
  title: string;
  thumbnail_url: string | null;
  stream_url: string | null;
  download_url: string | null;
  category: string;
  is_premium: boolean;
  is_live: boolean;
  created_at: string;
  updated_at: string;
}

export function useFootballVideos(category?: string) {
  return useQuery({
    queryKey: ['football-videos', category],
    queryFn: async () => {
      let query = supabase
        .from('football_videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as FootballVideo[];
    },
  });
}

export function useFootballCategories() {
  return useQuery({
    queryKey: ['football-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('football_videos')
        .select('category');
      if (error) throw error;
      const cats = [...new Set((data || []).map((d: any) => d.category))];
      return cats.sort();
    },
  });
}

export function useCreateFootballVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (video: Omit<FootballVideo, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('football_videos')
        .insert(video)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['football-videos'] });
      qc.invalidateQueries({ queryKey: ['football-categories'] });
    },
  });
}

export function useUpdateFootballVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FootballVideo> & { id: string }) => {
      const { data, error } = await supabase
        .from('football_videos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['football-videos'] });
      qc.invalidateQueries({ queryKey: ['football-categories'] });
    },
  });
}

export function useDeleteFootballVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('football_videos')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['football-videos'] });
      qc.invalidateQueries({ queryKey: ['football-categories'] });
    },
  });
}
