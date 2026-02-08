import { useEffect, useRef } from 'react';

/**
 * Detects when the user goes offline and comes back online,
 * then auto-refreshes the page. Does NOT refresh on every
 * connection type change to avoid aggressive reloading.
 */
export function useNetworkRefresh() {
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    const handleOnline = () => {
      if (wasOfflineRef.current) {
        wasOfflineRef.current = false;
        console.log('[Network] Back online — refreshing...');
        window.location.reload();
      }
    };

    const handleOffline = () => {
      wasOfflineRef.current = true;
      console.log('[Network] Went offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
}
