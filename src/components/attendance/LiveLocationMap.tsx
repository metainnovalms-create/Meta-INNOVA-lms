/**
 * Live Location Map with Real-Time GPS Tracking
 * Interactive map using Leaflet + OpenStreetMap
 */

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Navigation, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';
import { calculateDistance } from '@/utils/locationHelpers';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons
const createCustomIcon = (color: string, pulseClass?: string) => {
  return L.divIcon({
    className: `custom-marker ${pulseClass || ''}`,
    html: `
      <div style="
        background: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ${pulseClass ? 'animation: pulse 2s infinite;' : ''}
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const institutionIcon = createCustomIcon('#3B82F6'); // Blue
const userIconInside = createCustomIcon('#22C55E', 'pulse'); // Green with pulse
const userIconOutside = createCustomIcon('#EF4444', 'pulse'); // Red with pulse

interface LiveLocationMapProps {
  institutionLatitude: number;
  institutionLongitude: number;
  institutionName: string;
  allowedRadius: number;
  userLatitude?: number | null;
  userLongitude?: number | null;
  showUserLocation?: boolean;
  onLocationUpdate?: (lat: number, lng: number, distance: number, isValid: boolean) => void;
  enableRealTimeTracking?: boolean;
  height?: string;
}

// Component to update map view when location changes
function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export function LiveLocationMap({
  institutionLatitude,
  institutionLongitude,
  institutionName,
  allowedRadius,
  userLatitude,
  userLongitude,
  showUserLocation = true,
  onLocationUpdate,
  enableRealTimeTracking = false,
  height = '300px',
}: LiveLocationMapProps) {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(
    userLatitude && userLongitude ? { lat: userLatitude, lng: userLongitude } : null
  );
  const [distance, setDistance] = useState<number | null>(null);
  const [isInsideRadius, setIsInsideRadius] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Calculate distance when location changes
  useEffect(() => {
    if (currentLocation) {
      const dist = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        institutionLatitude,
        institutionLongitude
      );
      setDistance(Math.round(dist));
      const isValid = dist <= allowedRadius;
      setIsInsideRadius(isValid);
      onLocationUpdate?.(currentLocation.lat, currentLocation.lng, dist, isValid);
    }
  }, [currentLocation, institutionLatitude, institutionLongitude, allowedRadius, onLocationUpdate]);

  // Update from props
  useEffect(() => {
    if (userLatitude && userLongitude) {
      setCurrentLocation({ lat: userLatitude, lng: userLongitude });
    }
  }, [userLatitude, userLongitude]);

  // Real-time tracking
  const startTracking = () => {
    if (!navigator.geolocation) {
      setTrackingError('Geolocation is not supported by your browser');
      return;
    }

    setIsTracking(true);
    setTrackingError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setTrackingError(null);
      },
      (error) => {
        setTrackingError(error.message);
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  };

  const refreshLocation = () => {
    if (!navigator.geolocation) {
      setTrackingError('Geolocation is not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setTrackingError(null);
      },
      (error) => {
        setTrackingError(error.message);
      },
      { enableHighAccuracy: true }
    );
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Auto-start tracking if enabled
  useEffect(() => {
    if (enableRealTimeTracking && !isTracking && !currentLocation) {
      startTracking();
    }
  }, [enableRealTimeTracking]);

  const center: [number, number] = currentLocation
    ? [currentLocation.lat, currentLocation.lng]
    : [institutionLatitude, institutionLongitude];

  return (
    <div className="space-y-3">
      {/* Status Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {currentLocation && (
            <>
              {isInsideRadius ? (
                <Badge className="bg-green-500/10 text-green-700 border-green-500/20 gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Within Range
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Outside Range
                </Badge>
              )}
              {distance !== null && (
                <Badge variant="outline" className="gap-1">
                  <MapPin className="h-3 w-3" />
                  {distance}m away
                </Badge>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {enableRealTimeTracking && (
            <Button
              size="sm"
              variant={isTracking ? 'default' : 'outline'}
              onClick={isTracking ? stopTracking : startTracking}
              className="gap-1"
            >
              <Navigation className={`h-3 w-3 ${isTracking ? 'animate-pulse' : ''}`} />
              {isTracking ? 'Tracking...' : 'Track Live'}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={refreshLocation} className="gap-1">
            <RefreshCw className="h-3 w-3" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {trackingError && (
        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-lg">
          {trackingError}
        </div>
      )}

      {/* Map Container */}
      <div className="rounded-lg overflow-hidden border" style={{ height }}>
        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.8; }
          }
          .custom-marker { background: transparent; border: none; }
        `}</style>
        <MapContainer
          center={center}
          zoom={16}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapUpdater center={center} zoom={16} />

          {/* Institution Marker */}
          <Marker
            position={[institutionLatitude, institutionLongitude]}
            icon={institutionIcon}
          >
            <Popup>
              <div className="font-medium">{institutionName}</div>
              <div className="text-xs text-muted-foreground">Institution Location</div>
            </Popup>
          </Marker>

          {/* Allowed Radius Circle */}
          <Circle
            center={[institutionLatitude, institutionLongitude]}
            radius={allowedRadius}
            pathOptions={{
              color: '#3B82F6',
              fillColor: '#3B82F6',
              fillOpacity: 0.1,
              weight: 2,
              dashArray: '5, 5',
            }}
          />

          {/* User Location Marker */}
          {showUserLocation && currentLocation && (
            <Marker
              position={[currentLocation.lat, currentLocation.lng]}
              icon={isInsideRadius ? userIconInside : userIconOutside}
            >
              <Popup>
                <div className="font-medium">Your Location</div>
                <div className="text-xs text-muted-foreground">
                  {distance}m from institution
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Institution</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>You (Valid)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>You (Invalid)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full border-2 border-dashed border-blue-500" />
          <span>Allowed Radius ({allowedRadius}m)</span>
        </div>
      </div>
    </div>
  );
}
