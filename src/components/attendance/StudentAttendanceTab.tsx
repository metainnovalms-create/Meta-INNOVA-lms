import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Download, Loader2, Users, TrendingUp, TrendingDown, AlertTriangle, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, parseISO, subMonths } from 'date-fns';
import { LowAttendanceAlerts } from './LowAttendanceAlerts';

interface StudentAttendanceTabProps {
  institutionId?: string;
}

interface StudentAttendanceRecord {
  student_id: string;
  student_name: string;
  roll_number: string;
  classes_attended: number;
  total_classes: number;
  attendance_percentage: number;
}

export const StudentAttendanceTab = ({ institutionId }: StudentAttendanceTabProps) => {
  const [selectedClass, setSelectedClass] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');

  const selectedMonth = format(currentMonth, 'yyyy-MM');

  // Fetch classes for this institution
  const { data: classes = [], isLoading: isLoadingClasses } = useQuery({
    queryKey: ['institution-classes', institutionId],
    queryFn: async () => {
      if (!institutionId) return [];
      
      const { data, error } = await supabase
        .from('classes')
        .select('id, class_name, section')
        .eq('institution_id', institutionId)
        .eq('status', 'active')
        .order('display_order');

      if (error) throw error;
      return data || [];
    },
    enabled: !!institutionId,
  });

  // Auto-select first class when classes load
  const effectiveClassId = selectedClass || classes[0]?.id || '';

  // Fetch students for selected class
  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['class-students', effectiveClassId],
    queryFn: async () => {
      if (!effectiveClassId) return [];
      
      const { data, error } = await supabase
        .from('students')
        .select('id, student_id, student_name, roll_number')
        .eq('class_id', effectiveClassId)
        .eq('status', 'active')
        .order('roll_number');

      if (error) throw error;
      return data || [];
    },
    enabled: !!effectiveClassId,
  });

  // Fetch class session attendance for this class and month
  const { data: sessionAttendance = [], isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['class-session-attendance', effectiveClassId, selectedMonth],
    queryFn: async () => {
      if (!effectiveClassId || !selectedMonth) return [];
      
      const monthStart = startOfMonth(new Date(selectedMonth + '-01'));
      const monthEnd = endOfMonth(monthStart);
      
      const { data, error } = await supabase
        .from('class_session_attendance')
        .select('id, date, attendance_records, is_session_completed, subject, period_time')
        .eq('class_id', effectiveClassId)
        .gte('date', format(monthStart, 'yyyy-MM-dd'))
        .lte('date', format(monthEnd, 'yyyy-MM-dd'))
        .eq('is_session_completed', true)
        .order('date');

      if (error) throw error;
      return data || [];
    },
    enabled: !!effectiveClassId && !!selectedMonth,
  });

  // Calculate attendance stats for each student
  const attendanceData: StudentAttendanceRecord[] = students.map(student => {
    let classesAttended = 0;
    const totalClasses = sessionAttendance.length;

    sessionAttendance.forEach(session => {
      const records = session.attendance_records as any[] || [];
      const studentRecord = records.find((r: any) => r.student_id === student.id);
      if (studentRecord && (studentRecord.status === 'present' || studentRecord.status === 'late')) {
        classesAttended++;
      }
    });

    const attendancePercentage = totalClasses > 0 
      ? (classesAttended / totalClasses) * 100 
      : 0;

    return {
      student_id: student.id,
      student_name: student.student_name,
      roll_number: student.roll_number || student.student_id,
      classes_attended: classesAttended,
      total_classes: totalClasses,
      attendance_percentage: attendancePercentage,
    };
  });

  // Filter by search query
  const filteredData = attendanceData.filter(record =>
    record.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.roll_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate stats
  const stats = {
    totalStudents: filteredData.length,
    avgAttendance: filteredData.length > 0 
      ? filteredData.reduce((sum, r) => sum + r.attendance_percentage, 0) / filteredData.length 
      : 0,
    belowThreshold: filteredData.filter(r => r.total_classes > 0 && r.attendance_percentage < 75).length,
    totalClasses: sessionAttendance.length,
    aboveNinety: filteredData.filter(r => r.total_classes > 0 && r.attendance_percentage >= 90).length,
  };

  // Calculate attendance by day for calendar view
  const attendanceByDay = useMemo(() => {
    const dayMap = new Map<string, { total: number; present: number }>();
    
    sessionAttendance.forEach(session => {
      const dateKey = session.date;
      const records = session.attendance_records as any[] || [];
      const present = records.filter((r: any) => r.status === 'present' || r.status === 'late').length;
      const total = records.length;
      
      const existing = dayMap.get(dateKey) || { total: 0, present: 0 };
      dayMap.set(dateKey, {
        total: existing.total + total,
        present: existing.present + present,
      });
    });
    
    return dayMap;
  }, [sessionAttendance]);

  // Calendar data
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handlePrevMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Handle export
  const handleExport = () => {
    const csvContent = [
      ['Student Name', 'Roll Number', 'Classes Attended', 'Total Classes', 'Attendance %'],
      ...filteredData.map(r => [
        r.student_name,
        r.roll_number,
        r.classes_attended.toString(),
        r.total_classes.toString(),
        r.attendance_percentage.toFixed(1) + '%'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student-attendance-${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get badge color for attendance percentage
  const getAttendanceBadge = (percentage: number) => {
    if (percentage >= 90) return { variant: 'default' as const, color: 'text-green-600 dark:text-green-400' };
    if (percentage >= 75) return { variant: 'secondary' as const, color: 'text-yellow-600 dark:text-yellow-400' };
    return { variant: 'destructive' as const, color: 'text-red-600 dark:text-red-400' };
  };

  const isLoading = isLoadingClasses || isLoadingStudents || isLoadingAttendance;

  if (!institutionId) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No institution selected</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters Row */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <Select 
              value={effectiveClassId} 
              onValueChange={setSelectedClass}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map(cls => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.class_name} {cls.section ? `- ${cls.section}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium min-w-[120px] text-center">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
            
            <Button variant="outline" onClick={handleExport} disabled={filteredData.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="text-3xl font-bold">{stats.totalStudents}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="h-5 w-5 mx-auto mb-2 text-blue-500" />
              <p className="text-sm text-muted-foreground">Avg Attendance</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {stats.totalClasses > 0 ? `${stats.avgAttendance.toFixed(1)}%` : 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className={stats.belowThreshold > 0 ? 'border-red-200 dark:border-red-800' : ''}>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className={`h-5 w-5 mx-auto mb-2 ${stats.belowThreshold > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
              <p className="text-sm text-muted-foreground">Below 75%</p>
              <p className={`text-3xl font-bold ${stats.belowThreshold > 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                {stats.totalClasses > 0 ? stats.belowThreshold : 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className={stats.aboveNinety > 0 ? 'border-green-200 dark:border-green-800' : ''}>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className={`h-5 w-5 mx-auto mb-2 ${stats.aboveNinety > 0 ? 'text-green-500' : 'text-muted-foreground'}`} />
              <p className="text-sm text-muted-foreground">Above 90%</p>
              <p className={`text-3xl font-bold ${stats.aboveNinety > 0 ? 'text-green-600 dark:text-green-400' : ''}`}>
                {stats.totalClasses > 0 ? stats.aboveNinety : 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Calendar className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Sessions</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {stats.totalClasses}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Attendance Alerts */}
      {stats.totalClasses > 0 && (
        <LowAttendanceAlerts students={attendanceData} threshold={75} />
      )}

      {/* Monthly Calendar View */}
      {stats.totalClasses > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              {format(currentMonth, 'MMMM yyyy')} Attendance Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before month starts */}
              {Array.from({ length: getDay(monthStart) }).map((_, i) => (
                <div key={`empty-start-${i}`} className="h-14" />
              ))}
              
              {/* Day cells */}
              {daysInMonth.map(day => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayData = attendanceByDay.get(dateKey);
                const isToday = isSameDay(day, new Date());
                const attendanceRate = dayData && dayData.total > 0 
                  ? Math.round((dayData.present / dayData.total) * 100) 
                  : null;
                
                return (
                  <div
                    key={dateKey}
                    className={`h-14 rounded-md flex flex-col items-center justify-center p-1 ${
                      attendanceRate !== null 
                        ? attendanceRate >= 80 
                          ? 'bg-green-100 dark:bg-green-900/30' 
                          : attendanceRate >= 60 
                            ? 'bg-yellow-100 dark:bg-yellow-900/30' 
                            : 'bg-red-100 dark:bg-red-900/30'
                        : 'hover:bg-muted/50'
                    } ${isToday ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                    title={attendanceRate !== null ? `${attendanceRate}% attendance` : 'No session'}
                  >
                    <span className={`text-xs ${attendanceRate !== null ? 'font-medium' : 'text-muted-foreground'}`}>
                      {format(day, 'd')}
                    </span>
                    {attendanceRate !== null && (
                      <span className={`text-[10px] font-medium ${
                        attendanceRate >= 80 ? 'text-green-600 dark:text-green-400' :
                        attendanceRate >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {attendanceRate}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Student Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Student Attendance Details</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No classes found for this institution</p>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No students enrolled in this class</p>
            </div>
          ) : (
            <>
              {sessionAttendance.length === 0 && (
                <div className="mb-4 p-4 bg-muted/50 rounded-lg border border-dashed">
                  <p className="text-sm text-muted-foreground text-center">
                    No class sessions have been completed this month yet. Attendance will appear once officers mark class sessions.
                  </p>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Roll Number</TableHead>
                    <TableHead className="text-center">Present</TableHead>
                    <TableHead className="text-center">Absent</TableHead>
                    <TableHead className="text-center">Total Classes</TableHead>
                    <TableHead>Attendance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map(record => {
                    const badge = getAttendanceBadge(record.attendance_percentage);
                    return (
                      <TableRow key={record.student_id}>
                        <TableCell className="font-medium">{record.student_name}</TableCell>
                        <TableCell>{record.roll_number}</TableCell>
                        <TableCell className="text-center">
                          <span className="text-green-600 dark:text-green-400 font-semibold">
                            {record.classes_attended}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-red-600 dark:text-red-400 font-semibold">
                            {record.total_classes - record.classes_attended}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">{record.total_classes}</TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Progress value={record.total_classes > 0 ? record.attendance_percentage : 0} className="h-2 flex-1" />
                              <Badge variant={record.total_classes > 0 ? badge.variant : 'secondary'} className={record.total_classes > 0 ? badge.color : 'text-muted-foreground'}>
                                {record.total_classes > 0 ? `${record.attendance_percentage.toFixed(1)}%` : 'Awaiting'}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
