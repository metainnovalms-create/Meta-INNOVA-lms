import { useState, useMemo, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight, Calendar, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CreateHolidayInput, CalendarDayType, CalendarType } from '@/types/leave';
import { calendarDayTypeService } from '@/services/calendarDayType.service';
import { toast } from 'sonner';

interface Holiday {
  id: string;
  name: string;
  date: string;
  end_date?: string | null;
  description?: string | null;
  holiday_type: string;
  is_paid: boolean;
  year: number;
}

interface Props {
  holidays: Holiday[];
  isLoading?: boolean;
  onAddHoliday: (data: CreateHolidayInput) => void;
  onUpdateHoliday: (id: string, data: Partial<CreateHolidayInput>) => void;
  onDeleteHoliday: (id: string) => void;
  allowedTypes?: string[];
  title?: string;
  isMutating?: boolean;
  onYearChange?: (year: number) => void;
  calendarType?: CalendarType;
  institutionId?: string;
  enableDayTypeMarking?: boolean;
}

// Simplified to just 3 day types with clear colors
const DAY_TYPE_COLORS: Record<CalendarDayType, { bg: string; text: string; border: string; label: string }> = {
  working: { 
    bg: 'bg-emerald-50 dark:bg-emerald-900/20', 
    text: 'text-emerald-700 dark:text-emerald-300', 
    border: 'border-emerald-500',
    label: 'Working Day'
  },
  weekend: { 
    bg: 'bg-slate-100 dark:bg-slate-800/50', 
    text: 'text-slate-600 dark:text-slate-400', 
    border: 'border-slate-400',
    label: 'Weekend'
  },
  holiday: { 
    bg: 'bg-rose-50 dark:bg-rose-900/20', 
    text: 'text-rose-700 dark:text-rose-300', 
    border: 'border-rose-500',
    label: 'Holiday'
  }
};

