import { OfficerTimetableSlot } from "@/types/officer";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface OfficerTimetablePreviewProps {
  slots: OfficerTimetableSlot[];
  compact?: boolean;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export function OfficerTimetablePreview({ slots, compact = false }: OfficerTimetablePreviewProps) {
  // Group slots by day
  const slotsByDay = slots.reduce((acc, slot) => {
    if (!acc[slot.day]) acc[slot.day] = [];
    acc[slot.day].push(slot);
    return acc;
  }, {} as Record<string, OfficerTimetableSlot[]>);

  // Sort slots by time within each day
  Object.keys(slotsByDay).forEach(day => {
    slotsByDay[day].sort((a, b) => a.start_time.localeCompare(b.start_time));
  });

  // Get all unique time slots
  const allTimeSlots = Array.from(
    new Set(
      slots.map(slot => `${slot.start_time}-${slot.end_time}`)
    )
  ).sort();

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'workshop':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300';
      case 'lab':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300';
      case 'mentoring':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300';
      case 'project_review':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-300';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const getSlotForDayAndTime = (day: string, timeRange: string) => {
    const daySlots = slotsByDay[day] || [];
    return daySlots.find(slot => `${slot.start_time}-${slot.end_time}` === timeRange);
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {DAYS.map(day => {
          const daySlots = slotsByDay[day] || [];
          if (daySlots.length === 0) return null;
          
          return (
            <div key={day} className="text-sm">
              <span className="font-semibold text-muted-foreground">{day.substring(0, 3)}:</span>
              <div className="ml-4 space-y-1">
                {daySlots.map(slot => (
                  <div key={slot.id} className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">
                      {slot.start_time}-{slot.end_time}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {slot.subject}
                    </Badge>
                    <span className="text-muted-foreground">({slot.class})</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="p-2 text-left font-semibold text-sm bg-muted/50">Time</th>
            {DAYS.map(day => (
              <th key={day} className="p-2 text-left font-semibold text-sm bg-muted/50 min-w-[140px]">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allTimeSlots.map(timeRange => (
            <tr key={timeRange} className="border-b">
              <td className="p-2 text-sm font-medium align-top whitespace-nowrap">
                {timeRange}
              </td>
              {DAYS.map(day => {
                const slot = getSlotForDayAndTime(day, timeRange);
                return (
                  <td key={day} className="p-2 align-top">
                    {slot && (
                      <div className={cn(
                        "p-2 rounded-md border text-xs space-y-1",
                        getActivityColor(slot.type)
                      )}>
                        <div className="font-semibold">{slot.subject}</div>
                        <div className="flex items-center gap-1 text-xs opacity-90">
                          <span>{slot.class}</span>
                          {slot.batch && <span>• {slot.batch}</span>}
                        </div>
                        <div className="text-xs opacity-80">{slot.room}</div>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
