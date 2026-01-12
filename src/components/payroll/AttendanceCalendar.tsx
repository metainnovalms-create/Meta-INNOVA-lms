import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ChevronLeft, ChevronRight, Users, UserX, Clock, 
  Calendar as CalendarIcon, Gift, Plus, Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  fetchCalendarData, 
  CalendarDayData,
  DailyAttendanceRecord,
  EmployeeTypeFilter
} from '@/services/payroll.service';
import { EditAttendanceDialog } from './EditAttendanceDialog';
import { AddAttendanceDialog } from './AddAttendanceDialog';

interface AttendanceCalendarProps {
  month: number;
  year: number;
  onMonthChange: (month: number, year: number) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function AttendanceCalendar({ month, year, onMonthChange }: AttendanceCalendarProps) {
  const [calendarData, setCalendarData] = useState<CalendarDayData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<CalendarDayData | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DailyAttendanceRecord | null>(null);
  const [selectedDateForAdd, setSelectedDateForAdd] = useState<string>('');
  const [employeeTypeFilter, setEmployeeTypeFilter] = useState<EmployeeTypeFilter>('all');

  useEffect(() => {
    loadCalendarData();
  }, [month, year, employeeTypeFilter]);

  const loadCalendarData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchCalendarData(month, year, { employeeType: employeeTypeFilter });
      setCalendarData(data);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevMonth = () => {
    if (month === 1) {
      onMonthChange(12, year - 1);
    } else {
      onMonthChange(month - 1, year);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      onMonthChange(1, year + 1);
    } else {
      onMonthChange(month + 1, year);
    }
  };

  const handleDayClick = (day: CalendarDayData) => {
    if (day.isFuture) return;
    setSelectedDay(day);
    setDetailsOpen(true);
  };

  const handleEditRecord = (record: DailyAttendanceRecord) => {
    setSelectedRecord(record);
    setEditDialogOpen(true);
  };

  const handleAddAttendance = (date: string) => {
    setSelectedDateForAdd(date);
    setAddDialogOpen(true);
  };

  const getMonthName = () => {
    return new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  // Calculate first day offset for calendar grid
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();

  // Create empty cells for days before the 1st
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const getDayClass = (day: CalendarDayData) => {
    if (day.isFuture) return 'bg-muted/30 cursor-not-allowed';
    if (day.isHoliday) return 'bg-indigo-500/10 border-indigo-500/30';
    if (day.isWeekend) return 'bg-muted/50';
    if (day.attendance.absent > 0 || day.attendance.noPay > 0) return 'bg-red-500/10 border-red-500/30';
    if (day.attendance.late > 0) return 'bg-yellow-500/10 border-yellow-500/30';
    if (day.attendance.present > 0) return 'bg-green-500/10 border-green-500/30';
    return 'bg-background';
  };

  const getFilterLabel = () => {
    switch (employeeTypeFilter) {
      case 'officer': return 'Officers Only';
      case 'staff': return 'Staff Only';
      default: return 'All Employees';
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Attendance Calendar
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Click on any day to see detailed attendance • Color coded for quick overview
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Employee Type Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select 
                  value={employeeTypeFilter} 
                  onValueChange={(value: EmployeeTypeFilter) => setEmployeeTypeFilter(value)}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    <SelectItem value="officer">Officers Only</SelectItem>
                    <SelectItem value="staff">Staff Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Month Navigation */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-medium min-w-[150px] text-center">{getMonthName()}</span>
                <Button variant="outline" size="icon" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Active Filter Badge */}
          {employeeTypeFilter !== 'all' && (
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                Showing: {getFilterLabel()}
                {employeeTypeFilter === 'officer' && ' (using institution holidays)'}
                {employeeTypeFilter === 'staff' && ' (using company holidays)'}
              </Badge>
            </div>
          )}
          
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-green-500/30 border border-green-500"></div>
              <span>Present</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-yellow-500/30 border border-yellow-500"></div>
              <span>Late</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-red-500/30 border border-red-500"></div>
              <span>Absent / No Pay</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-purple-500/30 border border-purple-500"></div>
              <span>Leave</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-indigo-500/30 border border-indigo-500"></div>
              <span>Holiday</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-muted border border-muted-foreground/20"></div>
              <span>Weekend</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {/* Weekday headers */}
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
              
              {/* Empty cells */}
              {emptyDays.map((i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              
              {/* Calendar days */}
              {calendarData.map((day) => (
                <div
                  key={day.date}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "aspect-square p-1 border rounded-lg transition-all cursor-pointer hover:ring-2 hover:ring-primary/50",
                    getDayClass(day),
                    day.isToday && "ring-2 ring-primary"
                  )}
                >
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "text-sm font-medium",
                        day.isWeekend && "text-muted-foreground",
                        day.isToday && "text-primary font-bold"
                      )}>
                        {day.dayOfMonth}
                      </span>
                      {day.isHoliday && (
                        <Gift className="h-3 w-3 text-indigo-500" />
                      )}
                    </div>
                    
                    {!day.isFuture && !day.isWeekend && !day.isHoliday && (
                      <div className="flex-1 flex flex-col justify-end gap-0.5 mt-1">
                        {day.attendance.present > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-green-600">
                            <Users className="h-2.5 w-2.5" />
                            <span>{day.attendance.present}P</span>
                          </div>
                        )}
                        {day.attendance.absent > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-red-600">
                            <UserX className="h-2.5 w-2.5" />
                            <span>{day.attendance.absent}A</span>
                          </div>
                        )}
                        {day.attendance.late > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-yellow-600">
                            <Clock className="h-2.5 w-2.5" />
                            <span>{day.attendance.late}L</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {day.isHoliday && (
                      <p className="text-[9px] text-indigo-600 truncate mt-auto">
                        {day.holidayName}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Day Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>
                {selectedDay && new Date(selectedDay.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
              {selectedDay && !selectedDay.isWeekend && !selectedDay.isHoliday && (
                <Button 
                  size="sm" 
                  onClick={() => handleAddAttendance(selectedDay.date)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Attendance
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedDay && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-5 gap-2">
                <div className="text-center p-2 rounded-lg bg-green-500/10">
                  <p className="text-2xl font-bold text-green-600">{selectedDay.attendance.present}</p>
                  <p className="text-xs text-muted-foreground">Present</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-red-500/10">
                  <p className="text-2xl font-bold text-red-600">{selectedDay.attendance.absent}</p>
                  <p className="text-xs text-muted-foreground">Absent</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-yellow-500/10">
                  <p className="text-2xl font-bold text-yellow-600">{selectedDay.attendance.late}</p>
                  <p className="text-xs text-muted-foreground">Late</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-purple-500/10">
                  <p className="text-2xl font-bold text-purple-600">{selectedDay.attendance.leave}</p>
                  <p className="text-xs text-muted-foreground">On Leave</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-destructive/10">
                  <p className="text-2xl font-bold text-destructive">{selectedDay.attendance.noPay}</p>
                  <p className="text-xs text-muted-foreground">No Pay</p>
                </div>
              </div>
              
              {selectedDay.isHoliday && (
                <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
                  <div className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-indigo-600" />
                    <span className="font-medium text-indigo-700">Holiday: {selectedDay.holidayName}</span>
                  </div>
                </div>
              )}
              
              {/* Records List */}
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {selectedDay.records.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      {selectedDay.isWeekend ? 'Weekend - No attendance required' :
                       selectedDay.isHoliday ? 'Holiday - No attendance required' :
                       'No attendance records for this day'}
                    </p>
                  ) : (
                    selectedDay.records.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer"
                        onClick={() => handleEditRecord(record)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{record.user_name}</p>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {record.user_type === 'officer' ? 'Officer' : 'Staff'}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'No check-in'} 
                              {' → '}
                              {record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'No check-out'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {record.is_late && (
                            <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">Late</Badge>
                          )}
                          {record.missed_checkout && (
                            <Badge className="bg-orange-500/10 text-orange-700 border-orange-500/20">Missed Out</Badge>
                          )}
                          {record.status === 'no_pay' && (
                            <Badge variant="destructive">No Pay</Badge>
                          )}
                          {record.status === 'checked_out' && !record.is_late && (
                            <Badge className="bg-green-500/10 text-green-700 border-green-500/20">Present</Badge>
                          )}
                          <span className="text-sm text-muted-foreground">
                            {record.total_hours_worked.toFixed(1)}h
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Attendance Dialog */}
      <EditAttendanceDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        record={selectedRecord}
        onSuccess={() => {
          loadCalendarData();
          setDetailsOpen(false);
        }}
      />

      {/* Add Attendance Dialog */}
      <AddAttendanceDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        date={selectedDateForAdd}
        onSuccess={() => {
          loadCalendarData();
          setDetailsOpen(false);
        }}
      />
    </>
  );
}