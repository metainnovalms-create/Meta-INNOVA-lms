import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { getOfficerAttendanceRecord } from '@/data/mockOfficerAttendance';

interface OfficerMonthlyAttendanceCalendarProps {
  officerId: string;
  month: string;
  onMonthChange: (month: string) => void;
}

export function OfficerMonthlyAttendanceCalendar({
  officerId,
  month,
  onMonthChange,
}: OfficerMonthlyAttendanceCalendarProps) {
  const attendanceRecord = useMemo(() => {
    return getOfficerAttendanceRecord(officerId, month);
  }, [officerId, month]);

  const calendarDays = useMemo(() => {
    const [year, monthNum] = month.split('-').map(Number);
    const firstDay = new Date(year, monthNum - 1, 1);
    const lastDay = new Date(year, monthNum, 0);
    const daysInMonth = lastDay.getDate();
    
    const days: Date[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, monthNum - 1, i));
    }
    return { days, firstDay };
  }, [month]);

  const getStatusForDate = (date: Date) => {
    if (!attendanceRecord) return null;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    const record = attendanceRecord.daily_records.find((r: any) => r.date === dateStr);
    return record;
  };

  const getStatusColor = (date: Date) => {
    const attendance = getStatusForDate(date);
    
    if (!attendance) return 'bg-muted text-muted-foreground';
    
    switch (attendance.status) {
      case 'present':
        return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
      case 'leave':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIndicator = (date: Date) => {
    const attendance = getStatusForDate(date);
    if (!attendance) return '';
    
    switch (attendance.status) {
      case 'present': return '✓';
      case 'absent': return '✗';
      case 'leave': return 'L';
      default: return '';
    }
  };

  const goToPreviousMonth = () => {
    const [year, monthNum] = month.split('-').map(Number);
    const prevMonth = monthNum === 1 ? 12 : monthNum - 1;
    const prevYear = monthNum === 1 ? year - 1 : year;
    onMonthChange(`${prevYear}-${String(prevMonth).padStart(2, '0')}`);
  };

  const goToNextMonth = () => {
    const [year, monthNum] = month.split('-').map(Number);
    const nextMonth = monthNum === 12 ? 1 : monthNum + 1;
    const nextYear = monthNum === 12 ? year + 1 : year;
    onMonthChange(`${nextYear}-${String(nextMonth).padStart(2, '0')}`);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Monthly Attendance Calendar</CardTitle>
          <div className="flex gap-2 items-center">
            <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[150px] text-center">
              <span className="text-sm font-medium">
                {format(new Date(month + '-01'), 'MMMM yyyy')}
              </span>
            </div>
            <Button variant="outline" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Cards */}
          {attendanceRecord && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-green-600">
                    {attendanceRecord.present_days}
                  </div>
                  <p className="text-xs text-muted-foreground">Present</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-red-600">
                    {attendanceRecord.absent_days}
                  </div>
                  <p className="text-xs text-muted-foreground">Absent</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-yellow-600">
                    {attendanceRecord.leave_days}
                  </div>
                  <p className="text-xs text-muted-foreground">Leave</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {attendanceRecord.total_hours_worked.toFixed(1)} hrs
                  </div>
                  <p className="text-xs text-muted-foreground">Total Hours</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                {day}
              </div>
            ))}
            
            {/* Empty cells for offset */}
            {Array.from({ length: calendarDays.firstDay.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            
            {/* Calendar days */}
            {calendarDays.days.map((date, index) => {
              const attendance = getStatusForDate(date);
              
              return (
                <div
                  key={index}
                  className={`
                    p-3 text-center rounded-lg border-2 transition-all
                    ${getStatusColor(date)}
                    ${attendance ? 'cursor-pointer hover:scale-105' : ''}
                  `}
                  title={attendance ? `${attendance.status.toUpperCase()}\nCheck-in: ${attendance.check_in_time || '-'}\nCheck-out: ${attendance.check_out_time || '-'}` : ''}
                >
                  <div className="text-sm font-medium">{date.getDate()}</div>
                  <div className="text-xs font-bold">{getStatusIndicator(date)}</div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-300 dark:bg-green-900/20 dark:border-green-800" />
              <span className="text-sm">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100 border-2 border-red-300 dark:bg-red-900/20 dark:border-red-800" />
              <span className="text-sm">Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-100 border-2 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-800" />
              <span className="text-sm">Leave</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-muted border-2" />
              <span className="text-sm">No Data</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
