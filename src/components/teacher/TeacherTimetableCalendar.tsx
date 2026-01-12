import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, MapPin } from 'lucide-react';

interface ScheduleItem {
  id: string;
  day: string;
  course_code: string;
  course_name: string;
  start_time: string;
  end_time: string;
  room: string;
  type: 'lecture' | 'lab' | 'tutorial';
}

interface TeacherTimetableCalendarProps {
  schedule: ScheduleItem[];
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function TeacherTimetableCalendar({ schedule }: TeacherTimetableCalendarProps) {
  const timeSlots = useMemo(() => {
    const uniqueTimeRanges = new Set<string>();
    schedule.forEach((item) => {
      uniqueTimeRanges.add(`${item.start_time}-${item.end_time}`);
    });
    return Array.from(uniqueTimeRanges).sort();
  }, [schedule]);

  const getSlotForDayAndTime = (day: string, timeRange: string) => {
    return schedule.find(
      (item) => item.day === day && `${item.start_time}-${item.end_time}` === timeRange
    );
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      lecture: 'bg-blue-100 text-blue-800 border-blue-300',
      lab: 'bg-green-100 text-green-800 border-green-300',
      tutorial: 'bg-purple-100 text-purple-800 border-purple-300',
    };
    return colors[type] || colors.lecture;
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <Card>
      <CardContent className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr>
                <th className="border border-border bg-muted p-3 text-left font-semibold min-w-[120px]">
                  Time
                </th>
                {days.map((day) => (
                  <th
                    key={day}
                    className={`border border-border p-3 text-center font-semibold ${
                      day === today ? 'bg-primary/10' : 'bg-muted'
                    }`}
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((timeRange) => (
                <tr key={timeRange}>
                  <td className="border border-border bg-muted/50 p-3 font-medium text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {timeRange}
                    </div>
                  </td>
                  {days.map((day) => {
                    const slot = getSlotForDayAndTime(day, timeRange);
                    return (
                      <td
                        key={`${day}-${timeRange}`}
                        className={`border border-border p-2 align-top ${
                          day === today ? 'bg-primary/5' : ''
                        }`}
                      >
                        {slot ? (
                          <div
                            className={`rounded-lg border-2 p-3 h-full ${getTypeColor(
                              slot.type
                            )}`}
                          >
                            <div className="font-semibold text-sm mb-1">
                              {slot.course_code}
                            </div>
                            <div className="text-xs mb-2 line-clamp-1">
                              {slot.course_name}
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              <MapPin className="h-3 w-3" />
                              <span>{slot.room}</span>
                            </div>
                            <div className="mt-1 text-xs font-medium capitalize">
                              {slot.type}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground text-xs py-4">
                            Free
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

        {/* Legend */}
        <div className="flex items-center gap-4 mt-6 pt-4 border-t border-border">
          <span className="text-sm font-medium text-muted-foreground">Legend:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-100 border-2 border-blue-300"></div>
            <span className="text-sm">Lecture</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-300"></div>
            <span className="text-sm">Lab</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-purple-100 border-2 border-purple-300"></div>
            <span className="text-sm">Tutorial</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
