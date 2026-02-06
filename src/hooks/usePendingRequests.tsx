import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePendingRequestCount() {
  const { data: count = 0 } = useQuery({
    queryKey: ['pending-premium-requests-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('premium_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) {
        console.error('Error fetching pending requests count:', error);
        return 0;
      }
      return count || 0;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return count;
}
