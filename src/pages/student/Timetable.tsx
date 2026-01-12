import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, MapPin, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useClassTimetable } from '@/hooks/useClassTimetable';
import { Skeleton } from '@/components/ui/skeleton';

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export default function Timetable() {
  const { user } = useAuth();

  const { assignments, periods, periodMap, isLoading, error } = useClassTimetable(
    user?.institution_id,
    user?.class_id,
    '2024-25'
  );

  // Group assignments by day and sort by period display_order
  const eventsByDay = weekDays.map((day) => {
    const dayAssignments = assignments
      .filter(a => a.day === day)
      .sort((a, b) => {
        const periodA = periodMap.get(a.period_id);
        const periodB = periodMap.get(b.period_id);
        return (periodA?.display_order || 0) - (periodB?.display_order || 0);
      });

    return {
      day,
      events: dayAssignments,
    };
  });

  if (!user?.class_id) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">My Timetable</h1>
            <p className="text-muted-foreground">View your weekly class schedule and sessions</p>
          </div>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No class assigned to your profile yet. Please contact management.
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Timetable</h1>
          <p className="text-muted-foreground">View your weekly class schedule and sessions</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Weekly Schedule</CardTitle>
                <CardDescription>Your class timetable for each day</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {weekDays.map((day) => (
                  <Card key={day} className="border-2">
                    <CardHeader className="pb-3">
                      <Skeleton className="h-6 w-24" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8 text-destructive">
                Failed to load timetable. Please try again later.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {eventsByDay.map((dayData) => (
                  <Card key={dayData.day} className="border-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{dayData.day}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {dayData.events.length > 0 ? (
                        dayData.events.map((event) => {
                          const period = periodMap.get(event.period_id);
                          return (
                            <div
                              key={event.id}
                              className="rounded-lg border-2 p-3 space-y-2 bg-primary/5 border-primary/20"
                            >
                              <div className="font-semibold">{event.subject}</div>
                              <div className="space-y-1 text-xs text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {period ? `${period.label} (${period.start_time} - ${period.end_time})` : 'Time N/A'}
                                  </span>
                                </div>
                                {event.teacher_name && (
                                  <div className="flex items-center gap-2">
                                    <User className="h-3 w-3" />
                                    <span>{event.teacher_name}</span>
                                  </div>
                                )}
                                {event.room && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-3 w-3" />
                                    <span>{event.room}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                          No classes scheduled
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
