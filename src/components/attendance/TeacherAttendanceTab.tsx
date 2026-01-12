import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, Calendar as CalendarIcon } from 'lucide-react';
import { getTeacherAttendanceByInstitution } from '@/data/mockTeacherAttendance';
import { getTeacherAttendanceStats, exportTeacherAttendanceCSV } from '@/utils/teacherAttendanceHelpers';
import { AttendanceCalendar } from './AttendanceCalendar';

export const TeacherAttendanceTab = () => {
  const [selectedMonth, setSelectedMonth] = useState('2024-01');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // Get teacher attendance data
  const attendanceData = getTeacherAttendanceByInstitution('springfield', selectedMonth);
  
  // Filter by search query
  const filteredData = attendanceData.filter(record =>
    record.teacher_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.employee_id.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Calculate stats
  const stats = getTeacherAttendanceStats(filteredData);
  
  // Handle export
  const handleExport = () => {
    exportTeacherAttendanceCSV(filteredData, `teacher-attendance-${selectedMonth}.csv`);
  };
  
  // Handle view calendar
  const handleViewCalendar = (record: any) => {
    setSelectedTeacher({
      officer_id: record.teacher_id,
      officer_name: record.teacher_name,
      employee_id: record.employee_id,
      department: record.department,
      month: record.month,
      daily_records: record.daily_records,
      present_days: record.present_days,
      absent_days: record.absent_days,
      leave_days: record.leave_days,
      total_hours_worked: 0,
      last_marked_date: record.last_marked_date,
    });
    setIsCalendarOpen(true);
  };
  
  // Get today's status badge
  const getTodayStatusBadge = (record: any) => {
    const today = new Date();
    const todayDate = `2024-01-${String(today.getDate()).padStart(2, '0')}`;
    const todayRecord = record.daily_records.find((r: any) => r.date === todayDate);
    
    if (!todayRecord || !todayRecord.self_reported_time) {
      return <Badge variant="outline">Not Marked</Badge>;
    }
    
    if (todayRecord.status === 'present') {
      return <Badge variant="default" className="bg-green-600">Present</Badge>;
    }
    
    if (todayRecord.status === 'leave') {
      return <Badge variant="secondary">On Leave</Badge>;
    }
    
    return <Badge variant="destructive">Absent</Badge>;
  };
  
  return (
    <div className="space-y-6">
      {/* Filters Row */}
      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Search teachers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-64"
        />
        
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Select Month" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2024-01">January 2024</SelectItem>
            <SelectItem value="2023-12">December 2023</SelectItem>
            <SelectItem value="2023-11">November 2023</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Teachers</p>
              <p className="text-3xl font-bold">{stats.totalTeachers}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Present Today</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {stats.presentToday}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Avg Attendance</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {stats.avgAttendance.toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Not Marked Today</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {stats.notMarkedToday}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Teacher Attendance Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Today's Status</TableHead>
                <TableHead className="text-center">Present Days</TableHead>
                <TableHead className="text-center">Absent Days</TableHead>
                <TableHead className="text-center">Leave Days</TableHead>
                <TableHead>Attendance %</TableHead>
                <TableHead>Last Marked</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map(record => {
                const total = record.present_days + record.absent_days + record.leave_days;
                const percentage = total > 0 ? ((record.present_days / total) * 100).toFixed(1) : '0.0';
                
                return (
                  <TableRow key={record.teacher_id}>
                    <TableCell className="font-medium">{record.teacher_name}</TableCell>
                    <TableCell>{record.employee_id}</TableCell>
                    <TableCell>{getTodayStatusBadge(record)}</TableCell>
                    <TableCell className="text-center">
                      <span className="text-green-600 dark:text-green-400 font-semibold">
                        {record.present_days}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-red-600 dark:text-red-400 font-semibold">
                        {record.absent_days}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-yellow-600 dark:text-yellow-400 font-semibold">
                        {record.leave_days}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={parseFloat(percentage) >= 90 ? 'default' : 'secondary'}>
                        {percentage}%
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(record.last_marked_date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewCalendar(record)}
                      >
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        Calendar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Calendar Dialog */}
      {selectedTeacher && (
        <AttendanceCalendar
          attendance={selectedTeacher}
          isOpen={isCalendarOpen}
          onClose={() => setIsCalendarOpen(false)}
        />
      )}
    </div>
  );
};
