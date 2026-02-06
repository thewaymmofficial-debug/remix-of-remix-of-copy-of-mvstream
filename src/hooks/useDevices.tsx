import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserDevice {
  id: string;
  user_id: string;
  device_name: string;
  device_id: string;
  last_active_at: string;
  created_at: string;
}

// Parse user agent into a friendly device name
function parseDeviceName(): string {
  const ua = navigator.userAgent;
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  // Detect browser
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

  // Detect OS
  if (ua.includes('iPhone')) os = 'iPhone';
  else if (ua.includes('iPad')) os = 'iPad';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'Mac';
  else if (ua.includes('Linux')) os = 'Linux';

  return `${browser} on ${os}`;
}

// Get or create a persistent device ID in localStorage
function getDeviceId(): string {
  const key = 'cineverse_device_id';
  let deviceId = localStorage.getItem(key);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(key, deviceId);
  }
  return deviceId;
}

export function useDevices(userId: string | undefined) {
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deviceLimitReached, setDeviceLimitReached] = useState(false);
  const [maxDevices, setMaxDevices] = useState(1);

  const fetchDevices = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_devices')
        .select('*')
        .eq('user_id', userId)
        .order('last_active_at', { ascending: false });

      if (!error && data) {
        setDevices(data as UserDevice[]);
      }
    } catch (err) {
      console.error('Error fetching devices:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const registerDevice = useCallback(async (userId: string): Promise<{ allowed: boolean; devices: UserDevice[] }> => {
    const deviceId = getDeviceId();
    const deviceName = parseDeviceName();

    // Get user's max_devices from user_roles
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('max_devices, role')
      .eq('user_id', userId)
      .single();

    const userMaxDevices = roleData?.max_devices ?? 1;
    const isAdmin = roleData?.role === 'admin';
    setMaxDevices(userMaxDevices);

    // Try upsert current device (update last_active if exists)
    await supabase
      .from('user_devices')
      .upsert(
        {
          user_id: userId,
          device_id: deviceId,
          device_name: deviceName,
          last_active_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,device_id' }
      );

    // Fetch all devices for this user
    const { data: allDevices } = await supabase
      .from('user_devices')
      .select('*')
      .eq('user_id', userId)
      .order('last_active_at', { ascending: false });

    const deviceList = (allDevices || []) as UserDevice[];
    setDevices(deviceList);

    // Admin has unlimited devices
    if (isAdmin) {
      setDeviceLimitReached(false);
      return { allowed: true, devices: deviceList };
    }

    // Check if current device is in the allowed list
    const currentDeviceIndex = deviceList.findIndex(d => d.device_id === deviceId);
    
    if (deviceList.length > userMaxDevices && currentDeviceIndex >= userMaxDevices) {
      // This device exceeds the limit and isn't one of the oldest registered
      setDeviceLimitReached(true);
      // Remove the device we just registered since it's not allowed
      await supabase
        .from('user_devices')
        .delete()
        .eq('user_id', userId)
        .eq('device_id', deviceId);
      
      // Re-fetch without the rejected device
      const { data: updatedDevices } = await supabase
        .from('user_devices')
        .select('*')
        .eq('user_id', userId)
        .order('last_active_at', { ascending: false });
      
      const updatedList = (updatedDevices || []) as UserDevice[];
      setDevices(updatedList);
      return { allowed: false, devices: updatedList };
    }

    setDeviceLimitReached(false);
    return { allowed: true, devices: deviceList };
  }, []);

  const removeDevice = useCallback(async (deviceDbId: string) => {
    if (!userId) return;
    await supabase
      .from('user_devices')
      .delete()
      .eq('id', deviceDbId)
      .eq('user_id', userId);
    
    await fetchDevices();
  }, [userId, fetchDevices]);

  useEffect(() => {
    if (userId) {
      fetchDevices();
    }
  }, [userId, fetchDevices]);

  return {
    devices,
    isLoading,
    deviceLimitReached,
    setDeviceLimitReached,
    maxDevices,
    registerDevice,
    removeDevice,
    fetchDevices,
    currentDeviceId: getDeviceId(),
  };
}
