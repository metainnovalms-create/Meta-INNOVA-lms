/**
 * Officer Check-in/Check-out Card with GPS Validation
 * Persists to Supabase officer_attendance table
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Loader2, AlertCircle, CheckCircle2, XCircle, Building2, Map, MapPinOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentLocation } from '@/utils/locationHelpers';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  useOfficerTodayAttendance,
  useCheckIn,
  useCheckOut,
  useInstitutionGPSSettings,
} from '@/hooks/useOfficerAttendance';
import { LocationMapPreview } from './LocationMapPreview';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { leaveSettingsService } from '@/services/leaveSettings.service';

interface OfficerCheckInCardProps {
  officerId: string;
  institutionId: string;
  onStatusChange?: (status: 'checked_in' | 'checked_out' | 'not_checked_in') => void;
}

export function OfficerCheckInCard({ officerId, institutionId, onStatusChange }: OfficerCheckInCardProps) {
  const { user } = useAuth();
  const [hoursWorked, setHoursWorked] = useState(0);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [loadingGpsSetting, setLoadingGpsSetting] = useState(true);

  // Fetch GPS enabled setting
  useEffect(() => {
    const loadGpsSetting = async () => {
      try {
        const enabled = await leaveSettingsService.isGpsEnabled();
        setGpsEnabled(enabled);
      } catch (error) {
        console.error('Failed to load GPS setting:', error);
      } finally {
        setLoadingGpsSetting(false);
      }
    };
    loadGpsSetting();
  }, []);

  // Fetch today's attendance
  const { data: todayAttendance, isLoading: isLoadingAttendance } = useOfficerTodayAttendance(
    officerId,
    institutionId
  );

  // Fetch institution GPS settings
  const { data: institutionSettings } = useInstitutionGPSSettings(institutionId);

  // Mutations
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  // Calculate live hours worked
  useEffect(() => {
    if (todayAttendance?.status === 'checked_in' && todayAttendance.check_in_time) {
      const calculateHours = () => {
        const checkInDate = new Date(todayAttendance.check_in_time!);
        const now = new Date();
        const hours = (now.getTime() - checkInDate.getTime()) / (1000 * 60 * 60);
        setHoursWorked(Math.round(hours * 100) / 100);
      };

      calculateHours();
      const interval = setInterval(calculateHours, 60000); // Update every minute

      return () => clearInterval(interval);
    } else if (todayAttendance?.status === 'checked_out') {
      setHoursWorked(todayAttendance.total_hours_worked || 0);
    }
  }, [todayAttendance]);

  // Notify parent of status changes
  useEffect(() => {
    if (todayAttendance?.status && onStatusChange) {
      onStatusChange(todayAttendance.status as 'checked_in' | 'checked_out' | 'not_checked_in');
    }
  }, [todayAttendance?.status, onStatusChange]);

  const handleCheckIn = async () => {
    setIsLoadingLocation(true);

    try {
      // If GPS is disabled globally, skip location fetching
      if (!gpsEnabled) {
        const result = await checkInMutation.mutateAsync({
          officer_id: officerId,
          institution_id: institutionId,
          latitude: 0,
          longitude: 0,
          institution_latitude: 0,
          institution_longitude: 0,
          attendance_radius_meters: 0,
          skip_gps: true,
        });

        if (result.success) {
          toast.success('Check-in Successful', {
            description: 'Time recorded (GPS verification disabled)',
          });
        } else {
          toast.error('Check-in Failed', {
            description: result.error || 'Please try again',
          });
        }
        return;
      }

      // GPS is enabled - normal flow
      if (!institutionSettings?.gps_location) {
        toast.error('Institution GPS coordinates not configured');
        return;
      }

      const location = await getCurrentLocation();

      const result = await checkInMutation.mutateAsync({
        officer_id: officerId,
        institution_id: institutionId,
        latitude: location.latitude,
        longitude: location.longitude,
        institution_latitude: institutionSettings.gps_location.latitude,
        institution_longitude: institutionSettings.gps_location.longitude,
        attendance_radius_meters: institutionSettings.attendance_radius_meters,
      });

      if (result.success) {
        if (result.validated) {
          toast.success('Check-in Successful', {
            description: `Location verified - ${result.distance}m from institution`,
          });
        } else {
          toast.warning('Check-in Recorded (Location Unverified)', {
            description: `You are ${result.distance}m from institution (allowed: ${institutionSettings.attendance_radius_meters}m)`,
          });
        }
      } else {
        toast.error('Check-in Failed', {
          description: result.error || 'Please try again',
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get location';
      toast.error('Location Error', {
        description: errorMessage,
      });
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleCheckOut = async () => {
    setIsLoadingLocation(true);

    try {
      // If GPS is disabled globally, skip location fetching
      if (!gpsEnabled) {
        const result = await checkOutMutation.mutateAsync({
          officer_id: officerId,
          institution_id: institutionId,
          latitude: 0,
          longitude: 0,
          institution_latitude: 0,
          institution_longitude: 0,
          attendance_radius_meters: 0,
          normal_working_hours: institutionSettings?.normal_working_hours || 8,
          skip_gps: true,
        });

        if (result.success) {
          toast.success('Check-out Successful', {
            description: `Total hours: ${result.hoursWorked.toFixed(2)}h | Overtime: ${result.overtimeHours.toFixed(2)}h`,
          });
        } else {
          toast.error('Check-out Failed', {
            description: result.error || 'Please try again',
          });
        }
        return;
      }

      // GPS is enabled - normal flow
      if (!institutionSettings?.gps_location) {
        toast.error('Institution GPS coordinates not configured');
        return;
      }

      const location = await getCurrentLocation();

      const result = await checkOutMutation.mutateAsync({
        officer_id: officerId,
        institution_id: institutionId,
        latitude: location.latitude,
        longitude: location.longitude,
        institution_latitude: institutionSettings.gps_location.latitude,
        institution_longitude: institutionSettings.gps_location.longitude,
        attendance_radius_meters: institutionSettings.attendance_radius_meters,
        normal_working_hours: institutionSettings.normal_working_hours,
      });

      if (result.success) {
        toast.success('Check-out Successful', {
          description: `Total hours: ${result.hoursWorked.toFixed(2)}h | Overtime: ${result.overtimeHours.toFixed(2)}h`,
        });
      } else {
        toast.error('Check-out Failed', {
          description: result.error || 'Please try again',
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get location';
      toast.error('Location Error', {
        description: errorMessage,
      });
    } finally {
      setIsLoadingLocation(false);
    }
  };


  const getStatusBadge = () => {
    if (!todayAttendance || todayAttendance.status === 'not_checked_in') {
      return (
        <Badge variant="outline" className="gap-1">
          <XCircle className="h-3 w-3" />
          Not Checked In
        </Badge>
      );
    }
    if (todayAttendance.status === 'checked_out') {
      return (
        <Badge variant="secondary" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Checked Out
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="gap-1 bg-green-500">
        <Clock className="h-3 w-3" />
        Working
      </Badge>
    );
  };

  const getLocationBadge = () => {
    if (!todayAttendance) return null;

    const validated = todayAttendance.check_in_validated;
    if (validated === null || validated === undefined) return null;

    return validated ? (
      <Badge variant="default" className="gap-1 bg-green-500">
        <CheckCircle2 className="h-3 w-3" />
        Location Verified
      </Badge>
    ) : (
      <Badge variant="destructive" className="gap-1">
        <AlertCircle className="h-3 w-3" />
        Location Unverified
      </Badge>
    );
  };

  const isCheckedIn = todayAttendance?.status === 'checked_in';
  const isCheckedOut = todayAttendance?.status === 'checked_out';
  const isLoading = isLoadingLocation || checkInMutation.isPending || checkOutMutation.isPending;

  if (isLoadingAttendance) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Daily Attendance
            </CardTitle>
            <CardDescription>GPS-verified check-in and check-out</CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Institution Info */}
        {institutionSettings && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{institutionSettings.name}</span>
            {!gpsEnabled ? (
              <Badge variant="secondary" className="ml-auto text-xs gap-1">
                <MapPinOff className="h-3 w-3" />
                GPS Disabled
              </Badge>
            ) : institutionSettings.gps_location ? (
              <Badge variant="outline" className="ml-auto text-xs gap-1">
                <MapPin className="h-3 w-3" />
                GPS Enabled
              </Badge>
            ) : (
              <Badge variant="destructive" className="ml-auto text-xs">
                GPS Not Configured
              </Badge>
            )}
          </div>
        )}

        {/* Time Display */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Check-in Time</p>
            <p className="text-lg font-semibold">
              {todayAttendance?.check_in_time
                ? format(new Date(todayAttendance.check_in_time), 'hh:mm a')
                : '--:--'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Check-out Time</p>
            <p className="text-lg font-semibold">
              {todayAttendance?.check_out_time
                ? format(new Date(todayAttendance.check_out_time), 'hh:mm a')
                : '--:--'}
            </p>
          </div>
        </div>

        {/* Hours Worked */}
        {(isCheckedIn || isCheckedOut) && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Hours Worked Today</span>
            </div>
            <span className="text-lg font-bold">{hoursWorked.toFixed(2)} hrs</span>
          </div>
        )}

        {/* Overtime Display */}
        {isCheckedOut && (todayAttendance?.overtime_hours || 0) > 0 && (
          <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Overtime</span>
            <span className="text-lg font-bold text-amber-700 dark:text-amber-400">
              {todayAttendance.overtime_hours?.toFixed(2)} hrs
            </span>
          </div>
        )}

        {/* Location Validation */}
        {todayAttendance && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Location:</span>
            {getLocationBadge()}
            {todayAttendance.check_in_distance_meters !== null && (
              <span className="text-xs text-muted-foreground ml-auto">
                {todayAttendance.check_in_distance_meters}m from institution
              </span>
            )}
          </div>
        )}

        {/* Visual Map - Only show if GPS coordinates are valid (not 0,0) */}
        {institutionSettings?.gps_location && 
         (institutionSettings.gps_location.latitude !== 0 || institutionSettings.gps_location.longitude !== 0) && (
          <Collapsible open={showMap} onOpenChange={setShowMap}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Map className="h-4 w-4 mr-2" />
                {showMap ? 'Hide Location Map' : 'View Location Map'}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <LocationMapPreview
                institutionLatitude={institutionSettings.gps_location.latitude}
                institutionLongitude={institutionSettings.gps_location.longitude}
                institutionName={institutionSettings.name}
                allowedRadius={institutionSettings.attendance_radius_meters}
                officerLatitude={todayAttendance?.check_in_latitude ?? currentLocation?.latitude}
                officerLongitude={todayAttendance?.check_in_longitude ?? currentLocation?.longitude}
                officerDistance={todayAttendance?.check_in_distance_meters ?? undefined}
                isValidated={todayAttendance?.check_in_validated ?? undefined}
                showOfficerLocation={!!(todayAttendance?.check_in_latitude || currentLocation)}
              />
            </CollapsibleContent>
          </Collapsible>
        )}
        
        {/* Show message when GPS coordinates are (0,0) */}
        {institutionSettings?.gps_location && 
         institutionSettings.gps_location.latitude === 0 && 
         institutionSettings.gps_location.longitude === 0 && (
          <div className="text-center py-3 text-muted-foreground bg-muted/50 rounded-lg">
            <MapPinOff className="h-6 w-6 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">GPS coordinates not configured</p>
            <p className="text-xs">Contact admin to set up institution location</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleCheckIn}
            disabled={isLoading || isCheckedIn || isCheckedOut || (!gpsEnabled && false) || (gpsEnabled && (!institutionSettings?.gps_location || (institutionSettings.gps_location.latitude === 0 && institutionSettings.gps_location.longitude === 0)))}
            className="flex-1"
            size="lg"
          >
            {isLoading && !isCheckedIn ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Getting Location...
              </>
            ) : (
              <>
                <Clock className="h-4 w-4 mr-2" />
                Check In
              </>
            )}
          </Button>

          <Button
            onClick={handleCheckOut}
            disabled={isLoading || !isCheckedIn || isCheckedOut || (!gpsEnabled && false) || (gpsEnabled && (!institutionSettings?.gps_location || (institutionSettings.gps_location.latitude === 0 && institutionSettings.gps_location.longitude === 0)))}
            variant="outline"
            className="flex-1"
            size="lg"
          >
            {isLoading && isCheckedIn ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Getting Location...
              </>
            ) : (
              <>
                <Clock className="h-4 w-4 mr-2" />
                Check Out
              </>
            )}
          </Button>
        </div>

        {/* Instructions */}
        <p className="text-xs text-muted-foreground text-center">
          Your GPS location will be verified against the institution's coordinates.
          {institutionSettings?.attendance_radius_meters && (
            <span className="block mt-1">
              Allowed radius: {institutionSettings.attendance_radius_meters}m
            </span>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
