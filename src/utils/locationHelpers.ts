/**
 * GPS Location Helper Functions
 * Provides utilities for tracking officer locations during check-in/check-out
 */

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: string;
}

/**
 * Get current GPS coordinates using browser's Geolocation API
 */
export const getCurrentLocation = (): Promise<LocationData> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: new Date().toISOString(),
        });
      },
      (error) => {
        let errorMessage = 'Unable to retrieve location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * Returns distance in meters
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Check if officer is within institution's radius
 */
export const isWithinInstitution = (
  userLocation: { latitude: number; longitude: number },
  institutionLocation: { latitude: number; longitude: number; radius_meters: number }
): boolean => {
  const distance = calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    institutionLocation.latitude,
    institutionLocation.longitude
  );
  
  return distance <= institutionLocation.radius_meters;
};

/**
 * Format location for display
 */
export const formatLocationDisplay = (
  latitude: number,
  longitude: number
): string => {
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
};

/**
 * Get address from coordinates using reverse geocoding (optional feature)
 * Note: This would require a geocoding API key (Google Maps, OpenStreetMap, etc.)
 */
export const getAddressFromCoordinates = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  try {
    // Using OpenStreetMap's Nominatim API (free, no API key required)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
    );
    const data = await response.json();
    return data.display_name || 'Address not found';
  } catch (error) {
    console.error('Error fetching address:', error);
    return 'Address unavailable';
  }
};
