import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useInstitutionPeriods, useInstitutionTimetable } from '@/hooks/useTimetable';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export default function ManagementTimetable() {
  const { user } = useAuth();
  const institutionId = user?.tenant_id;

  const { periods, isLoading: isLoadingPeriods } = useInstitutionPeriods(institutionId);
  const { assignments, isLoading: isLoadingTimetable } = useInstitutionTimetable(institutionId);

  const sortedPeriods = [...periods].sort((a, b) => a.display_order - b.display_order);

  const getAssignment = (day: string, periodId: string) => {
    return assignments.find(a => a.day === day && a.period_id === periodId);
  };

  const getOfficerColor = (teacherId: string | null | undefined) => {
    if (!teacherId) return 'bg-muted text-muted-foreground';
    const colors = [
      'bg-blue-100 text-blue-700 border-blue-200',
      'bg-green-100 text-green-700 border-green-200',
      'bg-purple-100 text-purple-700 border-purple-200',
      'bg-orange-100 text-orange-700 border-orange-200',
      'bg-pink-100 text-pink-700 border-pink-200',
      'bg-cyan-100 text-cyan-700 border-cyan-200',
    ];
    const hash = teacherId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  if (isLoadingPeriods || isLoadingTimetable) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Clock className="h-12 w-12 text-muted-foreground animate-pulse mx-auto mb-4" />
            <p className="text-muted-foreground">Loading timetable...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Institution Timetable</h1>
          <p className="text-muted-foreground">
            View the weekly timetable for your institution
          </p>
        </div>

        {periods.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Timetable Configured</h3>
              <p className="text-muted-foreground text-center">
                The timetable has not been set up for this institution yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Weekly Timetable
              </CardTitle>
              <CardDescription>Officer assignments for each period</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="w-full">
                <div className="min-w-[800px]">
                  <div className="grid grid-cols-7 gap-2">
                    {/* Header */}
                    <div className="font-semibold text-sm p-2">Period / Day</div>
                    {DAYS.map(day => (
                      <div key={day} className="font-semibold text-sm p-2 text-center">
                        {day}
                      </div>
                    ))}

                    {/* Timetable Grid */}
                    {sortedPeriods.map(period => (
                      <>
                        <div key={`${period.id}-label`} className="p-2 border rounded bg-muted/50">
                          <div className="font-medium text-sm">{period.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {period.start_time} - {period.end_time}
                          </div>
                          {period.is_break && (
                            <Badge variant="secondary" className="text-xs mt-1">Break</Badge>
                          )}
                        </div>
                        {DAYS.map(day => {
                          const assignment = getAssignment(day, period.id);
                          return (
                            <div
                              key={`${day}-${period.id}`}
                              className={cn(
                                "p-2 border rounded min-h-[80px]",
                                period.is_break
                                  ? "bg-muted/30"
                                  : assignment
                                  ? getOfficerColor(assignment.teacher_id)
                                  : "bg-background"
                              )}
                            >
                              {assignment && !period.is_break ? (
                                <div className="space-y-1">
                                  <div className="font-medium text-sm">{assignment.class_name}</div>
                                  <div className="flex items-center gap-1 text-xs">
                                    <User className="h-3 w-3" />
                                    {assignment.teacher_name || 'Unassigned'}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
