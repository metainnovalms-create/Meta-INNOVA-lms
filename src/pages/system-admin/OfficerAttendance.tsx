import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Download, DollarSign, Clock, TrendingUp, MapPin, Users, Briefcase, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { generateMonthCalendarDays, getAttendanceForDate, calculateAttendancePercentage, exportToCSV, formatCurrency } from '@/utils/attendanceHelpers';
import { format, subMonths } from 'date-fns';
import { MetaEmployeeAttendanceTab } from '@/components/attendance/MetaEmployeeAttendanceTab';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  useAllOfficerAttendanceForMonth, 
  useOfficerAttendanceRealtime,
  aggregateAttendanceByOfficer,
  type AggregatedOfficerAttendance 
} from '@/hooks/useOfficerAttendance';
import { DailyAttendance } from '@/types/attendance';

export default function OfficerAttendance() {
  const [activeTab, setActiveTab] = useState<'officers' | 'employees'>('officers');
  const [selectedInstitution, setSelectedInstitution] = useState<string>('all');
  const [selectedOfficerId, setSelectedOfficerId] = useState('');
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));

  // Enable realtime updates
  useOfficerAttendanceRealtime();

  // Fetch all officers
  const { data: officers = [], isLoading: isLoadingOfficers } = useQuery({
    queryKey: ['officers-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('officers')
        .select('id, full_name, employee_id, department, assigned_institutions, hourly_rate, overtime_rate_multiplier, normal_working_hours');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch all institutions
  const { data: institutions = [] } = useQuery({
    queryKey: ['institutions-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('institutions')
        .select('id, name');
      if (error) throw error;
      return data || [];
    },
  });

  // Filter officers by institution
  const filteredOfficers = useMemo(() => {
    if (selectedInstitution === 'all') return officers;
    return officers.filter(o => o.assigned_institutions?.includes(selectedInstitution));
  }, [officers, selectedInstitution]);

  // Fetch attendance data from Supabase
  const { data: attendanceRecords = [], isLoading: isLoadingAttendance } = useAllOfficerAttendanceForMonth(currentMonth);

  // Filter attendance by institution
  const filteredAttendanceRecords = useMemo(() => {
    if (selectedInstitution === 'all') return attendanceRecords;
    return attendanceRecords.filter(r => r.institution_id === selectedInstitution);
  }, [attendanceRecords, selectedInstitution]);

  // Aggregate attendance data by officer
  const attendanceData = useMemo(() => {
    return aggregateAttendanceByOfficer(
      filteredAttendanceRecords,
      officers.map(o => ({ id: o.id, full_name: o.full_name, employee_id: o.employee_id || '' })),
      institutions,
      currentMonth
    );
  }, [filteredAttendanceRecords, officers, institutions, currentMonth]);

  // Set default officer when data changes
  useMemo(() => {
    if (selectedOfficerId === '' && attendanceData.length > 0) {
      setSelectedOfficerId(attendanceData[0].officer_id);
    }
  }, [attendanceData, selectedOfficerId]);

  // Get selected officer's data
  const selectedOfficer = attendanceData.find(
    (officer) => officer.officer_id === selectedOfficerId
  );

  // Get officer profile for salary configuration
  const officerProfile = selectedOfficer 
    ? officers.find(o => o.id === selectedOfficer.officer_id) 
    : null;

  // Convert aggregated records to DailyAttendance format for calendar
  const dailyRecordsForCalendar: DailyAttendance[] = useMemo(() => {
    if (!selectedOfficer) return [];
    return selectedOfficer.daily_records.map(r => ({
      date: r.date,
      status: r.status === 'checked_out' ? 'present' : r.status === 'checked_in' ? 'present' : 'absent',
      check_in_time: r.check_in_time ? format(new Date(r.check_in_time), 'HH:mm') : undefined,
      check_out_time: r.check_out_time ? format(new Date(r.check_out_time), 'HH:mm') : undefined,
      hours_worked: r.total_hours_worked || undefined,
      overtime_hours: r.overtime_hours || undefined,
      check_in_location: r.check_in_latitude && r.check_in_longitude && r.check_in_time ? {
        latitude: r.check_in_latitude,
        longitude: r.check_in_longitude,
        address: r.check_in_address || undefined,
        timestamp: r.check_in_time,
      } : undefined,
      check_out_location: r.check_out_latitude && r.check_out_longitude && r.check_out_time ? {
        latitude: r.check_out_latitude,
        longitude: r.check_out_longitude,
        address: r.check_out_address || undefined,
        timestamp: r.check_out_time,
      } : undefined,
      location_validated: r.check_in_validated && r.check_out_validated,
    }));
  }, [selectedOfficer]);

  // Calculate metrics for summary cards
  const summaryMetrics = useMemo(() => {
    if (!selectedOfficer || !officerProfile) {
      return {
        totalPayroll: 0,
        overtimeHours: 0,
        averageHours: 0,
        scheduledHours: 8,
      };
    }

    const overtimeHours = selectedOfficer.overtime_hours;
    const normalHours = selectedOfficer.total_hours_worked - overtimeHours;
    const hourlyRate = officerProfile.hourly_rate || 0;
    const overtimeRate = hourlyRate * (officerProfile.overtime_rate_multiplier || 1.5);
    
    const normalPay = normalHours * hourlyRate;
    const overtimePay = overtimeHours * overtimeRate;
    const totalPayroll = normalPay + overtimePay;

    const averageHours = selectedOfficer.present_days > 0 
      ? selectedOfficer.total_hours_worked / selectedOfficer.present_days 
      : 0;

    return {
      totalPayroll,
      overtimeHours,
      averageHours,
      scheduledHours: officerProfile.normal_working_hours || 8,
    };
  }, [selectedOfficer, officerProfile]);

  // Generate calendar days for current month
  const calendarDays = generateMonthCalendarDays(currentMonth);

  // Generate all days in the month for the table
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
    if (!selectedOfficer) return [];
    
    const today = new Date();
    const [currentYear, currentMonthNum] = currentMonth.split('-').map(Number);
    
    return allDaysInMonth.map(({ date, dayNumber }) => {
      const dayDate = new Date(currentYear, currentMonthNum - 1, dayNumber);
      const isFutureDate = dayDate > today;
      
      // Find attendance record for this date
      const record = selectedOfficer.daily_records.find(r => r.date === date);
      
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
          overtime: '-',
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
          overtime: '-',
        };
      }
      
      // Calculate overtime
      const normalHours = officerProfile?.normal_working_hours || 8;
      const totalHours = record.total_hours_worked || 0;
      const overtime = Math.max(0, totalHours - normalHours);
      
      return {
        date,
        displayDate: format(dayDate, 'EEE, MMM dd'),
        status: record.status === 'checked_out' ? 'present' : record.status === 'checked_in' ? 'checked_in' : 'not_checked_in',
        checkInTime: record.check_in_time ? format(new Date(record.check_in_time), 'HH:mm') : '-',
        checkOutTime: record.check_out_time ? format(new Date(record.check_out_time), 'HH:mm') : '-',
        checkInLocation: record.check_in_latitude && record.check_in_longitude ? {
          latitude: record.check_in_latitude,
          longitude: record.check_in_longitude,
          address: record.check_in_address,
        } : null,
        checkOutLocation: record.check_out_latitude && record.check_out_longitude ? {
          latitude: record.check_out_latitude,
          longitude: record.check_out_longitude,
          address: record.check_out_address,
        } : null,
        locationValidated: record.check_in_validated,
        totalHours: totalHours > 0 ? `${totalHours.toFixed(1)} hrs` : '-',
        overtime: overtime > 0 ? `${overtime.toFixed(1)} hrs` : '-',
      };
    });
  }, [selectedOfficer, currentMonth, allDaysInMonth, officerProfile]);

  // Helper function to render GPS link
  const renderGPSLink = (location: { latitude: number; longitude: number; address?: string | null } | null) => {
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
    if (validated === null || status === 'future' || status === 'not_marked' || status === 'not_checked_in') {
      return <Badge variant="outline" className="bg-gray-100 text-gray-500">N/A</Badge>;
    }
    
    if (validated === true) {
      return <Badge className="bg-green-100 text-green-800 border-green-300">✓ Verified</Badge>;
    }
    
    return <Badge className="bg-red-100 text-red-800 border-red-300">✗ Invalid</Badge>;
  };

  // Helper function for attendance status badge
  const getAttendanceStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      present: { label: 'Present', className: 'bg-green-100 text-green-800 border-green-300' },
      checked_in: { label: 'Checked In', className: 'bg-blue-100 text-blue-800 border-blue-300' },
      not_checked_in: { label: 'Not Checked In', className: 'bg-gray-100 text-gray-600 border-gray-300' },
      not_marked: { label: 'Not Marked', className: 'bg-gray-100 text-gray-600 border-gray-300' },
      future: { label: 'Future', className: 'bg-blue-100 text-blue-600 border-blue-300' },
    };
    
    const config = statusConfig[status] || statusConfig.not_marked;
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
    if (!selectedOfficer) return;
    
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
        'Overtime Hours': day.overtime,
      };
    });
    
    const officerName = selectedOfficer.officer_name.replace(/\s+/g, '_');
    const filename = `${officerName}_Daily_Attendance_${currentMonth}.csv`;
    
    exportToCSV(exportData, filename);
    toast.success('Daily attendance details exported successfully');
  };

  // Get status color for calendar day
  const getStatusColor = (date: Date) => {
    if (!selectedOfficer) return 'bg-muted text-muted-foreground';
    
    const attendance = getAttendanceForDate(date, dailyRecordsForCalendar);
    
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

  // Get status indicator
  const getStatusIndicator = (date: Date) => {
    if (!selectedOfficer) return '';
    
    const attendance = getAttendanceForDate(date, dailyRecordsForCalendar);
    if (!attendance) return '';
    
    switch (attendance.status) {
      case 'present': return '✓';
      case 'absent': return '✗';
      case 'leave': return 'L';
      default: return '';
    }
  };

  // Export handler
  const handleExport = () => {
    if (!selectedOfficer) return;
    
    const exportData = dailyAttendanceDetails.map((day) => ({
      Date: day.date,
      Status: day.status,
      'Check In': day.checkInTime,
      'Check Out': day.checkOutTime,
      'Total Hours': day.totalHours,
      'Overtime Hours': day.overtime,
    }));
    
    exportToCSV(exportData, `${selectedOfficer.officer_name}_${currentMonth}_attendance.csv`);
  };

  const attendancePercentage = selectedOfficer 
    ? calculateAttendancePercentage(
        selectedOfficer.present_days,
        selectedOfficer.present_days + selectedOfficer.absent_days + selectedOfficer.leave_days
      )
    : 0;

  const isLoading = isLoadingOfficers || isLoadingAttendance;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Attendance & Payroll Management</h1>
          <p className="text-muted-foreground mt-2">
            Track attendance and payroll for innovation officers and meta employees
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-2 max-w-2xl">
            <TabsTrigger value="officers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Innovation Officers
            </TabsTrigger>
            <TabsTrigger value="employees" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Meta Employees
            </TabsTrigger>
          </TabsList>

          <TabsContent value="officers" className="mt-6 space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-sm font-medium mb-2 block">Institution</label>
                    <Select value={selectedInstitution} onValueChange={setSelectedInstitution}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select institution" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Institutions</SelectItem>
                        {institutions.map((inst) => (
                          <SelectItem key={inst.id} value={inst.id}>
                            {inst.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1 min-w-[200px]">
                    <label className="text-sm font-medium mb-2 block">Officer</label>
                    <Select value={selectedOfficerId} onValueChange={setSelectedOfficerId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select officer" />
                      </SelectTrigger>
                      <SelectContent>
                        {attendanceData.map((officer) => (
                          <SelectItem key={officer.officer_id} value={officer.officer_id}>
                            {officer.officer_name}
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
                    <Button onClick={handleExport} variant="outline" disabled={!selectedOfficer}>
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : attendanceData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No attendance records found for this month.
              </div>
            ) : selectedOfficer && (
              <>
                {/* Summary Statistics Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(summaryMetrics.totalPayroll)}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Current month estimated
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Overtime Hours</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{summaryMetrics.overtimeHours.toFixed(1)} hrs</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Total overtime this month
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Working Hours</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {summaryMetrics.averageHours.toFixed(1)} / {summaryMetrics.scheduledHours} hrs
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Average / Scheduled per day
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Monthly Attendance Calendar */}
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Attendance Calendar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Summary Cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card>
                          <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-green-600">
                              {selectedOfficer.present_days}
                            </div>
                            <p className="text-xs text-muted-foreground">Present</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-red-600">
                              {selectedOfficer.absent_days}
                            </div>
                            <p className="text-xs text-muted-foreground">Absent</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-yellow-600">
                              {selectedOfficer.leave_days}
                            </div>
                            <p className="text-xs text-muted-foreground">Leave</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-blue-600">
                              {attendancePercentage.toFixed(1)}%
                            </div>
                            <p className="text-xs text-muted-foreground">Attendance Rate</p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                          <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                            {day}
                          </div>
                        ))}
                        
                        {/* Empty cells for offset */}
                        {Array.from({ length: calendarDays[0]?.getDay() || 0 }).map((_, i) => (
                          <div key={`empty-${i}`} />
                        ))}
                        
                        {/* Calendar days */}
                        {calendarDays.map((date, index) => {
                          const attendance = getAttendanceForDate(date, dailyRecordsForCalendar);
                          
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

                {/* Daily Attendance Details Table */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Daily Attendance Details</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Complete daily breakdown with GPS location tracking
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleExportDailyDetails}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export Daily Details
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[120px]">Date</TableHead>
                            <TableHead className="min-w-[100px]">Status</TableHead>
                            <TableHead className="min-w-[90px]">Check-in</TableHead>
                            <TableHead className="min-w-[90px]">Check-out</TableHead>
                            <TableHead className="min-w-[180px]">Check-in Location</TableHead>
                            <TableHead className="min-w-[180px]">Check-out Location</TableHead>
                            <TableHead className="min-w-[100px]">Validated</TableHead>
                            <TableHead className="min-w-[90px]">Total Hours</TableHead>
                            <TableHead className="min-w-[90px]">Overtime</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dailyAttendanceDetails.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                No attendance data available for this month
                              </TableCell>
                            </TableRow>
                          ) : (
                            dailyAttendanceDetails.map((day) => (
                              <TableRow key={day.date}>
                                <TableCell className="font-medium">{day.displayDate}</TableCell>
                                <TableCell>{getAttendanceStatusBadge(day.status)}</TableCell>
                                <TableCell className="text-sm">{day.checkInTime}</TableCell>
                                <TableCell className="text-sm">{day.checkOutTime}</TableCell>
                                <TableCell>{renderGPSLink(day.checkInLocation)}</TableCell>
                                <TableCell>{renderGPSLink(day.checkOutLocation)}</TableCell>
                                <TableCell>{getValidationBadge(day.locationValidated, day.status)}</TableCell>
                                <TableCell className="text-sm">{day.totalHours}</TableCell>
                                <TableCell>
                                  {day.overtime !== '-' && day.overtime !== '0.0 hrs' ? (
                                    <span className="text-orange-600 font-semibold text-sm">{day.overtime}</span>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">{day.overtime}</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Officer Details */}
                {officerProfile && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Officer Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                          <p className="text-sm text-muted-foreground">Employee ID</p>
                          <p className="font-medium">{selectedOfficer.employee_id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Department</p>
                          <p className="font-medium">{officerProfile.department || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Hours Worked</p>
                          <p className="font-medium">{selectedOfficer.total_hours_worked.toFixed(1)} hrs</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Last Marked Date</p>
                          <p className="font-medium">{selectedOfficer.last_marked_date || '-'}</p>
                        </div>
                      </div>

                      <div className="mt-6 pt-6 border-t">
                        <h4 className="font-semibold mb-4">Salary Configuration</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                          <div>
                            <p className="text-sm text-muted-foreground">Hourly Rate</p>
                            <p className="font-medium">{formatCurrency(officerProfile.hourly_rate || 0)}/hr</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Overtime Rate</p>
                            <p className="font-medium">
                              {officerProfile.overtime_rate_multiplier || 1.5}x ({formatCurrency((officerProfile.hourly_rate || 0) * (officerProfile.overtime_rate_multiplier || 1.5))}/hr)
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Normal Working Hours</p>
                            <p className="font-medium">{officerProfile.normal_working_hours || 8} hrs/day</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="employees" className="mt-6">
            <MetaEmployeeAttendanceTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
