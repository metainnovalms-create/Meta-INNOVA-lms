import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, CalendarIcon, Clock, MapPin, 
  AlertTriangle, XCircle, User, Edit2, DollarSign, LayoutGrid, List
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  fetchDailyAttendance, 
  DailyAttendanceRecord 
} from '@/services/payroll.service';
import { EditAttendanceDialog } from './EditAttendanceDialog';
import { AttendanceCalendar } from './AttendanceCalendar';

interface DailyAttendanceTabProps {
  month: number;
  year: number;
  onMonthChange?: (month: number, year: number) => void;
}

export function DailyAttendanceTab({ month, year, onMonthChange }: DailyAttendanceTabProps) {
  const [attendanceRecords, setAttendanceRecords] = useState<DailyAttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<DailyAttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DailyAttendanceRecord | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(month);
  const [currentYear, setCurrentYear] = useState(year);

  useEffect(() => {
    loadAttendance();
  }, [month, year, selectedDate]);

  useEffect(() => {
    filterRecords();
  }, [attendanceRecords, searchQuery, statusFilter]);

  const loadAttendance = async () => {
    setIsLoading(true);
    try {
      let startDate: string;
      let endDate: string;
      
      if (selectedDate) {
        // Show records for selected date only
        startDate = format(selectedDate, 'yyyy-MM-dd');
        endDate = format(selectedDate, 'yyyy-MM-dd');
      } else {
        // Show all records for the month
        const start = startOfMonth(new Date(year, month - 1));
        const end = endOfMonth(new Date(year, month - 1));
        startDate = format(start, 'yyyy-MM-dd');
        endDate = format(end, 'yyyy-MM-dd');
      }
      
      const data = await fetchDailyAttendance(startDate, endDate);
      setAttendanceRecords(data);
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = [...attendanceRecords];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.user_name.toLowerCase().includes(query)
      );
    }
    
    if (statusFilter !== 'all') {
      switch (statusFilter) {
        case 'late':
          filtered = filtered.filter(r => r.is_late);
          break;
        case 'missed_checkout':
          filtered = filtered.filter(r => r.missed_checkout);
          break;
        case 'present':
          filtered = filtered.filter(r => r.status === 'checked_out' && !r.is_late);
          break;
        case 'absent':
          filtered = filtered.filter(r => r.is_uninformed_absence);
          break;
        case 'no_pay':
          filtered = filtered.filter(r => r.status === 'no_pay' || r.is_uninformed_absence);
          break;
      }
    }
    
    setFilteredRecords(filtered);
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '-';
    try {
      return format(parseISO(timeStr), 'hh:mm a');
    } catch {
      return timeStr;
    }
  };

  const getStatusBadge = (record: DailyAttendanceRecord) => {
    if (record.status === 'no_pay') {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <DollarSign className="h-3 w-3" />
        No Pay
      </Badge>;
    }
    if (record.status === 'leave') {
      return <Badge className="bg-purple-500/10 text-purple-700 border-purple-500/20">Leave</Badge>;
    }
    if (record.status === 'holiday') {
      return <Badge className="bg-indigo-500/10 text-indigo-700 border-indigo-500/20">Holiday</Badge>;
    }
    if (record.is_uninformed_absence) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <DollarSign className="h-3 w-3" />
        No Pay
      </Badge>;
    }
    if (record.missed_checkout) {
      return <Badge className="bg-orange-500/10 text-orange-700 border-orange-500/20">Missed Checkout</Badge>;
    }
    if (record.is_late) {
      return <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">Late</Badge>;
    }
    if (record.status === 'checked_out') {
      return <Badge className="bg-green-500/10 text-green-700 border-green-500/20">Present</Badge>;
    }
    if (record.status === 'checked_in') {
      return <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/20">Checked In</Badge>;
    }
    return <Badge variant="secondary">{record.status || 'Not Marked'}</Badge>;
  };

  const handleEditClick = (record: DailyAttendanceRecord) => {
    setSelectedRecord(record);
    setEditDialogOpen(true);
  };

  const handleMonthChange = (newMonth: number, newYear: number) => {
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    onMonthChange?.(newMonth, newYear);
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant={viewMode === 'calendar' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('calendar')}
        >
          <LayoutGrid className="h-4 w-4 mr-2" />
          Calendar View
        </Button>
        <Button
          variant={viewMode === 'table' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('table')}
        >
          <List className="h-4 w-4 mr-2" />
          Table View
        </Button>
      </div>

      {viewMode === 'calendar' ? (
        <AttendanceCalendar 
          month={currentMonth} 
          year={currentYear} 
          onMonthChange={handleMonthChange}
        />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Daily Attendance Records</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Check-in/out times with location • Edit to correct missed entries • No Pay = LOP deduction
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[200px] justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search..." 
                    className="pl-9 w-[150px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="missed_checkout">Missed Checkout</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="no_pay">No Pay / LOP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead className="text-center">Hours</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No attendance records found for {selectedDate ? format(selectedDate, 'PPP') : 'this period'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((record) => (
                      <TableRow key={record.id} className={cn(
                        record.is_late && "bg-yellow-50 dark:bg-yellow-900/10",
                        record.missed_checkout && "bg-orange-50 dark:bg-orange-900/10",
                        (record.is_uninformed_absence || record.status === 'no_pay') && "bg-red-50 dark:bg-red-900/10"
                      )}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium">{record.user_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={record.user_type === 'officer' ? 'default' : 'secondary'}>
                            {record.user_type === 'officer' ? 'Officer' : 'Staff'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(parseISO(record.date), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className={cn(record.is_late && "text-yellow-600 font-medium")}>
                              {formatTime(record.check_in_time)}
                            </span>
                            {record.is_late && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className={cn(record.missed_checkout && "text-orange-600")}>
                              {formatTime(record.check_out_time)}
                            </span>
                            {record.missed_checkout && <XCircle className="h-4 w-4 text-orange-500" />}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-medium">{record.total_hours_worked.toFixed(1)}</span>
                          {record.overtime_hours > 0 && (
                            <span className="text-xs text-green-600 ml-1">
                              (+{record.overtime_hours.toFixed(1)} OT)
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {record.check_in_address ? (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground max-w-[150px] truncate">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span title={record.check_in_address}>{record.check_in_address}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(record)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditClick(record)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          
          {filteredRecords.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {filteredRecords.length} records • 
                <span className="text-yellow-600 ml-2">{filteredRecords.filter(r => r.is_late).length} late</span> • 
                <span className="text-orange-600 ml-2">{filteredRecords.filter(r => r.missed_checkout).length} missed checkout</span> •
                <span className="text-red-600 ml-2">{filteredRecords.filter(r => r.is_uninformed_absence || r.status === 'no_pay').length} no pay</span>
              </p>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="font-bold">
                  {filteredRecords.reduce((sum, r) => sum + r.total_hours_worked, 0).toFixed(1)} hrs
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      <EditAttendanceDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        record={selectedRecord}
        onSuccess={loadAttendance}
      />
    </>
  );
}
