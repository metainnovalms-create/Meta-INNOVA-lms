import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/attendanceHelpers';
import { EmployeePayrollSummary, STANDARD_DAYS_PER_MONTH } from '@/services/payroll.service';
import { calendarDayTypeService } from '@/services/calendarDayType.service';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, User, Briefcase, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface EmployeePayrollDialogProps {
  employee: EmployeePayrollSummary | null;
  isOpen: boolean;
  onClose: () => void;
  month: number;
  year: number;
}

interface DayStatus {
  type: 'present' | 'leave' | 'lop' | 'holiday' | 'weekend' | 'future' | 'not_marked';
  label?: string;
}

export function EmployeePayrollDialog({ 
  employee, 
  isOpen, 
  onClose, 
  month, 
  year 
}: EmployeePayrollDialogProps) {
  const [calendarData, setCalendarData] = useState<Map<string, DayStatus>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [institutionName, setInstitutionName] = useState<string>('');

  useEffect(() => {
    if (isOpen && employee) {
      loadCalendarData();
    }
  }, [isOpen, employee, month, year]);

  const loadCalendarData = async () => {
    if (!employee) return;
    
    setIsLoading(true);
    try {
      const monthStart = startOfMonth(new Date(year, month - 1));
      const monthEnd = endOfMonth(new Date(year, month - 1));
      const today = new Date();
      const startDateStr = format(monthStart, 'yyyy-MM-dd');
      const endDateStr = format(monthEnd, 'yyyy-MM-dd');
      
      // Determine calendar type based on employee type
      const calendarType = employee.user_type === 'officer' ? 'institution' : 'company';
      
      // Fetch day types from calendar
      const dayTypesMap = await calendarDayTypeService.getDayTypesForMonth(
        calendarType,
        year,
        month,
        employee.user_type === 'officer' ? employee.institution_id : undefined
      );
      
      // Fetch attendance records
      let attendanceDates = new Set<string>();
      if (employee.user_type === 'officer' && employee.officer_id) {
        const { data } = await supabase
          .from('officer_attendance')
          .select('date, status')
          .eq('officer_id', employee.officer_id)
          .gte('date', startDateStr)
          .lte('date', endDateStr);
        
        if (data) {
          data.forEach(r => {
            if (r.status === 'checked_out' || r.status === 'checked_in' || r.status === 'present') {
              attendanceDates.add(r.date);
            }
          });
        }
      } else {
        const { data } = await supabase
          .from('staff_attendance')
          .select('date, status')
          .eq('user_id', employee.user_id)
          .gte('date', startDateStr)
          .lte('date', endDateStr);
        
        if (data) {
          data.forEach(r => {
            if (r.status === 'checked_out' || r.status === 'checked_in' || r.status === 'present') {
              attendanceDates.add(r.date);
            }
          });
        }
      }
      
      // Fetch leave records
      const { data: leaveRecords } = await supabase
        .from('leave_applications')
        .select('start_date, end_date, is_lop')
        .eq('applicant_id', employee.user_id)
        .eq('status', 'approved')
        .or(`start_date.gte.${startDateStr},end_date.lte.${endDateStr}`);
      
      const leaveDates = new Set<string>();
      const lopDates = new Set<string>();
      
      if (leaveRecords) {
        for (const leave of leaveRecords) {
          const start = parseISO(leave.start_date);
          const end = parseISO(leave.end_date);
          
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            if (d >= monthStart && d <= monthEnd) {
              const dateStr = format(d, 'yyyy-MM-dd');
              if (leave.is_lop) {
                lopDates.add(dateStr);
              } else {
                leaveDates.add(dateStr);
              }
            }
          }
        }
      }
      
      // Fetch institution name if officer
      if (employee.user_type === 'officer' && employee.institution_id) {
        const { data: inst } = await supabase
          .from('institutions')
          .select('name')
          .eq('id', employee.institution_id)
          .single();
        
        if (inst) setInstitutionName(inst.name);
      }
      
      // Build calendar status map
      const statusMap = new Map<string, DayStatus>();
      const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
      
      for (const day of days) {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayType = dayTypesMap.get(dateStr);
        
        if (day > today) {
          statusMap.set(dateStr, { type: 'future' });
        } else if (dayType === 'holiday') {
          statusMap.set(dateStr, { type: 'holiday', label: 'Holiday' });
        } else if (dayType === 'weekend') {
          statusMap.set(dateStr, { type: 'weekend', label: 'Weekend' });
        } else if (attendanceDates.has(dateStr)) {
          statusMap.set(dateStr, { type: 'present', label: 'Present' });
        } else if (lopDates.has(dateStr)) {
          statusMap.set(dateStr, { type: 'lop', label: 'LOP' });
        } else if (leaveDates.has(dateStr)) {
          statusMap.set(dateStr, { type: 'leave', label: 'Leave' });
        } else if (dayType === 'working') {
          statusMap.set(dateStr, { type: 'not_marked', label: 'Not Marked' });
        } else {
          // Default weekends by day of week if no calendar marking
          const dow = day.getDay();
          if (dow === 0 || dow === 6) {
            statusMap.set(dateStr, { type: 'weekend', label: 'Weekend' });
          } else {
            statusMap.set(dateStr, { type: 'not_marked', label: 'Not Marked' });
          }
        }
      }
      
      setCalendarData(statusMap);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!employee) return null;

  const monthStart = startOfMonth(new Date(year, month - 1));
  const monthEnd = endOfMonth(new Date(year, month - 1));
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Calculate weeks for calendar grid
  const firstDayOfWeek = monthStart.getDay();
  const paddedDays = [...Array(firstDayOfWeek).fill(null), ...days];
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < paddedDays.length; i += 7) {
    weeks.push(paddedDays.slice(i, i + 7));
  }
  
  const attendancePercentage = employee.days_present > 0 
    ? Math.round((employee.days_present / (employee.days_present + employee.days_not_marked + employee.days_lop)) * 100)
    : 0;

  const getStatusColor = (status: DayStatus['type']) => {
    switch (status) {
      case 'present': return 'bg-emerald-500 text-white';
      case 'leave': return 'bg-blue-500 text-white';
      case 'lop': return 'bg-red-500 text-white';
      case 'holiday': return 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300';
      case 'weekend': return 'bg-slate-100 dark:bg-slate-800 text-slate-500';
      case 'future': return 'bg-muted text-muted-foreground opacity-50';
      case 'not_marked': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700';
      default: return 'bg-muted';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{employee.name}</p>
              <p className="text-sm font-normal text-muted-foreground">
                {format(new Date(year, month - 1), 'MMMM yyyy')} Payroll Details
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-4 p-1">
            {/* Employee Info */}
            <div className="flex flex-wrap gap-2">
              <Badge variant={employee.user_type === 'officer' ? 'default' : 'secondary'}>
                {employee.user_type === 'officer' ? 'Officer' : 'Staff'}
              </Badge>
              {employee.position_name && (
                <Badge variant="outline" className="gap-1">
                  <Briefcase className="h-3 w-3" />
                  {employee.position_name}
                </Badge>
              )}
              {employee.user_type === 'officer' && institutionName && (
                <Badge variant="outline">{institutionName}</Badge>
              )}
              <Badge variant="outline" className="gap-1">
                <Calendar className="h-3 w-3" />
                {employee.user_type === 'officer' ? 'Institution Calendar' : 'Company Calendar'}
              </Badge>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card>
                <CardContent className="pt-3 pb-3 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{employee.days_present}</p>
                  <p className="text-xs text-muted-foreground">Days Present</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-3 pb-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{employee.days_leave}</p>
                  <p className="text-xs text-muted-foreground">Paid Leave</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-3 pb-3 text-center">
                  <p className="text-2xl font-bold text-amber-600">{employee.days_not_marked}</p>
                  <p className="text-xs text-muted-foreground">Not Marked</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-3 pb-3 text-center">
                  <p className="text-2xl font-bold text-red-600">{employee.days_lop}</p>
                  <p className="text-xs text-muted-foreground">LOP Days</p>
                </CardContent>
              </Card>
            </div>

            {/* Calendar Grid */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium">Attendance Calendar</p>
                  <div className="flex items-center gap-1">
                    {attendancePercentage >= 80 ? (
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                    ) : attendancePercentage >= 60 ? (
                      <Minus className="h-4 w-4 text-amber-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={cn(
                      "text-sm font-medium",
                      attendancePercentage >= 80 ? "text-emerald-600" :
                      attendancePercentage >= 60 ? "text-amber-600" : "text-red-600"
                    )}>
                      {attendancePercentage}% Attendance
                    </span>
                  </div>
                </div>
                
                {isLoading ? (
                  <div className="h-48 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                ) : (
                  <>
                    {/* Day headers */}
                    <div className="grid grid-cols-7 gap-1 mb-1">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <div key={i} className="text-center text-xs font-medium text-muted-foreground py-1">
                          {d}
                        </div>
                      ))}
                    </div>
                    
                    {/* Calendar weeks */}
                    <div className="space-y-1">
                      {weeks.map((week, weekIdx) => (
                        <div key={weekIdx} className="grid grid-cols-7 gap-1">
                          {week.map((day, dayIdx) => {
                            if (!day) {
                              return <div key={dayIdx} className="aspect-square" />;
                            }
                            
                            const dateStr = format(day, 'yyyy-MM-dd');
                            const status = calendarData.get(dateStr);
                            
                            return (
                              <div
                                key={dayIdx}
                                className={cn(
                                  "aspect-square rounded-md flex flex-col items-center justify-center text-xs",
                                  status ? getStatusColor(status.type) : 'bg-muted'
                                )}
                                title={status?.label}
                              >
                                <span className="font-medium">{format(day, 'd')}</span>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                    
                    {/* Legend */}
                    <div className="flex flex-wrap gap-3 mt-3 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-emerald-500" />
                        <span>Present</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-blue-500" />
                        <span>Leave</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-red-500" />
                        <span>LOP</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-amber-100 dark:bg-amber-900/30" />
                        <span>Not Marked</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-rose-100 dark:bg-rose-900/30" />
                        <span>Holiday</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-slate-100 dark:bg-slate-800" />
                        <span>Weekend</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Salary Calculation */}
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm font-medium mb-3">Salary Calculation</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Salary</span>
                    <span className="font-medium">{formatCurrency(employee.monthly_salary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Per Day Salary (÷{STANDARD_DAYS_PER_MONTH})</span>
                    <span className="font-medium">{formatCurrency(employee.per_day_salary)}</span>
                  </div>
                  {employee.gross_salary !== employee.monthly_salary && (
                    <div className="flex justify-between text-amber-600">
                      <span>Prorated Salary (from join date)</span>
                      <span className="font-medium">{formatCurrency(employee.gross_salary)}</span>
                    </div>
                  )}
                  <div className="border-t my-2" />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      LOP Deduction ({employee.days_not_marked + employee.days_lop} days × {formatCurrency(employee.per_day_salary)})
                    </span>
                    <span className="font-medium text-red-600">-{formatCurrency(employee.total_deductions)}</span>
                  </div>
                  <div className="border-t my-2" />
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">Net Pay</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(employee.net_pay)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Hours Worked */}
            {employee.total_hours_worked > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Total Hours Worked:</span>
                    <span className="font-semibold">{employee.total_hours_worked.toFixed(1)} hours</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
