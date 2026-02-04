import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AdminContacts {
  telegram: { handle: string; url: string };
  viber: { number: string; url: string };
  email: { address: string; url: string };
}

export interface SubscriptionPrice {
  mmk: number;
  usd: number;
  label: string;
}

export interface SubscriptionPrices {
  monthly: SubscriptionPrice;
  yearly: SubscriptionPrice;
  lifetime: SubscriptionPrice;
}

export function useSiteSettings() {
  return useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value');

      if (error) throw error;

      const settings: Record<string, any> = {};
      data?.forEach((item) => {
        settings[item.key] = item.value;
      });

      return {
        adminContacts: settings['admin_contacts'] as AdminContacts | undefined,
        subscriptionPrices: settings['subscription_prices'] as SubscriptionPrices | undefined,
      };
    },
  });
}

export function useUpdateSiteSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase
        .from('site_settings')
        .update({ value })
        .eq('key', key);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast({
        title: 'Settings Updated',
        description: 'Site settings have been saved successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update settings. Please try again.',
        variant: 'destructive',
      });
    },
  });
}
