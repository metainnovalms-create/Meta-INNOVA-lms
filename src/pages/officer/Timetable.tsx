import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useInstitutionPeriods, useInstitutionTimetable } from '@/hooks/useTimetable';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export default function OfficerTimetable() {
  const { user } = useAuth();
  const [officerId, setOfficerId] = useState<string | null>(null);
  const [assignedInstitutions, setAssignedInstitutions] = useState<string[]>([]);
  
  // Use first assigned institution for now
  const institutionId = assignedInstitutions[0];

  const { periods, isLoading: isLoadingPeriods } = useInstitutionPeriods(institutionId);
  const { assignments, isLoading: isLoadingTimetable } = useInstitutionTimetable(institutionId);

  useEffect(() => {
    const fetchOfficerData = async () => {
      if (!user?.email) return;

      const { data: officer } = await supabase
        .from('officers')
        .select('id, assigned_institutions')
        .eq('email', user.email)
        .single();

      if (officer) {
        setOfficerId(officer.id);
        setAssignedInstitutions(officer.assigned_institutions || []);
      }
    };

    fetchOfficerData();
  }, [user?.email]);

  const sortedPeriods = [...periods].sort((a, b) => a.display_order - b.display_order);

  // Filter assignments to only show this officer's schedule
  const myAssignments = assignments.filter(a => a.teacher_id === officerId);

  const getAssignment = (day: string, periodId: string) => {
    return myAssignments.find(a => a.day === day && a.period_id === periodId);
  };

  const getClassColor = (classId: string) => {
    const colors = [
      'bg-blue-100 text-blue-700 border-blue-200',
      'bg-green-100 text-green-700 border-green-200',
      'bg-purple-100 text-purple-700 border-purple-200',
      'bg-orange-100 text-orange-700 border-orange-200',
      'bg-pink-100 text-pink-700 border-pink-200',
      'bg-cyan-100 text-cyan-700 border-cyan-200',
    ];
    const hash = classId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  if (isLoadingPeriods || isLoadingTimetable) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Clock className="h-12 w-12 text-muted-foreground animate-pulse mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your schedule...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const totalSessions = myAssignments.length;
  const uniqueClasses = [...new Set(myAssignments.map(a => a.class_id))].length;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Timetable</h1>
          <p className="text-muted-foreground">
            Your weekly teaching schedule
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSessions}</div>
              <p className="text-xs text-muted-foreground">per week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Classes Assigned</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueClasses}</div>
              <p className="text-xs text-muted-foreground">unique classes</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Institutions</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assignedInstitutions.length}</div>
              <p className="text-xs text-muted-foreground">assigned</p>
            </CardContent>
          </Card>
        </div>

        {periods.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Schedule Available</h3>
              <p className="text-muted-foreground text-center">
                You haven't been assigned to any classes yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Weekly Schedule
              </CardTitle>
              <CardDescription>Your assigned classes for each period</CardDescription>
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
                                  ? getClassColor(assignment.class_id)
                                  : "bg-background"
                              )}
                            >
                              {assignment && !period.is_break ? (
                                <div className="space-y-1">
                                  <div className="font-medium text-sm">{assignment.class_name}</div>
                                  {assignment.room && (
                                    <div className="text-xs opacity-75">Room: {assignment.room}</div>
                                  )}
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
