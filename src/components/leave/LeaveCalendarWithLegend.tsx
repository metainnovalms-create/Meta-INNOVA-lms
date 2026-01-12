import { useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO, eachDayOfInterval, isSameDay } from 'date-fns';
import type { DateRange } from 'react-day-picker';

interface LeaveCalendarWithLegendProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  nonWorkingDays: {
    weekends: string[];
    holidays: string[];
  };
  holidayDetails?: Array<{ date: string; name: string }>;
  numberOfMonths?: number;
}

export function LeaveCalendarWithLegend({
  dateRange,
  onDateRangeChange,
  nonWorkingDays,
  holidayDetails = [],
  numberOfMonths = 1
}: LeaveCalendarWithLegendProps) {
  // Create sets for quick lookup
  const weekendSet = useMemo(() => 
    new Set(nonWorkingDays.weekends.map(d => format(parseISO(d), 'yyyy-MM-dd'))),
    [nonWorkingDays.weekends]
  );
  
  const holidaySet = useMemo(() => 
    new Set(nonWorkingDays.holidays.map(d => format(parseISO(d), 'yyyy-MM-dd'))),
    [nonWorkingDays.holidays]
  );

  // Get holiday name for a date
  const getHolidayName = (date: Date): string | null => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const holiday = holidayDetails.find(h => format(parseISO(h.date), 'yyyy-MM-dd') === dateStr);
    return holiday?.name || null;
  };

  // Custom modifier for day styling
  const modifiers = useMemo(() => ({
    weekend: (date: Date) => weekendSet.has(format(date, 'yyyy-MM-dd')),
    holiday: (date: Date) => holidaySet.has(format(date, 'yyyy-MM-dd')),
  }), [weekendSet, holidaySet]);

  const modifiersClassNames = {
    weekend: 'bg-muted/60 text-muted-foreground',
    holiday: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4">
        <Calendar
          mode="range"
          selected={dateRange}
          onSelect={onDateRangeChange}
          disabled={(date) => date < new Date()}
          numberOfMonths={numberOfMonths}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          className="pointer-events-auto"
        />
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-white border" />
          <span className="text-muted-foreground">Working Day</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-muted/60" />
          <span className="text-muted-foreground">Weekend</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900/30" />
          <span className="text-muted-foreground">Holiday</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary" />
          <span className="text-muted-foreground">Selected</span>
        </div>
      </div>
    </div>
  );
}
