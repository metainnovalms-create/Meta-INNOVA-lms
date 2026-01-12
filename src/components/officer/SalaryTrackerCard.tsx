import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, DollarSign, TrendingUp, Calendar, CheckCircle2, MapPin } from 'lucide-react';
import { formatCurrency } from '@/utils/attendanceHelpers';
import type { LocationData } from '@/utils/locationHelpers';

interface SalaryTrackerProps {
  currentMonthSalary: number;
  normalHoursWorked: number;
  overtimeHours: number;
  overtimePay: number;
  expectedHours: number;
  netPay: number;
  // Today's check-in status
  isCheckedIn?: boolean;
  checkInTime?: string | null;
  checkInLocation?: LocationData | null;
  locationValidated?: boolean | null;
}

export function SalaryTrackerCard({
  currentMonthSalary,
  normalHoursWorked,
  overtimeHours,
  overtimePay,
  expectedHours,
  netPay,
  isCheckedIn = false,
  checkInTime = null,
  checkInLocation = null,
  locationValidated = null,
}: SalaryTrackerProps) {
  const progressPercent = Math.min((normalHoursWorked / expectedHours) * 100, 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          My Salary Tracker
        </CardTitle>
        <CardDescription>Current month estimated earnings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Today's Check-in Status */}
        {isCheckedIn && checkInTime && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Today's Status</p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Checked in at {checkInTime}
                </p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            {checkInLocation && (
              <div className="flex items-center justify-between pt-2 border-t border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
                  <MapPin className="h-3 w-3" />
                  <span>Location recorded</span>
                </div>
                {locationValidated === true && (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs">✓ Verified</Badge>
                )}
                {locationValidated === false && (
                  <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 text-xs">⚠ Review</Badge>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Net Pay */}
        <div className="p-4 bg-primary/10 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Expected Net Pay</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(netPay)}</p>
        </div>

        {/* Hours Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Hours Worked
            </span>
            <span className="font-medium">
              {normalHoursWorked.toFixed(1)} / {expectedHours}h
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Overtime */}
        {overtimeHours > 0 && (
          <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-700">Overtime Earnings</p>
                <p className="text-xs text-green-600">{overtimeHours.toFixed(1)} hours</p>
              </div>
            </div>
            <p className="font-semibold text-green-700">{formatCurrency(overtimePay)}</p>
          </div>
        )}

        {/* Breakdown */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Base Salary</span>
            <span className="font-medium">{formatCurrency(currentMonthSalary)}</span>
          </div>
          {overtimeHours > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overtime Pay</span>
              <span className="font-medium text-green-600">+{formatCurrency(overtimePay)}</span>
            </div>
          )}
        </div>

        {/* Last Updated */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
          <Calendar className="h-3 w-3" />
          <span>Updates in real-time as you work</span>
        </div>
      </CardContent>
    </Card>
  );
}
