import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Users, UserCheck, Clock, CheckCircle2, Download, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { useInstitutionClassAttendance, useClassAttendanceRealtime, aggregateClassAttendanceStats } from '@/hooks/useClassSessionAttendance';
import { Skeleton } from '@/components/ui/skeleton';
import { MonthlySessionsSummary } from './MonthlySessionsSummary';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ClassSessionAttendanceTabProps {
  institutionId?: string;
}

export function ClassSessionAttendanceTab({ institutionId }: ClassSessionAttendanceTabProps) {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [viewMode, setViewMode] = useState<'day' | 'month'>('month');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [selectedOfficerFilter, setSelectedOfficerFilter] = useState<string>('all');
  
  // Calculate date range based on view mode
  const startDate = viewMode === 'day' ? selectedDate : format(startOfMonth(currentMonth), 'yyyy-MM-dd');
  const endDate = viewMode === 'day' ? selectedDate : format(endOfMonth(currentMonth), 'yyyy-MM-dd');
  
  const { data: attendanceData, isLoading } = useInstitutionClassAttendance(institutionId, startDate, endDate);
  
  // Enable realtime updates
  useClassAttendanceRealtime(institutionId);

  // Fetch classes for filter
  const { data: classes = [] } = useQuery({
    queryKey: ['institution-classes', institutionId],
    queryFn: async () => {
      if (!institutionId) return [];
      const { data, error } = await supabase
        .from('classes')
        .select('id, class_name')
        .eq('institution_id', institutionId)
        .eq('status', 'active')
        .order('display_order');
      if (error) throw error;
      return data || [];
    },
    enabled: !!institutionId,
  });

  // Fetch officers for filter
  const { data: officers = [] } = useQuery({
    queryKey: ['institution-officers', institutionId],
    queryFn: async () => {
      if (!institutionId) return [];
      const { data, error } = await supabase
        .from('officers')
        .select('id, full_name')
        .contains('assigned_institutions', [institutionId])
        .eq('status', 'active');
      if (error) throw error;
      return data || [];
    },
    enabled: !!institutionId,
  });

  // Filter data based on selections
  const filteredData = useMemo(() => {
    if (!attendanceData) return [];
    
    return attendanceData.filter(record => {
      if (selectedClassFilter !== 'all' && record.class_id !== selectedClassFilter) {
        return false;
      }
      if (selectedOfficerFilter !== 'all' && record.officer_id !== selectedOfficerFilter) {
        return false;
      }
      return true;
    });
  }, [attendanceData, selectedClassFilter, selectedOfficerFilter]);
  
  const stats = aggregateClassAttendanceStats(filteredData || []);

  // Map data for MonthlySessionsSummary
  const sessionsForSummary = useMemo(() => {
    return filteredData.map(record => ({
      id: record.id,
      date: record.date,
      class_name: (record as any).class_name || 'Unknown',
      officer_name: (record as any).officer_name || 'Unknown',
      subject: record.subject || undefined,
      period_time: record.period_time || undefined,
      students_present: record.students_present,
      students_absent: record.students_absent,
      total_students: record.total_students,
      is_session_completed: record.is_session_completed,
    }));
  }, [filteredData]);
  
  const handlePrevMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const clearFilters = () => {
    setSelectedClassFilter('all');
    setSelectedOfficerFilter('all');
  };

  const hasFilters = selectedClassFilter !== 'all' || selectedOfficerFilter !== 'all';
  
  const handleExportCSV = () => {
    if (!filteredData || filteredData.length === 0) return;
    
    const csvContent = [
      ['Date', 'Class', 'Subject', 'Period', 'Officer', 'Total', 'Present', 'Absent', 'Late', 'Attendance %', 'Completed'],
      ...filteredData.map(record => [
        record.date,
        (record as any).class_name || '-',
        record.subject || '-',
        record.period_time || '-',
        (record as any).officer_name || '-',
        record.total_students,
        record.students_present,
        record.students_absent,
        record.students_late,
        record.total_students > 0 
          ? ((record.students_present + record.students_late) / record.total_students * 100).toFixed(1) + '%'
          : '0%',
        record.is_session_completed ? 'Yes' : 'No'
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `class_attendance_${startDate}_to_${endDate}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };
  
  if (!institutionId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No institution selected
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Class Session Attendance
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!filteredData?.length}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            <Select value={viewMode} onValueChange={(v) => setViewMode(v as 'day' | 'month')}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="View mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Daily View</SelectItem>
                <SelectItem value="month">Monthly View</SelectItem>
              </SelectContent>
            </Select>
            
            {viewMode === 'day' ? (
              <Input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-[180px]"
              />
            ) : (
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
            )}

            <div className="h-6 w-px bg-border" />

            {/* Filters */}
            <Select value={selectedClassFilter} onValueChange={setSelectedClassFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map(cls => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.class_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedOfficerFilter} onValueChange={setSelectedOfficerFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Officers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Officers</SelectItem>
                {officers.map(officer => (
                  <SelectItem key={officer.id} value={officer.id}>
                    {officer.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <Filter className="h-4 w-4 mr-1" />
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{stats.totalSessions}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : (
              <>
                <div className="text-2xl font-bold text-green-600">{stats.completedSessions}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.sessionCompletionRate.toFixed(0)}% completion rate
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students Tracked</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{stats.totalStudentsMarked}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : (
              <>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.completedSessions > 0 ? `${stats.averageAttendance.toFixed(1)}%` : 'N/A'}
                </div>
                {stats.completedSessions === 0 && (
                  <p className="text-xs text-muted-foreground">Awaiting sessions</p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Summary (only in month view) */}
      {viewMode === 'month' && !isLoading && (
        <MonthlySessionsSummary 
          sessions={sessionsForSummary}
          currentMonth={currentMonth}
        />
      )}
      
      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Session Details
            {hasFilters && (
              <Badge variant="secondary" className="ml-2">
                Filtered
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !filteredData || filteredData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No class sessions completed yet</p>
              <p className="text-sm mt-1">Sessions will appear here once officers mark attendance for their classes.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Officer</TableHead>
                  <TableHead className="text-center">Present</TableHead>
                  <TableHead className="text-center">Absent</TableHead>
                  <TableHead className="text-center">Late</TableHead>
                  <TableHead className="text-center">Attendance %</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((record) => {
                  const attendanceRate = record.total_students > 0 
                    ? ((record.students_present + record.students_late) / record.total_students * 100)
                    : 0;
                  
                  return (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {format(new Date(record.date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>{(record as any).class_name || '-'}</TableCell>
                      <TableCell>{record.subject || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{record.period_time || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{(record as any).officer_name || '-'}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
                          {record.students_present}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800">
                          {record.students_absent}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800">
                          {record.students_late}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-medium ${
                          attendanceRate >= 80 ? 'text-green-600 dark:text-green-400' : 
                          attendanceRate >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {attendanceRate.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {record.is_session_completed ? (
                          <Badge className="bg-green-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
