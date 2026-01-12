import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingDown, User } from 'lucide-react';

interface StudentAttendanceRecord {
  student_id: string;
  student_name: string;
  roll_number: string;
  classes_attended: number;
  total_classes: number;
  attendance_percentage: number;
}

interface LowAttendanceAlertsProps {
  students: StudentAttendanceRecord[];
  threshold?: number;
}

export function LowAttendanceAlerts({ students, threshold = 75 }: LowAttendanceAlertsProps) {
  const lowAttendanceStudents = students
    .filter(s => s.total_classes > 0 && s.attendance_percentage < threshold)
    .sort((a, b) => a.attendance_percentage - b.attendance_percentage);

  if (lowAttendanceStudents.length === 0) {
    return null;
  }

  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4" />
          Low Attendance Alert ({lowAttendanceStudents.length} student{lowAttendanceStudents.length !== 1 ? 's' : ''})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {lowAttendanceStudents.slice(0, 5).map(student => (
            <div 
              key={student.student_id} 
              className="flex items-center justify-between p-2 rounded-md bg-background border"
            >
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{student.student_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Roll: {student.roll_number} • {student.classes_attended}/{student.total_classes} classes
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <Badge 
                  variant="destructive"
                  className="text-xs"
                >
                  {student.attendance_percentage.toFixed(1)}%
                </Badge>
              </div>
            </div>
          ))}
          {lowAttendanceStudents.length > 5 && (
            <p className="text-xs text-muted-foreground text-center pt-2">
              +{lowAttendanceStudents.length - 5} more students below {threshold}% attendance
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
