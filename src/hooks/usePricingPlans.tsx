import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PricingPlan {
  id: string;
  duration: string;
  duration_days: number;
  price: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function usePricingPlans() {
  return useQuery({
    queryKey: ['pricing-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_plans')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as PricingPlan[];
    },
  });
}

export function useUpsertPricingPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (plan: Partial<PricingPlan> & { duration: string; price: string }) => {
      if (plan.id) {
        const { error } = await supabase
          .from('pricing_plans')
          .update(plan)
          .eq('id', plan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('pricing_plans')
          .insert(plan);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-plans'] });
      toast.success('Pricing plan saved');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeletePricingPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pricing_plans').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-plans'] });
      toast.success('Pricing plan deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
