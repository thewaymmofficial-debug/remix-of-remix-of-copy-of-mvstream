import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const TABLE_QUERY_MAP: Record<string, string[]> = {
  movies: ['movies', 'movie', 'trending-movies', 'most-viewed-movies', 'related-movies', 'featured-all'],
  site_settings: ['site-settings'],
  categories: ['categories'],
  tv_channels: ['channels', 'broken-channels', 'direct-channels', 'direct-channels-active'],
  football_videos: ['football-videos', 'football-categories'],
  info_slides: ['info-slides'],
  pricing_plans: ['pricing-plans'],
  payment_methods: ['payment-methods'],
};

export function useRealtimeSync() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const appVersionRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Fetch initial app_version
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'app_version')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          appVersionRef.current = data.value;
        }
      });

    const channel = supabase
      .channel('realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'movies' },
        () => invalidateKeys('movies')
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_settings' },
        (payload) => {
          invalidateKeys('site_settings');
          handleVersionCheck(payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        () => invalidateKeys('categories')
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tv_channels' },
        () => invalidateKeys('tv_channels')
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'football_videos' },
        () => invalidateKeys('football_videos')
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'info_slides' },
        () => invalidateKeys('info_slides')
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pricing_plans' },
        () => invalidateKeys('pricing_plans')
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payment_methods' },
        () => invalidateKeys('payment_methods')
      )
      .subscribe();

    function invalidateKeys(table: string) {
      const keys = TABLE_QUERY_MAP[table] || [];
      keys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
    }

    function handleVersionCheck(payload: any) {
      const record = payload.new as { key?: string; value?: string } | undefined;
      if (!record || record.key !== 'app_version') return;
      if (appVersionRef.current && record.value && record.value !== appVersionRef.current) {
        toast({
          title: '🔄 New Update Available',
          description: 'A new version is available. Tap to refresh.',
          duration: Infinity,
          action: (
            <button
              onClick={() => window.location.reload()}
              className="rounded bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
            >
              Refresh
            </button>
          ),
        });
      }
    }

    return () => {
      supabase.removeChannel(channel);
      initializedRef.current = false;
    };
  }, [queryClient, toast]);
}
