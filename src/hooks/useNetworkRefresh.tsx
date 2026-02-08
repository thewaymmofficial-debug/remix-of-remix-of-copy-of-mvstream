import { useEffect, useRef } from 'react';

/**
 * Detects network/IP changes and auto-refreshes the page.
 * Uses navigator.connection change events + online/offline detection.
 */
export function useNetworkRefresh() {
  const wasOfflineRef = useRef(false);
  const lastTypeRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    // Handle coming back online after being offline
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

    // Handle connection type changes (WiFi ↔ Mobile data, IP change)
    const handleConnectionChange = () => {
      const conn = (navigator as any).connection;
      if (!conn) return;

      const currentType = conn.effectiveType || conn.type;
      
      // Skip first initialization
      if (lastTypeRef.current === undefined) {
        lastTypeRef.current = currentType;
        return;
      }

      // If connection type changed, reload
      if (lastTypeRef.current !== currentType) {
        console.log(`[Network] Connection changed: ${lastTypeRef.current} → ${currentType} — refreshing...`);
        lastTypeRef.current = currentType;
        window.location.reload();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const conn = (navigator as any).connection;
    if (conn) {
      lastTypeRef.current = conn.effectiveType || conn.type;
      conn.addEventListener('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (conn) {
        conn.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);
}
