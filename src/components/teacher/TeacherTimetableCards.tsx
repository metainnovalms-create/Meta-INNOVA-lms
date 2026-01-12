import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, BookOpen } from 'lucide-react';

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

interface TeacherTimetableCardsProps {
  schedule: ScheduleItem[];
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function TeacherTimetableCards({ schedule }: TeacherTimetableCardsProps) {
  const getScheduleForDay = (day: string) => {
    return schedule
      .filter((item) => item.day === day)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      lecture: 'bg-blue-500/10 text-blue-500',
      lab: 'bg-green-500/10 text-green-500',
      tutorial: 'bg-purple-500/10 text-purple-500',
    };
    return colors[type] || colors.lecture;
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {days.map((day) => {
        const daySchedule = getScheduleForDay(day);
        const isToday = day === today;

        return (
          <Card key={day} className={isToday ? 'ring-2 ring-primary' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {day}
                  {isToday && (
                    <Badge variant="default" className="ml-2">
                      Today
                    </Badge>
                  )}
                </div>
                <Badge variant="outline">{daySchedule.length} classes</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {daySchedule.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No classes scheduled</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {daySchedule.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                          <BookOpen className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm truncate">
                              {item.course_code} - {item.course_name}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>
                                {item.start_time} - {item.end_time}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>{item.room}</span>
                            </div>
                          </div>
                          <Badge className={`${getTypeColor(item.type)} mt-2 text-xs`}>
                            {item.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
