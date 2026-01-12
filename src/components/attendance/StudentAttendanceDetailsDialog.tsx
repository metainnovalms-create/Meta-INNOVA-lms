import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getStudentAttendanceById } from '@/data/mockStudentAttendance';
import { CheckCircle2, XCircle } from 'lucide-react';

interface StudentAttendanceDetailsDialogProps {
  studentId: string;
  month: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const StudentAttendanceDetailsDialog = ({
  studentId,
  month,
  open,
  onOpenChange,
}: StudentAttendanceDetailsDialogProps) => {
  const record = getStudentAttendanceById(studentId, month);
  
  if (!record) return null;
  
  // Generate calendar grid
  const calendarDays: (Date | null)[] = [];
  const firstDay = new Date(`${month}-01`);
  const year = firstDay.getFullYear();
  const monthNum = firstDay.getMonth();
  
  // Get first day of month's weekday (0 = Sunday)
  const startingDayOfWeek = firstDay.getDay();
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Add all days in month
  const daysInMonth = new Date(year, monthNum + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, monthNum, day));
  }
  
  const getStatusForDate = (date: Date) => {
    const dateStr = `${month}-${String(date.getDate()).padStart(2, '0')}`;
    return record.daily_records.find(r => r.date === dateStr);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Attendance Details - {record.student_name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Roll Number</p>
                  <p className="font-semibold">{record.roll_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Class</p>
                  <p className="font-semibold">{record.class} {record.section}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Attendance Rate</p>
                  <p className="font-semibold text-blue-600 dark:text-blue-400">
                    {record.attendance_percentage.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Classes Attended</p>
                  <p className="font-semibold">
                    {record.classes_attended}/{record.total_classes}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Calendar View */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Monthly Calendar</h3>
              <div className="space-y-4">
                {/* Days of Week Header */}
                <div className="grid grid-cols-7 gap-2 text-center font-semibold text-sm">
                  <div>Sun</div>
                  <div>Mon</div>
                  <div>Tue</div>
                  <div>Wed</div>
                  <div>Thu</div>
                  <div>Fri</div>
                  <div>Sat</div>
                </div>
                
                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((date, index) => {
                    if (!date) {
                      return <div key={index} className="min-h-[60px]" />;
                    }
                    
                    const status = getStatusForDate(date);
                    const isPresent = status?.status === 'present';
                    const isAbsent = status?.status === 'absent';
                    
                    return (
                      <div
                        key={index}
                        className={`
                          min-h-[60px] p-2 rounded-lg border-2 flex flex-col items-center justify-center
                          ${isPresent ? 'bg-green-100 border-green-300 dark:bg-green-900/20 dark:border-green-800' : ''}
                          ${isAbsent ? 'bg-red-100 border-red-300 dark:bg-red-900/20 dark:border-red-800' : ''}
                          ${!status ? 'bg-muted border-muted-foreground/20' : ''}
                        `}
                      >
                        <div className="text-xs font-semibold">{date.getDate()}</div>
                        {isPresent && <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-1" />}
                        {isAbsent && <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-1" />}
                      </div>
                    );
                  })}
                </div>
                
                {/* Legend */}
                <div className="flex items-center justify-center gap-6 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-300 dark:bg-green-900/20 dark:border-green-800" />
                    <span className="text-sm">Present</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-100 border-2 border-red-300 dark:bg-red-900/20 dark:border-red-800" />
                    <span className="text-sm">Absent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-muted border-2 border-muted-foreground/20" />
                    <span className="text-sm">No Class</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Session List */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Session History</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {record.daily_records.map((session, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {session.status === 'present' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      )}
                      <div>
                        <p className="font-medium">{session.date}</p>
                        <p className="text-sm text-muted-foreground">
                          Marked by {session.marked_by_officer}
                        </p>
                      </div>
                    </div>
                    <Badge variant={session.status === 'present' ? 'default' : 'destructive'}>
                      {session.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
