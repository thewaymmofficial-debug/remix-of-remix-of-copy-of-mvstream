import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Polls the user_devices table to check if the current device is still registered.
 * If the device has been removed (kicked), it auto-signs out the user.
 */
export function useDevicePresence(
  userId: string | undefined,
  isPremiumOrAdmin: boolean,
  deviceId: string
) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Only track for premium/admin users who are logged in
    if (!userId || !isPremiumOrAdmin) return;

    const checkPresence = async () => {
      try {
        const { data, error } = await supabase
          .from('user_devices')
          .select('id')
          .eq('user_id', userId)
          .eq('device_id', deviceId)
          .maybeSingle();

        if (error) {
          console.error('Device presence check error:', error);
          return;
        }

        // Device was removed — force sign out
        if (!data) {
          console.log('Device was kicked, signing out...');
          clearInterval(intervalRef.current!);
          await supabase.auth.signOut();
          window.location.href = '/auth';
        }
      } catch (err) {
        console.error('Device presence check failed:', err);
      }
    };

    // Check every 10 seconds
    intervalRef.current = setInterval(checkPresence, 10000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [userId, isPremiumOrAdmin, deviceId]);
}
