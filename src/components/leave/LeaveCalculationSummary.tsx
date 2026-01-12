import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Calculator, AlertTriangle, CheckCircle } from 'lucide-react';

interface LeaveCalculationSummaryProps {
  totalCalendarDays: number;
  weekendsExcluded: number;
  holidaysExcluded: number;
  actualLeaveDays: number;
  availableBalance: number;
  showPayCalculation?: boolean;
}

export function LeaveCalculationSummary({
  totalCalendarDays,
  weekendsExcluded,
  holidaysExcluded,
  actualLeaveDays,
  availableBalance,
  showPayCalculation = true
}: LeaveCalculationSummaryProps) {
  const paidDays = Math.min(actualLeaveDays, availableBalance);
  const lopDays = Math.max(0, actualLeaveDays - availableBalance);

  if (totalCalendarDays === 0) {
    return null;
  }

  return (
    <Card className="bg-muted/30">
      <CardContent className="p-4 space-y-4">
        {/* Leave Days Calculation */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CalendarDays className="h-4 w-4 text-primary" />
            Leave Calculation
          </div>
          <div className="pl-6 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Calendar Days:</span>
              <span className="font-medium">{totalCalendarDays}</span>
            </div>
            {weekendsExcluded > 0 && (
              <div className="flex justify-between text-blue-600 dark:text-blue-400">
                <span>🗓️ Weekends Excluded:</span>
                <span>-{weekendsExcluded}</span>
              </div>
            )}
            {holidaysExcluded > 0 && (
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>🎉 Holidays Excluded:</span>
                <span>-{holidaysExcluded}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-1 font-semibold">
              <span>Actual Leave Days:</span>
              <span>{actualLeaveDays}</span>
            </div>
          </div>
        </div>

        {/* Pay Calculation */}
        {showPayCalculation && actualLeaveDays > 0 && (
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calculator className="h-4 w-4 text-primary" />
              Pay Calculation
            </div>
            <div className="pl-6 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Available Balance:</span>
                <span className="font-medium">{availableBalance} days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Paid Leave:
                </span>
                <Badge variant="default" className="bg-green-500">
                  {paidDays} days
                </Badge>
              </div>
              {lopDays > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    LOP (Loss of Pay):
                  </span>
                  <Badge variant="destructive">
                    {lopDays} days
                  </Badge>
                </div>
              )}
            </div>
            {lopDays > 0 && (
              <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>
                  You don't have enough leave balance. {lopDays} day(s) will be marked as Loss of Pay (LOP) and will be deducted from your salary.
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