export function HolidayCalendar({
  holidays,
  isLoading,
  onAddHoliday,
  onUpdateHoliday,
  onDeleteHoliday,
  allowedTypes = ['company', 'national', 'optional'],
  title = 'Holiday Calendar',
  isMutating = false,
  onYearChange,
  calendarType = 'company',
  institutionId,
  enableDayTypeMarking = true
}: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isMarkDayDialogOpen, setIsMarkDayDialogOpen] = useState(false);
  const [dayTypes, setDayTypes] = useState<Map<string, CalendarDayType>>(new Map());
  const [dayDescriptions, setDayDescriptions] = useState<Map<string, string>>(new Map());
  const [isLoadingDayTypes, setIsLoadingDayTypes] = useState(false);
  const [markDayForm, setMarkDayForm] = useState<{
    date: string;
    dayType: CalendarDayType;
    holidayName: string;
    description: string;
  }>({
    date: '',
    dayType: 'working',
    holidayName: '',
    description: ''
  });

  // Fetch day types when month or institution changes - always fetch for display
  useEffect(() => {
    const fetchDayTypes = async () => {
      setIsLoadingDayTypes(true);
      try {
        const year = currentDate.getFullYear();
        const types = await calendarDayTypeService.getDayTypesForRange(
          calendarType,
          year - 1,
          year + 2,
          calendarType === 'institution' ? institutionId : undefined
        );
        setDayTypes(types);
        
        // Also fetch descriptions for holidays
        const { data } = await import('@/integrations/supabase/client').then(m => {
          let query = m.supabase
            .from('calendar_day_types')
            .select('date, description')
            .eq('calendar_type', calendarType)
            .eq('day_type', 'holiday')
            .gte('date', `${year - 1}-01-01`)
            .lte('date', `${year + 2}-12-31`);
          
          // Add institution_id filter for institution calendars
          if (calendarType === 'institution' && institutionId) {
            query = query.eq('institution_id', institutionId);
          }
          
          return query;
        });
        
        if (data) {
          const descMap = new Map<string, string>();
          data.forEach((d: { date: string; description: string | null }) => {
            if (d.description) descMap.set(d.date, d.description);
          });
          setDayDescriptions(descMap);
        }
      } catch (error) {
        console.error('Error fetching day types:', error);
      } finally {
        setIsLoadingDayTypes(false);
      }
    };
    
    fetchDayTypes();
  }, [currentDate, calendarType, institutionId]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const getHolidaysForDay = (day: Date) => {
    return holidays.filter(h => {
      const start = parseISO(h.date);
      const end = h.end_date ? parseISO(h.end_date) : start;
      return isWithinInterval(day, { start, end }) || isSameDay(day, start) || isSameDay(day, end);
    });
  };

  const getDayTypeForDate = (day: Date): CalendarDayType | null => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return dayTypes.get(dateStr) || null;
  };

  const getHolidayDescription = (day: Date): string | null => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return dayDescriptions.get(dateStr) || null;
  };

  const upcomingHolidays = useMemo(() => {
    // Get upcoming holidays from day types marked as holiday
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    
    const upcoming: { date: string; name: string }[] = [];
    dayTypes.forEach((type, dateStr) => {
      if (type === 'holiday' && dateStr >= todayStr) {
        const desc = dayDescriptions.get(dateStr);
        upcoming.push({
          date: dateStr,
          name: desc || 'Holiday'
        });
      }
    });
    
    return upcoming
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);
  }, [dayTypes, dayDescriptions]);

  const handlePrevMonth = () => {
    const newDate = subMonths(currentDate, 1);
    setCurrentDate(newDate);
    if (onYearChange && newDate.getFullYear() !== currentDate.getFullYear()) {
      onYearChange(newDate.getFullYear());
    }
  };
  
  const handleNextMonth = () => {
    const newDate = addMonths(currentDate, 1);
    setCurrentDate(newDate);
    if (onYearChange && newDate.getFullYear() !== currentDate.getFullYear()) {
      onYearChange(newDate.getFullYear());
    }
  };
  
  const handleToday = () => {
    const today = new Date();
    if (onYearChange && today.getFullYear() !== currentDate.getFullYear()) {
      onYearChange(today.getFullYear());
    }
    setCurrentDate(today);
  };

  // Toggle day type on right-click
  const handleDayTypeToggle = async (day: Date, e: React.MouseEvent) => {
    if (!enableDayTypeMarking) return;
    if (!isSameMonth(day, currentDate)) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const dateStr = format(day, 'yyyy-MM-dd');
    const currentType = dayTypes.get(dateStr);
    
    // Cycle: working -> weekend -> holiday -> working
    let newType: CalendarDayType;
    if (!currentType || currentType === 'working') {
      newType = 'weekend';
    } else if (currentType === 'weekend') {
      newType = 'holiday';
    } else {
      newType = 'working';
    }
    
    try {
      await calendarDayTypeService.setDayType(
        calendarType,
        dateStr,
        newType,
        calendarType === 'institution' ? institutionId : undefined
      );
      
      const newDayTypes = new Map(dayTypes);
      newDayTypes.set(dateStr, newType);
      setDayTypes(newDayTypes);
      
      toast.success(`Marked as ${DAY_TYPE_COLORS[newType].label}`);
    } catch (error) {
      toast.error('Failed to update day type');
    }
  };

  const handleDayClick = (day: Date) => {
    if (!isSameMonth(day, currentDate)) return;
    if (!enableDayTypeMarking) return;
    
    setSelectedDate(day);
    openMarkDayDialog(day);
  };

  const openMarkDayDialog = (date?: Date) => {
    const d = date || new Date();
    const dateStr = format(d, 'yyyy-MM-dd');
    const currentType = dayTypes.get(dateStr) || 'working';
    const description = dayDescriptions.get(dateStr) || '';
    
    setMarkDayForm({
      date: dateStr,
      dayType: currentType,
      holidayName: description,
      description: description
    });
    setIsMarkDayDialogOpen(true);
  };

  const handleMarkDaySubmit = async () => {
    if (!markDayForm.date) return;
    
    try {
      await calendarDayTypeService.setDayType(
        calendarType,
        markDayForm.date,
        markDayForm.dayType,
        calendarType === 'institution' ? institutionId : undefined,
        markDayForm.dayType === 'holiday' ? markDayForm.holidayName : undefined
      );
      
      // Update local state
      const newDayTypes = new Map(dayTypes);
      newDayTypes.set(markDayForm.date, markDayForm.dayType);
      setDayTypes(newDayTypes);
      
      if (markDayForm.dayType === 'holiday' && markDayForm.holidayName) {
        const newDescriptions = new Map(dayDescriptions);
        newDescriptions.set(markDayForm.date, markDayForm.holidayName);
        setDayDescriptions(newDescriptions);
      }
      
      toast.success(`Day marked as ${DAY_TYPE_COLORS[markDayForm.dayType].label}`);
      setIsMarkDayDialogOpen(false);
    } catch (error) {
      toast.error('Failed to mark day');
    }
  };

  const handleQuickSetup = async () => {
    if (!enableDayTypeMarking) return;
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    
    try {
      await calendarDayTypeService.quickSetupMonth(
        calendarType,
        year,
        month,
        calendarType === 'institution' ? institutionId : undefined
      );
      
      const types = await calendarDayTypeService.getDayTypesForRange(
        calendarType,
        year - 1,
        year + 2,
        calendarType === 'institution' ? institutionId : undefined
      );
      setDayTypes(types);
      
      toast.success('Quick setup complete! Saturdays and Sundays marked as weekends.');
    } catch (error) {
      toast.error('Failed to set up calendar');
    }
  };

  // Calculate monthly stats
  const monthStats = useMemo(() => {
    let workingDays = 0;
    let weekends = 0;
    let holidays = 0;
    
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    monthDays.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const type = dayTypes.get(dateStr);
      if (type === 'working') workingDays++;
      else if (type === 'weekend') weekends++;
      else if (type === 'holiday') holidays++;
    });
    
    return { workingDays, weekends, holidays, total: monthDays.length };
  }, [dayTypes, monthStart, monthEnd]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr,280px]">
      {/* Main Calendar */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-muted/30">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
            <h2 className="text-xl font-semibold">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {enableDayTypeMarking && (
              <>
                <Button variant="outline" onClick={handleQuickSetup} size="sm">
                  <Wand2 className="h-4 w-4 mr-2" />
                  Quick Setup
                </Button>
                <Button onClick={() => openMarkDayDialog()}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Mark Day
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading || isLoadingDayTypes ? (
            <div className="flex items-center justify-center h-96 text-muted-foreground">
              Loading calendar...
            </div>
          ) : (
            <div className="border-t">
              {/* Days of week header */}
              <div className="grid grid-cols-7 border-b bg-muted/50">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar grid */}
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 border-b last:border-b-0">
                  {week.map((day, dayIndex) => {
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isToday = isSameDay(day, new Date());
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const dayType = getDayTypeForDate(day);
                    const holidayDesc = getHolidayDescription(day);
                    
                    // Get background color based on day type - show in both edit and read-only mode
                    let dayTypeBg = '';
                    let dayTypeBorder = '';
                    if (isCurrentMonth && dayType) {
                      const colors = DAY_TYPE_COLORS[dayType];
                      dayTypeBg = colors.bg;
                      dayTypeBorder = `border-l-4 ${colors.border}`;
                    }

                    return (
                      <div
                        key={dayIndex}
                        onClick={() => handleDayClick(day)}
                        onContextMenu={(e) => handleDayTypeToggle(day, e)}
                        className={cn(
                          "min-h-[90px] p-2 border-r last:border-r-0 cursor-pointer transition-colors",
                          !isCurrentMonth && "bg-muted/20 text-muted-foreground opacity-50",
                          isSelected && "ring-2 ring-primary ring-inset",
                          dayTypeBg,
                          dayTypeBorder,
                          "hover:opacity-80"
                        )}
                        title={enableDayTypeMarking ? "Click to edit, right-click to toggle" : undefined}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className={cn(
                            "flex items-center justify-center w-7 h-7 rounded-full text-sm",
                            isToday && "bg-primary text-primary-foreground font-bold"
                          )}>
                            {format(day, 'd')}
                          </div>
                          {isCurrentMonth && dayType && (
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-[10px] px-1.5 py-0 h-5",
                                DAY_TYPE_COLORS[dayType].text,
                                DAY_TYPE_COLORS[dayType].bg
                              )}
                            >
                              {dayType === 'working' ? 'Work' : dayType === 'weekend' ? 'Off' : 'Holiday'}
                            </Badge>
                          )}
                        </div>
                        {/* Show holiday name if marked as holiday */}
                        {dayType === 'holiday' && isCurrentMonth && (
                          <div className={cn(
                            "text-xs px-1.5 py-0.5 rounded truncate mt-1",
                            DAY_TYPE_COLORS.holiday.text
                          )}>
                            {holidayDesc || 'Holiday'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Monthly Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">This Month</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div className="text-center p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{monthStats.workingDays}</p>
              <p className="text-xs text-muted-foreground">Working Days</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-slate-100 dark:bg-slate-800/50">
              <p className="text-xl font-bold text-slate-600 dark:text-slate-400">{monthStats.weekends}</p>
              <p className="text-xs text-muted-foreground">Weekends</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-rose-50 dark:bg-rose-900/20 col-span-2">
              <p className="text-xl font-bold text-rose-700 dark:text-rose-300">{monthStats.holidays}</p>
              <p className="text-xs text-muted-foreground">Holidays</p>
            </div>
          </CardContent>
        </Card>

        {/* Day Type Legend */}
        {enableDayTypeMarking && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Day Types</CardTitle>
              <p className="text-xs text-muted-foreground">Click to edit, right-click to toggle</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {(['working', 'weekend', 'holiday'] as CalendarDayType[]).map(type => {
                const colors = DAY_TYPE_COLORS[type];
                return (
                  <div key={type} className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded border-l-4", colors.bg, colors.border)} />
                    <span className="text-sm">{colors.label}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Upcoming Holidays */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Upcoming Holidays
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[180px]">
              {upcomingHolidays.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No upcoming holidays</p>
              ) : (
                <div className="space-y-2">
                  {upcomingHolidays.map((holiday, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-rose-50 dark:bg-rose-900/20 border-l-4 border-rose-500"
                    >
                      <p className="font-medium text-sm text-rose-700 dark:text-rose-300">{holiday.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(parseISO(holiday.date), 'EEE, MMM d, yyyy')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Mark Day Dialog - Simplified to 3 types */}
      <Dialog open={isMarkDayDialogOpen} onOpenChange={setIsMarkDayDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Day Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={markDayForm.date}
                onChange={(e) => setMarkDayForm({ ...markDayForm, date: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Day Type</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['working', 'weekend', 'holiday'] as CalendarDayType[]).map(type => {
                  const colors = DAY_TYPE_COLORS[type];
                  const isSelected = markDayForm.dayType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setMarkDayForm({ ...markDayForm, dayType: type })}
                      className={cn(
                        "p-3 rounded-lg border-2 transition-all text-center",
                        colors.bg,
                        isSelected ? `border-primary ring-2 ring-primary ring-offset-2` : "border-transparent",
                        "hover:opacity-80"
                      )}
                    >
                      <div className={cn("text-sm font-medium", colors.text)}>
                        {colors.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {markDayForm.dayType === 'holiday' && (
              <div className="space-y-2">
                <Label>Holiday Name / Description</Label>
                <Input
                  value={markDayForm.holidayName}
                  onChange={(e) => setMarkDayForm({ ...markDayForm, holidayName: e.target.value })}
                  placeholder="e.g., Diwali, Christmas, School Annual Day"
                />
                <p className="text-xs text-muted-foreground">
                  This description will be shown on the calendar
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMarkDayDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleMarkDaySubmit} disabled={!markDayForm.date}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
