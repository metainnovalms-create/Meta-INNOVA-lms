import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Download, Calendar, Search, Eye, MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AttendanceCalendar } from './AttendanceCalendar';
import { OfficerAttendanceRecord } from '@/types/attendance';
import { calculateAttendancePercentage, exportToCSV } from '@/utils/attendanceHelpers';
import { format, subMonths, startOfMonth } from 'date-fns';
import { 
  useInstitutionMonthlyAttendance, 
  useOfficerAttendanceRealtime,
  aggregateAttendanceByOfficer,
  type AggregatedOfficerAttendance 
} from '@/hooks/useOfficerAttendance';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface OfficerAttendanceTabProps {
  institutionId?: string;
}

export function OfficerAttendanceTab({ institutionId }: OfficerAttendanceTabProps) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(format(currentDate, 'yyyy-MM'));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOfficer, setSelectedOfficer] = useState<OfficerAttendanceRecord | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Enable realtime updates
  useOfficerAttendanceRealtime(institutionId);

  // Generate month options (last 12 months)
  const monthOptions = useMemo(() => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      const date = subMonths(currentDate, i);
      const value = format(date, 'yyyy-MM');
      const label = format(date, 'MMMM yyyy');
      months.push({ value, label });
    }
    return months;
  }, []);

  // Fetch officers assigned to this institution
  const { data: officers = [] } = useQuery({
    queryKey: ['officers', institutionId],
    queryFn: async () => {
      if (!institutionId) return [];
      const { data, error } = await supabase
        .from('officers')
        .select('id, full_name, employee_id, department')
        .contains('assigned_institutions', [institutionId]);
      if (error) throw error;
      return data || [];
    },
    enabled: !!institutionId,
  });

  // Fetch institution details
  const { data: institutions = [] } = useQuery({
    queryKey: ['institutions', institutionId],
    queryFn: async () => {
      if (!institutionId) return [];
      const { data, error } = await supabase
        .from('institutions')
        .select('id, name')
        .eq('id', institutionId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!institutionId,
  });

  // Fetch attendance data from Supabase
  const { data: attendanceRecords = [], isLoading } = useInstitutionMonthlyAttendance(
    institutionId || '',
    selectedMonth
  );

  // Aggregate attendance data by officer
  const attendanceData = useMemo(() => {
    return aggregateAttendanceByOfficer(
      attendanceRecords,
      officers.map(o => ({ id: o.id, full_name: o.full_name, employee_id: o.employee_id || '' })),
      institutions,
      selectedMonth
    );
  }, [attendanceRecords, officers, institutions, selectedMonth]);

  const filteredData = attendanceData.filter(
    record =>
      record.officer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.employee_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalOfficers = filteredData.length;
  const totalPresentDays = filteredData.reduce((sum, record) => sum + record.present_days, 0);
  const avgAttendanceRate =
    filteredData.length > 0
      ? filteredData.reduce((sum, record) => {
          const total = record.present_days + record.absent_days + record.leave_days;
          return sum + (total > 0 ? calculateAttendancePercentage(record.present_days, total) : 0);
        }, 0) / filteredData.length
      : 0;

  const handleExportSummary = () => {
    const exportData = filteredData.map(record => ({
      'Employee ID': record.employee_id,
      'Officer Name': record.officer_name,
      'Present Days': record.present_days,
      'Absent Days': record.absent_days,
      'Leave Days': record.leave_days,
      'Total Hours': record.total_hours_worked.toFixed(1),
      'Overtime Hours': record.overtime_hours.toFixed(1),
      'Last Marked': record.last_marked_date,
    }));
    
    exportToCSV(exportData, `attendance-summary-${selectedMonth}.csv`);
    toast.success('Attendance summary exported successfully');
  };

  const handleViewCalendar = (officer: AggregatedOfficerAttendance) => {
    // Convert to the expected format for AttendanceCalendar
    const calendarData: OfficerAttendanceRecord = {
      officer_id: officer.officer_id,
      officer_name: officer.officer_name,
      employee_id: officer.employee_id,
      department: '',
      month: officer.month,
      present_days: officer.present_days,
      absent_days: officer.absent_days,
      leave_days: officer.leave_days,
      total_hours_worked: officer.total_hours_worked,
      last_marked_date: officer.last_marked_date,
      daily_records: officer.daily_records.map(r => ({
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
      })),
    };
    setSelectedOfficer(calendarData);
    setIsCalendarOpen(true);
  };

  // Helper to render GPS validation badge
  const getValidationStatus = (records: AggregatedOfficerAttendance['daily_records']) => {
    if (records.length === 0) return null;
    
    const validated = records.filter(r => r.check_in_validated).length;
    const total = records.filter(r => r.status === 'checked_in' || r.status === 'checked_out').length;
    
    if (total === 0) return null;
    
    const percentage = (validated / total) * 100;
    
    return (
      <Badge 
        variant="outline" 
        className={percentage >= 90 ? 'bg-green-100 text-green-800' : percentage >= 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}
      >
        <MapPin className="h-3 w-3 mr-1" />
        {percentage.toFixed(0)}% verified
      </Badge>
    );
  };

  if (!institutionId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Please select an institution to view officer attendance.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or employee ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleExportSummary} variant="outline" disabled={filteredData.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Officers</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOfficers}</div>
            <p className="text-xs text-muted-foreground">Active officers tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Attendance Rate</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgAttendanceRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Across all officers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Present Days</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPresentDays}</div>
            <p className="text-xs text-muted-foreground">For {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Officer Attendance Records</CardTitle>
          <CardDescription>View and verify daily attendance with GPS validation</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : officers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="font-medium">No officers assigned to this institution</p>
              <p className="text-sm mt-1">Add officers and assign them to this institution to track attendance.</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="font-medium">No check-ins recorded this month</p>
              <p className="text-sm mt-1">Officers will appear here once they check in using the mobile app.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Officer Name</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead className="text-right">Present</TableHead>
                  <TableHead className="text-right">Hours Worked</TableHead>
                  <TableHead className="text-right">Overtime</TableHead>
                  <TableHead className="text-center">GPS Validation</TableHead>
                  <TableHead className="text-right">Last Marked</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((record) => (
                  <TableRow key={record.officer_id}>
                    <TableCell>
                      <button
                        onClick={() => handleViewCalendar(record)}
                        className="font-medium text-primary hover:underline text-left"
                      >
                        {record.officer_name}
                      </button>
                    </TableCell>
                    <TableCell>{record.employee_id}</TableCell>
                    <TableCell className="text-right text-green-600 font-medium">
                      {record.present_days}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {record.total_hours_worked.toFixed(1)} hrs
                    </TableCell>
                    <TableCell className="text-right">
                      {record.overtime_hours > 0 ? (
                        <span className="text-orange-600 font-medium">{record.overtime_hours.toFixed(1)} hrs</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {getValidationStatus(record.daily_records)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {record.last_marked_date ? format(new Date(record.last_marked_date), 'MMM dd, yyyy') : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewCalendar(record)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedOfficer && (
        <AttendanceCalendar
          attendance={selectedOfficer}
          isOpen={isCalendarOpen}
          onClose={() => setIsCalendarOpen(false)}
        />
      )}
    </div>
  );
}
