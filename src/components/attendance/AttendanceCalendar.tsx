import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parse } from 'date-fns';
import { generateMonthCalendarDays, getAttendanceForDate, calculateAttendancePercentage } from '@/utils/attendanceHelpers';
import { OfficerAttendanceRecord } from '@/types/attendance';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AttendanceCalendarProps {
  attendance: OfficerAttendanceRecord;
  isOpen: boolean;
  onClose: () => void;
}

export function AttendanceCalendar({ attendance, isOpen, onClose }: AttendanceCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(attendance.month);
  
  const calendarDays = generateMonthCalendarDays(currentMonth);
  const monthDate = parse(currentMonth, 'yyyy-MM', new Date());
  const totalDays = attendance.present_days + attendance.absent_days + attendance.leave_days;
  const attendanceRate = calculateAttendancePercentage(attendance.present_days, totalDays);

  const getStatusColor = (status: 'present' | 'absent' | 'leave' | 'half_day' | undefined) => {
    switch (status) {
      case 'present':
        return 'bg-green-500/20 border-green-500 text-green-700';
      case 'absent':
        return 'bg-red-500/20 border-red-500 text-red-700';
      case 'leave':
        return 'bg-yellow-500/20 border-yellow-500 text-yellow-700';
      case 'half_day':
        return 'bg-orange-500/20 border-orange-500 text-orange-700';
      default:
        return 'bg-muted border-muted-foreground/20 text-muted-foreground';
    }
  };

  const goToPreviousMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    setCurrentMonth(`${prevYear}-${String(prevMonth).padStart(2, '0')}`);
  };

  const goToNextMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    setCurrentMonth(`${nextYear}-${String(nextMonth).padStart(2, '0')}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {attendance.officer_name}'s Attendance
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Employee ID</p>
              <p className="font-semibold">{attendance.employee_id}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Present</p>
              <p className="font-semibold text-green-600">{attendance.present_days} days</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Absent</p>
              <p className="font-semibold text-red-600">{attendance.absent_days} days</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Leave</p>
              <p className="font-semibold text-yellow-600">{attendance.leave_days} days</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Attendance Rate</p>
              <p className="font-semibold">{attendanceRate.toFixed(1)}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Hours</p>
              <p className="font-semibold">{attendance.total_hours_worked.toFixed(1)}h</p>
            </div>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold">{format(monthDate, 'MMMM yyyy')}</h3>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div>
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {/* Empty cells for days before month starts */}
              {Array.from({ length: calendarDays[0]?.getDay() || 0 }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              
              {/* Calendar days */}
              {calendarDays.map((date) => {
                const record = getAttendanceForDate(date, attendance.daily_records);
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                const isFuture = date > new Date();
                
                return (
                  <div
                    key={date.toISOString()}
                    className={cn(
                      'relative aspect-square border rounded-lg p-2 flex flex-col items-center justify-center',
                      isWeekend || isFuture 
                        ? 'bg-muted border-muted-foreground/20 text-muted-foreground'
                        : getStatusColor(record?.status),
                      'group cursor-pointer hover:shadow-md transition-shadow'
                    )}
                    title={
                      record 
                        ? `${record.status.toUpperCase()}\n${record.check_in_time ? `In: ${record.check_in_time}` : ''}\n${record.check_out_time ? `Out: ${record.check_out_time}` : ''}\n${record.leave_reason ? `Reason: ${record.leave_reason}` : ''}`
                        : isWeekend ? 'Weekend' : isFuture ? 'Future date' : 'No record'
                    }
                  >
                    <span className="text-sm font-medium">{format(date, 'd')}</span>
                    {record && (
                      <span className="text-xs mt-1 capitalize">
                        {record.status === 'present' ? '✓' : record.status === 'absent' ? '✗' : 'L'}
                      </span>
                    )}
                    
                    {/* Tooltip on hover */}
                    {record && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                        <div className="bg-popover text-popover-foreground text-xs rounded-md shadow-lg p-2 whitespace-nowrap border">
                          <p className="font-semibold capitalize">{record.status}</p>
                          {record.check_in_time && <p>In: {record.check_in_time}</p>}
                          {record.check_out_time && <p>Out: {record.check_out_time}</p>}
                          {record.hours_worked && <p>Hours: {record.hours_worked.toFixed(1)}h</p>}
                          {record.leave_reason && <p>Reason: {record.leave_reason}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500" />
              <span className="text-sm">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500" />
              <span className="text-sm">Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500/20 border border-yellow-500" />
              <span className="text-sm">Leave</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-muted border border-muted-foreground/20" />
              <span className="text-sm">Weekend/Future</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
