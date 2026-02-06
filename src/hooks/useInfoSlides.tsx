import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface InfoSlide {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  bg_color: string;
  accent_color: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useInfoSlides() {
  return useQuery({
    queryKey: ['info-slides'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('info_slides')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as InfoSlide[];
    },
  });
}

export function useAllInfoSlides() {
  return useQuery({
    queryKey: ['info-slides-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('info_slides')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as InfoSlide[];
    },
  });
}

export function useCreateInfoSlide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (slide: Omit<InfoSlide, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('info_slides')
        .insert(slide)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['info-slides'] });
      queryClient.invalidateQueries({ queryKey: ['info-slides-admin'] });
      toast.success('Slide created successfully');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateInfoSlide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InfoSlide> & { id: string }) => {
      const { data, error } = await supabase
        .from('info_slides')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['info-slides'] });
      queryClient.invalidateQueries({ queryKey: ['info-slides-admin'] });
      toast.success('Slide updated');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteInfoSlide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('info_slides')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['info-slides'] });
      queryClient.invalidateQueries({ queryKey: ['info-slides-admin'] });
      toast.success('Slide deleted');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
