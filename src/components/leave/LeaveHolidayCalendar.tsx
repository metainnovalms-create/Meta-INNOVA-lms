import { useMemo } from 'react';
import { format, isSameDay, parseISO, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';

// Simple holiday type that works with both old and new calendar system
export interface SimpleHoliday {
  id: string;
  date: string;
  name: string;
  end_date?: string;
  holiday_type?: string;
}

interface LeaveHolidayCalendarProps {
  holidays: SimpleHoliday[];
  selectedRange?: { from?: Date; to?: Date };
  userType: 'staff' | 'officer';
  isLoading?: boolean;
}

export function LeaveHolidayCalendar({
  holidays,
  selectedRange,
  userType,
  isLoading = false,
}: LeaveHolidayCalendarProps) {
  // Expand holidays to include all dates in multi-day holidays
  const holidayDates = useMemo(() => {
    const dates: Date[] = [];
    holidays.forEach((h) => {
      const startDate = parseISO(h.date);
      const endDate = h.end_date ? parseISO(h.end_date) : startDate;
      const interval = eachDayOfInterval({ start: startDate, end: endDate });
      dates.push(...interval);
    });
    return dates;
  }, [holidays]);

  // Get holidays that fall within selected range
  const holidaysInRange = useMemo(() => {
    if (!selectedRange?.from) return [];
    const endDate = selectedRange.to || selectedRange.from;
    
    return holidays.filter((h) => {
      const hStart = parseISO(h.date);
      const hEnd = h.end_date ? parseISO(h.end_date) : hStart;
      
      // Check if any day of the holiday overlaps with the selected range
      return (
        isWithinInterval(hStart, { start: selectedRange.from!, end: endDate }) ||
        isWithinInterval(hEnd, { start: selectedRange.from!, end: endDate }) ||
        isWithinInterval(selectedRange.from!, { start: hStart, end: hEnd })
      );
    });
  }, [holidays, selectedRange]);

  // Upcoming holidays (next 3)
  const upcomingHolidays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return holidays
      .filter((h) => parseISO(h.date) >= today)
      .slice(0, 4);
  }, [holidays]);

  const isHolidayDate = (date: Date) => {
    return holidayDates.some((hd) => isSameDay(hd, date));
  };

  const getHolidayName = (date: Date): string | undefined => {
    const holiday = holidays.find((h) => {
      const startDate = parseISO(h.date);
      const endDate = h.end_date ? parseISO(h.end_date) : startDate;
      return isWithinInterval(date, { start: startDate, end: endDate });
    });
    return holiday?.name;
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="h-4 w-4 text-primary" />
          Holiday Calendar
          <Badge variant="outline" className="ml-auto text-xs">
            {userType === 'officer' ? 'Institution Holidays' : 'Company Holidays'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            Loading holidays...
          </div>
        ) : (
          <>
            <Calendar
              mode="default"
              numberOfMonths={2}
              modifiers={{
                holiday: holidayDates,
              }}
              modifiersClassNames={{
                holiday: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 font-medium',
              }}
              disabled={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date < today;
              }}
              className="pointer-events-auto"
              components={{
                DayContent: ({ date }) => {
                  const holiday = isHolidayDate(date);
                  const holidayName = holiday ? getHolidayName(date) : undefined;
                  
                  return (
                    <div
                      className={cn(
                        'relative w-full h-full flex items-center justify-center',
                        holiday && 'group'
                      )}
                      title={holidayName}
                    >
                      {format(date, 'd')}
                      {holiday && (
                        <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-500" />
                      )}
                    </div>
                  );
                },
              }}
            />

            <div className="flex items-center gap-4 text-xs text-muted-foreground border-t pt-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700" />
                <span>Holidays</span>
              </div>
            </div>

            {holidaysInRange.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-sm font-medium mb-2">
                  <Gift className="h-4 w-4" />
                  Holidays in Selected Range ({holidaysInRange.length})
                </div>
                <ul className="text-sm text-amber-600 dark:text-amber-400 space-y-1">
                  {holidaysInRange.map((h) => (
                    <li key={h.id} className="flex items-center gap-2">
                      <span className="font-medium">{format(parseISO(h.date), 'MMM dd')}</span>
                      <span>- {h.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {upcomingHolidays.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Upcoming Holidays
                </div>
                <div className="grid gap-2">
                  {upcomingHolidays.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50"
                    >
                      <span className="font-medium">{h.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {format(parseISO(h.date), 'MMM dd')}
                        {h.end_date && h.end_date !== h.date && ` - ${format(parseISO(h.end_date), 'MMM dd')}`}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {holidays.length === 0 && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No holidays configured for this year
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to count holidays in a date range
export function countHolidaysInRange(
  startDate: string,
  endDate: string,
  holidays: SimpleHoliday[]
): number {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const rangeDays = eachDayOfInterval({ start, end });
  
  // Get all holiday dates expanded
  const holidayDates: Date[] = [];
  holidays.forEach((h) => {
    const hStart = parseISO(h.date);
    const hEnd = h.end_date ? parseISO(h.end_date) : hStart;
    const interval = eachDayOfInterval({ start: hStart, end: hEnd });
    holidayDates.push(...interval);
  });

  // Count how many range days are holidays
  return rangeDays.filter((day) =>
    holidayDates.some((hd) => isSameDay(hd, day))
  ).length;
}

// Calculate leave days excluding holidays only (legacy function for backward compatibility)
export function calculateLeaveDaysExcludingHolidays(
  startDate: string,
  endDate: string,
  holidays: SimpleHoliday[]
): { totalCalendarDays: number; holidaysInRange: number; actualLeaveDays: number } {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const rangeDays = eachDayOfInterval({ start, end });
  const totalCalendarDays = rangeDays.length;
  
  const holidaysInRange = countHolidaysInRange(startDate, endDate, holidays);
  const actualLeaveDays = Math.max(0, totalCalendarDays - holidaysInRange);

  return {
    totalCalendarDays,
    holidaysInRange,
    actualLeaveDays,
  };
}

// Calculate actual leave days excluding both weekends AND holidays from calendar
export function calculateActualLeaveDays(
  startDate: string,
  endDate: string,
  weekendDates: string[],
  holidayDates: string[]
): { 
  totalCalendarDays: number; 
  weekendsInRange: number; 
  holidaysInRange: number; 
  actualLeaveDays: number 
} {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const rangeDays = eachDayOfInterval({ start, end });
  const totalCalendarDays = rangeDays.length;
  
  // Count weekends that fall within the range (using calendar data, not day of week)
  const weekendsInRange = rangeDays.filter((day) =>
    weekendDates.some((wd) => format(parseISO(wd), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'))
  ).length;
  
  // Count holidays that fall within the range (excluding days already counted as weekends)
  const holidaysInRange = rangeDays.filter((day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const isWeekend = weekendDates.some((wd) => format(parseISO(wd), 'yyyy-MM-dd') === dayStr);
    if (isWeekend) return false; // Don't double count
    return holidayDates.some((hd) => format(parseISO(hd), 'yyyy-MM-dd') === dayStr);
  }).length;
  
  const actualLeaveDays = Math.max(0, totalCalendarDays - weekendsInRange - holidaysInRange);

  return {
    totalCalendarDays,
    weekendsInRange,
    holidaysInRange,
    actualLeaveDays,
  };
}
