/**
 * Jibble-Style Check-in/Check-out Component
 * Modern, professional attendance tracking with real-time GPS map
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Clock,
  MapPin,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Building2,
  MapPinOff,
  Timer,
  AlertTriangle,
} from 'lucide-react';
import { format, differenceInMinutes, parseISO } from 'date-fns';
import { toast } from 'sonner';
import {
  useOfficerTodayAttendance,
  useCheckIn,
  useCheckOut,
  useInstitutionGPSSettings,
} from '@/hooks/useOfficerAttendance';
import { LiveLocationMap } from './LiveLocationMap';
import { leaveSettingsService } from '@/services/leaveSettings.service';
import { getCurrentLocation } from '@/utils/locationHelpers';

interface JibbleStyleCheckInProps {
  officerId: string;
  institutionId: string;
  onStatusChange?: (status: 'checked_in' | 'checked_out' | 'not_checked_in') => void;
}

const TOLERANCE_MINUTES = 15;

export function JibbleStyleCheckIn({
  officerId,
  institutionId,
  onStatusChange,
}: JibbleStyleCheckInProps) {
  const [hoursWorked, setHoursWorked] = useState(0);
  const [minutesWorked, setMinutesWorked] = useState(0);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [loadingGpsSetting, setLoadingGpsSetting] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [liveDistance, setLiveDistance] = useState<number | null>(null);
  const [isLocationValid, setIsLocationValid] = useState(false);

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

  // Live clock
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
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
      const calculateTime = () => {
        const checkInDate = new Date(todayAttendance.check_in_time!);
        const now = new Date();
        const totalMinutes = Math.floor((now.getTime() - checkInDate.getTime()) / (1000 * 60));
        setHoursWorked(Math.floor(totalMinutes / 60));
        setMinutesWorked(totalMinutes % 60);
      };

      calculateTime();
      const interval = setInterval(calculateTime, 1000);
      return () => clearInterval(interval);
    } else if (todayAttendance?.status === 'checked_out' && todayAttendance.total_hours_worked) {
      const totalMinutes = Math.floor(todayAttendance.total_hours_worked * 60);
      setHoursWorked(Math.floor(totalMinutes / 60));
      setMinutesWorked(totalMinutes % 60);
    }
  }, [todayAttendance]);

  // Notify parent of status changes
  useEffect(() => {
    if (todayAttendance?.status && onStatusChange) {
      onStatusChange(todayAttendance.status as 'checked_in' | 'checked_out' | 'not_checked_in');
    }
  }, [todayAttendance?.status, onStatusChange]);

  // Calculate late/overtime status
  const getAttendanceStatus = () => {
    if (!institutionSettings || !todayAttendance) return null;

    const expectedCheckIn = institutionSettings.check_in_time || '09:00';
    const expectedCheckOut = institutionSettings.check_out_time || '17:00';
    const normalHours = institutionSettings.normal_working_hours || 8;

    // Parse expected times for today
    const today = new Date();
    const [checkInHour, checkInMin] = expectedCheckIn.split(':').map(Number);
    const [checkOutHour, checkOutMin] = expectedCheckOut.split(':').map(Number);

    const expectedCheckInTime = new Date(today.setHours(checkInHour, checkInMin, 0, 0));
    const toleranceTime = new Date(expectedCheckInTime.getTime() + TOLERANCE_MINUTES * 60 * 1000);
    const expectedCheckOutTime = new Date(today.setHours(checkOutHour, checkOutMin, 0, 0));
    const overtimeStartTime = new Date(expectedCheckOutTime.getTime() + TOLERANCE_MINUTES * 60 * 1000);

    let isLate = false;
    let lateMinutes = 0;
    let potentialOvertime = 0;

    if (todayAttendance.check_in_time) {
      const actualCheckIn = new Date(todayAttendance.check_in_time);
      if (actualCheckIn > toleranceTime) {
        isLate = true;
        lateMinutes = differenceInMinutes(actualCheckIn, toleranceTime);
      }
    }

    // Calculate potential overtime for current session
    if (todayAttendance.status === 'checked_in') {
      const now = new Date();
      if (now > overtimeStartTime) {
        potentialOvertime = differenceInMinutes(now, overtimeStartTime);
      }
    }

    return {
      expectedCheckIn,
      expectedCheckOut,
      isLate,
      lateMinutes,
      potentialOvertime,
      normalHours,
    };
  };

  const attendanceStatus = getAttendanceStatus();

  const handleLocationUpdate = (lat: number, lng: number, distance: number, isValid: boolean) => {
    setCurrentLocation({ lat, lng });
    setLiveDistance(distance);
    setIsLocationValid(isValid);
  };

  const handleCheckIn = async () => {
    setIsLoadingLocation(true);

    try {
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
          toast.error('Check-in Failed', { description: result.error || 'Please try again' });
        }
        return;
      }

      if (!institutionSettings?.gps_location) {
        toast.error('Institution GPS coordinates not configured');
        return;
      }

      const location = currentLocation 
        ? { latitude: currentLocation.lat, longitude: currentLocation.lng }
        : await getCurrentLocation();

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
            description: `You are ${result.distance}m from institution`,
          });
        }
      } else {
        toast.error('Check-in Failed', { description: result.error || 'Please try again' });
      }
    } catch (error) {
      toast.error('Location Error', {
        description: error instanceof Error ? error.message : 'Failed to get location',
      });
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleCheckOut = async () => {
    setIsLoadingLocation(true);

    try {
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
          toast.error('Check-out Failed', { description: result.error || 'Please try again' });
        }
        return;
      }

      if (!institutionSettings?.gps_location) {
        toast.error('Institution GPS coordinates not configured');
        return;
      }

      const location = currentLocation 
        ? { latitude: currentLocation.lat, longitude: currentLocation.lng }
        : await getCurrentLocation();

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
        toast.error('Check-out Failed', { description: result.error || 'Please try again' });
      }
    } catch (error) {
      toast.error('Location Error', {
        description: error instanceof Error ? error.message : 'Failed to get location',
      });
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const isCheckedIn = todayAttendance?.status === 'checked_in';
  const isCheckedOut = todayAttendance?.status === 'checked_out';
  const isLoading = isLoadingLocation || checkInMutation.isPending || checkOutMutation.isPending;
  const progressPercent = Math.min(100, ((hoursWorked * 60 + minutesWorked) / ((attendanceStatus?.normalHours || 8) * 60)) * 100);

  if (isLoadingAttendance || loadingGpsSetting) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Header with Status */}
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Clock className="h-5 w-5" />
              Daily Attendance
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {format(currentTime, 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          {/* Status Badge */}
          {!todayAttendance || todayAttendance.status === 'not_checked_in' ? (
            <Badge variant="outline" className="gap-1 px-3 py-1">
              <XCircle className="h-3 w-3" />
              Not Checked In
            </Badge>
          ) : isCheckedOut ? (
            <Badge variant="secondary" className="gap-1 px-3 py-1">
              <CheckCircle2 className="h-3 w-3" />
              Checked Out
            </Badge>
          ) : (
            <Badge className="gap-1 bg-green-500 px-3 py-1">
              <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
              Working
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Live Clock */}
        <div className="text-center py-4 bg-muted/50 rounded-xl">
          <p className="text-5xl font-bold font-mono tracking-tight">
            {format(currentTime, 'HH:mm:ss')}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Current Time</p>
        </div>

        {/* Institution Info */}
        {institutionSettings && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="font-medium text-sm">{institutionSettings.name}</p>
              <p className="text-xs text-muted-foreground">
                Expected: {attendanceStatus?.expectedCheckIn} - {attendanceStatus?.expectedCheckOut}
              </p>
            </div>
            {!gpsEnabled ? (
              <Badge variant="secondary" className="gap-1">
                <MapPinOff className="h-3 w-3" />
                GPS Off
              </Badge>
            ) : institutionSettings.gps_location ? (
              <Badge variant="outline" className="gap-1 bg-blue-500/10 text-blue-700 border-blue-500/20">
                <MapPin className="h-3 w-3" />
                GPS Active
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                GPS Not Set
              </Badge>
            )}
          </div>
        )}

        {/* Live Map (only when GPS enabled) */}
        {gpsEnabled && institutionSettings?.gps_location && (
          <LiveLocationMap
            institutionLatitude={institutionSettings.gps_location.latitude}
            institutionLongitude={institutionSettings.gps_location.longitude}
            institutionName={institutionSettings.name}
            allowedRadius={institutionSettings.attendance_radius_meters}
            userLatitude={todayAttendance?.check_in_latitude}
            userLongitude={todayAttendance?.check_in_longitude}
            showUserLocation={isCheckedIn || !!currentLocation}
            onLocationUpdate={handleLocationUpdate}
            enableRealTimeTracking={!isCheckedIn && !isCheckedOut}
            height="250px"
          />
        )}

        {/* Time Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-muted/50 rounded-xl text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Check-in</p>
            <p className="text-2xl font-bold mt-1">
              {todayAttendance?.check_in_time
                ? format(new Date(todayAttendance.check_in_time), 'HH:mm')
                : '--:--'}
            </p>
            {attendanceStatus?.isLate && (
              <Badge variant="destructive" className="mt-2 text-xs gap-1">
                <AlertTriangle className="h-3 w-3" />
                {attendanceStatus.lateMinutes}min late
              </Badge>
            )}
          </div>
          <div className="p-4 bg-muted/50 rounded-xl text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Check-out</p>
            <p className="text-2xl font-bold mt-1">
              {todayAttendance?.check_out_time
                ? format(new Date(todayAttendance.check_out_time), 'HH:mm')
                : '--:--'}
            </p>
            {isCheckedIn && attendanceStatus?.potentialOvertime && attendanceStatus.potentialOvertime > 0 && (
              <Badge className="mt-2 text-xs gap-1 bg-orange-500">
                <Timer className="h-3 w-3" />
                +{Math.floor(attendanceStatus.potentialOvertime / 60)}h {attendanceStatus.potentialOvertime % 60}m OT
              </Badge>
            )}
          </div>
        </div>

        {/* Hours Progress */}
        {(isCheckedIn || isCheckedOut) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Hours Worked</span>
              <span className="font-bold">
                {hoursWorked}h {minutesWorked}m / {attendanceStatus?.normalHours || 8}h
              </span>
            </div>
            <Progress value={progressPercent} className="h-3" />
            <p className="text-xs text-muted-foreground text-center">
              {progressPercent.toFixed(0)}% of target completed
            </p>
          </div>
        )}

        {/* Overtime Display */}
        {isCheckedOut && (todayAttendance?.overtime_hours || 0) > 0 && (
          <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-orange-600" />
              <span className="font-medium text-orange-700 dark:text-orange-400">Overtime Logged</span>
            </div>
            <span className="text-xl font-bold text-orange-700 dark:text-orange-400">
              {todayAttendance.overtime_hours?.toFixed(2)}h
            </span>
          </div>
        )}

        <Separator />

        {/* Action Buttons */}
        <div className="space-y-3">
          {!isCheckedIn && !isCheckedOut && (
            <Button
              onClick={handleCheckIn}
              disabled={isLoading || (!gpsEnabled && false) || (gpsEnabled && !institutionSettings?.gps_location)}
              className="w-full h-14 text-lg font-semibold bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Getting Location...
                </>
              ) : (
                <>
                  <Clock className="h-5 w-5 mr-2" />
                  CLOCK IN
                </>
              )}
            </Button>
          )}

          {isCheckedIn && (
            <Button
              onClick={handleCheckOut}
              disabled={isLoading}
              variant="destructive"
              className="w-full h-14 text-lg font-semibold"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Getting Location...
                </>
              ) : (
                <>
                  <Clock className="h-5 w-5 mr-2" />
                  CLOCK OUT
                </>
              )}
            </Button>
          )}

          {isCheckedOut && (
            <div className="text-center p-4 bg-muted/50 rounded-xl">
              <CheckCircle2 className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <p className="font-medium">Attendance Complete</p>
              <p className="text-sm text-muted-foreground">
                You worked {hoursWorked}h {minutesWorked}m today
              </p>
            </div>
          )}
        </div>

        {/* Location Info */}
        {gpsEnabled && liveDistance !== null && !isCheckedIn && !isCheckedOut && (
          <p className="text-xs text-center text-muted-foreground">
            {isLocationValid ? (
              <span className="text-green-600">✓ You are {liveDistance}m from institution (within range)</span>
            ) : (
              <span className="text-orange-600">⚠ You are {liveDistance}m from institution (outside range)</span>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
