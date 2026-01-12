import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Download, Clock, TrendingUp, MapPin, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { mockUsers } from '@/data/mockUsers';
import { getStaffAttendance } from '@/data/mockStaffAttendance';
import { generateMonthCalendarDays, getAttendanceForDate, calculateAttendancePercentage, exportToCSV } from '@/utils/attendanceHelpers';

export function MetaEmployeeAttendanceTab() {
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [currentMonth, setCurrentMonth] = useState('2025-11');

  // Get meta staff users
  const metaStaff = mockUsers.filter(
    (user) =>
      user.role === 'system_admin' &&
      ['ceo', 'md', 'agm', 'gm', 'manager', 'admin_staff'].includes(user.position_name || '')
  );

  // Set default staff when not selected
  if (selectedStaffId === '' && metaStaff.length > 0) {
    setSelectedStaffId(metaStaff[0].id);
  }

  const selectedStaff = metaStaff.find((s) => s.id === selectedStaffId);
  const attendance = selectedStaff ? getStaffAttendance(selectedStaffId, currentMonth) : null;

  const getPositionDisplay = (position: string) => {
    const displayNames: Record<string, string> = {
      ceo: 'CEO',
      md: 'Managing Director',
      agm: 'AGM',
      gm: 'General Manager',
      manager: 'Manager',
      admin_staff: 'Admin Staff',
    };
    return displayNames[position] || position;
  };

  // Calculate metrics for summary cards
  const summaryMetrics = useMemo(() => {
    if (!attendance || !selectedStaff) {
      return {
        totalHours: 0,
        averageHours: 0,
        attendancePercentage: 0,
      };
    }

    const averageHours = attendance.present_days > 0 
      ? attendance.total_hours_worked / attendance.present_days 
      : 0;

    const totalDays = attendance.present_days + attendance.absent_days + attendance.leave_days;
    const attendancePercentage = calculateAttendancePercentage(attendance.present_days, totalDays);

    return {
      totalHours: attendance.total_hours_worked,
      averageHours,
      attendancePercentage,
    };
  }, [attendance, selectedStaff]);

  // Generate calendar days for current month
  const calendarDays = generateMonthCalendarDays(currentMonth);

  // Generate all days in the month
  const allDaysInMonth = useMemo(() => {
    const [year, month] = currentMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const date = `${currentMonth}-${day.toString().padStart(2, '0')}`;
      return { date, dayNumber: day };
    });
  }, [currentMonth]);

  // Daily attendance details with GPS tracking
  const dailyAttendanceDetails = useMemo(() => {
    if (!attendance) return [];
    
    const today = new Date();
    const [currentYear, currentMonthNum] = currentMonth.split('-').map(Number);
    
    return allDaysInMonth.map(({ date, dayNumber }) => {
      const dayDate = new Date(currentYear, currentMonthNum - 1, dayNumber);
      const isFutureDate = dayDate > today;
      
      const record = attendance.daily_records.find(r => r.date === date);
      
      if (isFutureDate) {
        return {
          date,
          displayDate: format(dayDate, 'EEE, MMM dd'),
          status: 'future',
          checkInTime: '-',
          checkOutTime: '-',
          checkInLocation: null,
          checkOutLocation: null,
          locationValidated: null,
          totalHours: '-',
        };
      }
      
      if (!record) {
        return {
          date,
          displayDate: format(dayDate, 'EEE, MMM dd'),
          status: 'not_marked',
          checkInTime: '-',
          checkOutTime: '-',
          checkInLocation: null,
          checkOutLocation: null,
          locationValidated: null,
          totalHours: '-',
        };
      }
      
      return {
        date,
        displayDate: format(dayDate, 'EEE, MMM dd'),
        status: record.status,
        checkInTime: record.check_in_time || '-',
        checkOutTime: record.check_out_time || '-',
        checkInLocation: record.check_in_location,
        checkOutLocation: record.check_out_location,
        locationValidated: record.location_validated,
        totalHours: record.total_hours ? `${record.total_hours.toFixed(1)} hrs` : '-',
      };
    });
  }, [attendance, currentMonth, allDaysInMonth]);

  // Helper function to render GPS link
  const renderGPSLink = (location: { latitude: number; longitude: number; address?: string } | null) => {
    if (!location) {
      return <span className="text-muted-foreground">-</span>;
    }
    
    const { latitude, longitude, address } = location;
    const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
    const coordinateDisplay = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    
    return (
      <a 
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 hover:underline text-sm flex items-center gap-1"
        title={address || coordinateDisplay}
      >
        <MapPin className="h-3 w-3" />
        <span className="font-mono text-xs">{coordinateDisplay}</span>
      </a>
    );
  };

  // Helper function for validation badge
  const getValidationBadge = (validated: boolean | null, status: string) => {
    if (validated === null || status === 'future' || status === 'not_marked' || status === 'absent' || status === 'leave') {
      return <Badge variant="outline" className="bg-gray-100 text-gray-500">N/A</Badge>;
    }
    
    if (validated === true) {
      return <Badge className="bg-green-100 text-green-800 border-green-300">✓ Verified</Badge>;
    }
    
    return <Badge className="bg-red-100 text-red-800 border-red-300">✗ Invalid</Badge>;
  };

  // Helper function for attendance status badge
  const getAttendanceStatusBadge = (status: string) => {
    const statusConfig = {
      present: { label: 'Present', className: 'bg-green-100 text-green-800 border-green-300' },
      absent: { label: 'Absent', className: 'bg-red-100 text-red-800 border-red-300' },
      leave: { label: 'Leave', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      not_marked: { label: 'Not Marked', className: 'bg-gray-100 text-gray-600 border-gray-300' },
      future: { label: 'Future', className: 'bg-blue-100 text-blue-600 border-blue-300' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.not_marked;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  // Navigation functions
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

  // Export handler for daily details
  const handleExportDailyDetails = () => {
    if (!attendance || !selectedStaff) return;
    
    const exportData = dailyAttendanceDetails.map(day => {
      const checkInCoords = day.checkInLocation 
        ? `${day.checkInLocation.latitude}, ${day.checkInLocation.longitude}`
        : '-';
      const checkOutCoords = day.checkOutLocation 
        ? `${day.checkOutLocation.latitude}, ${day.checkOutLocation.longitude}`
        : '-';
      const validation = day.locationValidated === null 
        ? 'N/A' 
        : day.locationValidated 
          ? 'Verified' 
          : 'Invalid';
      
      return {
        Date: day.displayDate,
        Status: day.status.replace('_', ' ').toUpperCase(),
        'Check-in Time': day.checkInTime,
        'Check-out Time': day.checkOutTime,
        'Check-in GPS': checkInCoords,
        'Check-out GPS': checkOutCoords,
        'Location Validated': validation,
        'Total Hours': day.totalHours,
      };
    });
    
    const staffName = selectedStaff.name.replace(/\s+/g, '_');
    const filename = `${staffName}_Daily_Attendance_${currentMonth}.csv`;
    
    exportToCSV(exportData, filename);
    toast.success('Daily attendance details exported successfully');
  };

  // Get status color for calendar day
  const getStatusColor = (date: Date) => {
    if (!attendance) return 'bg-muted text-muted-foreground';
    
    const record = getAttendanceForDate(date, attendance.daily_records);
    
    if (!record) return 'bg-muted text-muted-foreground';
    
    switch (record.status) {
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

  // Get status indicator
  const getStatusIndicator = (date: Date) => {
    if (!attendance) return '';
    
    const record = getAttendanceForDate(date, attendance.daily_records);
    if (!record) return '';
    
    switch (record.status) {
      case 'present': return '✓';
      case 'absent': return '✗';
      case 'leave': return 'L';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[250px]">
              <label className="text-sm font-medium mb-2 block">Employee</label>
              <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {metaStaff.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      <div className="flex flex-col">
                        <span>{staff.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {getPositionDisplay(staff.position_name || '')}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Month</label>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1 flex items-center justify-center border rounded-md px-3 bg-background">
                  <span className="text-sm font-medium">
                    {format(new Date(currentMonth + '-01'), 'MMMM yyyy')}
                  </span>
                </div>
                <Button variant="outline" size="icon" onClick={goToNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-end">
              <Button onClick={handleExportDailyDetails} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export Daily Details
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {attendance && selectedStaff && (
        <>
          {/* Summary Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Working Hours</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryMetrics.totalHours.toFixed(1)} hrs</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Current month total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Attendance Percentage</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryMetrics.attendancePercentage.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {attendance.present_days} present / {attendance.present_days + attendance.absent_days + attendance.leave_days} total days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Hours/Day</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryMetrics.averageHours.toFixed(1)} hrs</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Daily average
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Attendance Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Monthly Attendance Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                    {day}
                  </div>
                ))}
                {calendarDays.map((date, index) => {
                  const statusColor = getStatusColor(date);
                  const indicator = getStatusIndicator(date);
                  
                  return (
                    <div
                      key={index}
                      className={`aspect-square flex flex-col items-center justify-center p-2 rounded-md border ${statusColor}`}
                    >
                      <div className="text-sm font-medium">{format(date, 'd')}</div>
                      {indicator && (
                        <div className="text-xs font-bold mt-1">{indicator}</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
                  <span className="text-sm">Present</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-100 border border-red-300" />
                  <span className="text-sm">Absent</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300" />
                  <span className="text-sm">Leave</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-muted border" />
                  <span className="text-sm">Not Marked</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employee Details */}
          <Card>
            <CardHeader>
              <CardTitle>Employee Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedStaff.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Position</p>
                  <p className="font-medium">{getPositionDisplay(selectedStaff.position_name || '')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedStaff.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">User ID</p>
                  <p className="font-medium">{selectedStaff.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Attendance Details Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Daily Attendance Details</CardTitle>
                <Button onClick={handleExportDailyDetails} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export Daily Details
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Check-in Time</TableHead>
                      <TableHead>Check-out Time</TableHead>
                      <TableHead>Check-in Location</TableHead>
                      <TableHead>Check-out Location</TableHead>
                      <TableHead>Validated</TableHead>
                      <TableHead>Total Hours</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyAttendanceDetails.map((day, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{day.displayDate}</TableCell>
                        <TableCell>{getAttendanceStatusBadge(day.status)}</TableCell>
                        <TableCell>{day.checkInTime}</TableCell>
                        <TableCell>{day.checkOutTime}</TableCell>
                        <TableCell>{renderGPSLink(day.checkInLocation)}</TableCell>
                        <TableCell>{renderGPSLink(day.checkOutLocation)}</TableCell>
                        <TableCell>{getValidationBadge(day.locationValidated, day.status)}</TableCell>
                        <TableCell className="font-medium">{day.totalHours}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
