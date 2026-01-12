import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Clock, Download, User } from 'lucide-react';
import { PeriodConfig, InstitutionTimetableAssignment } from '@/types/institution';
import { OfficerTimetable } from '@/types/officer';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface InstitutionTimetableViewProps {
  institutionId: string;
  periods: PeriodConfig[];
  timetableData: InstitutionTimetableAssignment[];
  officerTimetables: OfficerTimetable[];
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export const InstitutionTimetableView = ({
  institutionId,
  periods,
  timetableData,
  officerTimetables
}: InstitutionTimetableViewProps) => {
  const getAssignment = (day: typeof DAYS[number], periodId: string) => {
    return timetableData.find(t => t.day === day && t.period_id === periodId);
  };

  const getClassColor = (classId: string) => {
    const colors = [
      'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
      'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20',
      'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20',
      'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20',
      'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-500/10 dark:text-pink-400 dark:border-pink-500/20',
      'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20',
    ];
    const hashCode = classId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hashCode % colors.length];
  };

  const handleExportCSV = () => {
    // Create CSV content
    const headers = ['Day', 'Period', 'Time', 'Class', 'Subject', 'Room'];
    const rows = timetableData.map(assignment => {
      const period = periods.find(p => p.id === assignment.period_id);
      return [
        assignment.day,
        period?.label || '',
        period ? `${period.start_time} - ${period.end_time}` : '',
        assignment.class_name,
        assignment.subject,
        assignment.room || ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timetable-${institutionId}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Timetable exported successfully');
  };

  const totalSlots = timetableData.length;
  const totalHours = timetableData.reduce((acc, assignment) => {
    const period = periods.find(p => p.id === assignment.period_id);
    if (period && !period.is_break) {
      const [startH, startM] = period.start_time.split(':').map(Number);
      const [endH, endM] = period.end_time.split(':').map(Number);
      return acc + ((endH * 60 + endM) - (startH * 60 + startM)) / 60;
    }
    return acc;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">STEM Class Schedule</h2>
          <p className="text-muted-foreground">View weekly timetable and officer assignments</p>
        </div>
        <Button variant="outline" onClick={handleExportCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes Scheduled</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSlots}</div>
            <p className="text-xs text-muted-foreground">Across all periods</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teaching Hours/Week</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(totalHours)}</div>
            <p className="text-xs text-muted-foreground">Total hours scheduled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Innovation Officers</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{officerTimetables.length}</div>
            <p className="text-xs text-muted-foreground">Assigned to institution</p>
          </CardContent>
        </Card>
      </div>

      {periods.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Timetable Configured</h3>
            <p className="text-muted-foreground text-center">
              System Admin needs to configure period timings and timetable assignments
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Weekly Timetable
            </CardTitle>
            <CardDescription>Read-only view of class schedule</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <div className="min-w-[800px]">
                <div className="grid grid-cols-7 gap-2">
                  {/* Header */}
                  <div className="font-semibold text-sm p-2 bg-muted/50 rounded">Period / Day</div>
                  {DAYS.map(day => (
                    <div key={day} className="font-semibold text-sm p-2 text-center bg-muted/50 rounded">
                      {day}
                    </div>
                  ))}

                  {/* Timetable Grid */}
                  {periods.sort((a, b) => a.display_order - b.display_order).map(period => (
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
                                ? `${getClassColor(assignment.class_id)}`
                                : "bg-background"
                            )}
                          >
                            {assignment && !period.is_break ? (
                              <div className="space-y-1">
                                <div className="font-medium text-sm">{assignment.class_name}</div>
                                <div className="text-xs">{assignment.subject}</div>
                                {assignment.room && (
                                  <div className="text-xs opacity-75">Room: {assignment.room}</div>
                                )}
                                {assignment.teacher_name && (
                                  <div className="text-xs opacity-75 flex items-center gap-1 mt-1">
                                    <User className="h-3 w-3" />
                                    {assignment.teacher_name}
                                  </div>
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

      {/* Officer Schedules */}
      {officerTimetables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Innovation Officer Schedules</CardTitle>
            <CardDescription>Individual officer timetables for this institution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {officerTimetables.map((officerTimetable) => (
              <div key={officerTimetable.officer_id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">Officer ID: {officerTimetable.officer_id}</h4>
                    <p className="text-sm text-muted-foreground">
                      {officerTimetable.total_hours} hours/week • {officerTimetable.slots.length} classes
                    </p>
                  </div>
                  <Badge variant={officerTimetable.status === 'assigned' ? 'default' : 'secondary'}>
                    {officerTimetable.status}
                  </Badge>
                </div>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {officerTimetable.slots.slice(0, 6).map((slot) => (
                    <div key={slot.id} className="text-xs p-2 rounded border bg-muted/30">
                      <div className="font-medium">{slot.day}</div>
                      <div className="text-muted-foreground">{slot.start_time} - {slot.end_time}</div>
                      <div className="mt-1">{slot.class}</div>
                      <div className="text-muted-foreground">{slot.subject}</div>
                    </div>
                  ))}
                  {officerTimetable.slots.length > 6 && (
                    <div className="text-xs p-2 rounded border bg-muted/30 flex items-center justify-center">
                      <span className="text-muted-foreground">
                        +{officerTimetable.slots.length - 6} more classes
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
