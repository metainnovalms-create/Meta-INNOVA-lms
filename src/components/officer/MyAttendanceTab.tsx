import { useState, useEffect } from 'react';
import { format, subMonths } from 'date-fns';
import { Calendar, Download, CheckCircle2, XCircle, Coffee, Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { mockAttendanceData } from '@/data/mockAttendanceData';
import { OfficerAttendanceRecord } from '@/types/attendance';
import { exportToCSV } from '@/utils/attendanceHelpers';
import { toast } from 'sonner';

export function MyAttendanceTab() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<string>(
    format(new Date(), 'yyyy-MM')
  );
  const [showCalendar, setShowCalendar] = useState(false);
  const [attendanceRecord, setAttendanceRecord] = useState<OfficerAttendanceRecord | null>(null);

  // Generate last 12 months
  const generateMonthOptions = () => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      const date = subMonths(new Date(), i);
      months.push({
        value: format(date, 'yyyy-MM'),
        label: format(date, 'MMMM yyyy'),
      });
    }
    return months;
  };

  const monthOptions = generateMonthOptions();

  // Load attendance data
  useEffect(() => {
    if (user) {
      const record = mockAttendanceData.find(
        (r) => r.officer_id === user.id && r.month === selectedMonth
      );
      setAttendanceRecord(record || null);
    }
  }, [user, selectedMonth]);

  // Calculate attendance rate
  const calculateAttendanceRate = () => {
    if (!attendanceRecord) return 0;
    const total =
      attendanceRecord.present_days +
      attendanceRecord.absent_days +
      attendanceRecord.leave_days;
    return total > 0 ? (attendanceRecord.present_days / total) * 100 : 0;
  };

  // Download attendance report
  const handleDownloadReport = () => {
    if (!attendanceRecord) {
      toast.error('No attendance data to download');
      return;
    }

    const exportData = attendanceRecord.daily_records.map((record) => ({
      Date: record.date,
      Status: record.status,
      'Check In': record.check_in_time || '-',
      'Check Out': record.check_out_time || '-',
      'Hours Worked': record.hours_worked?.toFixed(2) || '-',
      'Overtime Hours': record.overtime_hours?.toFixed(2) || '-',
      'Leave Type': record.leave_type || '-',
      'Leave Reason': record.leave_reason || '-',
    }));

    exportToCSV(exportData, `my-attendance-${selectedMonth}.csv`);
    toast.success('Attendance report downloaded successfully');
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Present
          </Badge>
        );
      case 'absent':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Absent
          </Badge>
        );
      case 'leave':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Coffee className="h-3 w-3 mr-1" />
            Leave
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!attendanceRecord) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-center py-12">
          <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Attendance Records</h3>
          <p className="text-muted-foreground">
            No attendance data found for {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}
          </p>
        </div>
      </div>
    );
  }

  const attendanceRate = calculateAttendanceRate();

  return (
    <div className="space-y-6">
      {/* Month Selector and Download Button */}
      <div className="flex items-center justify-between">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={handleDownloadReport} className="gap-2">
          <Download className="h-4 w-4" />
          Download Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{attendanceRecord.present_days}</p>
                <p className="text-sm text-muted-foreground">Present</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{attendanceRecord.absent_days}</p>
                <p className="text-sm text-muted-foreground">Absent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                <Coffee className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{attendanceRecord.leave_days}</p>
                <p className="text-sm text-muted-foreground">Leave</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{attendanceRecord.total_hours_worked}</p>
                <p className="text-sm text-muted-foreground">Hours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{attendanceRate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Calendar</CardTitle>
          <CardDescription>Visual representation of your monthly attendance</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => setShowCalendar(!showCalendar)}
            className="mb-4"
          >
            <Calendar className="h-4 w-4 mr-2" />
            {showCalendar ? 'Hide Calendar' : 'Show Calendar'}
          </Button>

          {showCalendar && (
            <div className="space-y-4">
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-2">
                {(() => {
                  const [year, month] = selectedMonth.split('-').map(Number);
                  const firstDay = new Date(year, month - 1, 1);
                  const daysInMonth = new Date(year, month, 0).getDate();
                  const startDayOfWeek = firstDay.getDay();
                  
                  const days = [];
                  
                  // Empty cells for days before month starts
                  for (let i = 0; i < startDayOfWeek; i++) {
                    days.push(<div key={`empty-${i}`} />);
                  }
                  
                  // Calendar days
                  for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(year, month - 1, day);
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const record = attendanceRecord.daily_records.find(r => r.date === dateStr);
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    const isFuture = date > new Date();
                    
                    const getStatusColor = () => {
                      if (isWeekend || isFuture) return 'bg-muted border-muted-foreground/20 text-muted-foreground';
                      if (!record) return 'bg-muted border-muted-foreground/20 text-muted-foreground';
                      
                      switch (record.status) {
                        case 'present':
                          return 'bg-green-500/20 border-green-500 text-green-700';
                        case 'absent':
                          return 'bg-red-500/20 border-red-500 text-red-700';
                        case 'leave':
                          return 'bg-yellow-500/20 border-yellow-500 text-yellow-700';
                        default:
                          return 'bg-muted border-muted-foreground/20 text-muted-foreground';
                      }
                    };
                    
                    days.push(
                      <div
                        key={day}
                        className={cn(
                          'relative aspect-square border rounded-lg p-2 flex flex-col items-center justify-center',
                          getStatusColor(),
                          'group cursor-pointer hover:shadow-md transition-shadow'
                        )}
                        title={
                          record 
                            ? `${record.status.toUpperCase()}\n${record.check_in_time ? `In: ${record.check_in_time}` : ''}\n${record.check_out_time ? `Out: ${record.check_out_time}` : ''}`
                            : isWeekend ? 'Weekend' : isFuture ? 'Future date' : 'No record'
                        }
                      >
                        <span className="text-sm font-medium">{day}</span>
                        {record && (
                          <span className="text-xs mt-1">
                            {record.status === 'present' ? '✓' : record.status === 'absent' ? '✗' : 'L'}
                          </span>
                        )}
                      </div>
                    );
                  }
                  
                  return days;
                })()}
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
          )}
        </CardContent>
      </Card>

      {/* Daily Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Attendance Records</CardTitle>
          <CardDescription>Detailed breakdown of your attendance for the month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Overtime</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecord.daily_records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No daily records available
                    </TableCell>
                  </TableRow>
                ) : (
                  attendanceRecord.daily_records.map((record) => {
                    const date = new Date(record.date);
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                    return (
                      <TableRow
                        key={record.date}
                        className={isWeekend ? 'bg-muted/50' : ''}
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {format(date, 'dd MMM yyyy')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(date, 'EEEE')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell>{record.check_in_time || '-'}</TableCell>
                        <TableCell>{record.check_out_time || '-'}</TableCell>
                        <TableCell>
                          {record.hours_worked ? `${record.hours_worked.toFixed(2)}h` : '-'}
                        </TableCell>
                        <TableCell>
                          {record.overtime_hours ? `${record.overtime_hours.toFixed(2)}h` : '-'}
                        </TableCell>
                        <TableCell>
                          {record.leave_type && (
                            <div className="text-sm">
                              <div className="font-medium capitalize">{record.leave_type}</div>
                              {record.leave_reason && (
                                <div className="text-muted-foreground">{record.leave_reason}</div>
                              )}
                            </div>
                          )}
                          {record.notes && (
                            <div className="text-sm text-muted-foreground">{record.notes}</div>
                          )}
                          {!record.leave_type && !record.notes && '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
