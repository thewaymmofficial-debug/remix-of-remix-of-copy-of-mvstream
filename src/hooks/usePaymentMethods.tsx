import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PaymentMethod {
  id: string;
  name: string;
  account_number: string;
  account_name: string;
  gradient: string;
  text_color: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as PaymentMethod[];
    },
  });
}

export function useUpsertPaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (method: Partial<PaymentMethod> & { name: string; account_number: string; account_name: string }) => {
      if (method.id) {
        const { error } = await supabase
          .from('payment_methods')
          .update(method)
          .eq('id', method.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('payment_methods')
          .insert(method);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      toast.success('Payment method saved');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeletePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('payment_methods').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      toast.success('Payment method deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
