import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Loader2, AlertCircle, CheckCircle2, XCircle, MapPinOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { staffAttendanceService } from '@/services/staff-attendance.service';
import { getCurrentLocation } from '@/utils/locationHelpers';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { leaveSettingsService } from '@/services/leaveSettings.service';
import { cn } from '@/lib/utils';

interface StaffAttendanceCardProps {
  className?: string;
}

export function StaffAttendanceCard({ className }: StaffAttendanceCardProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkInStatus, setCheckInStatus] = useState<{
    checkedIn: boolean;
    checkedOut: boolean;
    checkInTime?: string;
    checkOutTime?: string;
  }>({
    checkedIn: false,
    checkedOut: false,
  });
  const [hoursWorked, setHoursWorked] = useState(0);
  const [locationValidated, setLocationValidated] = useState<boolean | null>(null);
  const [gpsEnabled, setGpsEnabled] = useState(true);

  useEffect(() => {
    const loadGpsSetting = async () => {
      try {
        const enabled = await leaveSettingsService.isGpsEnabled();
        setGpsEnabled(enabled);
      } catch (error) {
        console.error('Failed to load GPS setting:', error);
      }
    };
    loadGpsSetting();
  }, []);

  useEffect(() => {
    if (user?.id) {
      const status = staffAttendanceService.getTodayCheckInStatus(user.id);
      setCheckInStatus(status);

      if (status.checkInTime && status.checkOutTime) {
        const checkIn = new Date(status.checkInTime);
        const checkOut = new Date(status.checkOutTime);
        const hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
        setHoursWorked(hours);
      } else if (status.checkInTime && !status.checkOutTime) {
        const checkIn = new Date(status.checkInTime);
        const interval = setInterval(() => {
          const now = new Date();
          const hours = (now.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
          setHoursWorked(hours);
        }, 1000);
        return () => clearInterval(interval);
      }
    }
  }, [user?.id, checkInStatus.checkInTime, checkInStatus.checkOutTime]);

  const handleCheckIn = async () => {
    if (!user?.id) return;

    setLoading(true);
    setLocationValidated(null);

    try {
      let location = null;
      
      // Only get location if GPS is enabled
      if (gpsEnabled) {
        location = await getCurrentLocation();
      }

      const result = await staffAttendanceService.recordStaffCheckIn({
        staff_id: user.id,
        location,
        timestamp: new Date().toISOString(),
      });

      setLocationValidated(gpsEnabled ? result.validated : null);
      setCheckInStatus((prev) => ({
        ...prev,
        checkedIn: true,
        checkInTime: new Date().toISOString(),
      }));

      toast.success('Check-in Successful', {
        description: gpsEnabled ? result.message : 'Time recorded (GPS verification disabled)',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check in';
      toast.error('Check-in Failed', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!user?.id) return;

    setLoading(true);

    try {
      let location = null;
      
      // Only get location if GPS is enabled
      if (gpsEnabled) {
        location = await getCurrentLocation();
      }

      const result = await staffAttendanceService.recordStaffCheckOut({
        staff_id: user.id,
        location,
        timestamp: new Date().toISOString(),
      });

      setCheckInStatus((prev) => ({
        ...prev,
        checkedOut: true,
        checkOutTime: new Date().toISOString(),
      }));

      toast.success('Check-out Successful', {
        description: gpsEnabled ? result.message : 'Time recorded (GPS verification disabled)',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check out';
      toast.error('Check-out Failed', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (checkInStatus.checkedOut) {
      return (
        <Badge variant="secondary" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Checked Out
        </Badge>
      );
    }
    if (checkInStatus.checkedIn) {
      return (
        <Badge variant="default" className="gap-1 bg-green-500">
          <Clock className="h-3 w-3" />
          Working
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1">
        <XCircle className="h-3 w-3" />
        Not Checked In
      </Badge>
    );
  };

  const getLocationBadge = () => {
    if (locationValidated === null) return null;
    
    return locationValidated ? (
      <Badge variant="default" className="gap-1 bg-green-500">
        <CheckCircle2 className="h-3 w-3" />
        Verified
      </Badge>
    ) : (
      <Badge variant="destructive" className="gap-1">
        <AlertCircle className="h-3 w-3" />
        Unverified
      </Badge>
    );
  };

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Daily Attendance</CardTitle>
            <CardDescription>Track your check-in and check-out times</CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Time Display */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Check-in Time</p>
            <p className="text-lg font-semibold">
              {checkInStatus.checkInTime
                ? format(new Date(checkInStatus.checkInTime), 'hh:mm a')
                : '--:--'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Check-out Time</p>
            <p className="text-lg font-semibold">
              {checkInStatus.checkOutTime
                ? format(new Date(checkInStatus.checkOutTime), 'hh:mm a')
                : '--:--'}
            </p>
          </div>
        </div>

        {/* Hours Worked */}
        {checkInStatus.checkedIn && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Hours Worked Today</span>
            </div>
            <span className="text-lg font-bold">{hoursWorked.toFixed(2)} hrs</span>
          </div>
        )}

        {/* Location Validation */}
        {locationValidated !== null && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Location:</span>
            {getLocationBadge()}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleCheckIn}
            disabled={loading || checkInStatus.checkedIn}
            className="flex-1"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Checking In...
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
            disabled={loading || !checkInStatus.checkedIn || checkInStatus.checkedOut}
            variant="outline"
            className="flex-1"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Checking Out...
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
          Check in when you arrive at the office. Your GPS location will be verified.
        </p>
      </CardContent>
    </Card>
  );
}
