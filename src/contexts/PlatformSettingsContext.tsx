import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';


interface PlatformSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  maintenanceAffectedRoles: string[];
  sessionTimeoutEnabled: boolean;
  sessionTimeoutMinutes: number;
}

interface PlatformSettingsContextType {
  settings: PlatformSettings;
  isLoading: boolean;
  updateSettings: (newSettings: Partial<PlatformSettings>) => Promise<void>;
  refetch: () => Promise<void>;
}

const defaultSettings: PlatformSettings = {
  maintenanceMode: false,
  maintenanceMessage: 'System is under maintenance. Please check back later.',
  maintenanceAffectedRoles: ['student', 'teacher', 'officer', 'management'],
  sessionTimeoutEnabled: true,
  sessionTimeoutMinutes: 30,
};

const PlatformSettingsContext = createContext<PlatformSettingsContextType | undefined>(undefined);

export const usePlatformSettings = () => {
  const context = useContext(PlatformSettingsContext);
  if (!context) {
    throw new Error('usePlatformSettings must be used within a PlatformSettingsProvider');
  }
  return context;
};

export const PlatformSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('system_configurations')
        .select('value')
        .eq('key', 'platform_settings')
        .single();

      if (error) {
        console.error('Error fetching platform settings:', error);
        return;
      }

      if (data?.value) {
        const value = data.value as Record<string, unknown>;
        setSettings({
          maintenanceMode: Boolean(value.maintenance_mode),
          maintenanceMessage: String(value.maintenance_message || defaultSettings.maintenanceMessage),
          maintenanceAffectedRoles: Array.isArray(value.maintenance_affected_roles) 
            ? value.maintenance_affected_roles as string[]
            : defaultSettings.maintenanceAffectedRoles,
          sessionTimeoutEnabled: Boolean(value.session_timeout_enabled),
          sessionTimeoutMinutes: Number(value.session_timeout_minutes) || 30,
        });
      }
    } catch (error) {
      console.error('Error fetching platform settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateSettings = async (newSettings: Partial<PlatformSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    
    const dbValue = {
      maintenance_mode: updatedSettings.maintenanceMode,
      maintenance_message: updatedSettings.maintenanceMessage,
      maintenance_affected_roles: updatedSettings.maintenanceAffectedRoles,
      session_timeout_enabled: updatedSettings.sessionTimeoutEnabled,
      session_timeout_minutes: updatedSettings.sessionTimeoutMinutes,
    };

    const { error } = await supabase
      .from('system_configurations')
      .update({ value: dbValue })
      .eq('key', 'platform_settings');

    if (error) {
      console.error('Error updating platform settings:', error);
      throw error;
    }

    setSettings(updatedSettings);
  };

  useEffect(() => {
    fetchSettings();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('platform_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_configurations',
          filter: 'key=eq.platform_settings',
        },
        (payload) => {
          console.log('Platform settings changed:', payload);
          if (payload.new && typeof payload.new === 'object' && 'value' in payload.new) {
            const value = payload.new.value as Record<string, unknown>;
            setSettings({
              maintenanceMode: Boolean(value.maintenance_mode),
              maintenanceMessage: String(value.maintenance_message || defaultSettings.maintenanceMessage),
              maintenanceAffectedRoles: Array.isArray(value.maintenance_affected_roles) 
                ? value.maintenance_affected_roles as string[]
                : defaultSettings.maintenanceAffectedRoles,
              sessionTimeoutEnabled: Boolean(value.session_timeout_enabled),
              sessionTimeoutMinutes: Number(value.session_timeout_minutes) || 30,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSettings]);

  return (
    <PlatformSettingsContext.Provider value={{ settings, isLoading, updateSettings, refetch: fetchSettings }}>
      {children}
    </PlatformSettingsContext.Provider>
  );
};
