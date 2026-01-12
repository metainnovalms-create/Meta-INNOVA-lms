import { useState, useEffect, useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight, Users, User, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { LeaveApplication, LeaveType, LeaveStatus, UserType, ApprovalChainItem, SubstituteAssignment } from '@/types/leave';

interface LeaveCalendarProps {
  institutionId?: string;
  showInstitutionSelector?: boolean;
}

interface Institution {
  id: string;
  name: string;
}

const leaveTypeColors: Record<LeaveType, string> = {
  sick: 'bg-red-100 border-red-400 text-red-800',
  casual: 'bg-blue-100 border-blue-400 text-blue-800'
};

const applicantTypeIndicator: Record<UserType, { color: string; icon: typeof User }> = {
  officer: { color: 'bg-emerald-500', icon: Users },
  staff: { color: 'bg-amber-500', icon: User }
};

export function LeaveCalendar({ institutionId, showInstitutionSelector = false }: LeaveCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedInstitution, setSelectedInstitution] = useState<string>(institutionId || 'all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (showInstitutionSelector) {
      fetchInstitutions();
    }
  }, [showInstitutionSelector]);

  useEffect(() => {
    fetchApprovedLeaves();
  }, [currentDate, selectedInstitution]);

  const fetchInstitutions = async () => {
    const { data } = await supabase
      .from('institutions')
      .select('id, name')
      .eq('status', 'active')
      .order('name');
    setInstitutions(data || []);
  };

  const fetchApprovedLeaves = async () => {
    setLoading(true);
    try {
      const monthStart = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(currentDate), 'yyyy-MM-dd');

      let query = supabase
        .from('leave_applications')
        .select('*')
        .eq('status', 'approved')
        .or(`start_date.lte.${monthEnd},end_date.gte.${monthStart}`);

      if (selectedInstitution && selectedInstitution !== 'all') {
        query = query.eq('institution_id', selectedInstitution);
      }

      const { data, error } = await query.order('start_date');
      
      if (error) throw error;
      
      setLeaves((data || []).map(l => ({
        ...l,
        leave_type: l.leave_type as LeaveType,
        status: l.status as LeaveStatus,
        applicant_type: l.applicant_type as UserType,
        approval_chain: (Array.isArray(l.approval_chain) ? l.approval_chain : []) as unknown as ApprovalChainItem[],
        substitute_assignments: (Array.isArray(l.substitute_assignments) ? l.substitute_assignments : []) as unknown as SubstituteAssignment[]
      })));
    } catch (error) {
      console.error('Error fetching leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  const getLeavesForDay = (day: Date): LeaveApplication[] => {
    return leaves.filter(leave => {
      const start = parseISO(leave.start_date);
      const end = parseISO(leave.end_date);
      return isWithinInterval(day, { start, end });
    });
  };

  const selectedDayLeaves = selectedDate ? getLeavesForDay(selectedDate) : [];

  const stats = useMemo(() => {
    const officers = leaves.filter(l => l.applicant_type === 'officer').length;
    const staff = leaves.filter(l => l.applicant_type === 'staff').length;
    const byType = leaves.reduce((acc, l) => {
      acc[l.leave_type] = (acc[l.leave_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return { officers, staff, byType, total: leaves.length };
  }, [leaves]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold min-w-[200px] text-center">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
        </div>

        {showInstitutionSelector && (
          <Select value={selectedInstitution} onValueChange={setSelectedInstitution}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="All Institutions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Institutions</SelectItem>
              {institutions.map(inst => (
                <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-primary/10">
                <CalendarIcon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Leaves</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-emerald-100">
                <Users className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.officers}</p>
                <p className="text-xs text-muted-foreground">Officer Leaves</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-amber-100">
                <User className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.staff}</p>
                <p className="text-xs text-muted-foreground">Staff Leaves</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-1">
              {Object.entries(stats.byType).slice(0, 3).map(([type, count]) => (
                <Badge key={type} variant="outline" className="text-xs">
                  {type}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span>Officer</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span>Staff</span>
        </div>
        <div className="border-l pl-4 flex flex-wrap gap-2">
          {Object.entries(leaveTypeColors).map(([type, classes]) => (
            <div key={type} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded border ${classes.split(' ')[0]} ${classes.split(' ')[1]}`} />
              <span className="capitalize text-xs">{type}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map(day => {
                const dayLeaves = getLeavesForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isToday = isSameDay(day, new Date());
                const isSelected = selectedDate && isSameDay(day, selectedDate);

                return (
                  <TooltipProvider key={day.toISOString()}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setSelectedDate(day)}
                          className={`
                            min-h-[80px] p-1 rounded-lg border text-left transition-all
                            ${!isCurrentMonth ? 'bg-muted/30 text-muted-foreground' : 'bg-background'}
                            ${isToday ? 'ring-2 ring-primary' : ''}
                            ${isSelected ? 'border-primary bg-primary/5' : 'border-border'}
                            ${dayLeaves.length > 0 ? 'hover:border-primary/50' : 'hover:bg-muted/50'}
                          `}
                        >
                          <div className="flex justify-between items-start">
                            <span className={`text-sm font-medium ${isToday ? 'text-primary' : ''}`}>
                              {format(day, 'd')}
                            </span>
                            {dayLeaves.length > 0 && (
                              <span className="text-xs bg-primary/10 text-primary px-1.5 rounded">
                                {dayLeaves.length}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 space-y-0.5 max-h-[50px] overflow-hidden">
                            {dayLeaves.slice(0, 2).map(leave => {
                              const typeColor = leaveTypeColors[leave.leave_type] || 'bg-gray-100 border-gray-400 text-gray-800';
                              const indicator = applicantTypeIndicator[leave.applicant_type];
                              
                              return (
                                <div 
                                  key={leave.id}
                                  className={`text-[10px] px-1 py-0.5 rounded border truncate flex items-center gap-1 ${typeColor}`}
                                >
                                  <div className={`w-1.5 h-1.5 rounded-full ${indicator.color} flex-shrink-0`} />
                                  <span className="truncate">{leave.applicant_name}</span>
                                </div>
                              );
                            })}
                            {dayLeaves.length > 2 && (
                              <div className="text-[10px] text-muted-foreground text-center">
                                +{dayLeaves.length - 2} more
                              </div>
                            )}
                          </div>
                        </button>
                      </TooltipTrigger>
                      {dayLeaves.length > 0 && (
                        <TooltipContent side="right" className="max-w-[250px]">
                          <p className="font-medium mb-1">{format(day, 'EEEE, MMM d')}</p>
                          <div className="space-y-1">
                            {dayLeaves.map(leave => (
                              <div key={leave.id} className="text-xs flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${applicantTypeIndicator[leave.applicant_type].color}`} />
                                <span>{leave.applicant_name}</span>
                                <Badge variant="outline" className="text-[10px] py-0 h-4">
                                  {leave.leave_type}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Day Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Select a date'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <p className="text-sm text-muted-foreground">Click on a date to see leave details</p>
            ) : selectedDayLeaves.length === 0 ? (
              <p className="text-sm text-muted-foreground">No approved leaves on this date</p>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {selectedDayLeaves.map(leave => {
                    const indicator = applicantTypeIndicator[leave.applicant_type];
                    const IconComponent = indicator.icon;
                    
                    return (
                      <div 
                        key={leave.id}
                        className={`p-3 rounded-lg border ${leaveTypeColors[leave.leave_type]}`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`p-1.5 rounded-full ${indicator.color} text-white`}>
                            <IconComponent className="h-3 w-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{leave.applicant_name}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {leave.applicant_type} • {leave.position_name || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Type:</span>
                            <Badge variant="outline" className="capitalize text-[10px]">
                              {leave.leave_type}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Duration:</span>
                            <span>{leave.total_days} day(s)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Period:</span>
                            <span>
                              {format(parseISO(leave.start_date), 'MMM d')} - {format(parseISO(leave.end_date), 'MMM d')}
                            </span>
                          </div>
                          {leave.institution_name && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Institution:</span>
                              <span className="truncate max-w-[120px]">{leave.institution_name}</span>
                            </div>
                          )}
                          {leave.reason && (
                            <div className="pt-1 border-t mt-2">
                              <span className="text-muted-foreground">Reason:</span>
                              <p className="mt-0.5 text-foreground">{leave.reason}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
