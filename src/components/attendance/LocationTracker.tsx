import { useState, useEffect } from 'react';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getCurrentLocation, formatLocationDisplay } from '@/utils/locationHelpers';
import type { LocationData } from '@/utils/locationHelpers';

interface LocationTrackerProps {
  onLocationUpdate: (location: LocationData) => void;
  autoFetch?: boolean;
  showDisplay?: boolean;
}

export function LocationTracker({ 
  onLocationUpdate, 
  autoFetch = false,
  showDisplay = true 
}: LocationTrackerProps) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const locationData = await getCurrentLocation();
      setLocation(locationData);
      onLocationUpdate(locationData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get location';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchLocation();
    }
  }, [autoFetch]);

  if (!showDisplay) {
    return null;
  }

  return (
    <div className="space-y-2">
      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Getting your location...</span>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {location && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>Location: {formatLocationDisplay(location.latitude, location.longitude)}</span>
        </div>
      )}
    </div>
  );
}
