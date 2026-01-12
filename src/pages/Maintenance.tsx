import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Wrench } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useBranding } from '@/contexts/BrandingContext';

export default function Maintenance() {
  const navigate = useNavigate();
  const { branding } = useBranding();
  const [isChecking, setIsChecking] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('System is under maintenance. Please check back later.');

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const { data, error } = await supabase
        .from('system_configurations')
        .select('value')
        .eq('key', 'platform_settings')
        .single();

      if (!error && data?.value) {
        const value = data.value as Record<string, unknown>;
        if (!value.maintenance_mode) {
          // Maintenance mode is off, redirect to login
          navigate('/login');
          return;
        }
        if (value.maintenance_message) {
          setMaintenanceMessage(String(value.maintenance_message));
        }
      }
    } catch (error) {
      console.error('Error checking maintenance status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Set up realtime subscription for maintenance mode changes
    const channel = supabase
      .channel('maintenance_check')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_configurations',
          filter: 'key=eq.platform_settings',
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object' && 'value' in payload.new) {
            const value = payload.new.value as Record<string, unknown>;
            if (!value.maintenance_mode) {
              navigate('/login');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex items-center justify-center">
            {branding?.logo_expanded_url ? (
              <img 
                src={branding.logo_expanded_url} 
                alt="Logo" 
                className="h-12 object-contain"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Wrench className="h-8 w-8 text-primary" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              <CardTitle className="text-2xl">System Under Maintenance</CardTitle>
            </div>
            <CardDescription className="text-base">
              {maintenanceMessage}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Our team is working hard to improve your experience. 
              We apologize for any inconvenience.
            </p>
          </div>
          <Button 
            onClick={checkStatus} 
            disabled={isChecking}
            className="w-full"
          >
            {isChecking ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Check Status
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
